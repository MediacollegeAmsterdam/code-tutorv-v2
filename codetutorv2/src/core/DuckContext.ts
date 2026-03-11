/**
 * Duck Context - Session State Management for Rubber Duck Command
 *
 * Manages in-memory session state for a rubber duck debugging session.
 * Tracks hints, questions, code snapshots, and conversation history
 * to enable the Socratic method without repetition.
 *
 * @author Kevin Hamelink
 */

import { RubberDuckSession, DuckHint } from '../types';
import crypto from 'crypto';

/**
 * Manages rubber duck session state
 */
export class DuckContext {
	private currentSession: RubberDuckSession | null = null;
	private hintCache: Map<string, string[]> = new Map(); // code hash -> asked questions

	/**
	 * Initialize a new duck session
	 */
	public initializeSession(codeSnapshot: string): RubberDuckSession {
		const sessionId = `duck-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const codeHash = this.hashCode(codeSnapshot);

		this.currentSession = {
			sessionId,
			startedAt: new Date().toISOString(),
			codeSnapshot,
			codeHash,
			hintsGiven: [],
			questionsAsked: [],
			attempts: 0,
			conversationDepth: 0,
		};

		// Initialize hint cache for this code if not exists
		if (!this.hintCache.has(codeHash)) {
			this.hintCache.set(codeHash, []);
		}

		return this.currentSession;
	}

	/**
	 * Get current active session
	 */
	public getCurrentSession(): RubberDuckSession | null {
		return this.currentSession;
	}

	/**
	 * Record a hint given in the session
	 */
	public recordHint(
		question: string,
		codeContext: string,
		hintLevel: 'guidance' | 'debugging_tip' | 'concept_clarification'
	): DuckHint {
		if (!this.currentSession) {
			throw new Error('No active duck session');
		}

		const hint: DuckHint = {
			timestamp: new Date().toISOString(),
			question,
			codeContext,
			hintLevel,
		};

		this.currentSession.hintsGiven.push(hint);
		this.currentSession.questionsAsked.push(question);
		this.currentSession.attempts++;

		// Update cache
		const codeHash = this.currentSession.codeHash;
		const cached = this.hintCache.get(codeHash) || [];
		cached.push(question);
		this.hintCache.set(codeHash, cached);

		return hint;
	}

	/**
	 * Record student's response to a hint
	 */
	public recordStudentResponse(hintIndex: number, response: string, responseTime: number): void {
		if (!this.currentSession || hintIndex >= this.currentSession.hintsGiven.length) {
			throw new Error('Invalid hint index');
		}

		this.currentSession.hintsGiven[hintIndex].studentResponse = response;
		this.currentSession.hintsGiven[hintIndex].responseTime = responseTime;
	}

	/**
	 * Increment conversation depth (tracks how many rounds of back-and-forth)
	 */
	public incrementConversationDepth(): void {
		if (this.currentSession) {
			this.currentSession.conversationDepth++;
		}
	}

	/**
	 * Check if a question has been asked in this session
	 */
	public hasAskedSimilarQuestion(question: string): boolean {
		if (!this.currentSession) {
			return false;
		}

		return this.currentSession.questionsAsked.some(
			q => this.calculateSimilarity(q, question) > 0.5
		);
	}

	/**
	 * Get hints from previous sessions for the same code
	 */
	public getCachedHintsForCode(codeHash: string): string[] {
		return this.hintCache.get(codeHash) || [];
	}

	/**
	 * Check if code has changed significantly
	 */
	public hasCodeChanged(newCode: string): boolean {
		if (!this.currentSession) {
			return false;
		}

		const newHash = this.hashCode(newCode);
		return newHash !== this.currentSession.codeHash;
	}

	/**
	 * Detect if student is making progress
	 */
	public isStudentMakingProgress(): boolean {
		if (!this.currentSession) {
			return false;
		}

		// Progress indicators:
		// 1. Student is responding to hints
		const hasResponses = this.currentSession.hintsGiven.some(h => h.studentResponse);
		if (!hasResponses) {
			return false;
		}

		// 2. Conversation is progressing (more than 1 round)
		return this.currentSession.conversationDepth > 0;
	}

	/**
	 * Should we end the session?
	 */
	public shouldEndSession(): boolean {
		if (!this.currentSession) {
			return true;
		}

		// End if: too many attempts without progress, or student explicitly asks to stop
		const MAX_ATTEMPTS = 8;
		if (this.currentSession.attempts >= MAX_ATTEMPTS) {
			return !this.isStudentMakingProgress();
		}

		return false;
	}

	/**
	 * Get session summary for closing
	 */
	public getSessionSummary(): {
		hintsGiven: number;
		questionsAsked: number;
		conversationRounds: number;
		duration: string;
	} | null {
		if (!this.currentSession) {
			return null;
		}

		const startTime = new Date(this.currentSession.startedAt).getTime();
		const endTime = Date.now();
		const durationMs = endTime - startTime;
		const durationMin = Math.round(durationMs / 60000);

		return {
			hintsGiven: this.currentSession.hintsGiven.length,
			questionsAsked: this.currentSession.questionsAsked.length,
			conversationRounds: this.currentSession.conversationDepth,
			duration: durationMin > 0 ? `${durationMin} minuten` : '< 1 minuut',
		};
	}

	/**
	 * Close the current session
	 */
	public closeSession(): RubberDuckSession | null {
		const session = this.currentSession;
		this.currentSession = null;
		return session;
	}

	// ============== PRIVATE HELPERS ==============

	/**
	 * Hash code for comparison
	 */
	private hashCode(code: string): string {
		return crypto.createHash('sha256').update(code).digest('hex');
	}

	/**
	 * Calculate similarity between two strings (0-1)
	 * Simple implementation: compare words
	 */
	private calculateSimilarity(str1: string, str2: string): number {
		const words1 = str1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
		const words2 = str2.toLowerCase().split(/\s+/).filter(w => w.length > 2);

		if (words1.length === 0 || words2.length === 0) {
			return 0;
		}

		const common = words1.filter(w => words2.includes(w)).length;
		const total = Math.max(words1.length, words2.length);

		return total === 0 ? 0 : common / total;
	}
}

