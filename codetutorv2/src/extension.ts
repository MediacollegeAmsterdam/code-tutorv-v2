/**
 * The heart of the Code tutor
 * @author Interis_MK
 */

import * as vscode from 'vscode';
import {
    ExplainCommand,
    FeedbackCommand,
    ExerciseCommand,
    LevelCommand,
    DuckCommand,
    ChatContext,
    ICommand,
    CommandServices,
    getValidModel
} from './index';
import { ChatResponseFileTree, Uri } from "vscode";

/**
 * Registers a chat participant with commands
 */
export function activate(context: vscode.ExtensionContext) {
    // Step 1: Create your services implementation
    const services: CommandServices = {
        updateProgress: (command: string) => {
            // Implement your progress tracking logic
            return { command, timestamp: new Date().toISOString() };
        },

        broadcastSSEUpdate: (data: any) => {
            console.log('Broadcasting update:', data);
        },

        getOrCreateStudentId: () => {
            // Implement your student ID generation logic
            let studentId = context.globalState.get<string>('studentId');
            if (!studentId) {
                studentId = `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                context.globalState.update('studentId', studentId);
            }
            return studentId;
        },

        loadStudentData: () => {
            return context.globalState.get('studentData', {});
        },

        saveStudentData: (data: Record<string, any>) => {
            context.globalState.update('studentData', data);
        },

        loadStudentMetadata: () => {
            return context.globalState.get('studentMetadata', {});
        },

        saveStudentMetadata: (data: Record<string, any>) => {
            context.globalState.update('studentMetadata', data);
        }
    };

    // Step 2: Initialize commands
    const commands: Map<string, ICommand> = new Map();

    const explainCmd = new ExplainCommand();
    const feedbackCmd = new FeedbackCommand();
    const exerciseCmd = new ExerciseCommand();
    const levelCmd = new LevelCommand();
    const duckCmd = new DuckCommand();

    commands.set(explainCmd.name, explainCmd);
    commands.set(feedbackCmd.name, feedbackCmd);
    commands.set(exerciseCmd.name, exerciseCmd);
    commands.set(levelCmd.name, levelCmd);
    commands.set(duckCmd.name, duckCmd);

    // Also register aliases
    [explainCmd, feedbackCmd, exerciseCmd, levelCmd, duckCmd].forEach(cmd => {
        if ('aliases' in cmd && cmd.aliases) {
            cmd.aliases.forEach((alias: string) => commands.set(alias, cmd));
        }
    });

    // Step 3: Register chat participant
    const participant = vscode.chat.createChatParticipant(
        'codetutorv2.tutor',
        async (
            request: vscode.ChatRequest,
            chatContext: vscode.ChatContext,
            stream: vscode.ChatResponseStream,
            token: vscode.CancellationToken
        ): Promise<vscode.ChatResult> => {
            try {
                // Get AI model - prefer the one selected by the user in the UI (request.model)
                const rawModel = request.model || await getCachedModel();
                
                // Check if getValidModel is actually the function we expect, not a Jest mock
                const model = (typeof getValidModel === 'function' && !(getValidModel as any)._isMockFunction)
                    ? await getValidModel(rawModel || undefined) : rawModel;

                if (!model) {
                    stream.markdown('❌ No AI model available. Please install GitHub Copilot.');
                    return { metadata: { command: 'error' } };
                }

                // Create chat context
                const chatContextInstance = await ChatContext.create(
                    request,
                    chatContext,
                    token,
                    context,
                    model,
                    services
                );

                // Parse command - first try request.command, then try parsing from prompt
                let commandName = '';

                // Check if request has a command property (newer VS Code API)
                if ('command' in request && request.command) {
                    commandName = (request.command as string).toLowerCase();
                    console.log('[Code Tutor] Using request.command:', commandName);
                } else {
                    // Fallback: parse from prompt text
                    const commandMatch = request.prompt.match(/^\/(\w+)/);
                    commandName = commandMatch ? commandMatch[1].toLowerCase() : '';
                    console.log('[Code Tutor] Parsed from prompt:', commandName, 'prompt:', request.prompt);
                }

                console.log('[Code Tutor] Final command name:', commandName);
                console.log('[Code Tutor] Available commands:', Array.from(commands.keys()));

                // Execute command
                const command = commands.get(commandName);
                if (command) {
                    await command.execute(chatContextInstance, stream, token);
                    return { metadata: { command: commandName } };
                } else {
                    // Default AI response (no specific command)
                    stream.markdown(`🤖 I don't recognize that command.\n\n`);
                    stream.markdown(`Available commands:\n`);
                    stream.markdown(`- \`/explain\` - Explain code or concepts\n`);
                    stream.markdown(`- \`/feedback\` - Get progressive feedback on your code\n`);
                    stream.markdown(`- \`/exercise\` - Generate or list exercises\n`);
                    stream.markdown(`- \`/duck\` - Rubber duck debugging with Socratic hints\n`);
                    stream.markdown(`- \`/level\` - Change your difficulty level\n`);
                    return { metadata: { command: 'help' } };
                }
            } catch (error) {
                console.error('Chat participant error:', error);
                stream.markdown(`❌ An error occurred: ${error instanceof Error ? error.message : String(error)}`);
                return { metadata: { command: 'error', error: String(error) } };
            }
        }
    );

    // Step 4: Set metadata
    participant.iconPath = vscode.Uri.file(
        context.asAbsolutePath('resources/icon.png')
    );

    // Step 5: Add to subscriptions
    context.subscriptions.push(participant);

    console.log('✅ Chat participant with extracted features activated!');
}

export function deactivate() {
    console.log('Chat participant deactivated');
}

/**
 * programatically commands usage
 */
export async function exampleProgrammaticUsage(
    context: vscode.ExtensionContext,
    model: vscode.LanguageModelChat,
    services: CommandServices
) {
    // Create a mock request
    const mockRequest: vscode.ChatRequest = {
        prompt: 'Explain what a loop is',
        command: 'explain',
        references: [],
        toolReferences: [],
        toolInvocationToken: undefined,
        model: model
    };

    // Create a mock chat context
    const mockChatContext: vscode.ChatContext = {
        history: []
    };

    // Create a mock stream
    const mockStream: vscode.ChatResponseStream = {
        markdown: (text: string) => console.log('[Stream]', text),
        anchor: (uri: vscode.Uri) => { },
        button: (command: vscode.Command) => { },
        progress: (message: string) => { },
        reference: (resource: vscode.Uri | vscode.Location) => { },
        push: (part: vscode.ChatResponsePart) => { },
        filetree(value: ChatResponseFileTree[], baseUri: Uri) { }
    };

    // Create cancellation token
    const token = new vscode.CancellationTokenSource().token;

    // Create chat context
    const chatContext = await ChatContext.create(
        mockRequest,
        mockChatContext,
        token,
        context,
        model,
        services
    );

    // Execute explain command
    const explainCmd = new ExplainCommand();
    await explainCmd.execute(chatContext, mockStream, token);
}

/**
 * Model cache to avoid repeated API calls (60 second TTL)
 */
let cachedModel: vscode.LanguageModelChat | null = null;
let modelCacheTime = 0;

async function getCachedModel(): Promise<vscode.LanguageModelChat | null> {
    const now = Date.now();
    if (cachedModel && (now - modelCacheTime) < 60000) {
        return cachedModel;
    }

    try {
        const [model] = await vscode.lm.selectChatModels({ vendor: 'copilot' });
        if (model) {
            cachedModel = model;
            modelCacheTime = now;
        }
        return model || null;
    } catch (error) {
        console.error('Failed to get model:', error);
        return null;
    }
}