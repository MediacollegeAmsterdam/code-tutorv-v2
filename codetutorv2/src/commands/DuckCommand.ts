import * as vscode from 'vscode';
import {ICommand} from '../core/ICommand';
import {ChatContext} from '../core/ChatContext';
import {buildChatMessages, sendChatRequest} from "../core/chat-utils";
import {DuckContext} from '../core/DuckContext';
import {getInitialAnalysisPrompt, getFollowUpPrompt, getDebuggingHintPrompt, getHintTypesForLevel} from '../core/duck-prompts';

/**
 * Rubber Duck Command - Socratic debugging mode
 *
 * Uses the Socratic method to guide students through debugging their code
 * with hints and guiding questions - never providing direct answers.
 *
 * Features:
 * - Year-level adapted question difficulty
 * - Conversation history tracking to prevent repetition
 * - Code snapshot comparison to detect changes
 * - Progress tracking and session management
 * - Hint-only approach (no code solutions)
 *
 * Usage:
 *   @tutor /duck [describe your problem]
 *
 * @author Kevin Hamelink
 */
export class DuckCommand implements ICommand {
    readonly name = 'duck';
    readonly description = 'Rubber duck debugging mode - hints only, no answers';
    readonly aliases = ['duck', 'rubber', 'eendje', 'ducky'];

    // Session management - map of student ID -> duck context
    private sessions: Map<string, DuckContext> = new Map();

    async execute(
        context: ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [DUCK] Rubber duck command started`);
        console.log(`[${timestamp}] [DUCK] Year level: ${context.yearLevel}`);
        console.log(`[${timestamp}] [DUCK] User query: "${context.request.prompt.substring(0, 100)}..."`);

        try {
            // Validate code context
            if (!context.codeContext) {
                stream.markdown('🦆 **Rubber Duck Mode**\n\n');
                stream.markdown('Selecteer code in je editor om rubber duck mode te starten.\n\n');
                stream.markdown('Ik zal je helpen door vragen te stellen - GEEN directe antwoorden!\n');
                context.trackProgress('duck');
                return;
            }

            // Get or create duck context for this student
            const duckContext = this.getDuckContext(context.studentId);

            // Extract code
            const code = context.codeContext.code.replace(/^.*?\`\`\`\w+\n/, '').replace(/\`\`\`$/, '');
            const language = context.codeContext.language || 'unknown';

            // Initialize or update session
            if (!duckContext.getCurrentSession() || duckContext.hasCodeChanged(code)) {
                duckContext.initializeSession(code);
                console.log(`[${timestamp}] [DUCK] New session initialized`);
            }

            // Stream session header
            stream.markdown('🦆 **Rubber Duck Debugging Mode**\n\n');
            stream.markdown(`*Moeilijkheidsgraad: ${this.getDifficultyName(context.yearLevel)}*\n\n`);

            // Get user's problem description
            const problemDescription = this.extractProblemDescription(context.request.prompt);

            // Generate and stream initial analysis/question
            await this.streamSocraticResponse(
                context,
                stream,
                code,
                language,
                problemDescription,
                duckContext,
                token
            );

            // Track session depth
            duckContext.incrementConversationDepth();

            // Check if session should end
            if (duckContext.shouldEndSession()) {
                this.streamSessionClosure(stream, duckContext);
                duckContext.closeSession();
                this.sessions.delete(context.studentId);
                console.log(`[${timestamp}] [DUCK] Session closed - max attempts reached`);
            }

            context.trackProgress('duck');
        } catch (error) {
            console.error('[DUCK] Error in duck command:', error);
            stream.markdown('❌ Kon rubber duck mode niet starten.\n');
            stream.markdown(`*Zorg ervoor dat je code in de editor hebt geselecteerd.*\n`);
        }
    }

    /**
     * Validate command prerequisites
     */
    validate(context: ChatContext): string | undefined {
        if (!context.codeContext) {
            return 'Selecteer code in je editor om rubber duck mode te gebruiken.';
        }
        return undefined;
    }

    // ============== PRIVATE HELPERS ==============

    /**
     * Get or create duck context for a student
     */
    private getDuckContext(studentId: string): DuckContext {
        if (!this.sessions.has(studentId)) {
            this.sessions.set(studentId, new DuckContext());
        }
        return this.sessions.get(studentId)!;
    }

    /**
     * Stream socratic response with AI-generated questions
     */
    private async streamSocraticResponse(
        context: ChatContext,
        stream: vscode.ChatResponseStream,
        code: string,
        language: string,
        problemDescription: string,
        duckContext: DuckContext,
        token: vscode.CancellationToken
    ): Promise<void> {
        const session = duckContext.getCurrentSession();
        if (!session) {
            stream.markdown('❌ Sessie kon niet worden geïnitialiseerd.\n');
            return;
        }

        // Generate appropriate prompt based on session state
        let prompt: string;

        if (session.hintsGiven.length === 0) {
            // First hint - initial analysis and first question
            prompt = getInitialAnalysisPrompt(code, language, context.yearLevel, problemDescription);
        } else {
            // Follow-up hints
            const previousHints = session.hintsGiven
                .slice(-3) // Last 3 hints for context
                .map(h => h.question);

            prompt = getFollowUpPrompt(code, language, context.yearLevel, problemDescription, previousHints);
        }

        try {
            // Build messages and send request
            const messages = buildChatMessages(
                `Je bent een rubber duck debugger. ${this.getSystemContext(context.yearLevel)}`,
                context.chatContext,
                prompt,
                ''
            );

            const response = await sendChatRequest(context.model, messages, token, stream);

            if (response) {
                let responseText = '';
                for await (const fragment of response.text) {
                    stream.markdown(fragment);
                    responseText += fragment;
                }

                // Get proper hint type based on year level and hint number
                const hintTypes = getHintTypesForLevel(context.yearLevel);
                const hintIndex = session.hintsGiven.length % hintTypes.length;
                const hintType = hintTypes[hintIndex];

                // Record the hint
                duckContext.recordHint(responseText, code, hintType);

                console.log(`[DUCK] Hint recorded, total hints: ${session.hintsGiven.length}, type: ${hintType}`);
            } else {
                stream.markdown('\n\n❌ Kon geen response van AI ontvangen.\n');
            }
        } catch (error) {
            console.error('[DUCK] Error streaming response:', error);
            stream.markdown('\n\n❌ Fout bij verwerken van je vraag.\n');
        }
    }

    /**
     * Stream session closure message
     */
    private streamSessionClosure(stream: vscode.ChatResponseStream, duckContext: DuckContext): void {
        const summary = duckContext.getSessionSummary();

        stream.markdown('\n\n---\n\n');
        stream.markdown('🦆 **Rubber Duck Sessie Afgerond**\n\n');

        if (summary) {
            stream.markdown(`**Sessie Samenvatting:**\n`);
            stream.markdown(`- Vragen gesteld: ${summary.questionsAsked}\n`);
            stream.markdown(`- Hints gegeven: ${summary.hintsGiven}\n`);
            stream.markdown(`- Conversatie rondes: ${summary.conversationRounds}\n`);
            stream.markdown(`- Duur: ${summary.duration}\n\n`);
        }

        stream.markdown('*Wil je verder gaan met je code? Typ `/duck` opnieuw om te herstarten!*\n');
    }

    /**
     * Extract problem description from user prompt
     */
    private extractProblemDescription(prompt: string): string {
        // Remove the command part
        const withoutCommand = prompt.replace(/^\/duck\s*/, '').trim();
        return withoutCommand || 'Ik heb een probleem met mijn code';
    }

    /**
     * Get system context message for AI
     */
    private getSystemContext(yearLevel: number): string {
        const contexts: Record<number, string> = {
            1: 'Dit is een eerstejaars student. Zorg dat vragen duidelijk en niet-technisch zijn.',
            2: 'Dit is een tweedejaars student. Zorg dat vragen gericht zijn op probleemoplossing.',
            3: 'Dit is een derdejaars student. Focus op geavanceerde debugging technieken.',
            4: 'Dit is een vierdejaars student. Focus op architecturale en design-gerelateerde vragen.',
        };
        return contexts[yearLevel] || contexts[2];
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
        return names[level] || 'Onbekend';
    }
}