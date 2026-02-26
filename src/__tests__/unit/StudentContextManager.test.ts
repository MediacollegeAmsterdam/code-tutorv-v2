/**
 * Unit tests for StudentContextManager
 */

// Mock vscode before any imports
jest.mock('vscode', () => ({
    workspace: {
        getConfiguration: jest.fn(() => ({
            get: jest.fn((key: string, defaultValue: any) => defaultValue),
        })),
    },
}), { virtual: true });

import * as vscode from 'vscode';
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
} as unknown as vscode.ExtensionContext;


describe('StudentContextManager', () => {
    let manager: StudentContextManager;
    let storage: ConversationStorage;

    beforeEach(() => {
        mockGlobalState.clear();
        storage = new ConversationStorage(mockContext);
        manager = new StudentContextManager(mockContext, storage);
    });

    describe('Context initialization', () => {
        it('should create new context with defaults', async () => {
            const context = await manager.getContext();

            expect(context.learningLevel).toBe('beginner');
            expect(context.conversationHistory).toEqual([]);
            expect(context.preferences.includeExamples).toBe(true);
            expect(context.sessionId).toBeDefined();
        });

        it('should load existing context from storage', async () => {
            // Create initial context
            await manager.updateLearningLevel('advanced');

            // Create new manager (simulating reload)
            const newManager = new StudentContextManager(mockContext, storage);
            const context = await newManager.getContext();

            expect(context.learningLevel).toBe('advanced');
        });

        it('should cache context across multiple calls', async () => {
            const context1 = await manager.getContext();
            const context2 = await manager.getContext();

            expect(context1.sessionId).toBe(context2.sessionId);
        });
    });

    describe('Message management', () => {
        it('should add messages to conversation history', async () => {
            await manager.addMessage({
                role: 'student',
                content: 'Hello',
            });

            const context = await manager.getContext();
            expect(context.conversationHistory).toHaveLength(1);
            expect(context.conversationHistory[0].content).toBe('Hello');
        });

        it('should add timestamp to messages', async () => {
            const before = Date.now();

            await manager.addMessage({
                role: 'student',
                content: 'Test',
            });

            const context = await manager.getContext();
            const after = Date.now();

            expect(context.conversationHistory[0].timestamp).toBeGreaterThanOrEqual(before);
            expect(context.conversationHistory[0].timestamp).toBeLessThanOrEqual(after);
        });

        it('should enforce history limit (50 messages)', async () => {
            // Add 60 messages
            for (let i = 0; i < 60; i++) {
                await manager.addMessage({
                    role: 'student',
                    content: `Message ${i}`,
                });
            }

            const context = await manager.getContext();
            expect(context.conversationHistory.length).toBeLessThanOrEqual(50);
            // Should keep most recent messages
            expect(context.conversationHistory[context.conversationHistory.length - 1].content).toBe(
                'Message 59'
            );
        });

        it('should update lastUpdatedAt when adding messages', async () => {
            const context1 = await manager.getContext();
            const initialTime = context1.lastUpdatedAt;

            await new Promise(resolve => setTimeout(resolve, 10));

            await manager.addMessage({
                role: 'student',
                content: 'Test',
            });

            const context2 = await manager.getContext();
            expect(context2.lastUpdatedAt).toBeGreaterThan(initialTime);
        });
    });

    describe('Learning level management', () => {
        it('should update learning level', async () => {
            await manager.updateLearningLevel('intermediate');

            const context = await manager.getContext();
            expect(context.learningLevel).toBe('intermediate');
        });

        it('should persist learning level', async () => {
            await manager.updateLearningLevel('advanced');

            // Create new manager instance
            const newManager = new StudentContextManager(mockContext, storage);
            const context = await newManager.getContext();

            expect(context.learningLevel).toBe('advanced');
        });
    });

    describe('Recent history', () => {
        beforeEach(async () => {
            for (let i = 0; i < 15; i++) {
                await manager.addMessage({
                    role: i % 2 === 0 ? 'student' : 'assistant',
                    content: `Message ${i}`,
                });
            }
        });

        it('should get recent N messages', async () => {
            const recent = await manager.getRecentHistory(5);

            expect(recent).toHaveLength(5);
            expect(recent[4].content).toBe('Message 14');
        });

        it('should default to 10 recent messages', async () => {
            const recent = await manager.getRecentHistory();

            expect(recent).toHaveLength(10);
        });

        it('should return all messages if limit exceeds total', async () => {
            const recent = await manager.getRecentHistory(100);

            expect(recent).toHaveLength(15);
        });
    });

    describe('Preferences', () => {
        it('should update preferences', async () => {
            await manager.updatePreferences({
                preferredLanguages: ['javascript', 'typescript'],
            });

            const context = await manager.getContext();
            expect(context.preferences.preferredLanguages).toEqual(['javascript', 'typescript']);
        });

        it('should merge preferences (not replace)', async () => {
            await manager.updatePreferences({
                preferredLanguages: ['python'],
            });

            await manager.updatePreferences({
                explainationStyle: 'concise',
            });

            const context = await manager.getContext();
            expect(context.preferences.preferredLanguages).toEqual(['python']);
            expect(context.preferences.explainationStyle).toBe('concise');
        });
    });

    describe('Session management', () => {
        it('should clear history but keep learning level', async () => {
            await manager.updateLearningLevel('advanced');
            await manager.addMessage({
                role: 'student',
                content: 'Test',
            });

            await manager.clearHistory();

            const context = await manager.getContext();
            expect(context.conversationHistory).toHaveLength(0);
            expect(context.learningLevel).toBe('advanced');
        });

        it('should start new session', async () => {
            const context1 = await manager.getContext();
            const oldSessionId = context1.sessionId;

            await manager.startNewSession();

            const context2 = await manager.getContext();
            expect(context2.sessionId).not.toBe(oldSessionId);
            expect(context2.conversationHistory).toHaveLength(0);
        });

        it('should reset all data', async () => {
            await manager.updateLearningLevel('advanced');
            await manager.addMessage({
                role: 'student',
                content: 'Test',
            });

            await manager.resetAll();

            const context = await manager.getContext();
            expect(context.learningLevel).toBe('beginner');
            expect(context.conversationHistory).toHaveLength(0);
        });
    });
});