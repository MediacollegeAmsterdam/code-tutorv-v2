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
        // Always generate an exercise when this command is called
        // The user explicitly asked for /exercise
        await this.generateExercise(context, stream, token);
    }

    /**
     * Generate a new exercise using AI with example
     */
    private async generateExercise(
        context: ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        const timestamp = new Date().toISOString();
        stream.markdown(`## 🎯 Oefening aan het genereren...\n\n`);
        try {
            const difficulty = this.getDifficultyForYear(context.yearLevel);

            // Extract code context if available
            const codeContext = context.codeContext?.code || '';
            const hasCode = codeContext.length > 0;

            // Extract the topic or use code concepts
            let topic = context.request.prompt;
            topic = topic.replace(/geef\s+me\s+een\s+oefening\s+over\s+|give\s+me\s+an\s+exercise\s+about\s+|geef\s+een\s+oefening\s+over\s+|exercise|oefening/gi, '').trim();

            // If no specific topic provided, use code-based or general topic
            if (!topic || topic.length === 0) {
                topic = hasCode ? 'het concept uit deze code' : 'programmeren';
            }

            console.log(`[${timestamp}] [EXERCISE] Generating exercise for topic: "${topic}"`);
            console.log(`[${timestamp}] [EXERCISE] Difficulty level: ${difficulty}`);
            console.log(`[${timestamp}] [EXERCISE] Has code context: ${hasCode}`);

            // OPTIMIZED: Better prompt for full exercises
            const basePrompt = hasCode
                ? `Je bent een programmeerleraar. Analyseer deze code en maak educatieve oefeningen voor de CONCEPTS die erin voorkomen.

Code:
${codeContext}

Maak 1-2 volledige oefeningen op ${difficulty} niveau voor deze concepts.

Format exact:
### 💻 Voorbeeld
\`\`\`javascript
// [code voorbeeld - 5 regels max]
\`\`\`

### 📝 Oefening
**[Concept]** - ${difficulty} niveau

**Doel:** [1-2 zinnen leeruitkomsten]

**Opdracht:** [2-3 duidelijke stappen wat te doen]

**Hints:**
- [Hint 1]
- [Hint 2]
- [Hint 3]

Focus op de CONCEPTS uit de code. Geen lange uitleg, alleen essentieel en praktisch.`
                : `Je bent een ervaren programmeerleraar. Maak een volledige, educatieve oefening voor ${difficulty} niveau over: "${topic}"

Zorg voor:
- Duidelijke leerdoelen
- Praktische opdracht
- Helpende hints
- Code voorbeelden

Format exact:
### 💻 Voorbeeld
\`\`\`javascript
// [code voorbeeld - 5 regels max]
\`\`\`

### 📝 Oefening
**${topic}** - ${difficulty} niveau

**Doel:** [1-2 zinnen leeruitkomsten]

**Opdracht:** [2-3 duidelijke stappen wat te doen]

**Hints:**
- [Hint 1]
- [Hint 2]
- [Hint 3]

Geen lange uitleg, alleen essentieel en praktisch.`;

            const promptTokens = Math.ceil(basePrompt.length / 4);
            console.log(`[${timestamp}] [EXERCISE] Base prompt tokens: ~${promptTokens}`);

            const messages = buildChatMessages(
                basePrompt,
                context.chatContext,
                context.request.prompt,
                ''
            );

            console.log(`[${timestamp}] [EXERCISE] Total messages: ${messages.length}`);
            const totalRequestTokens = messages.reduce((sum, msg) => sum + Math.ceil(msg.content.length / 4), 0);
            console.log(`[${timestamp}] [EXERCISE] Total request tokens: ~${totalRequestTokens}`);

            const startTime = Date.now();
            const response = await sendChatRequest(context.model, messages, token, stream);

            if (response) {
                let exerciseContent = '';
                for await (const fragment of response.text) {
                    stream.markdown(fragment);
                    exerciseContent += fragment;
                }

                const elapsed = Date.now() - startTime;
                const responseTokens = Math.ceil(exerciseContent.length / 4);
                console.log(`[${timestamp}] [EXERCISE] Response received in ${elapsed}ms, length: ${exerciseContent.length} chars (~${responseTokens} tokens)`);
                console.log(`[${timestamp}] [EXERCISE] Total tokens (request+response): ~${totalRequestTokens + responseTokens}`);

                // Create a markdown file with the exercise
                console.log(`[${timestamp}] [EXERCISE] Creating exercise file with content length: ${exerciseContent.length}`);
                await this.createExerciseFile(exerciseContent, topic, difficulty);

                stream.markdown(`\n\n💡 Vraag /feedback voor hulp!\n`);
            }

            context.trackProgress('exercise');
        } catch (error) {
            console.error(`[${timestamp}] [EXERCISE-ERROR] Failed to generate exercise:`, error);
            stream.markdown(`❌ Kon de oefening niet genereren. Probeer het opnieuw.\n`);
            context.trackProgress('exercise');
        }
    }

    /**
     * Create a markdown file with the exercise content
     */
    private async createExerciseFile(
        content: string,
        topic: string,
        difficulty: string
    ): Promise<void> {
        try {
            // Validate content
            if (!content || content.trim().length === 0) {
                console.warn('[EXERCISE] Empty content, skipping file creation');
                return;
            }

            // Create exercises directory if it doesn't exist
            if (!vscode.workspace.workspaceFolders) {
                console.warn('[EXERCISE] No workspace folder open, skipping file creation');
                return;
            }

            const exercisesDir = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, 'exercises');
            console.log(`[EXERCISE] Creating exercises directory: ${exercisesDir.fsPath}`);

            try {
                await vscode.workspace.fs.stat(exercisesDir);
                console.log('[EXERCISE] Exercises directory already exists');
            } catch (e) {
                console.log('[EXERCISE] Creating new exercises directory...');
                await vscode.workspace.fs.createDirectory(exercisesDir);
                console.log('[EXERCISE] Exercises directory created');
            }

            // Create a descriptive filename
            const timestamp = new Date().toISOString().slice(0, 10);
            const time = new Date().toISOString().slice(11, 19).replace(/:/g, '-');
            const sanitizedTopic = (topic || 'oefening').replace(/[^a-z0-9]/gi, '_').slice(0, 30);
            const fileName = `exercise_${sanitizedTopic}_${difficulty}_${timestamp}_${time}.md`;
            const filePath = vscode.Uri.joinPath(exercisesDir, fileName);

            console.log(`[EXERCISE] File path: ${filePath.fsPath}`);
            console.log(`[EXERCISE] Topic: ${topic}, Difficulty: ${difficulty}`);
            console.log(`[EXERCISE] Content length: ${content.length} characters`);

            // Build the complete markdown content with header
            const fullContent = `# 📝 Oefening: ${topic || 'Programmeren'}
**Moeilijkheidsgraad:** ${difficulty}  
**Datum:** ${new Date().toLocaleDateString('nl-NL')}

---

${content}

---

## 💭 Hulp
- Vraag \`/hint\` voor hints
- Vraag \`/feedback\` voor feedback op je code
- Schakel tussen dit bestand en je code om te werken`;

            // Write the file to disk
            console.log('[EXERCISE] Writing file to disk...');
            const encoder = new TextEncoder();
            const encoded = encoder.encode(fullContent);
            console.log(`[EXERCISE] Encoded size: ${encoded.length} bytes`);

            await vscode.workspace.fs.writeFile(filePath, encoded);
            console.log('[EXERCISE] File written successfully');

            // Open the file in the editor
            console.log('[EXERCISE] Opening file in editor...');
            const doc = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
            console.log(`[EXERCISE] Created and opened exercise file: ${fileName}`);

            // Show success notification
            vscode.window.showInformationMessage(`✅ Oefening opgeslagen: ${fileName}`);
        } catch (error) {
            console.error('[EXERCISE] Failed to create exercise file:', error);
            if (error instanceof Error) {
                console.error('[EXERCISE] Error details:', error.message);
                console.error('[EXERCISE] Stack:', error.stack);
            }
            vscode.window.showErrorMessage(`❌ Kon oefening niet opslaan: ${error instanceof Error ? error.message : String(error)}`);
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
        const timestamp = new Date().toISOString();
        stream.markdown(`## 🎯 Oefeningen\n\n`);

        try {
            console.log(`[${timestamp}] [EXERCISE-SUGGESTIONS] Generating exercise suggestions`);

            // OPTIMIZED: Much shorter suggestion prompt
            const basePrompt = `Geef 3-4 oefening suggesties voor ${this.getDifficultyForYear(context.yearLevel)} niveau.

Format:
**1. [Onderwerp]** - [1 zin wat je leert]
**2. [Onderwerp]** - [1 zin wat je leert]
**3. [Onderwerp]** - [1 zin wat je leert]`;

            const promptTokens = Math.ceil(basePrompt.length / 4);
            console.log(`[${timestamp}] [EXERCISE-SUGGESTIONS] Suggestion prompt tokens: ~${promptTokens}`);

            const messages = buildChatMessages(
                basePrompt,
                context.chatContext,
                'Geef suggesties',
                ''
            );

            const totalRequestTokens = messages.reduce((sum, msg) => sum + Math.ceil(msg.content.length / 4), 0);
            console.log(`[${timestamp}] [EXERCISE-SUGGESTIONS] Total request tokens: ~${totalRequestTokens}`);

            const startTime = Date.now();
            const response = await sendChatRequest(context.model, messages, token, stream);

            if (response) {
                let responseLength = 0;
                for await (const fragment of response.text) {
                    stream.markdown(fragment);
                    responseLength += fragment.length;
                }

                const elapsed = Date.now() - startTime;
                const responseTokens = Math.ceil(responseLength / 4);
                console.log(`[${timestamp}] [EXERCISE-SUGGESTIONS] Response received in ${elapsed}ms, length: ${responseLength} chars (~${responseTokens} tokens)`);
                console.log(`[${timestamp}] [EXERCISE-SUGGESTIONS] Total tokens (request+response): ~${totalRequestTokens + responseTokens}`);
            }

            context.trackProgress('exercise');
        } catch (error) {
            console.error(`[${timestamp}] [EXERCISE-SUGGESTIONS-ERROR] Failed to show suggestions:`, error);
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

