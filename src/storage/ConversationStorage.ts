/**
 * ConversationStorage - Persists conversation history locally using VS Code API
 *
 * Privacy-first approach:
 * - All data stored locally (no cloud)
 * - Uses VS Code's globalState (persists across sessions)
 * - Students can export/delete their data
 * - Automatic cleanup of old conversations (30 days)
 */

import * as vscode from 'vscode';

export interface ConversationMessage {
    role: 'student' | 'assistant';
    content: string;
    timestamp: number;
}

export interface ConversationSession {
    sessionId: string;
    messages: ConversationMessage[];
    createdAt: number;
    lastUpdatedAt: number;
}

/**
 * ConversationStorage - Privacy-first local storage for conversations
 */
export class ConversationStorage {
    private context: vscode.ExtensionContext;
    private currentSessionId: string;
    private cache: ConversationMessage[] = [];
    private readonly STORAGE_KEY = 'codeTutor.conversations';
    private readonly MAX_SESSION_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.currentSessionId = this.generateSessionId();
        this.loadCurrentSession();
    }

    /**
     * Save a message to the current conversation session
     */
    public async save(message: ConversationMessage): Promise<void> {
        // Add to in-memory cache
        this.cache.push(message);

        // Persist to globalState
        await this.persistCurrentSession();
    }

    /**
     * Get all messages from the current session
     */
    public async getAll(): Promise<ConversationMessage[]> {
        return [...this.cache];
    }

    /**
     * Get recent N messages from the current session
     */
    public async getRecent(limit: number = 10): Promise<ConversationMessage[]> {
        return this.cache.slice(-limit);
    }

    /**
     * Clear the current conversation session
     */
    public async clear(): Promise<void> {
        this.cache = [];
        await this.persistCurrentSession();
    }

    /**
     * Start a new conversation session
     */
    public async startNewSession(): Promise<void> {
        // Save current session first
        await this.persistCurrentSession();

        // Start new session
        this.currentSessionId = this.generateSessionId();
        this.cache = [];
    }

    /**
     * Get all conversation sessions
     */
    public async getAllSessions(): Promise<ConversationSession[]> {
        const allSessions = await this.context.globalState.get<ConversationSession[]>(
            this.STORAGE_KEY,
            []
        );
        return allSessions;
    }

    /**
     * Load a specific conversation session
     */
    public async loadSession(sessionId: string): Promise<void> {
        const sessions = await this.getAllSessions();
        const session = sessions.find(s => s.sessionId === sessionId);

        if (session) {
            this.currentSessionId = sessionId;
            this.cache = session.messages;
        }
    }

    /**
     * Delete a specific conversation session
     */
    public async deleteSession(sessionId: string): Promise<void> {
        const sessions = await this.getAllSessions();
        const filtered = sessions.filter(s => s.sessionId !== sessionId);
        await this.context.globalState.update(this.STORAGE_KEY, filtered);

        // If deleting current session, reset to new session (without persisting yet)
        if (sessionId === this.currentSessionId) {
            this.currentSessionId = this.generateSessionId();
            this.cache = [];
        }
    }

    /**
     * Cleanup old conversation sessions (older than 30 days)
     * Called automatically on initialization
     */
    public async cleanup(): Promise<number> {
        const sessions = await this.getAllSessions();
        const now = Date.now();
        const cutoffTime = now - this.MAX_SESSION_AGE_MS;

        const recentSessions = sessions.filter(
            session => session.lastUpdatedAt > cutoffTime
        );

        const deletedCount = sessions.length - recentSessions.length;

        if (deletedCount > 0) {
            await this.context.globalState.update(this.STORAGE_KEY, recentSessions);
        }

        return deletedCount;
    }

    /**
     * Export all conversations as JSON (for student data export)
     */
    public async exportAll(): Promise<string> {
        const sessions = await this.getAllSessions();
        return JSON.stringify(sessions, null, 2);
    }

    /**
     * Delete all conversation data (for privacy/reset)
     */
    public async deleteAll(): Promise<void> {
        await this.context.globalState.update(this.STORAGE_KEY, []);
        this.cache = [];
        this.currentSessionId = this.generateSessionId();
    }

    /**
     * Private: Load current session from storage on initialization
     */
    private async loadCurrentSession(): Promise<void> {
        const sessions = await this.getAllSessions();
        const currentSession = sessions.find(s => s.sessionId === this.currentSessionId);

        if (currentSession) {
            this.cache = currentSession.messages;
        }

        // Cleanup old sessions on load
        await this.cleanup();
    }

    /**
     * Private: Persist current session to globalState
     */
    private async persistCurrentSession(): Promise<void> {
        const sessions = await this.getAllSessions();
        const existingIndex = sessions.findIndex(s => s.sessionId === this.currentSessionId);

        const session: ConversationSession = {
            sessionId: this.currentSessionId,
            messages: this.cache,
            createdAt: existingIndex >= 0 ? sessions[existingIndex].createdAt : Date.now(),
            lastUpdatedAt: Date.now(),
        };

        if (existingIndex >= 0) {
            // Update existing session
            sessions[existingIndex] = session;
        } else {
            // Add new session
            sessions.push(session);
        }

        await this.context.globalState.update(this.STORAGE_KEY, sessions);
    }

    /**
     * Private: Generate unique session ID
     */
    private generateSessionId(): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        return `session-${timestamp}-${random}`;
    }
}

