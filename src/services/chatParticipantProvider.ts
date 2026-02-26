/**
 * ChatParticipantProvider - Entry point for code-tutor chat functionality
 *
 * Responsibilities:
 * - Register chat participant with VS Code
 * - Orchestrate full conversation flow
 * - Handle errors gracefully
 * - Ensure educational safety checks
 *
 * T009: ChatParticipantProvider skeleton ✅
 * T010: activate() method ✅
 * T011: handleChat() orchestration ✅
 */

import * as vscode from 'vscode';
import { MessageHandler, ParsedMessage } from './MessageHandler';
import { StudentContextManager, StudentContext } from './StudentContextManager';
import { PromptBuilder } from './PromptBuilder';
import { ResponseFormatter } from './ResponseFormatter';
import { CopilotClient } from './CopilotClient';

export class ChatParticipantProvider {
    private messageHandler: MessageHandler;
    private contextManager: StudentContextManager;
    private promptBuilder: PromptBuilder;
    private responseFormatter: ResponseFormatter;
    private copilotClient: CopilotClient;

    constructor(
        messageHandler: MessageHandler,
        contextManager: StudentContextManager,
        promptBuilder: PromptBuilder,
        responseFormatter: ResponseFormatter,
        context: vscode.ExtensionContext
    ) {
        this.messageHandler = messageHandler;
        this.contextManager = contextManager;
        this.promptBuilder = promptBuilder;
        this.responseFormatter = responseFormatter;
        this.copilotClient = new CopilotClient(context);
    }

    /**
     * T010: Activate the chat participant and register commands
     * Registers @code-tutor as a chat participant in VS Code
     */
    public activate(context: vscode.ExtensionContext): void {
        try {
            // Register the chat command
            const disposable = vscode.commands.registerCommand(
                'codeTutor.chat',
                async () => {
                    const input = await vscode.window.showInputBox({
                        prompt: 'Ask Code Tutor a question',
                        placeHolder: 'e.g., How do I use loops in JavaScript?',
                    });

                    if (!input) {
                        return;
                    }

                    await this.handleChat(input);
                }
            );

            context.subscriptions.push(disposable);

            console.log('✅ code-tutor chat participant registered successfully');
        } catch (error) {
            console.error('❌ Failed to activate code-tutor:', error);
            vscode.window.showErrorMessage(
                'Failed to activate code-tutor. Please reload VS Code and try again.'
            );
        }
    }

    /**
     * T011: Handle chat orchestration - full conversation flow
     *
     * Orchestration flow:
     * 1. Parse message (extract code, detect concerns)
     * 2. Get student context (learning level, history)
     * 3. Validate safety (homework, ethics)
     * 4. Generate response (placeholder for now, will use PromptBuilder + Copilot later)
     * 5. Persist conversation
     * 6. Display response
     *
     * Error handling: All errors caught and displayed to user
     */
    public async handleChat(rawMessage: string): Promise<void> {
        const startTime = Date.now();

        try {
            console.log('📨 Received message from student');

            // Step 1: Parse the message
            console.log('🔍 Step 1: Parsing message...');
            const parsed = this.parseMessageSafely(rawMessage);

            // Step 2: Get student context
            console.log('👤 Step 2: Loading student context...');
            const studentContext = await this.getContextSafely();

            // Step 3: Validate safety (homework, ethics checks)
            console.log('🛡️ Step 3: Validating safety...');
            const safetyCheck = this.validateSafety(parsed);
            if (!safetyCheck.isAllowed) {
                await this.handleBlockedRequest(rawMessage, safetyCheck.message);
                return;
            }

            // Step 4: Generate response
            console.log('💭 Step 4: Generating response...');
            const response = this.generateResponse(parsed, studentContext);

            // Step 5: Persist conversation
            console.log('💾 Step 5: Persisting conversation...');
            await this.persistConversation(rawMessage, response);

            // Step 6: Display response
            console.log('✅ Step 6: Displaying response...');
            await this.displayResponse(response);

            const duration = Date.now() - startTime;
            console.log(`⏱️ Chat handled successfully in ${duration}ms`);
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Parse message with error handling
     */
    private parseMessageSafely(rawMessage: string): ParsedMessage {
        try {
            return this.messageHandler.parseMessage(rawMessage);
        } catch (error) {
            console.error('Error parsing message:', error);
            // Return safe default if parsing fails
            return {
                text: rawMessage,
                codeBlocks: [],
                questionType: 'general',
                isHomeworkRequest: false,
                isUnethicalRequest: false,
                detectedLanguages: [],
            };
        }
    }

    /**
     * Get student context with error handling
     */
    private async getContextSafely(): Promise<StudentContext> {
        try {
            return await this.contextManager.getContext();
        } catch (error) {
            console.error('Error getting student context:', error);
            throw new Error('Failed to load your learning profile. Please try again.');
        }
    }

    /**
     * Validate message safety (homework, ethics)
     */
    private validateSafety(parsed: ParsedMessage): { isAllowed: boolean; message: string } {
        if (parsed.isHomeworkRequest) {
            return {
                isAllowed: false,
                message: "I can't solve assignments for you, but I can help you understand the concepts! What specific part are you struggling with?",
            };
        }

        if (parsed.isUnethicalRequest) {
            return {
                isAllowed: false,
                message: "I can't help with that request. I'm here to teach ethical programming practices. How can I help you learn programming the right way?",
            };
        }

        return { isAllowed: true, message: '' };
    }

    /**
     * Handle blocked requests (homework, ethics)
     */
    private async handleBlockedRequest(rawMessage: string, blockMessage: string): Promise<void> {
        // Still persist the student's message (for learning patterns)
        await this.contextManager.addMessage({
            role: 'student',
            content: rawMessage,
        });

        // Persist the block message
        await this.contextManager.addMessage({
            role: 'assistant',
            content: blockMessage,
        });

        // Display block message
        vscode.window.showWarningMessage(blockMessage);

        console.log('⚠️ Request blocked due to safety concerns');
    }

    /**
     * Persist the conversation to storage
     */
    private async persistConversation(studentMessage: string, assistantResponse: string): Promise<void> {
        try {
            await this.contextManager.addMessage({
                role: 'student',
                content: studentMessage,
            });

            await this.contextManager.addMessage({
                role: 'assistant',
                content: assistantResponse,
            });
        } catch (error) {
            console.error('Error persisting conversation:', error);
            // Non-fatal: conversation still happened, just not saved
            vscode.window.showWarningMessage(
                'Your conversation was not saved. It may not appear in history.'
            );
        }
    }

    /**
     * Display response to the user
     */
    private async displayResponse(response: string): Promise<void> {
        vscode.window.showInformationMessage(response);
    }

    /**
     * Handle errors gracefully
     */
    private handleError(error: unknown): void {
        console.error('❌ Error handling chat:', error);

        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

        vscode.window.showErrorMessage(
            `Code Tutor encountered an error: ${errorMessage}. Please try again.`
        );
    }

    /**
     * Generate educational response based on parsed message and student context
     *
     * WP3 Integration: Now uses PromptBuilder to construct prompts
     *
     * Steps:
     * 1. Build prompt using PromptBuilder
     * 2. Validate safety (double-check)
     * 3. Send to AI (placeholder - GitHub Copilot integration pending)
     * 4. Return response
     */
    private generateResponse(parsed: ParsedMessage, context: StudentContext): string {
        // Builds the prompt using PromptBuilder
        const builtPrompt = this.promptBuilder.buildPrompt(parsed, context);

        // Validates safety (double-check even though we checked earlier)
        const safetyCheck = this.promptBuilder.validateSafety(
            builtPrompt.systemPrompt + builtPrompt.userPrompt,
            parsed
        );

        if (!safetyCheck.isAllowed) {
            return safetyCheck.message;
        }

        // TODO: Send to GitHub Copilot API
        // For now, return educational placeholder based on the built prompt
        return this.generatePlaceholderResponse(parsed, context, builtPrompt.totalTokens);
    }

    /**
     * Placeholder response generator until GitHub Copilot is integrated
     * Shows that prompt is being built with appropriate context
     *
     * WP4 Integration: Now formats responses using ResponseFormatter
     */
    private generatePlaceholderResponse(
        parsed: ParsedMessage,
        context: StudentContext,
        tokenCount: number
    ): string {
        const prefix = `[Prompt built: ${tokenCount} tokens, ${context.learningLevel} level]`;

        let rawResponse: string;

        // Handle code-related questions
        if (parsed.codeBlocks && parsed.codeBlocks.length > 0) {
            const languages = parsed.detectedLanguages.join(', ');
            rawResponse = `${prefix}\n\n${this.generateCodeResponse(parsed.questionType, languages, context.learningLevel)}`;
        }
        // Handle by question type
        else {
            switch (parsed.questionType) {
                case 'debugging':
                    rawResponse = `${prefix}\n\n${this.generateDebuggingResponse(context.learningLevel)}`;
                    break;
                case 'explanation':
                    rawResponse = `${prefix}\n\n${this.generateExplanationResponse(context.learningLevel)}`;
                    break;
                case 'concept':
                    rawResponse = `${prefix}\n\n${this.generateConceptResponse(context.learningLevel)}`;
                    break;
                default:
                    rawResponse = `${prefix}\n\n${this.generateGeneralResponse(context.learningLevel)}`;
            }
        }

        // WP4: Format the response for clarity and accessibility
        // Once ResponseFormatter is implemented (T036-T042), this will:
        // - Fix markdown issues
        // - Format code blocks properly
        // - Add educational labels
        // - Normalize headings
        // - Validate accessibility
        return this.responseFormatter.formatResponse(rawResponse);
    }

    /**
     * Generate response for code-related questions
     */
    private generateCodeResponse(
        questionType: ParsedMessage['questionType'],
        languages: string,
        level: StudentContext['learningLevel']
    ): string {
        const prefix = `I see some ${languages} code.`;

        if (level === 'beginner') {
            return `${prefix} Let's break it down step by step. Can you explain what each part is supposed to do?`;
        } else if (level === 'intermediate') {
            return `${prefix} Let's analyze this together. What's the expected behavior versus what's actually happening?`;
        } else {
            return `${prefix} Let's examine the logic and identify potential issues. What have you tried so far?`;
        }
    }

    /**
     * Generate response for debugging questions
     */
    private generateDebuggingResponse(level: StudentContext['learningLevel']): string {
        if (level === 'beginner') {
            return "Let's debug this together! First, can you describe what you expected to happen and what actually happened?";
        } else if (level === 'intermediate') {
            return "Let's debug this systematically. What debugging steps have you tried so far? What did you learn from them?";
        } else {
            return "Let's approach this methodically. Have you checked the inputs, outputs, and intermediate states? What patterns do you see?";
        }
    }

    /**
     * Generate response for explanation questions
     */
    private generateExplanationResponse(level: StudentContext['learningLevel']): string {
        if (level === 'beginner') {
            return "Great question! Let me explain this concept in simple terms with examples.";
        } else if (level === 'intermediate') {
            return "Good question! Let's explore this concept and understand the reasoning behind it.";
        } else {
            return "Excellent question! Let's dive deep into this concept, including edge cases and best practices.";
        }
    }

    /**
     * Generate response for concept questions
     */
    private generateConceptResponse(level: StudentContext['learningLevel']): string {
        if (level === 'beginner') {
            return "Let's explore this concept together! I'll start with the basics and build up from there.";
        } else if (level === 'intermediate') {
            return "Let's examine this concept in detail, including practical applications and common patterns.";
        } else {
            return "Let's analyze this concept thoroughly, including theoretical foundations and advanced applications.";
        }
    }

    /**
     * Generate response for general questions
     */
    private generateGeneralResponse(level: StudentContext['learningLevel']): string {
        if (level === 'beginner') {
            return "I'm here to help you learn! What would you like to understand better? Feel free to share code or ask specific questions.";
        } else if (level === 'intermediate') {
            return "I'm here to guide your learning! What aspect would you like to explore further?";
        } else {
            return "I'm here to help you deepen your understanding! What would you like to discuss?";
        }
    }

    /**
     * Example usage of CopilotClient (T055)
     */
    private async getCopilotResponse(prompt: string): Promise<string> {
        return this.copilotClient.sendPrompt(prompt);
    }
}