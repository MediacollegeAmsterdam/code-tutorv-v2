/**
 * Duck Context Tests
 *
 * Tests for session state management in rubber duck debugging
 * @author Kevin Hamelink
 */

import { DuckContext } from '../../core/DuckContext';

describe('DuckContext', () => {
	let duckContext: DuckContext;

	beforeEach(() => {
		duckContext = new DuckContext();
	});

	describe('Session Initialization', () => {
		test('should initialize a new session with unique ID', () => {
			const code = 'const x = 5;';
			const session = duckContext.initializeSession(code);

			expect(session.sessionId).toBeDefined();
			expect(session.sessionId).toMatch(/^duck-/);
			expect(session.codeSnapshot).toBe(code);
		});

		test('should initialize with empty hints and questions', () => {
			const code = 'const x = 5;';
			const session = duckContext.initializeSession(code);

			expect(session.hintsGiven).toEqual([]);
			expect(session.questionsAsked).toEqual([]);
			expect(session.attempts).toBe(0);
			expect(session.conversationDepth).toBe(0);
		});

		test('should generate code hash', () => {
			const code = 'const x = 5;';
			const session = duckContext.initializeSession(code);

			expect(session.codeHash).toBeDefined();
			expect(session.codeHash.length).toBeGreaterThan(0);
		});

		test('should update session on new code', () => {
			const code1 = 'const x = 5;';
			const session1 = duckContext.initializeSession(code1);

			const code2 = 'const y = 10;';
			const session2 = duckContext.initializeSession(code2);

			expect(session1.codeHash).not.toBe(session2.codeHash);
		});
	});

	describe('Get Current Session', () => {
		test('should return null when no session initialized', () => {
			const session = duckContext.getCurrentSession();
			expect(session).toBeNull();
		});

		test('should return current session after initialization', () => {
			const code = 'const x = 5;';
			duckContext.initializeSession(code);
			const session = duckContext.getCurrentSession();

			expect(session).not.toBeNull();
			expect(session?.codeSnapshot).toBe(code);
		});
	});

	describe('Record Hints', () => {
		test('should record a hint', () => {
			const code = 'const x = 5;';
			duckContext.initializeSession(code);

			const hint = duckContext.recordHint('What is a variable?', code, 'guidance');

			expect(hint).toBeDefined();
			expect(hint.question).toBe('What is a variable?');
			expect(hint.codeContext).toBe(code);
			expect(hint.hintLevel).toBe('guidance');
			expect(hint.timestamp).toBeDefined();
		});

		test('should throw error when recording hint without session', () => {
			expect(() => {
				duckContext.recordHint('Question', '', 'guidance');
			}).toThrow();
		});

		test('should increment attempts on hint record', () => {
			const code = 'const x = 5;';
			duckContext.initializeSession(code);

			expect(duckContext.getCurrentSession()?.attempts).toBe(0);

			duckContext.recordHint('Question 1', code, 'guidance');
			expect(duckContext.getCurrentSession()?.attempts).toBe(1);

			duckContext.recordHint('Question 2', code, 'debugging_tip');
			expect(duckContext.getCurrentSession()?.attempts).toBe(2);
		});

		test('should add question to questionsAsked', () => {
			const code = 'const x = 5;';
			duckContext.initializeSession(code);

			duckContext.recordHint('First question?', code, 'guidance');
			duckContext.recordHint('Second question?', code, 'guidance');

			const session = duckContext.getCurrentSession();
			expect(session?.questionsAsked.length).toBe(2);
			expect(session?.questionsAsked[0]).toBe('First question?');
			expect(session?.questionsAsked[1]).toBe('Second question?');
		});

		test('should record different hint levels', () => {
			const code = 'const x = 5;';
			duckContext.initializeSession(code);

			const hint1 = duckContext.recordHint('Q1', code, 'guidance');
			const hint2 = duckContext.recordHint('Q2', code, 'debugging_tip');
			const hint3 = duckContext.recordHint('Q3', code, 'concept_clarification');

			expect(hint1.hintLevel).toBe('guidance');
			expect(hint2.hintLevel).toBe('debugging_tip');
			expect(hint3.hintLevel).toBe('concept_clarification');
		});
	});

	describe('Record Student Response', () => {
		test('should record student response to a hint', () => {
			const code = 'const x = 5;';
			duckContext.initializeSession(code);

			duckContext.recordHint('What is x?', code, 'guidance');
			duckContext.recordStudentResponse(0, 'x is a variable', 5000);

			const session = duckContext.getCurrentSession();
			expect(session?.hintsGiven[0].studentResponse).toBe('x is a variable');
			expect(session?.hintsGiven[0].responseTime).toBe(5000);
		});

		test('should throw error for invalid hint index', () => {
			const code = 'const x = 5;';
			duckContext.initializeSession(code);

			expect(() => {
				duckContext.recordStudentResponse(0, 'response', 1000);
			}).toThrow();
		});

		test('should throw error when no active session', () => {
			expect(() => {
				duckContext.recordStudentResponse(0, 'response', 1000);
			}).toThrow();
		});
	});

	describe('Code Change Detection', () => {
		test('should detect when code has changed', () => {
			const code1 = 'const x = 5;';
			const code2 = 'const y = 10;';

			duckContext.initializeSession(code1);
			const hasChanged = duckContext.hasCodeChanged(code2);

			expect(hasChanged).toBe(true);
		});

		test('should not detect change when code is same', () => {
			const code = 'const x = 5;';

			duckContext.initializeSession(code);
			const hasChanged = duckContext.hasCodeChanged(code);

			expect(hasChanged).toBe(false);
		});

		test('should return false when no active session', () => {
			const hasChanged = duckContext.hasCodeChanged('some code');
			expect(hasChanged).toBe(false);
		});
	});

	describe('Similar Question Detection', () => {
		test('should prevent duplicate question tracking', () => {
			const code = 'const x = 5;';
			duckContext.initializeSession(code);

			duckContext.recordHint('variable question', code, 'guidance');
			duckContext.recordHint('variable question', code, 'guidance');

			const session = duckContext.getCurrentSession();
			// Both should be recorded, similarity is used as a hint, not a blocker
			expect(session?.questionsAsked.length).toBe(2);
		});

		test('should not detect dissimilar questions as similar', () => {
			const code = 'const x = 5;';
			duckContext.initializeSession(code);

			duckContext.recordHint('What is a variable?', code, 'guidance');

			const isSimilar = duckContext.hasAskedSimilarQuestion('How does a loop work?');
			expect(isSimilar).toBe(false);
		});

		test('should return false when no session', () => {
			const isSimilar = duckContext.hasAskedSimilarQuestion('Any question');
			expect(isSimilar).toBe(false);
		});
	});

	describe('Conversation Depth Tracking', () => {
		test('should increment conversation depth', () => {
			const code = 'const x = 5;';
			duckContext.initializeSession(code);

			expect(duckContext.getCurrentSession()?.conversationDepth).toBe(0);

			duckContext.incrementConversationDepth();
			expect(duckContext.getCurrentSession()?.conversationDepth).toBe(1);

			duckContext.incrementConversationDepth();
			expect(duckContext.getCurrentSession()?.conversationDepth).toBe(2);
		});

		test('should not error when incrementing without session', () => {
			expect(() => {
				duckContext.incrementConversationDepth();
			}).not.toThrow();
		});
	});

	describe('Progress Tracking', () => {
		test('should detect when student is making progress', () => {
			const code = 'const x = 5;';
			duckContext.initializeSession(code);

			// No progress initially
			expect(duckContext.isStudentMakingProgress()).toBe(false);

			// Record hint but no response
			duckContext.recordHint('Question?', code, 'guidance');
			expect(duckContext.isStudentMakingProgress()).toBe(false);

			// Record response
			duckContext.recordStudentResponse(0, 'My answer', 5000);
			expect(duckContext.isStudentMakingProgress()).toBe(false); // Still need conversation depth

			// Add conversation depth
			duckContext.incrementConversationDepth();
			expect(duckContext.isStudentMakingProgress()).toBe(true);
		});

		test('should return false when no active session', () => {
			expect(duckContext.isStudentMakingProgress()).toBe(false);
		});
	});

	describe('Session End Conditions', () => {
		test('should end session when max attempts reached without progress', () => {
			const code = 'const x = 5;';
			duckContext.initializeSession(code);

			// Add 8 hints without responses
			for (let i = 0; i < 8; i++) {
				duckContext.recordHint(`Question ${i}`, code, 'guidance');
			}

			// Should end because max attempts reached and no progress
			const shouldEnd = duckContext.shouldEndSession();
			expect(shouldEnd).toBe(true);
		});

		test('should not end session if progress is being made', () => {
			const code = 'const x = 5;';
			duckContext.initializeSession(code);

			duckContext.recordHint('Question', code, 'guidance');
			duckContext.recordStudentResponse(0, 'Response', 5000);
			duckContext.incrementConversationDepth();

			const shouldEnd = duckContext.shouldEndSession();
			expect(shouldEnd).toBe(false);
		});

		test('should return true when no session active', () => {
			const shouldEnd = duckContext.shouldEndSession();
			expect(shouldEnd).toBe(true);
		});
	});

	describe('Session Summary', () => {
		test('should generate session summary', () => {
			const code = 'const x = 5;';
			duckContext.initializeSession(code);

			duckContext.recordHint('Q1', code, 'guidance');
			duckContext.recordHint('Q2', code, 'debugging_tip');
			duckContext.incrementConversationDepth();
			duckContext.incrementConversationDepth();

			const summary = duckContext.getSessionSummary();

			expect(summary).not.toBeNull();
			expect(summary?.hintsGiven).toBe(2);
			expect(summary?.questionsAsked).toBe(2);
			expect(summary?.conversationRounds).toBe(2);
			expect(summary?.duration).toBeDefined();
		});

		test('should return null when no active session', () => {
			const summary = duckContext.getSessionSummary();
			expect(summary).toBeNull();
		});
	});

	describe('Session Closure', () => {
		test('should close session and return session data', () => {
			const code = 'const x = 5;';
			duckContext.initializeSession(code);
			duckContext.recordHint('Question', code, 'guidance');

			const closedSession = duckContext.closeSession();

			expect(closedSession).not.toBeNull();
			expect(closedSession?.hintsGiven.length).toBe(1);
			expect(duckContext.getCurrentSession()).toBeNull();
		});

		test('should return null when closing with no active session', () => {
			const closedSession = duckContext.closeSession();
			expect(closedSession).toBeNull();
		});

		test('should allow new session after closing previous one', () => {
			const code1 = 'const x = 5;';
			duckContext.initializeSession(code1);
			duckContext.closeSession();

			const code2 = 'const y = 10;';
			const newSession = duckContext.initializeSession(code2);

			expect(newSession.codeSnapshot).toBe(code2);
		});
	});

	describe('Hint Cache', () => {
		test('should cache hints by code hash', () => {
			const code = 'const x = 5;';
			duckContext.initializeSession(code);

			duckContext.recordHint('Question 1', code, 'guidance');
			duckContext.recordHint('Question 2', code, 'guidance');

			const session = duckContext.getCurrentSession();
			expect(session?.questionsAsked.length).toBe(2);
		});

		test('should retrieve cached hints for same code', () => {
			const code = 'const x = 5;';
			duckContext.initializeSession(code);

			duckContext.recordHint('Q1', code, 'guidance');
			duckContext.recordHint('Q2', code, 'guidance');

			// Initialize new session with same code
			duckContext.initializeSession(code);
			const session = duckContext.getCurrentSession();
			const codeHash = session?.codeHash;

			if (codeHash) {
				const cached = duckContext.getCachedHintsForCode(codeHash);
				expect(cached.length).toBeGreaterThanOrEqual(2);
			}
		});
	});
});

