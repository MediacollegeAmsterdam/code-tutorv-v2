import * as vscode from 'vscode';
import {ICommand} from '../core/ICommand';
import {ChatContext} from '../core/ChatContext';
import {buildChatMessages, sendChatRequest} from '../core/chat-utils';
import {languages} from "vscode";

/**
 * Exercise Command - Generate or suggest programming exercises
 *
 * Generates custom programming exercises based on user requests using AI.
 *
 * Usage:
 *   Generate: @tutor /exercise Geef me een oefening over loops
 *   Suggest: @tutor /exercise
 *
 * Features:
 *   - AI-powered exercise generation
 *   - Difficulty adaptation based on student year level
 *   - Structured exercises with learning outcomes
 *   - Hints and tips included
 *   - Markdown formatted output
 *
 * Priority: P1 (Core learning feature)
 */
export class ExerciseCommand implements ICommand {
    readonly name = 'exercise';
    readonly description = 'Genereer of bekijk oefeningen';
    readonly aliases = ['exercises', 'oefening'];

    async execute(
        context: ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        const userQuery = context.request.prompt.toLowerCase().trim();

        // Check if user is asking to generate an exercise
        const isGenerating = userQuery.length > 3 &&
            (userQuery.includes('geef') || userQuery.includes('maak') ||
                userQuery.includes('give') || userQuery.includes('create') ||
                userQuery.includes('generate') || userQuery.includes('oefening') ||
                userQuery.includes('assignment') || userQuery.includes('exercise'));

        if (!isGenerating) {
            // Generate a new exercise based on the user's request
            await this.generateExercise(context, stream, token);
        } else {
            // Show exercise suggestions
            await this.showSuggestions(context, stream, token);
        }
    }

    /**
     * Generate a new exercise using AI with example
     */
    private async generateExercise(
        context: ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        stream.markdown(`## 🎯 Oefening aan het genereren...\n\n`);
        try {
            const difficulty = this.getDifficultyForYear(context.yearLevel);

            // Extract the topic
            let topic = context.request.prompt;
            topic = topic.replace(/geef\s+me\s+een\s+oefening\s+over\s+|give\s+me\s+an\s+exercise\s+about\s+|geef\s+een\s+oefening\s+over\s+/gi, '').trim();

            // OPTIMIZED: Much shorter prompt - 60% less tokens
            const basePrompt = `Je bent een programmeerleraar. Maak een korte oefening voor ${difficulty} niveau over: "${topic}"

Format exakt:
### 💻 Voorbeeld
\`\`\`javascript
// [code voorbeeld - 5 regels max]
\`\`\`

### 📝 Oefening
**${topic}** - ${difficulty} niveau

**Doel:** [1 zin]

**Opdracht:** [2-3 zinnen wat te doen]

**Hints:**
- [Hint 1]
- [Hint 2]

Geen lange uitleg, alleen essentieel.`;

            const messages = buildChatMessages(
                basePrompt,
                context.chatContext,
                context.request.prompt,
                ''
            );

            const response = await sendChatRequest(context.model, messages, token, stream);
            if (response) {
                for await (const fragment of response.text) {
                    stream.markdown(fragment);
                }
                stream.markdown(`\n\n💡 Vraag /feedback voor hulp!\n`);
            }

            context.trackProgress('exercise');
        } catch (error) {
            console.error('Error generating exercise:', error);
            stream.markdown(`❌ Kon de oefening niet genereren. Probeer het opnieuw.\n`);
            context.trackProgress('exercise');
        }
    }

    /**
     * Show exercise suggestions and guidance
     */
    private async showSuggestions(
        context: ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        stream.markdown(`## 🎯 Oefeningen\n\n`);

        try {
            // OPTIMIZED: Much shorter suggestion prompt
            const basePrompt = `Geef 3-4 oefening suggesties voor ${this.getDifficultyForYear(context.yearLevel)} niveau.

Format:
**1. [Onderwerp]** - [1 zin wat je leert]
**2. [Onderwerp]** - [1 zin wat je leert]
**3. [Onderwerp]** - [1 zin wat je leert]`;

            const messages = buildChatMessages(
                basePrompt,
                context.chatContext,
                'Geef suggesties',
                ''
            );

            const response = await sendChatRequest(context.model, messages, token, stream);
            if (response) {
                for await (const fragment of response.text) {
                    stream.markdown(fragment);
                }
            }

            context.trackProgress('exercise');
        } catch (error) {
            console.error('Error showing suggestions:', error);
            stream.markdown(`❌ Kon suggesties niet laden.\n`);
            context.trackProgress('exercise');
        }
    }

    /**
     * Get difficulty level based on year
     */
    private getDifficultyForYear(yearLevel: number): string {
        const map: Record<number, string> = {
            1: 'beginner',
            2: 'intermediate',
            3: 'advanced',
            4: 'advanced'
        };
        return map[yearLevel] || 'intermediate';
    }

    /**
     * Get difficulty description for year level
     */
    private getDifficultyDescription(yearLevel: number): string {
        const descriptions: Record<number, string> = {
            1: 'eerstejaars',
            2: 'tweedejaars',
            3: 'derdejaars',
            4: 'vierdejaars / professionals'
        };
        return descriptions[yearLevel] || 'intermediate';
    }
}

