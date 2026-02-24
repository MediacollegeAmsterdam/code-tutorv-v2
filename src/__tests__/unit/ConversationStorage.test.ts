import * as vscode from 'vscode';
import { ConversationStorage, ConversationMessage } from '../../storage/ConversationStorage';

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

describe('ConversationStorage', () => {
    let storage: ConversationStorage;

    beforeEach(() => {
        mockGlobalState.clear();
        storage = new ConversationStorage(mockContext);
    });

    describe('Basic operations', () => {
        it('should save and retrieve messages', async () => {
            const message: ConversationMessage = {
                role: 'student',
                content: 'Hello tutor',
                timestamp: Date.now(),
            };

            await storage.save(message);
            const messages = await storage.getAll();

            expect(messages).toHaveLength(1);
            expect(messages[0].content).toBe('Hello tutor');
            expect(messages[0].role).toBe('student');
        });

        it('should save multiple messages', async () => {
            await storage.save({
                role: 'student',
                content: 'Message 1',
                timestamp: Date.now(),
            });

            await storage.save({
                role: 'assistant',
                content: 'Response 1',
                timestamp: Date.now(),
            });

            const messages = await storage.getAll();
            expect(messages).toHaveLength(2);
        });

        it('should clear all messages', async () => {
            await storage.save({
                role: 'student',
                content: 'Test',
                timestamp: Date.now(),
            });

            await storage.clear();

            const messages = await storage.getAll();
            expect(messages).toHaveLength(0);
        });
    });

    describe('Recent messages', () => {
        beforeEach(async () => {
            // Add 15 messages
            for (let i = 0; i < 15; i++) {
                await storage.save({
                    role: i % 2 === 0 ? 'student' : 'assistant',
                    content: `Message ${i}`,
                    timestamp: Date.now() + i,
                });
            }
        });

        it('should get recent N messages', async () => {
            const recent = await storage.getRecent(5);

            expect(recent).toHaveLength(5);
            expect(recent[4].content).toBe('Message 14'); // Last message
        });

        it('should default to 10 recent messages', async () => {
            const recent = await storage.getRecent();

            expect(recent).toHaveLength(10);
        });

        it('should return all messages if limit exceeds total', async () => {
            const recent = await storage.getRecent(100);

            expect(recent).toHaveLength(15);
        });
    });

    describe('Session management', () => {
        it('should start a new session', async () => {
            await storage.save({
                role: 'student',
                content: 'Old session',
                timestamp: Date.now(),
            });

            await storage.startNewSession();

            const messages = await storage.getAll();
            expect(messages).toHaveLength(0); // New session has no messages
        });

        it('should persist old session when starting new one', async () => {
            await storage.save({
                role: 'student',
                content: 'Session 1',
                timestamp: Date.now(),
            });

            await storage.startNewSession();

            const sessions = await storage.getAllSessions();
            expect(sessions.length).toBeGreaterThan(0);
        });

        it('should load a specific session', async () => {
            await storage.save({
                role: 'student',
                content: 'Message 1',
                timestamp: Date.now(),
            });

            const sessions = await storage.getAllSessions();
            const sessionId = sessions[0].sessionId;

            await storage.startNewSession();
            await storage.save({
                role: 'student',
                content: 'Message 2',
                timestamp: Date.now(),
            });

            await storage.loadSession(sessionId);

            const messages = await storage.getAll();
            expect(messages[0].content).toBe('Message 1');
        });

        it('should delete a specific session', async () => {
            await storage.save({
                role: 'student',
                content: 'Test',
                timestamp: Date.now(),
            });

            const sessions = await storage.getAllSessions();
            const sessionId = sessions[0].sessionId;

            await storage.deleteSession(sessionId);

            const updatedSessions = await storage.getAllSessions();
            expect(updatedSessions.find(s => s.sessionId === sessionId)).toBeUndefined();
        });
    });

    describe('Cleanup', () => {
        it('should cleanup old sessions', async () => {
            // Create an old session (> 30 days)
            const oldTime = Date.now() - (31 * 24 * 60 * 60 * 1000);
            mockGlobalState.set('codeTutor.conversations', [
                {
                    sessionId: 'old-session',
                    messages: [],
                    createdAt: oldTime,
                    lastUpdatedAt: oldTime,
                },
                {
                    sessionId: 'recent-session',
                    messages: [],
                    createdAt: Date.now(),
                    lastUpdatedAt: Date.now(),
                },
            ]);

            const deletedCount = await storage.cleanup();

            expect(deletedCount).toBe(1);

            const sessions = await storage.getAllSessions();
            expect(sessions).toHaveLength(1);
            expect(sessions[0].sessionId).toBe('recent-session');
        });

        it('should not delete recent sessions', async () => {
            await storage.save({
                role: 'student',
                content: 'Recent',
                timestamp: Date.now(),
            });

            const deletedCount = await storage.cleanup();

            expect(deletedCount).toBe(0);
        });
    });

    describe('Export and delete all', () => {
        beforeEach(async () => {
            await storage.save({
                role: 'student',
                content: 'Test message',
                timestamp: Date.now(),
            });
        });

        it('should export all conversations as JSON', async () => {
            const exported = await storage.exportAll();

            expect(typeof exported).toBe('string');
            const parsed = JSON.parse(exported);
            expect(Array.isArray(parsed)).toBe(true);
        });

        it('should delete all conversation data', async () => {
            await storage.deleteAll();

            const sessions = await storage.getAllSessions();
            expect(sessions).toHaveLength(0);

            const messages = await storage.getAll();
            expect(messages).toHaveLength(0);
        });
    });
});