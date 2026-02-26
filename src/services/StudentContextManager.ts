/**
 * StudentContextManager - Manages student learning context and preferences
 *
 * Responsibilities:
 * - Track learning level (beginner/intermediate/advanced)
 * - Manage conversation history
 * - Store student preferences
 * - Provide context for AI prompts
 *
 * All data is persisted locally via ConversationStorage
 */

import * as vscode from 'vscode';
import { ConversationStorage, ConversationMessage } from '../storage/ConversationStorage';

export interface StudentPreferences {
    preferredLanguages: string[];
    explainationStyle: 'concise' | 'detailed' | 'step-by-step';
    includeExamples: boolean;
}

export interface StudentContext {
    sessionId: string;
    learningLevel: 'beginner' | 'intermediate' | 'advanced';
    conversationHistory: ConversationMessage[];
    preferences: StudentPreferences;
    lastUpdatedAt: number;
}

/**
 * StudentContextManager - Tracks student state across conversations
 */
export class StudentContextManager {
    private context: vscode.ExtensionContext;
    private storage: ConversationStorage;
    private cachedContext: StudentContext | null = null;
    private readonly CONTEXT_STORAGE_KEY = 'codeTutor.studentContext';
    private readonly MAX_HISTORY_LENGTH = 50; // Limit to prevent unbounded growth

    constructor(context: vscode.ExtensionContext, storage: ConversationStorage) {
        this.context = context;
        this.storage = storage;
    }

    /**
     * Get current student context (loads from cache or creates new)
     * T017: getContext() implementation
     */
    public async getContext(): Promise<StudentContext> {
        // Return cached context if available
        if (this.cachedContext) {
            // Update conversation history from storage (limit to max)
            const allMessages = await this.storage.getAll();
            this.cachedContext.conversationHistory = allMessages.slice(-this.MAX_HISTORY_LENGTH);
            return this.cachedContext;
        }

        // Load from persistent storage
        const savedContext = await this.context.globalState.get<StudentContext>(
            this.CONTEXT_STORAGE_KEY
        );

        if (savedContext) {
            // Load existing context (limit history)
            const allMessages = await this.storage.getAll();
            this.cachedContext = {
                ...savedContext,
                conversationHistory: allMessages.slice(-this.MAX_HISTORY_LENGTH),
            };
        } else {
            // Create new context
            this.cachedContext = this.createNewContext();
        }

        return this.cachedContext;
    }

    /**
     * Add a message to conversation history
     * T018: addMessage() implementation
     */
    public async addMessage(message: {
        role: 'student' | 'assistant';
        content: string;
    }): Promise<void> {
        const conversationMessage: ConversationMessage = {
            ...message,
            timestamp: Date.now(),
        };

        // Save to storage
        await this.storage.save(conversationMessage);

        // Update context
        const context = await this.getContext();
        context.conversationHistory.push(conversationMessage);

        // Enforce history limit
        if (context.conversationHistory.length > this.MAX_HISTORY_LENGTH) {
            context.conversationHistory = context.conversationHistory.slice(-this.MAX_HISTORY_LENGTH);
        }

        context.lastUpdatedAt = Date.now();

        // Persist context
        await this.saveContext(context);
    }

    /**
     * Update student learning level
     * T020: updateLearningLevel() implementation
     */
    public async updateLearningLevel(
        level: 'beginner' | 'intermediate' | 'advanced'
    ): Promise<void> {
        const context = await this.getContext();
        context.learningLevel = level;
        context.lastUpdatedAt = Date.now();

        await this.saveContext(context);
    }

    /**
     * Get recent conversation history (last N messages)
     * T021: getRecentHistory() implementation
     */
    public async getRecentHistory(limit: number = 10): Promise<ConversationMessage[]> {
        const messages = await this.storage.getRecent(limit);
        return messages;
    }

    /**
     * Update student preferences
     */
    public async updatePreferences(
        preferences: Partial<StudentPreferences>
    ): Promise<void> {
        const context = await this.getContext();
        context.preferences = {
            ...context.preferences,
            ...preferences,
        };
        context.lastUpdatedAt = Date.now();

        await this.saveContext(context);
    }

    /**
     * Clear conversation history (start fresh conversation)
     */
    public async clearHistory(): Promise<void> {
        await this.storage.clear();

        const context = await this.getContext();
        context.conversationHistory = [];
        context.lastUpdatedAt = Date.now();

        await this.saveContext(context);
    }

    /**
     * Start a new session (clear history, keep preferences and level)
     */
    public async startNewSession(): Promise<void> {
        await this.storage.startNewSession();

        const context = await this.getContext();
        context.sessionId = this.generateSessionId();
        context.conversationHistory = [];
        context.lastUpdatedAt = Date.now();

        await this.saveContext(context);
    }

    /**
     * Reset all student data (privacy/fresh start)
     */
    public async resetAll(): Promise<void> {
        await this.storage.deleteAll();
        await this.context.globalState.update(this.CONTEXT_STORAGE_KEY, undefined);
        this.cachedContext = null;
    }

    /**
     * Private: Save context to persistent storage
     */
    private async saveContext(context: StudentContext): Promise<void> {
        await this.context.globalState.update(this.CONTEXT_STORAGE_KEY, {
            sessionId: context.sessionId,
            learningLevel: context.learningLevel,
            preferences: context.preferences,
            lastUpdatedAt: context.lastUpdatedAt,
            // Don't store conversationHistory in globalState (it's in storage)
        });

        this.cachedContext = context;
    }

    /**
     * Private: Create new student context with defaults
     */
    private createNewContext(): StudentContext {
        // Check if user has configured learning level in settings
        const config = vscode.workspace.getConfiguration('codeTutor');
        const configuredLevel = config.get<'beginner' | 'intermediate' | 'advanced'>(
            'learningLevel',
            'beginner'
        );

        return {
            sessionId: this.generateSessionId(),
            learningLevel: configuredLevel,
            conversationHistory: [],
            preferences: {
                preferredLanguages: [],
                explainationStyle: 'detailed',
                includeExamples: true,
            },
            lastUpdatedAt: Date.now(),
        };
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

