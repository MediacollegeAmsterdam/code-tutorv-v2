import * as vscode from 'vscode';
import { ConversationStorage } from './storage/ConversationStorage';
import { StudentContextManager } from './services/StudentContextManager';
import { MessageHandler } from './services/MessageHandler';
import { PromptBuilder } from './services/PromptBuilder';
import { ResponseFormatter } from './services/ResponseFormatter';
import { ChatParticipantProvider } from './services/chatParticipantProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('code-tutor-v2 is now active!');

    // Initialize core components
    const storage = new ConversationStorage(context);
    const contextManager = new StudentContextManager(context, storage);
    const messageHandler = new MessageHandler();
    const promptBuilder = new PromptBuilder();
    const responseFormatter = new ResponseFormatter();
    const chatProvider = new ChatParticipantProvider(
        messageHandler,
        contextManager,
        promptBuilder,
        responseFormatter
    );

    // Activate chat participant
    chatProvider.activate(context);

    console.log('code-tutor-v2 chat participant registered');
}

// This method is called when your extension is deactivated
export function deactivate() {
    console.log('code-tutor-v2 is now deactivated');
}
