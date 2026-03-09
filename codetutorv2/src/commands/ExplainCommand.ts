import * as vscode from 'vscode';
import { ICommand } from '../core/ICommand';
import { ChatContext } from '../core/ChatContext';
import { buildChatMessages, sendChatRequest } from '../core/chat-utils';

/**
 * Explain Command - AI-powered code explanation
 *
 * Provides detailed explanations of code concepts and syntax.
 * Adapts explanation complexity based on student year level.
 *
 * Usage:
 *   @tutor /explain [concept or question]
 *
 * Features:
 *   - Year-level aware explanations (1st-4th year)
 *   - Uses selected code or visible code as context
 *   - Streams responses for better UX
 *   - No code generation unless hints requested
 *
 * Priority: P2 (Core learning feature)
 */
export class ExplainCommand implements ICommand {
	readonly name = 'explain';
	readonly description = 'Leg code of concepten uit';
	readonly aliases = ['clarify', 'what'];

	async execute(
		context: ChatContext,
		stream: vscode.ChatResponseStream,
		token: vscode.CancellationToken
	): Promise<void> {
		const timestamp = new Date().toISOString();
		console.log(`[${timestamp}] [EXPLAIN] Explain command started`);
		console.log(`[${timestamp}] [EXPLAIN] Year level: ${context.yearLevel}`);
		console.log(`[${timestamp}] [EXPLAIN] User query: "${context.request.prompt.substring(0, 100)}..."`);

		const codeContext = context.codeContext?.code || '';
		const prompt = this.createBasePrompt(context.yearLevel);
		const userMessage = context.request.prompt;

		if (codeContext) {
			const codeTokens = Math.ceil(codeContext.length / 4);
			console.log(`[${timestamp}] [EXPLAIN] Code context included: ~${codeTokens} tokens`);
		}

		const messages = buildChatMessages(
			prompt,
			context.chatContext,
			userMessage,
			codeContext
		);

		const totalRequestTokens = messages.reduce((sum, msg) => sum + Math.ceil(msg.content.length / 4), 0);
		console.log(`[${timestamp}] [EXPLAIN] Total request tokens: ~${totalRequestTokens}`);

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
			console.log(`[${timestamp}] [EXPLAIN] Response received in ${elapsed}ms, length: ${responseLength} chars (~${responseTokens} tokens)`);
			console.log(`[${timestamp}] [EXPLAIN] Total tokens (request+response): ~${totalRequestTokens + responseTokens}`);
		}

		context.trackProgress('explain');
	}

	/**
	 * Create year-level appropriate base prompt
	 */
	private createBasePrompt(yearLevel: number): string {
		const prompts: Record<number, string> = {
			1: 'Je bent een hulpzame programming coach voor eerstejaars studenten. Leg ALLES uit - geen aannames. GEEN CODE TENZIJ HINTS GEVRAAGD. Spreek Nederlands.',
			2: 'Je bent een programming coach voor 2nd year studenten. Focus op praktische uitleg. GEEN CODE TENZIJ HINTS. Spreek Nederlands.',
			3: 'Je bent een programming mentor voor 3rd year studenten. Focus on advanced concepts. GEEN CODE TENZIJ HINTS. Spreek Nederlands.',
			4: 'Je bent een expert programming mentor voor 4th year studenten. Focus op diepgaande analyse. GEEN CODE TENZIJ HINTS. Spreek Nederlands.'
		};
		return prompts[yearLevel] || prompts[2];
	}
}

