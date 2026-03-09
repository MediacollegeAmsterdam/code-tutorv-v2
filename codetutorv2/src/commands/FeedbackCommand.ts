import * as vscode from 'vscode';
import {ICommand} from '../core/ICommand';
import {ChatContext} from '../core/ChatContext';

/**
 * Feedback Command - Progressive feedback system for student code
 *
 * Provides multi-level feedback following the Socratic method:
 * - Level 1 (Attempt 1): Initial hints and guiding questions
 * - Level 2 (Attempts 2-3): Specific tips and debugging techniques
 * - Level 3 (Attempt 4+): Full working examples with explanations
 *
 * Usage:
 *   1. Select code in editor
 *   2. Type: @tutor /feedback [describe your problem]
 *
 * Features:
 *   - Progressive disclosure (more help as needed)
 *   - Session tracking for repeat questions
 *   - Automatic session cleanup after 30 seconds
 *   - Encourages critical thinking before giving answers
 *
 * Priority: P3 (Important learning feature)
 */
export class FeedbackCommand implements ICommand {
    readonly name = 'feedback';
    readonly description = 'Krijg progressieve feedback op je code';

    private feedbackSessions: Map<string, {
        attempts: number;
        lastFeedbackLevel: string;
        previousFeedback: string[];
        codeHash: string;
    }> = new Map();

    async execute(
        context: ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        const ctx = context.codeContext;
        if (!ctx) {
            stream.markdown(`Selecteer code in je editor om feedback te krijgen.\n\nGebruik: Selecteer je code, typ \`@tutor /feedback\` en beschrijf je probleem.`);
            context.trackProgress('feedback');
            return;
        }

        const code = ctx.code.replace(/^.*?\`\`\`\w+\n/, '').replace(/\`\`\`$/, '');
        const feedbackResponse = await this.generateProgressiveFeedback(
            context.request.prompt,
            code,
            ctx.language,
            context.model,
            1,
            undefined,
            token
        );

        stream.markdown(feedbackResponse);
        context.trackProgress('feedback');
    }

    /**
     * Generate progressive feedback based on attempt number
     */
    private async generateProgressiveFeedback(
        issue: string,
        code: string,
        language: string,
        model: vscode.LanguageModelChat,
        attempt: number = 1,
        sessionId?: string,
        token?: vscode.CancellationToken
    ): Promise<string> {
        const sid = sessionId || `session-${Date.now()}`;
        let session = this.feedbackSessions.get(sid);
        const codeHash = this.hashCode(code);
        const timestamp = new Date().toISOString();

        console.log(`[${timestamp}] [FEEDBACK] New feedback request - Issue: "${issue.substring(0, 50)}..."`);
        console.log(`[${timestamp}] [FEEDBACK] Code hash: ${codeHash}, Language: ${language}`);

        if (!session) {
            session = {attempts: 0, lastFeedbackLevel: 'initial', previousFeedback: [], codeHash};
            this.feedbackSessions.set(sid, session);
            console.log(`[${timestamp}] [FEEDBACK] Created new session: ${sid}`);
        }

        // If code hasn't changed, return cached feedback
        if (session.codeHash === codeHash && session.previousFeedback.length > 0 && attempt <= session.attempts) {
            console.log(`[${timestamp}] [FEEDBACK] Code unchanged - returning cached feedback (attempt ${session.attempts})`);
            return session.previousFeedback[session.attempts - 1] || 'Geen feedback beschikbaar.';
        }

        session.attempts++;
        console.log(`[${timestamp}] [FEEDBACK] Attempt ${session.attempts} - Level: ${session.attempts === 1 ? 'initial' : session.attempts <= 3 ? 'tips' : 'example'}`);

        // Level 1: Initial Feedback (Attempt 1) - OPTIMIZED
        if (session.attempts === 1) {
            const initialPrompt = `Je bent coach. Student probleem: ${issue}

Code:
\`\`\`${language}
${code}
\`\`\`

Geef kort feedback (max 100 woorden):
1. Het probleem identificeren
2. 1 gericht vraag om zelf op te lossen
Geen Code, geen uitleg, enkel vragen.`;

            const promptTokens = Math.ceil(initialPrompt.length / 4);
            console.log(`[${timestamp}] [FEEDBACK-L1] Sending request to ${model.name || model.id}`);
            console.log(`[${timestamp}] [FEEDBACK-L1] Prompt tokens: ~${promptTokens}`);

            const messages = [vscode.LanguageModelChatMessage.User(initialPrompt)];

            try {
                const startTime = Date.now();
                const response = await model.sendRequest(messages, {}, token);
                let fullResponse = '';
                let charCount = 0;
                const maxChars = 1200;

                for await (const fragment of response.text) {
                    if (charCount + fragment.length > maxChars) {
                        fullResponse += fragment.substring(0, maxChars - charCount) + '\n\n[...]';
                        break;
                    }
                    fullResponse += fragment;
                    charCount += fragment.length;
                }

                const elapsed = Date.now() - startTime;
                const responseTokens = Math.ceil(charCount / 4);
                console.log(`[${timestamp}] [FEEDBACK-L1] Response complete in ${elapsed}ms`);
                console.log(`[${timestamp}] [FEEDBACK-L1] Response length: ${charCount} chars (~${responseTokens} tokens)`);
                console.log(`[${timestamp}] [FEEDBACK-L1] Total tokens (request+response): ~${promptTokens + responseTokens}`);

                session.lastFeedbackLevel = 'initial';
                session.previousFeedback.push(fullResponse);
                return fullResponse;
            } catch (e) {
                console.error(`[${timestamp}] [FEEDBACK-L1-ERROR] Failed to generate feedback:`, e);
                return 'Kon feedback niet genereren. Probeer opnieuw.';
            }
        }

        // Level 2: Specific Tips (Attempts 2-3) - OPTIMIZED
        if (session.attempts === 2 || session.attempts === 3) {
            const tipsPrompt = `Coach antwoord op: ${issue}

Code:
\`\`\`${language}
${code}
\`\`\`

Geef 3 concrete tips (max 120 woorden):
- Wat te checken
- Debug techniek
- Volgende stap`;

            const promptTokens = Math.ceil(tipsPrompt.length / 4);
            console.log(`[${timestamp}] [FEEDBACK-L2] Sending request to ${model.name || model.id}`);
            console.log(`[${timestamp}] [FEEDBACK-L2] Prompt tokens: ~${promptTokens}`);

            const messages = [vscode.LanguageModelChatMessage.User(tipsPrompt)];

            try {
                const startTime = Date.now();
                const response = await model.sendRequest(messages, {}, token);
                let fullResponse = '';
                let charCount = 0;
                const maxChars = 1500;

                for await (const fragment of response.text) {
                    if (charCount + fragment.length > maxChars) {
                        fullResponse += fragment.substring(0, maxChars - charCount) + '\n\n[...]';
                        break;
                    }
                    fullResponse += fragment;
                    charCount += fragment.length;
                }

                const elapsed = Date.now() - startTime;
                const responseTokens = Math.ceil(charCount / 4);
                console.log(`[${timestamp}] [FEEDBACK-L2] Response complete in ${elapsed}ms`);
                console.log(`[${timestamp}] [FEEDBACK-L2] Response length: ${charCount} chars (~${responseTokens} tokens)`);
                console.log(`[${timestamp}] [FEEDBACK-L2] Total tokens (request+response): ~${promptTokens + responseTokens}`);

                session.lastFeedbackLevel = 'tips';
                session.previousFeedback.push(fullResponse);
                return fullResponse;
            } catch (e) {
                console.error(`[${timestamp}] [FEEDBACK-L2-ERROR] Failed to generate tips:`, e);
                return 'Kon tips niet genereren. Probeer opnieuw.';
            }
        }

        // Level 3: Full Example (Attempt 4+) - OPTIMIZED
        if (session.attempts >= 4) {
            const examplePrompt = `Geef werkend voorbeeld voor: ${issue}

\`\`\`${language}
${code}
\`\`\`

Output (250 woorden max):
\`\`\`${language}
[werkend code voorbeeld]
\`\`\`

Hoe het werkt:
[korte uitleg]`;

            const promptTokens = Math.ceil(examplePrompt.length / 4);
            console.log(`[${timestamp}] [FEEDBACK-L3] Sending request to ${model.name || model.id}`);
            console.log(`[${timestamp}] [FEEDBACK-L3] Prompt tokens: ~${promptTokens}`);

            const messages = [vscode.LanguageModelChatMessage.User(examplePrompt)];

            try {
                const startTime = Date.now();
                const response = await model.sendRequest(messages, {}, token);
                let fullResponse = '';
                let charCount = 0;
                const maxChars = 2000;

                for await (const fragment of response.text) {
                    if (charCount + fragment.length > maxChars) {
                        fullResponse += fragment.substring(0, maxChars - charCount) + '\n\n[...]';
                        break;
                    }
                    fullResponse += fragment;
                    charCount += fragment.length;
                }

                const elapsed = Date.now() - startTime;
                const responseTokens = Math.ceil(charCount / 4);
                console.log(`[${timestamp}] [FEEDBACK-L3] Response complete in ${elapsed}ms`);
                console.log(`[${timestamp}] [FEEDBACK-L3] Response length: ${charCount} chars (~${responseTokens} tokens)`);
                console.log(`[${timestamp}] [FEEDBACK-L3] Total tokens (request+response): ~${promptTokens + responseTokens}`);

                session.lastFeedbackLevel = 'example';
                session.previousFeedback.push(fullResponse);

                // Clean up after 30 seconds
                setTimeout(() => {
                    this.feedbackSessions.delete(sid);
                    console.log(`[${new Date().toISOString()}] [FEEDBACK] Session ${sid} cleaned up`);
                }, 30000);

                return fullResponse;
            } catch (e) {
                console.error(`[${timestamp}] [FEEDBACK-L3-ERROR] Failed to generate example:`, e);
                return 'Kon voorbeeld niet genereren. Probeer opnieuw.';
            }
        }

        return 'Vraag opnieuw - ik kan je beter helpen';
    }

    /**
     * Simple hash function for code deduplication
     */
    private hashCode(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }
}
