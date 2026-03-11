import * as vscode from 'vscode';
import {ICommand} from '../core/ICommand';
import {ChatContext} from '../core/ChatContext';

/**
 * Review Command - Structured exercise review with grading
 *
 * Reviews student code against exercise requirements with targeted feedback.
 * Evaluates what the student did right and wrong based on the exercise prompt.
 *
 * Usage:
 *   1. Generate exercise: @tutor /exercise [topic]
 *   2. Complete the exercise
 *   3. Select your code
 *   4. Type: @tutor /review [what exercise was this for]
 *
 * Features:
 *   - Compares code against exercise requirements
 *   - Highlights what was done well
 *   - Identifies specific issues
 *   - Provides targeted improvement tips
 *   - Gives a confidence score (not a grade)
 *   - Progressive feedback based on attempts
 *
 * Priority: P2 (Important learning feature)
 */
export class ReviewCommand implements ICommand {
    readonly name = 'review';
    readonly description = 'Laat je oefening nakijken met gerichte feedback';
    readonly aliases = ['check', 'grade', 'evaluate'];

    private reviewSessions: Map<string, {
        attempts: number;
        exerciseDescription: string;
        codeHash: string;
        previousReviews: string[];
    }> = new Map();

    async execute(
        context: ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [REVIEW] Exercise review started`);

        try {
            // Validate code context
            if (!context.codeContext) {
                stream.markdown('📋 **Exercise Review Mode**\n\n');
                stream.markdown('Selecteer je code in de editor om je oefening te laten nakijken.\n\n');
                stream.markdown('Beschrijf wat je moest maken, en ik zal je code beoordelen op:\n');
                stream.markdown('- ✅ Wat goed is\n');
                stream.markdown('- ❌ Wat fout is\n');
                stream.markdown('- 💡 Hoe te verbeteren\n');
                context.trackProgress('review');
                return;
            }

            // Extract code
            const code = context.codeContext.code.replace(/^.*?\`\`\`\w+\n/, '').replace(/\`\`\`$/, '');
            const language = context.codeContext.language || 'unknown';

            // Get exercise description from prompt
            const exerciseDescription = this.extractExerciseDescription(context.request.prompt);

            // Generate review
            await this.generateReview(
                context,
                stream,
                code,
                language,
                exerciseDescription,
                token,
                timestamp
            );

            context.trackProgress('review');
        } catch (error) {
            console.error('[REVIEW] Error in review command:', error);
            stream.markdown('❌ Kon je oefening niet beoordelen.\n');
            stream.markdown(`*Zorg ervoor dat je code in de editor hebt geselecteerd.*\n`);
        }
    }

    /**
     * Generate structured review with feedback
     */
    private async generateReview(
        context: ChatContext,
        stream: vscode.ChatResponseStream,
        code: string,
        language: string,
        exerciseDescription: string,
        token: vscode.CancellationToken,
        timestamp: string
    ): Promise<void> {
        const codeHash = this.hashCode(code);
        const sid = `review-${context.studentId}-${codeHash}`;

        let session = this.reviewSessions.get(sid);
        if (!session) {
            session = {
                attempts: 0,
                exerciseDescription,
                codeHash,
                previousReviews: []
            };
            this.reviewSessions.set(sid, session);
        }

        session.attempts++;

        // Check if reviewing same code multiple times
        if (session.codeHash === codeHash && session.previousReviews.length > 0 && session.attempts <= 2) {
            stream.markdown('📋 **Vorige beoordeling**\n\n');
            stream.markdown(session.previousReviews[session.attempts - 2]);
            stream.markdown('\n\n*Je hebt dezelfde code al ingediend. Pas je code aan en probeer het opnieuw.*\n');
            return;
        }

        stream.markdown('📋 **Oefening Beoordeling**\n\n');
        stream.markdown(`*Moeilijkheidsgraad: ${this.getDifficultyName(context.yearLevel)}*\n\n`);

        // Build the review prompt
        const reviewPrompt = this.buildReviewPrompt(
            code,
            language,
            exerciseDescription,
            context.yearLevel,
            session.attempts
        );

        console.log(`[${timestamp}] [REVIEW] Generating review for exercise: "${exerciseDescription}"`);
        console.log(`[${timestamp}] [REVIEW] Attempt: ${session.attempts}`);

        try {
            const messages = [vscode.LanguageModelChatMessage.User(reviewPrompt)];

            const response = await context.model.sendRequest(messages, {}, token);

            if (response) {
                let reviewText = '';
                let charCount = 0;
                const maxChars = 2000;

                for await (const fragment of response.text) {
                    if (charCount + fragment.length > maxChars) {
                        reviewText += fragment.substring(0, maxChars - charCount) + '\n\n[...]';
                        break;
                    }
                    reviewText += fragment;
                    charCount += fragment.length;
                }

                stream.markdown(reviewText);
                session.previousReviews.push(reviewText);

                console.log(`[${timestamp}] [REVIEW] Review completed, length: ${reviewText.length} chars`);
            } else {
                stream.markdown('❌ Kon beoordeling niet genereren.\n');
            }
        } catch (error) {
            console.error(`[${timestamp}] [REVIEW] Error generating review:`, error);
            stream.markdown('❌ Fout bij het genereren van feedback.\n');
        }
    }

    /**
     * Build structured review prompt
     */
    private buildReviewPrompt(
        code: string,
        language: string,
        exerciseDescription: string,
        yearLevel: number,
        attempt: number
    ): string {
        const difficulty = this.getDifficultyName(yearLevel);

        const baseContext = `Je bent een programmeerleraar die oefeningen beoordeelt.

OEFENING BESCHRIJVING: "${exerciseDescription}"
MOEILIJKHEIDSGRAAD: ${difficulty}
POGING NUMMER: ${attempt}

STUDENT CODE:
\`\`\`${language}
${code}
\`\`\`

Beoordeel de code met deze structuur:

### ✅ Wat goed is
[Wat werkt, goede aanpak, correcte syntax, etc. - max 2-3 punten]

### ❌ Wat fout is
[Specifieke problemen, logische fouten, edge cases gemist - max 3-4 punten]

### 💡 Hoe te verbeteren
[1-2 gerichte tips zonder de volledige oplossing te geven]

### 📊 Zelfvertrouwen score
Geef een score 1-10 hoe zeker je bent dat dit oefening werkt: [X]/10
Uitleg: [1 zin waarom]`;

        if (attempt >= 2) {
            return baseContext + `\n\nDit is poging ${attempt}. Wees iets directer en focus op de kernproblemen.`;
        }

        return baseContext;
    }

    /**
     * Extract exercise description from prompt
     */
    private extractExerciseDescription(prompt: string): string {
        const withoutCommand = prompt.replace(/^\/review\s*/, '').trim();
        return withoutCommand || 'onbekende oefening';
    }

    /**
     * Get difficulty name for a level
     */
    private getDifficultyName(level: number): string {
        const names: Record<number, string> = {
            1: 'Eerstejaars (Beginner)',
            2: 'Tweedejaars (Intermediate)',
            3: 'Derdejaars (Advanced)',
            4: 'Vierdejaars (Expert)'
        };
        return names[level] || 'Intermediate';
    }

    /**
     * Simple hash function for code deduplication
     */
    private hashCode(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
}

