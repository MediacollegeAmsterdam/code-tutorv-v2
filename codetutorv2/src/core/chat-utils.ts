/**
 * Chat Utilities - Helper functions for chat participant
 * WITH COMPREHENSIVE LOGGING FOR TOKEN USAGE TRACKING
 */

import * as vscode from 'vscode';
import {CodeContext} from '../types';

// Logging helper
function logTokenUsage(category: string, detail: string, estimatedTokens?: number) {
    const timestamp = new Date().toISOString();
    const tokenStr = estimatedTokens ? ` [~${estimatedTokens} tokens]` : '';
    console.log(`[${timestamp}] [TOKEN-USAGE] ${category}: ${detail}${tokenStr}`);
}

function logModelOperation(operation: string, model: string, detail: string) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [MODEL] ${operation}: ${model} - ${detail}`);
}

/**
 * Get code context from active editor
 * Returns selected text or visible code with markdown formatting
 */
export function getCodeContext(): CodeContext | null {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        console.log(`[${new Date().toISOString()}] [CODE-CONTEXT] No active editor`);
        return null;
    }

    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);

    if (selectedText) {
        const codeContext = `\n\nGeselecteerde code:\n\`\`\`${editor.document.languageId}\n${selectedText}\n\`\`\``;
        const estimatedTokens = Math.ceil(selectedText.length / 4);
        logTokenUsage('CODE-CONTEXT', `Selected code in ${editor.document.languageId}`, estimatedTokens);
        return {
            code: codeContext,
            language: editor.document.languageId
        };
    }

    const visibleRanges = editor.visibleRanges;
    if (visibleRanges.length > 0) {
        const visibleText = editor.document.getText(visibleRanges[0]);
        if (visibleText.length < 3000) {
            const estimatedTokens = Math.ceil(visibleText.length / 4);
            logTokenUsage('CODE-CONTEXT', `Visible code in ${editor.document.languageId}`, estimatedTokens);
            return {
                code: `\n\nZichtbare code in editor:\n\`\`\`${editor.document.languageId}\n${visibleText}\n\`\`\``,
                language: editor.document.languageId
            };
        } else {
            logTokenUsage('CODE-CONTEXT', `Visible code too large (${visibleText.length} chars), skipping`, 0);
        }
    }
    return null;
}

/**
 * Check if a model is the "auto" model
 */
export function isAutoModel(model: vscode.LanguageModelChat): boolean {
    const isAuto = model.id.toLowerCase().includes('auto') ||
        model.name.toLowerCase().includes('auto') ||
        (model.vendor === 'copilot' && model.family === '');

    if (isAuto) {
        logModelOperation('CHECK', model.name || model.id, 'Detected as AUTO model');
    }
    return isAuto;
}

/**
 * List all concrete (non-auto) language models
 * @param _useCache
 */
export async function listConcreteModels(_useCache: boolean = false): Promise<vscode.LanguageModelChat[]> {
    const startTime = Date.now();
    logTokenUsage('API-CALL', 'selectChatModels() - Starting', 0);

    try {
        const allModels = await vscode.lm.selectChatModels();
        const elapsed = Date.now() - startTime;
        logTokenUsage('API-CALL', `selectChatModels() - Success (${elapsed}ms)`, 50);
        logModelOperation('LIST', 'All Models', `Found ${allModels.length} total models`);

        const concrete = allModels.filter(m => !isAutoModel(m));
        logModelOperation('LIST', 'Concrete Models', `Filtered to ${concrete.length} concrete models`);
        concrete.forEach(m => {
            logModelOperation('AVAILABLE', m.name || m.id, `vendor: ${m.vendor}, family: ${m.family}`);
        });

        return concrete;
    } catch (error) {
        const elapsed = Date.now() - startTime;
        console.error(`[${new Date().toISOString()}] [API-ERROR] selectChatModels() failed after ${elapsed}ms:`, error);
        return [];
    }
}

/**
 * Get a valid language model, avoiding "auto" model
 * Returns the provided model if valid, otherwise first available concrete model
 * Respects user's preferred model from settings
 */
export async function getValidModel(model: vscode.LanguageModelChat | undefined): Promise<vscode.LanguageModelChat | null> {
    const startTime = Date.now();
    logTokenUsage('MODEL-SELECTION', 'Starting getValidModel()', 0);

    try {
        const list = await listConcreteModels(true);

        if (list.length === 0) {
            logTokenUsage('MODEL-SELECTION', 'No concrete models available', 0);
            return null;
        }

        if (model && !isAutoModel(model)) {
            const found = list.find((m: vscode.LanguageModelChat) => m.id === model.id);
            if (found) {
                logModelOperation('SELECTED', found.name || found.id, 'Using provided model');
                return found;
            }
        }

        // Check for user preference (settings) only if no explicit model was provided via UI
        const preferredModelId = vscode.workspace.getConfiguration('codeTutor').get<string>('preferredModel');
        if (preferredModelId) {
            logTokenUsage('MODEL-SELECTION', `Checking user preference: ${preferredModelId}`, 0);
            const preferred = list.find(m => m.id === preferredModelId);
            if (preferred) {
                logModelOperation('SELECTED', preferred.name || preferred.id, `User preferred model (${preferredModelId})`);
                return preferred;
            } else {
                logTokenUsage('MODEL-SELECTION', `Preferred model not found, using fallback`, 0);
            }
        }

        const selected = list[0] ?? null;
        if (selected) {
            logModelOperation('SELECTED', selected.name || selected.id, 'Using first available model');
        }
        const elapsed = Date.now() - startTime;
        logTokenUsage('MODEL-SELECTION', `Complete in ${elapsed}ms`, 0);
        return selected;
    } catch (e) {
        console.error(`[${new Date().toISOString()}] [API-ERROR] getValidModel() failed:`, e);
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
    const prompt = basePrompts[yearLevel] || basePrompts[2];
    const estimatedTokens = Math.ceil(prompt.length / 4);
    logTokenUsage('PROMPT', `Base prompt for year level ${yearLevel}`, estimatedTokens);
    return prompt;
}

/**
 * Build chat messages array with context history - OPTIMIZED
 * Only includes last 2 history items instead of all history
 */
export function buildChatMessages(
    basePrompt: string,
    chatContext: vscode.ChatContext,
    userPrompt: string,
    codeContext: string
): vscode.LanguageModelChatMessage[] {
    logTokenUsage('MESSAGES', 'Building chat message array', 0);

    const messages: vscode.LanguageModelChatMessage[] = [
        vscode.LanguageModelChatMessage.Assistant(basePrompt)
    ];

    let totalTokens = Math.ceil(basePrompt.length / 4);
    logTokenUsage('MESSAGES', `Added base prompt`, Math.ceil(basePrompt.length / 4));

    // OPTIMIZED: Only last 2 messages from history to reduce tokens
    const previousMessages = Array.isArray(chatContext?.history)
        ? chatContext.history
            .filter((h: any) => (vscode.ChatResponseTurn ? h instanceof vscode.ChatResponseTurn : false))
            .slice(-2) // Only last 2 messages
        : [];

    logTokenUsage('MESSAGES', `Processing ${previousMessages.length} history messages`, 0);

    previousMessages.forEach((m, index) => {
        let fullMessage = '';
        m.response.forEach((r: any) => {
            const mdPart = r as vscode.ChatResponseMarkdownPart;
            fullMessage += mdPart.value?.value || '';
        });
        if (fullMessage.length < 500) {
            const msgTokens = Math.ceil(fullMessage.length / 4);
            logTokenUsage('MESSAGES', `Added history message ${index + 1}`, msgTokens);
            totalTokens += msgTokens;
            messages.push(vscode.LanguageModelChatMessage.Assistant(fullMessage));
        } else {
            logTokenUsage('MESSAGES', `Skipped long history message (${fullMessage.length} chars)`, 0);
        }
    });

    // Add current user message with code context
    const userMessage = userPrompt + codeContext;
    messages.push(vscode.LanguageModelChatMessage.User(userMessage));

    const userMsgTokens = Math.ceil(userMessage.length / 4);
    logTokenUsage('MESSAGES', `Added user message`, userMsgTokens);
    totalTokens += userMsgTokens;

    logTokenUsage('MESSAGES', `Total ${messages.length} messages`, totalTokens);
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
    const startTime = Date.now();
    const messageTokens = messages.reduce((sum, msg) => sum + Math.ceil(msg.content.length / 4), 0);

    logModelOperation('REQUEST', model.name || model.id, `Sending ${messages.length} messages`);
    logTokenUsage('API-CALL', `sendRequest() with ${messages.length} messages`, messageTokens);

    const trySend = async (m: vscode.LanguageModelChat) => {
        logModelOperation('SEND', m.name || m.id, 'Executing sendRequest()');
        return m.sendRequest(messages, {}, token);
    };

    try {
        const response = await trySend(model);
        const elapsed = Date.now() - startTime;
        logModelOperation('RESPONSE', model.name || model.id, `Success in ${elapsed}ms`);
        logTokenUsage('API-CALL', `sendRequest() completed`, messageTokens);
        return response;
    } catch (err: any) {
        const msg = String(err?.message || '').toLowerCase();
        const elapsed = Date.now() - startTime;
        console.error(`[${new Date().toISOString()}] [MODEL-ERROR] ${model.name || model.id} failed after ${elapsed}ms:`, err?.message);

        const isAutoIssue = msg.includes('endpoint not found') || msg.includes('model auto');
        const isUnsupported = msg.includes('unsupported') ||
            (err?.code && String(err.code).toLowerCase().includes('unsupported'));

        if (isAutoIssue || isUnsupported) {
            logTokenUsage('MODEL-FALLBACK', `${model.name} failed with ${err?.code || 'unknown error'}, trying alternatives`, 0);
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
                    logModelOperation('FALLBACK-ATTEMPT', candidate.name || candidate.id, `Trying fallback model ${i + 1}/${list.length}`);
                    stream.markdown(`_(Andere model geprobeerd: ${candidate.name})_\n`);
                    const fallbackResponse = await trySend(candidate);
                    logModelOperation('FALLBACK-SUCCESS', candidate.name || candidate.id, 'Fallback model succeeded');
                    return fallbackResponse;
                } catch (fallbackErr: any) {
                    console.warn(`[${new Date().toISOString()}] [FALLBACK-ERROR] ${candidate.name} also failed:`, fallbackErr?.message);
                    logTokenUsage('MODEL-FALLBACK', `${candidate.name} failed, trying next`, 0);
                }
            }

            console.error(`[${new Date().toISOString()}] [CRITICAL] All models failed`);
            stream.markdown('❌ Geen geschikt AI-model werkte. Kies handmatig een ander model.');
            return null;
        } else {
            console.error(`[${new Date().toISOString()}] [API-ERROR] Non-fallback error:`, err);
            throw err;
        }
    }
}
