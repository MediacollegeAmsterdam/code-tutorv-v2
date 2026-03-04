/**
 * Main Export
 *
 * Barrel export for easy importing of commands and utilities
 */

// Commands
export { ExplainCommand } from './commands/ExplainCommand';
export { FeedbackCommand } from './commands/FeedbackCommand';
export { ExerciseCommand } from './commands/ExerciseCommand';
export { LevelCommand } from './commands/LevelCommand';

// Core
export { ICommand } from './core/ICommand';
export { ChatContext } from './core/ChatContext';
export {
    getCodeContext,
    isAutoModel,
    listConcreteModels,
    getValidModel,
    createBasePrompt,
    buildChatMessages,
    sendChatRequest
} from './core/chat-utils';

// Types
export type {
    CodeContext,
    UserProfile,
    Assignment,
    AssignmentProgress,
    ExerciseRequest,
    FeedbackSession,
    CommandServices
} from './types';

