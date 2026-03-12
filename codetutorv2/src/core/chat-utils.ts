/**
 * Chat Utilities - Helper functions for chat participant
 * WITH COMPREHENSIVE LOGGING FOR TOKEN USAGE TRACKING
 */

import * as vscode from 'vscode';
import {CodeContext} from '../types';

/**
 * Get code context from active editor
 * Returns selected text or visible code with markdown formatting
 */
export function getCodeContext(): CodeContext | null {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return null;
    }

    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);

    if (selectedText) {
        const codeContext = `\n\nGeselecteerde code:\n\`\`\`${editor.document.languageId}\n${selectedText}\n\`\`\``;
        return {
            code: codeContext,
            language: editor.document.languageId
        };
    }

    const visibleRanges = editor.visibleRanges;
    if (visibleRanges.length > 0) {
        const visibleText = editor.document.getText(visibleRanges[0]);
        if (visibleText.length < 3000) {
            return {
                code: `\n\nZichtbare code in editor:\n\`\`\`${editor.document.languageId}\n${visibleText}\n\`\`\``,
                language: editor.document.languageId
            };
        }
    }
    return null;
}

/**
 * Check if a model is the "auto" model
 */
export function isAutoModel(model: vscode.LanguageModelChat): boolean {
    return model.id.toLowerCase().includes('auto') ||
        model.name.toLowerCase().includes('auto') ||
        (model.vendor === 'copilot' && model.family === '');
}

/**
 * List all concrete (non-auto) language models
 * @param _useCache
 */
export async function listConcreteModels(_useCache: boolean = false): Promise<vscode.LanguageModelChat[]> {
    try {
        const allModels = await vscode.lm.selectChatModels();

        return allModels.filter(m => !isAutoModel(m));
    } catch (error) {
        return [];
    }
}

/**
 * Get a valid language model, avoiding "auto" model
 * Returns the provided model if valid, otherwise first available concrete model
 * Respects user's preferred model from settings
 */
export async function getValidModel(model: vscode.LanguageModelChat | undefined): Promise<vscode.LanguageModelChat | null> {
    try {
        const list = await listConcreteModels(true);

        if (list.length === 0) {
            return null;
        }

        if (model && !isAutoModel(model)) {
            const found = list.find((m: vscode.LanguageModelChat) => m.id === model.id);
            if (found) {
                return found;
            }
        }

        // Check for user preference (settings) only if no explicit model was provided via UI
        const preferredModelId = vscode.workspace.getConfiguration('codeTutor').get<string>('preferredModel');
        if (preferredModelId) {
            const preferred = list.find(m => m.id === preferredModelId);
            if (preferred) {
                return preferred;
            }
        }

        return list[0] ?? null;
    } catch (e) {
        return null;
    }
}

/**
 * Create year level aware base prompt for chat
 */
export function createBasePrompt(yearLevel: number): string {
    const basePrompts: Record<number, string> = {
        1: 'Je bent programmeercoach voor eerstejaars. Leg ALLES uit, geen aannames. Kleine stappen, veel voorbeelden. GEEN CODE tenzij gevraagd. Nederlands.',
        2: 'Je bent programmeercoach voor 2e jaars. Focus op praktijk, best practices. GEEN CODE tenzij hints. Nederlands.',
        3: 'Je bent programmeermentoor voor 3e jaars. Advanced patterns, systeem design. GEEN CODE tenzij hints. Nederlands.',
        4: 'Je bent expert mentor voor 4e jaars/professionals. Cutting-edge, onderzoek. GEEN CODE tenzij hints. Nederlands.'
    };
    return basePrompts[yearLevel] || basePrompts[2];
}

/**
 * Build chat messages array with context history - OPTIMIZED
 * Only includes last 5 history items instead of all history
 */
export function buildChatMessages(
    basePrompt: string,
    chatContext: vscode.ChatContext,
    userPrompt: string,
    codeContext: string
): vscode.LanguageModelChatMessage[] {

    const messages: vscode.LanguageModelChatMessage[] = [
        vscode.LanguageModelChatMessage.Assistant(basePrompt)
    ];
    let totalTokens = Math.ceil(basePrompt.length / 4);

    // OPTIMIZED: Only last 5 messages from history to reduce tokens
    const previousMessages = Array.isArray(chatContext?.history)
        ? chatContext.history
            .filter((h: any) => (vscode.ChatResponseTurn ? h instanceof vscode.ChatResponseTurn : false))
            .slice(-5) // Only last 5 messages
        : [];

    previousMessages.forEach((m, index) => {
        let fullMessage = '';
        m.response.forEach((r: any) => {
            const mdPart = r as vscode.ChatResponseMarkdownPart;
            fullMessage += mdPart.value?.value || '';
        });
        if (fullMessage.length < 500) {
            const msgTokens = Math.ceil(fullMessage.length / 4);
            totalTokens += msgTokens;
            messages.push(vscode.LanguageModelChatMessage.Assistant(fullMessage));
        }
    });

    // Add current user message with code context
    const userMessage = userPrompt + codeContext;
    messages.push(vscode.LanguageModelChatMessage.User(userMessage));

    return messages;
}

/**
 * Send chat request with model rotation fallback
 */
export async function sendChatRequest(
    model: vscode.LanguageModelChat,
    messages: vscode.LanguageModelChatMessage[],
    token: vscode.CancellationToken,
    stream: vscode.ChatResponseStream
): Promise<vscode.LanguageModelChatResponse | null> {

    const trySend = async (m: vscode.LanguageModelChat) => {
        return m.sendRequest(messages, {}, token);
    };

    try {
        return await trySend(model);
    } catch (err: any) {
        const msg = String(err?.message || '').toLowerCase();

        const isAutoIssue = msg.includes('endpoint not found') || msg.includes('model auto');
        const isUnsupported = msg.includes('unsupported') ||
            (err?.code && String(err.code).toLowerCase().includes('unsupported'));

        if (isAutoIssue || isUnsupported) {
            stream.markdown(`_(Andere model geprobeerd: ${model.name})_\n`);

            // Rotate through other concrete models and try again
            const list = await listConcreteModels();
            const currentIndex = list.findIndex((m: vscode.LanguageModelChat) => m.id === model.id);

            for (let i = 0; i < list.length; i++) {
                const candidate = list[i];
                if (i === currentIndex) {
                    continue;
                }

                try {
                    stream.markdown(`_(Andere model geprobeerd: ${candidate.name})_\n`);
                    return await trySend(candidate);
                } catch (fallbackErr: any) {
                    return null;
                }
            }

            stream.markdown('❌ Geen geschikt AI-model werkte. Kies handmatig een ander model.');
            return null;
        } else {
            throw err;
        }
    }
}
