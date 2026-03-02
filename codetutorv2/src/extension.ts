/**
 * The heart of the Code tutor
 * @author Interis_MK
 */

import * as vscode from 'vscode';
import {
    ExplainCommand,
    FeedbackCommand,
    ExerciseCommand,
    ChatContext,
    ICommand,
    CommandServices
} from './index';
import {ChatResponseFileTree, Uri} from "vscode";

/**
 * Registers a chat participant with commands
 */
export function activate(context: vscode.ExtensionContext) {
    // Step 1: Create your services implementation
    const services: CommandServices = {
        updateProgress: (command: string) => {
            console.log(`Command executed: ${command}`);
            // Implement your progress tracking logic
            return { command, timestamp: new Date().toISOString() };
        },

        broadcastSSEUpdate: (data: any) => {
            console.log('Broadcasting update:', data);
            // Implement your SSE broadcasting logic
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

    commands.set(explainCmd.name, explainCmd);
    commands.set(feedbackCmd.name, feedbackCmd);
    commands.set(exerciseCmd.name, exerciseCmd);

    // Also register aliases
    [explainCmd, feedbackCmd, exerciseCmd].forEach(cmd => {
        if ('aliases' in cmd && cmd.aliases) {
            cmd.aliases.forEach((alias: string) => commands.set(alias, cmd));
        }
    });

    // Step 3: Register chat participant
    const participant = vscode.chat.createChatParticipant(
        'github-copilot',
        async (
            request: vscode.ChatRequest,
            chatContext: vscode.ChatContext,
            stream: vscode.ChatResponseStream,
            token: vscode.CancellationToken
        ): Promise<vscode.ChatResult> => {
            try {
                // Get AI model
                const [model] = await vscode.lm.selectChatModels({
                    vendor: 'copilot',
                    family: 'Claude Sonnet 4.6'
                });

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

                // Parse command from request
                const commandMatch = request.prompt.match(/^\/(\w+)/);
                const commandName = commandMatch ? commandMatch[1].toLowerCase() : '';

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
        anchor: (uri: vscode.Uri) => {},
        button: (command: vscode.Command) => {},
        progress: (message: string) => {},
        reference: (resource: vscode.Uri | vscode.Location) => {},
        push: (part: vscode.ChatResponsePart) => {},
       filetree(value: ChatResponseFileTree[], baseUri: Uri) {}
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
 * Example: Custom command implementation
 */
class CustomCommand implements ICommand {
    readonly name = 'custom';
    readonly description = 'My custom command';
    readonly aliases = ['mycommand'];

    async execute(
        context: ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<void> {
        stream.markdown(`## Custom Command\n\n`);
        stream.markdown(`Student ID: ${context.studentId}\n`);
        stream.markdown(`Year Level: ${context.yearLevel}\n`);

        if (context.codeContext) {
            stream.markdown(`\nYou have code selected in ${context.codeContext.language}\n`);
        }

        context.trackProgress('custom');
    }
}

