import {expect, jest, test, describe, beforeEach} from '@jest/globals';
import * as vscode from 'vscode';
import { ChatContext } from '../../core/ChatContext';
import * as chatUtils from '../../core/chat-utils';

// Mock the chat-utils module
jest.mock('../../core/chat-utils', () => ({
    getCodeContext: jest.fn()
}));

describe('ChatContext', () => {
    let mockRequest: vscode.ChatRequest;
    let mockChatContext: vscode.ChatContext;
    let mockToken: vscode.CancellationToken;
    let mockExtensionContext: vscode.ExtensionContext;
    let mockModel: vscode.LanguageModelChat;
    let mockServices: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockRequest = {
            prompt: 'Test prompt',
            command: 'test',
            references: [],
            toolReferences: [],
            toolInvocationToken: undefined,
            model: {} as vscode.LanguageModelChat
        };

        mockChatContext = {
            history: []
        };

        mockToken = {} as any;

        mockExtensionContext = {
            globalState: {
                get: jest.fn(),
                update: jest.fn(),
                setKeysForSync: jest.fn()
            },
            workspaceState: {
                get: jest.fn(),
                update: jest.fn(),
                setKeysForSync: jest.fn()
            }
        } as any;

        mockModel = {
            id: 'gpt-4',
            name: 'GPT-4',
            vendor: 'openai',
            family: 'gpt-4',
            sendRequest: jest.fn()
        } as any;

        mockServices = {
            updateProgress: jest.fn(),
            broadcastSSEUpdate: jest.fn(),
            getOrCreateStudentId: jest.fn().mockReturnValue('student-123'),
            loadStudentData: jest.fn().mockReturnValue({}),
            saveStudentData: jest.fn(),
            loadStudentMetadata: jest.fn().mockReturnValue({}),
            saveStudentMetadata: jest.fn()
        };

        (chatUtils.getCodeContext as jest.Mock).mockReturnValue(null);
    });

    describe('static create method', () => {
        test('should create ChatContext with all dependencies', async () => {
            (mockExtensionContext.globalState.get as jest.Mock).mockReturnValue({ yearLevel: 2 });
            (chatUtils.getCodeContext as jest.Mock).mockReturnValue({
                code: 'const x = 5;',
                language: 'javascript'
            });

            const context = await ChatContext.create(
                mockRequest,
                mockChatContext,
                mockToken,
                mockExtensionContext,
                mockModel,
                mockServices
            );

            expect(context).toBeDefined();
            expect(context.studentId).toBe('student-123');
            expect(context.yearLevel).toBe(2);
            expect(context.model).toBe(mockModel);
        });

        test('should use default year level 2 if not in profile', async () => {
            (mockExtensionContext.globalState.get as jest.Mock).mockReturnValue(null);

            const context = await ChatContext.create(
                mockRequest,
                mockChatContext,
                mockToken,
                mockExtensionContext,
                mockModel,
                mockServices
            );

            expect(context.yearLevel).toBe(2);
        });

        test('should get code context from editor', async () => {
            const expectedCodeContext = { code: 'test code', language: 'python' };
            (chatUtils.getCodeContext as jest.Mock).mockReturnValue(expectedCodeContext);

            const context = await ChatContext.create(
                mockRequest,
                mockChatContext,
                mockToken,
                mockExtensionContext,
                mockModel,
                mockServices
            );

            expect(context.codeContext).toEqual(expectedCodeContext);
            expect(chatUtils.getCodeContext).toHaveBeenCalled();
        });
    });

    describe('instance properties', () => {
        let chatContextInstance: ChatContext;

        beforeEach(async () => {
            (mockExtensionContext.globalState.get as jest.Mock).mockReturnValue({ yearLevel: 3 });
            chatContextInstance = await ChatContext.create(
                mockRequest,
                mockChatContext,
                mockToken,
                mockExtensionContext,
                mockModel,
                mockServices
            );
        });

        test('should have correct studentId', () => {
            expect(chatContextInstance.studentId).toBe('student-123');
        });

        test('should have correct yearLevel', () => {
            expect(chatContextInstance.yearLevel).toBe(3);
        });

        test('should have request property', () => {
            expect(chatContextInstance.request).toBe(mockRequest);
        });

        test('should have chatContext property', () => {
            expect(chatContextInstance.chatContext).toBe(mockChatContext);
        });

        test('should have token property', () => {
            expect(chatContextInstance.token).toBe(mockToken);
        });

        test('should have extensionContext property', () => {
            expect(chatContextInstance.extensionContext).toBe(mockExtensionContext);
        });

        test('should have model property', () => {
            expect(chatContextInstance.model).toBe(mockModel);
        });

        test('should have services property', () => {
            expect(chatContextInstance.services).toBe(mockServices);
        });
    });

    describe('getUserProfile', () => {
        test('should return user profile from global state', async () => {
            const expectedProfile = { name: 'John', yearLevel: 2 };
            (mockExtensionContext.globalState.get as jest.Mock).mockReturnValue(expectedProfile);

            const context = await ChatContext.create(
                mockRequest,
                mockChatContext,
                mockToken,
                mockExtensionContext,
                mockModel,
                mockServices
            );

            const profile = context.getUserProfile();
            expect(profile).toEqual(expectedProfile);
        });

        test('should return null if no profile exists', async () => {
            (mockExtensionContext.globalState.get as jest.Mock)
                .mockReturnValueOnce(null) // for yearLevel in create()
                .mockReturnValueOnce(null); // for getUserProfile()

            const context = await ChatContext.create(
                mockRequest,
                mockChatContext,
                mockToken,
                mockExtensionContext,
                mockModel,
                mockServices
            );

            const profile = context.getUserProfile();
            expect(profile).toBeNull();
        });
    });

    describe('updateUserProfile', () => {
        test('should update user profile in global state', async () => {
            (mockExtensionContext.globalState.get as jest.Mock).mockReturnValue({ yearLevel: 2 });

            const context = await ChatContext.create(
                mockRequest,
                mockChatContext,
                mockToken,
                mockExtensionContext,
                mockModel,
                mockServices
            );

            const newProfile = { name: 'Jane', yearLevel: 3 };
            await context.updateUserProfile(newProfile);

            expect(mockExtensionContext.globalState.update).toHaveBeenCalledWith('userProfile', newProfile);
        });
    });

    describe('getAssignmentProgress', () => {
        test('should return assignment progress for student', async () => {
            const expectedProgress = { assignment1: { status: 'completed' } };
            const allProgress = { 'student-123': expectedProgress };
            (mockExtensionContext.globalState.get as jest.Mock)
                .mockReturnValueOnce({ yearLevel: 2 }) // for create
                .mockReturnValueOnce(allProgress); // for getAssignmentProgress

            const context = await ChatContext.create(
                mockRequest,
                mockChatContext,
                mockToken,
                mockExtensionContext,
                mockModel,
                mockServices
            );

            const progress = context.getAssignmentProgress();
            expect(progress).toEqual(expectedProgress);
        });

        test('should return empty object if no progress exists', async () => {
            (mockExtensionContext.globalState.get as jest.Mock)
                .mockReturnValueOnce({ yearLevel: 2 }) // for create
                .mockReturnValueOnce({}); // for getAssignmentProgress

            const context = await ChatContext.create(
                mockRequest,
                mockChatContext,
                mockToken,
                mockExtensionContext,
                mockModel,
                mockServices
            );

            const progress = context.getAssignmentProgress();
            expect(progress).toEqual({});
        });
    });

    describe('updateAssignmentProgress', () => {
        test('should update assignment progress for student', async () => {
            (mockExtensionContext.globalState.get as jest.Mock)
                .mockReturnValueOnce({ yearLevel: 2 }) // for create
                .mockReturnValueOnce({}); // for getAssignmentProgress

            const context = await ChatContext.create(
                mockRequest,
                mockChatContext,
                mockToken,
                mockExtensionContext,
                mockModel,
                mockServices
            );

            const newProgress = { task1: { status: 'in-progress' } };
            await context.updateAssignmentProgress(newProgress);

            expect(mockExtensionContext.globalState.update).toHaveBeenCalled();
        });
    });

    describe('getLearningPathProgress', () => {
        test('should return learning path progress', async () => {
            const expectedPath = { module1: { lesson1: true } };
            (mockExtensionContext.globalState.get as jest.Mock)
                .mockReturnValueOnce({ yearLevel: 2 }) // for create
                .mockReturnValueOnce(expectedPath); // for getLearningPathProgress

            const context = await ChatContext.create(
                mockRequest,
                mockChatContext,
                mockToken,
                mockExtensionContext,
                mockModel,
                mockServices
            );

            const progress = context.getLearningPathProgress();
            expect(progress).toEqual(expectedPath);
        });

        test('should return empty object if no learning path exists', async () => {
            (mockExtensionContext.globalState.get as jest.Mock)
                .mockReturnValueOnce({ yearLevel: 2 }) // for create
                .mockReturnValueOnce({}); // for getLearningPathProgress

            const context = await ChatContext.create(
                mockRequest,
                mockChatContext,
                mockToken,
                mockExtensionContext,
                mockModel,
                mockServices
            );

            const progress = context.getLearningPathProgress();
            expect(progress).toEqual({});
        });
    });

    describe('trackProgress', () => {
        test('should call service updateProgress method', async () => {
            (mockExtensionContext.globalState.get as jest.Mock).mockReturnValue({ yearLevel: 2 });

            const context = await ChatContext.create(
                mockRequest,
                mockChatContext,
                mockToken,
                mockExtensionContext,
                mockModel,
                mockServices
            );

            context.trackProgress('explain');

            expect(mockServices.updateProgress).toHaveBeenCalledWith('explain');
        });

        test('should return result from updateProgress service', async () => {
            const expectedResult = { command: 'explain', timestamp: '2023-01-01' };
            mockServices.updateProgress.mockReturnValue(expectedResult);
            (mockExtensionContext.globalState.get as jest.Mock).mockReturnValue({ yearLevel: 2 });

            const context = await ChatContext.create(
                mockRequest,
                mockChatContext,
                mockToken,
                mockExtensionContext,
                mockModel,
                mockServices
            );

            const result = context.trackProgress('explain');

            expect(result).toEqual(expectedResult);
        });
    });

    describe('codeContext property', () => {
        test('should be null when no code is selected', async () => {
            (chatUtils.getCodeContext as jest.Mock).mockReturnValue(null);
            (mockExtensionContext.globalState.get as jest.Mock).mockReturnValue({ yearLevel: 2 });

            const context = await ChatContext.create(
                mockRequest,
                mockChatContext,
                mockToken,
                mockExtensionContext,
                mockModel,
                mockServices
            );

            expect(context.codeContext).toBeNull();
        });

        test('should contain code context when available', async () => {
            const codeContext = {
                code: '\n\nGeselecteerde code:\n```javascript\nconst x = 5;\n```',
                language: 'javascript'
            };
            (chatUtils.getCodeContext as jest.Mock).mockReturnValue(codeContext);
            (mockExtensionContext.globalState.get as jest.Mock).mockReturnValue({ yearLevel: 2 });

            const context = await ChatContext.create(
                mockRequest,
                mockChatContext,
                mockToken,
                mockExtensionContext,
                mockModel,
                mockServices
            );

            expect(context.codeContext).toEqual(codeContext);
        });
    });
});

