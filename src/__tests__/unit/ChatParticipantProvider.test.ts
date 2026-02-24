/**
 * Unit tests for ChatParticipantProvider
 * Tests T009-T011: skeleton, activate(), and handleChat() orchestration
 */

// Mock vscode before any imports
jest.mock('vscode', () => ({
    window: {
        showInputBox: jest.fn(),
        showInformationMessage: jest.fn(),
        showWarningMessage: jest.fn(),
        showErrorMessage: jest.fn(),
    },
    commands: {
        registerCommand: jest.fn((command, callback) => {
            return {
                dispose: jest.fn(),
            };
        }),
    },
    workspace: {
        getConfiguration: jest.fn(() => ({
            get: jest.fn((key: string, defaultValue: any) => defaultValue),
        })),
    },
}), { virtual: true });

import * as vscode from 'vscode';
import { ChatParticipantProvider } from '../../services/chatParticipantProvider';
import { MessageHandler } from '../../services/MessageHandler';
import { StudentContextManager } from '../../services/StudentContextManager';
import { ConversationStorage } from '../../storage/ConversationStorage';

// Mock VS Code API
const mockGlobalState = new Map<string, any>();
const mockContext = {
    globalState: {
        get: jest.fn((key: string, defaultValue?: any) => {
            return mockGlobalState.get(key) ?? defaultValue;
        }),
        update: jest.fn((key: string, value: any) => {
            mockGlobalState.set(key, value);
            return Promise.resolve();
        }),
    },
    subscriptions: [] as vscode.Disposable[],
} as unknown as vscode.ExtensionContext;


describe('ChatParticipantProvider', () => {
    let provider: ChatParticipantProvider;
    let messageHandler: MessageHandler;
    let contextManager: StudentContextManager;
    let storage: ConversationStorage;

    beforeEach(() => {
        mockGlobalState.clear();
        jest.clearAllMocks();

        storage = new ConversationStorage(mockContext);
        contextManager = new StudentContextManager(mockContext, storage);
        messageHandler = new MessageHandler();
        provider = new ChatParticipantProvider(messageHandler, contextManager);
    });

    describe('T009: Constructor and initialization', () => {
        it('should create provider with dependencies', () => {
            expect(provider).toBeDefined();
            expect(provider).toBeInstanceOf(ChatParticipantProvider);
        });
    });

    describe('T010: activate() method', () => {
        it('should register chat command', () => {
            provider.activate(mockContext);

            expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
                'codeTutor.chat',
                expect.any(Function)
            );
        });

        it('should add command to subscriptions', () => {
            provider.activate(mockContext);

            expect(mockContext.subscriptions.length).toBeGreaterThan(0);
        });

        it('should handle activation errors gracefully', () => {
            const brokenContext = {
                ...mockContext,
                subscriptions: undefined,
            } as any;

            // Should not throw
            expect(() => provider.activate(brokenContext)).not.toThrow();
        });
    });

    describe('T011: handleChat() orchestration', () => {
        it('should handle normal question', async () => {
            const message = 'What is a loop?';

            await provider.handleChat(message);

            // Should display response
            expect(vscode.window.showInformationMessage).toHaveBeenCalled();

            // Should persist conversation
            const context = await contextManager.getContext();
            expect(context.conversationHistory.length).toBeGreaterThan(0);
        });

        it('should block homework requests', async () => {
            const message = 'Do my homework for me';

            await provider.handleChat(message);

            // Should show warning
            expect(vscode.window.showWarningMessage).toHaveBeenCalled();
            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                expect.stringContaining("can't solve")
            );
        });

        it('should block unethical requests', async () => {
            const message = 'How do I hack into a system?';

            await provider.handleChat(message);

            // Should show warning
            expect(vscode.window.showWarningMessage).toHaveBeenCalled();
            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                expect.stringContaining("can't help with that")
            );
        });

        it('should handle code blocks', async () => {
            const message = `Here's my code:
\`\`\`javascript
const x = 5;
\`\`\``;

            await provider.handleChat(message);

            expect(vscode.window.showInformationMessage).toHaveBeenCalled();
            const response = (vscode.window.showInformationMessage as jest.Mock).mock.calls[0][0];
            expect(response).toContain('javascript');
        });

        it('should adapt response to learning level', async () => {
            // Set learning level to advanced
            await contextManager.updateLearningLevel('advanced');

            const message = 'What is a closure?';

            await provider.handleChat(message);

            expect(vscode.window.showInformationMessage).toHaveBeenCalled();
            const response = (vscode.window.showInformationMessage as jest.Mock).mock.calls[0][0];

            // Advanced response should be more in-depth
            expect(response.toLowerCase()).toMatch(/advanced|thoroughly|deep/);
        });

        it('should persist both student and assistant messages', async () => {
            const message = 'Test question';

            await provider.handleChat(message);

            const context = await contextManager.getContext();

            // Should have 2 messages (student + assistant)
            expect(context.conversationHistory.length).toBe(2);
            expect(context.conversationHistory[0].role).toBe('student');
            expect(context.conversationHistory[1].role).toBe('assistant');
        });

        it('should handle errors gracefully', async () => {
            // Force an error by breaking contextManager
            jest.spyOn(contextManager, 'getContext').mockRejectedValueOnce(
                new Error('Test error')
            );

            await provider.handleChat('Test');

            // Should show error message
            expect(vscode.window.showErrorMessage).toHaveBeenCalled();
        });

        it('should handle parsing errors gracefully', async () => {
            // Force parsing to fail
            jest.spyOn(messageHandler, 'parseMessage').mockImplementationOnce(() => {
                throw new Error('Parse error');
            });

            // Should still handle the message with default values
            await provider.handleChat('Test');

            // Should display some response (not crash)
            expect(vscode.window.showInformationMessage).toHaveBeenCalled();
        });

        it('should handle different question types', async () => {
            const testCases = [
                { message: 'How do I fix this bug?', type: 'debugging' },
                { message: 'Can you explain closures?', type: 'explanation' },
                { message: 'What is recursion?', type: 'concept' },
                { message: 'Hello', type: 'general' },
            ];

            for (const testCase of testCases) {
                jest.clearAllMocks();
                await provider.handleChat(testCase.message);

                expect(vscode.window.showInformationMessage).toHaveBeenCalled();
            }
        });

        it('should include detected languages in code responses', async () => {
            const message = `\`\`\`python
x = 5
\`\`\``;

            await provider.handleChat(message);

            const response = (vscode.window.showInformationMessage as jest.Mock).mock.calls[0][0];
            expect(response).toContain('python');
        });

        it('should handle persistence failures gracefully', async () => {
            // Force persistence to fail
            jest.spyOn(contextManager, 'addMessage').mockRejectedValueOnce(
                new Error('Storage error')
            );

            await provider.handleChat('Test');

            // Should show warning about not saving
            expect(vscode.window.showWarningMessage).toHaveBeenCalled();
            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                expect.stringContaining('not saved')
            );
        });
    });

    describe('Learning level adaptation', () => {
        it('should provide beginner-appropriate responses', async () => {
            await contextManager.updateLearningLevel('beginner');

            await provider.handleChat('What is a variable?');

            const response = (vscode.window.showInformationMessage as jest.Mock).mock.calls[0][0];
            expect(response.toLowerCase()).toMatch(/simple|basics|start/);
        });

        it('should provide intermediate-appropriate responses', async () => {
            await contextManager.updateLearningLevel('intermediate');

            await provider.handleChat('Explain closures');

            const response = (vscode.window.showInformationMessage as jest.Mock).mock.calls[0][0];
            expect(response.toLowerCase()).toMatch(/explore|detail|practical/);
        });

        it('should provide advanced-appropriate responses', async () => {
            await contextManager.updateLearningLevel('advanced');

            await provider.handleChat('What are monads?');

            const response = (vscode.window.showInformationMessage as jest.Mock).mock.calls[0][0];
            expect(response.toLowerCase()).toMatch(/advanced|thoroughly|deep|theoretical/);
        });
    });
});

