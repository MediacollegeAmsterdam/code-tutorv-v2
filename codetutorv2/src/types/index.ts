/**
 * Type Definitions for Extracted Features
 *
 * Minimal type definitions required for the Explain, Feedback, and Exercise commands
 */

/**
 * Code context from editor (selected or visible code)
 */
export interface CodeContext {
    code: string;
    language: string;
}

/**
 * User profile with student information
 */
export interface UserProfile {
    name: string;
    yearLevel: number;
    studentId: string;
    createdAt: string;
}

/**
 * Assignment metadata structure
 */
export interface Assignment {
    id: string;
    title: string;
    filename: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    topic: string;
    dueDate: string | null;
    estimatedTime: number | null;
    description?: string;
}

/**
 * Assignment progress tracking
 */
export interface AssignmentProgress {
    status: 'not-started' | 'in-progress' | 'completed' | 'graded';
    startedAt?: string;
    completedAt?: string;
    gradedAt?: string;
    grade?: number;
    feedback?: string;
}

/**
 * Exercise generation request
 */
export interface ExerciseRequest {
    topic: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    yearLevel: number;
    estimatedTime?: number;
}

/**
 * Feedback session tracking
 */
export interface FeedbackSession {
    attempts: number;
    lastFeedbackLevel: 'initial' | 'tips' | 'example';
    previousFeedback: string[];
}

/**
 * Services interface that commands depend on
 */
export interface CommandServices {
    updateProgress: (command: string) => any;
    broadcastSSEUpdate: (data: any) => void;
    getOrCreateStudentId: () => string;
    loadStudentData: () => Record<string, any>;
    saveStudentData: (data: Record<string, any>) => void;
    loadStudentMetadata: () => Record<string, any>;
    saveStudentMetadata: (data: Record<string, any>) => void;
}

