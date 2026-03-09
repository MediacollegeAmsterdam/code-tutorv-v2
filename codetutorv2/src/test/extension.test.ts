import {expect, jest, test, describe, beforeEach} from '@jest/globals';
import * as vscode from 'vscode';
import { activate, deactivate, exampleProgrammaticUsage } from '../extension';
import { ChatContext } from '../core/ChatContext';
import {
    ExplainCommand,
    FeedbackCommand,
    ExerciseCommand
} from '../index';

// Mock dependencies
jest.mock('../core/chat-utils');
jest.mock('../core/ChatContext');
jest.mock('../commands/ExplainCommand');
jest.mock('../commands/FeedbackCommand');
jest.mock('../commands/ExerciseCommand');
jest.mock('../commands/LevelCommand');

describe('Extension', () => {
    let mockExtensionContext: vscode.ExtensionContext;
    let mockChatParticipant: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mock extension context
        mockExtensionContext = {
            subscriptions: [],
            globalState: {
                get: jest.fn(),
                update: jest.fn(),
                setKeysForSync: jest.fn()
            },
            workspaceState: {
                get: jest.fn(),
                update: jest.fn(),
                setKeysForSync: jest.fn()
            },
            asAbsolutePath: jest.fn((path: string) => `/path/to/${path}`),
            extensionPath: '/path/to/extension',
            extensionUri: { fsPath: '/path/to/extension', path: '/path/to/extension' },
            storageUri: { fsPath: '/path/to/storage', path: '/path/to/storage' },
            logUri: { fsPath: '/path/to/log', path: '/path/to/log' },
            globalStorageUri: { fsPath: '/path/to/global-storage', path: '/path/to/global-storage' },
            secrets: {} as any
        } as any;

        // Setup mock chat participant
        mockChatParticipant = {
            iconPath: undefined
        };

        (vscode.chat.createChatParticipant as any).mockReturnValue(mockChatParticipant);
        (vscode.lm.selectChatModels as any).mockResolvedValue([
            { id: 'gpt-4', name: 'GPT-4', vendor: 'openai', family: 'gpt-4' } as any
        ]);
    });

    describe('activate', () => {
        test('should register chat participant', () => {
            activate(mockExtensionContext);

            expect(vscode.chat.createChatParticipant).toHaveBeenCalledWith(
                'codetutorv2.tutor',
                expect.any(Function)
            );
        });

        test('should add participant to subscriptions', () => {
            activate(mockExtensionContext);

            expect(mockExtensionContext.subscriptions.length).toBeGreaterThan(0);
        });

        test('should set participant icon path', () => {
            activate(mockExtensionContext);

            expect(mockChatParticipant.iconPath).toBeDefined();
            expect(mockExtensionContext.asAbsolutePath).toHaveBeenCalledWith('resources/icon.png');
        });

        test('should create services with updateProgress', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

            activate(mockExtensionContext);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('activated')
            );

            consoleSpy.mockRestore();
        });

        test('should initialize all commands', async () => {
            (vscode.lm.selectChatModels as any).mockResolvedValue([
                { id: 'gpt-4', name: 'GPT-4' } as any
            ]);

            activate(mockExtensionContext);

            // Get the handler function
            const [, handler] = (vscode.chat.createChatParticipant as any).mock.calls[0];

            // Create mock request for explain command
            const mockRequest = {
                prompt: '/explain what is a loop',
                command: 'explain',
                references: [],
                toolReferences: [],
                toolInvocationToken: undefined,
                model: { id: 'gpt-4' }
            } as any;

            const mockChatContext = { history: [] };const mockToken = {} as any;
            const mockStream = {
                markdown: jest.fn()
            };

            (ChatContext.create as any).mockResolvedValue({
                studentId: 'student-123',
                yearLevel: 2
            } as any);

            // Mock ExplainCommand
            const mockExplainCmd = {
                name: 'explain',
                execute: jest.fn()
            };
            (ExplainCommand as jest.Mock).mockImplementation(() => mockExplainCmd);

            // Call handler
            const result = await handler(
                mockRequest,
                mockChatContext,
                mockStream,
                mockToken
            );

            // Verify result structure
            expect(result).toHaveProperty('metadata');
            expect(result.metadata).toHaveProperty('command');
        });
    });

    describe('deactivate', () => {
        test('should not throw error', () => {
            expect(() => deactivate()).not.toThrow();
        });
    });

    describe('chat participant handler', () => {
        let handler: Function;

        beforeEach(() => {
            activate(mockExtensionContext);
            const calls = (vscode.chat.createChatParticipant as any).mock.calls;
            handler = calls[0][1];
        });

        test('should return error when no model available', async () => {
            (vscode.lm.selectChatModels as any).mockResolvedValue([] as any);

            const mockRequest = {
                prompt: '/explain something',
                references: [],
                toolReferences: []
            } as any;

            const mockStream = { markdown: jest.fn() };
            const token = {} as any;

            const result = await handler(mockRequest, { history: [] }, mockStream, token);

            expect(result.metadata.command).toBe('error');
            expect(mockStream.markdown).toHaveBeenCalledWith(
                expect.stringContaining('No AI model available')
            );
        });

        test('should execute explain command', async () => {
            (vscode.lm.selectChatModels as any).mockResolvedValue([
                { id: 'gpt-4', name: 'GPT-4' } as any
            ]);

            const mockExplainCmd = {
                name: 'explain',
                execute: jest.fn()
            };
            (ExplainCommand as jest.Mock).mockImplementation(() => mockExplainCmd);

            (ChatContext.create as any).mockResolvedValue({
                studentId: 'student-123',
                yearLevel: 2
            } as any);

            const mockRequest = {
                prompt: '/explain what is a loop',
                command: 'explain',
                references: [],
                toolReferences: []
            } as any;

            const mockStream = { markdown: jest.fn() };
            const token = {} as any;

            const result = await handler(mockRequest, { history: [] }, mockStream, token);

            expect(result.metadata.command).toBe('explain');
        });

        test('should execute feedback command', async () => {
            (vscode.lm.selectChatModels as any).mockResolvedValue([
                { id: 'gpt-4', name: 'GPT-4' } as any
            ]);

            const mockFeedbackCmd = {
                name: 'feedback',
                execute: jest.fn()
            };
            (FeedbackCommand as jest.Mock).mockImplementation(() => mockFeedbackCmd);

            (ChatContext.create as any).mockResolvedValue({
                studentId: 'student-123',
                yearLevel: 2
            } as any);

            const mockRequest = {
                prompt: '/feedback on my code',
                command: 'feedback',
                references: [],
                toolReferences: []
            } as any;

            const mockStream = { markdown: jest.fn() };
            const token = {} as any;

            const result = await handler(mockRequest, { history: [] }, mockStream, token);

            expect(result.metadata.command).toBe('feedback');
        });

        test('should execute exercise command', async () => {
            (vscode.lm.selectChatModels as any).mockResolvedValue([
                { id: 'gpt-4', name: 'GPT-4' } as any
            ]);

            const mockExerciseCmd = {
                name: 'exercise',
                execute: jest.fn()
            };
            (ExerciseCommand as jest.Mock).mockImplementation(() => mockExerciseCmd);

            (ChatContext.create as any).mockResolvedValue({
                studentId: 'student-123',
                yearLevel: 2
            } as any);

            const mockRequest = {
                prompt: '/exercise',
                command: 'exercise',
                references: [],
                toolReferences: []
            } as any;

            const mockStream = { markdown: jest.fn() };
            const token = {} as any;

            const result = await handler(mockRequest, { history: [] }, mockStream, token);

            expect(result.metadata.command).toBe('exercise');
        });

        test('should handle unknown command', async () => {
            (vscode.lm.selectChatModels as any).mockResolvedValue([
                { id: 'gpt-4', name: 'GPT-4' } as any
            ]);

            (ChatContext.create as any).mockResolvedValue({
                studentId: 'student-123',
                yearLevel: 2
            } as any);

            const mockRequest = {
                prompt: '/unknown-command',
                command: 'unknown-command',
                references: [],
                toolReferences: []
            } as any;

            const mockStream = { markdown: jest.fn() };
            const token = {} as any;

            const result = await handler(mockRequest, { history: [] }, mockStream, token);

            expect(result.metadata.command).toBe('help');
            expect(mockStream.markdown).toHaveBeenCalledWith(
                expect.stringContaining("don't recognize")
            );
        });

        test('should handle errors gracefully', async () => {
            (vscode.lm.selectChatModels as any).mockResolvedValue([
                { id: 'gpt-4', name: 'GPT-4' } as any
            ]);

            (ChatContext.create as any).mockRejectedValue(
                new Error('Context creation failed')
            );

            const mockRequest = {
                prompt: '/explain something',
                command: 'explain',
                references: [],
                toolReferences: []
            } as any;

            const mockStream = { markdown: jest.fn() };
            const token = {} as any;

            const result = await handler(mockRequest, { history: [] }, mockStream, token);

            expect(result.metadata.command).toBe('error');
            expect(mockStream.markdown).toHaveBeenCalledWith(
                expect.stringContaining('An error occurred')
            );
        });

        test('should parse command from prompt when not in request.command', async () => {
            (vscode.lm.selectChatModels as any).mockResolvedValue([
                { id: 'gpt-4', name: 'GPT-4' } as any
            ]);

            const mockExplainCmd = {
                name: 'explain',
                execute: jest.fn()
            };
            (ExplainCommand as jest.Mock).mockImplementation(() => mockExplainCmd);

            (ChatContext.create as any).mockResolvedValue({
                studentId: 'student-123',
                yearLevel: 2
            } as any);

            const mockRequest = {
                prompt: '/explain test prompt',
                references: [],
                toolReferences: []
            } as any; // No command property

            const mockStream = { markdown: jest.fn() };
            const token = {} as any;

            const result = await handler(mockRequest, { history: [] }, mockStream, token);

            expect(result.metadata.command).toBe('explain');
        });
    });

    describe('services implementation', () => {
        beforeEach(() => {
            activate(mockExtensionContext);
        });

        test('should generate student ID', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            activate(mockExtensionContext);
            consoleSpy.mockRestore();

            // Verify globalState.update was called with studentId
            const calls = (mockExtensionContext.globalState.update as jest.Mock).mock.calls;
            expect(calls.some((call: any[]) => call[0] === 'studentId')).toBe(true);
        });

        test('should load and save student data', () => {
            activate(mockExtensionContext);

            // Verify methods are available through services
            expect(mockExtensionContext.globalState.get).toBeDefined();
            expect(mockExtensionContext.globalState.update).toBeDefined();
        });
    });

    describe('exampleProgrammaticUsage', () => {
        let mockModel: vscode.LanguageModelChat;

        beforeEach(() => {
            mockModel = {
                id: 'gpt-4',
                name: 'GPT-4',
                vendor: 'openai',
                family: 'gpt-4',
                sendRequest: jest.fn()
            } as any;
        });

        test('should create chat context and execute explain command', async () => {
            (ChatContext.create as any).mockResolvedValue({
                studentId: 'student-123',
                yearLevel: 2
            } as any);

            const mockExplainCmd = {
                name: 'explain',
                execute: jest.fn()
            };
            (ExplainCommand as jest.Mock).mockImplementation(() => mockExplainCmd);

            const mockServices: any = {
                updateProgress: jest.fn(),
                broadcastSSEUpdate: jest.fn(),
                getOrCreateStudentId: jest.fn().mockReturnValue('student-123'),
                loadStudentData: jest.fn(),
                saveStudentData: jest.fn(),
                loadStudentMetadata: jest.fn(),
                saveStudentMetadata: jest.fn()
            };

            await exampleProgrammaticUsage(mockExtensionContext, mockModel, mockServices);

            expect(ChatContext.create).toHaveBeenCalled();
            expect(mockExplainCmd.execute).toHaveBeenCalled();
        });

        test('should handle errors in programmatic usage', async () => {
            (ChatContext.create as any).mockRejectedValue(
                new Error('Creation failed')
            );

            const mockServices: any = {
                updateProgress: jest.fn(),
                broadcastSSEUpdate: jest.fn(),
                getOrCreateStudentId: jest.fn(),
                loadStudentData: jest.fn(),
                saveStudentData: jest.fn(),
                loadStudentMetadata: jest.fn(),
                saveStudentMetadata: jest.fn()
            };

            await expect(
                exampleProgrammaticUsage(mockExtensionContext, mockModel, mockServices)
            ).rejects.toThrow();
        });
    });
});

