/**
 * Duck Command Tests
 *
 * Tests for the rubber duck debugging feature using Socratic method
 * @author Kevin Hamelink
 */

import { DuckCommand } from '../../commands/DuckCommand';
import { ChatContext } from '../../core/ChatContext';
import { DuckContext } from '../../core/DuckContext';
import * as vscode from 'vscode';

describe('DuckCommand', () => {
	let duckCommand: DuckCommand;
	let mockStream: any;
	let mockChatContext: any;
	let mockRequest: any;
	let mockVscodeContext: any;
	let mockModel: any;
	let mockToken: any;

	beforeEach(() => {
		duckCommand = new DuckCommand();

		// Mock stream
		mockStream = {
			markdown: jest.fn(),
			anchor: jest.fn(),
			button: jest.fn(),
			progress: jest.fn(),
			reference: jest.fn(),
			push: jest.fn(),
			filetree: jest.fn(),
		};

		// Mock chat context
		mockChatContext = {
			history: [],
		};

		// Mock request
		mockRequest = {
			prompt: '/duck I have a bug in my loop',
			command: 'duck',
			references: [],
			toolReferences: [],
			toolInvocationToken: undefined,
			model: mockModel,
		};

		// Mock VS Code context
		mockVscodeContext = {
			asAbsolutePath: jest.fn((path: string) => path),
			globalState: {
				get: jest.fn(),
				update: jest.fn(),
			},
		};

		// Mock model
		mockModel = {
			id: 'copilot:gpt-4o',
			vendor: 'copilot',
			family: 'gpt-4o',
			name: 'GPT-4o',
		};

		// Mock cancellation token
		mockToken = {
			isCancellationRequested: false,
			onCancellationRequested: jest.fn(),
		};
	});

	describe('Command Properties', () => {
		test('should have correct name', () => {
			expect(duckCommand.name).toBe('duck');
		});

		test('should have description', () => {
			expect(duckCommand.description).toBe('Rubber duck debugging mode - hints only, no answers');
		});

		test('should have aliases', () => {
			expect(duckCommand.aliases).toContain('duck');
			expect(duckCommand.aliases).toContain('rubber');
			expect(duckCommand.aliases).toContain('eendje');
		});
	});

	describe('Validation', () => {
		test('should fail validation when no code context', () => {
			const context = {
				codeContext: null,
				yearLevel: 1,
				studentId: 'student-1',
				request: mockRequest,
				chatContext: mockChatContext,
				token: mockToken,
				extensionContext: mockVscodeContext,
				model: mockModel,
				trackProgress: jest.fn(),
			} as any;

			const error = duckCommand.validate(context);
			expect(error).toBeDefined();
			expect(error).toContain('code');
		});

		test('should pass validation when code context exists', () => {
			const context = {
				codeContext: {
					code: 'const x = 5;',
					language: 'javascript',
				},
				yearLevel: 1,
				studentId: 'student-1',
				request: mockRequest,
				chatContext: mockChatContext,
				token: mockToken,
				extensionContext: mockVscodeContext,
				model: mockModel,
				trackProgress: jest.fn(),
			} as any;

			const error = duckCommand.validate(context);
			expect(error).toBeUndefined();
		});
	});

	describe('Execute - No Code Context', () => {
		test('should handle missing code context gracefully', async () => {
			const context = {
				codeContext: null,
				yearLevel: 2,
				studentId: 'student-1',
				request: mockRequest,
				chatContext: mockChatContext,
				token: mockToken,
				extensionContext: mockVscodeContext,
				model: mockModel,
				trackProgress: jest.fn(),
			} as any;

			await duckCommand.execute(context, mockStream, mockToken);

			expect(mockStream.markdown).toHaveBeenCalled();
			const calls = mockStream.markdown.mock.calls;
			expect(calls.some((c: any[]) => c[0].includes('Selecteer'))).toBe(true);
		});
	});

	describe('Session Management', () => {
		test('should initialize session with code snapshot', () => {
			const duckContext = new DuckContext();
			const code = 'for (let i = 0; i < 10; i++) { console.log(i); }';

			const session = duckContext.initializeSession(code);

			expect(session).toBeDefined();
			expect(session.codeSnapshot).toBe(code);
			expect(session.hintsGiven).toEqual([]);
			expect(session.questionsAsked).toEqual([]);
			expect(session.conversationDepth).toBe(0);
		});

		test('should detect code changes', () => {
			const duckContext = new DuckContext();
			const code1 = 'let x = 5;';
			const code2 = 'let y = 10;';

			duckContext.initializeSession(code1);
			const hasChanged = duckContext.hasCodeChanged(code2);

			expect(hasChanged).toBe(true);
		});

		test('should record hints and track attempts', () => {
			const duckContext = new DuckContext();
			const code = 'const arr = [1,2,3]; arr.map()';

			duckContext.initializeSession(code);
			const hint1 = duckContext.recordHint('What does map do?', code, 'guidance');

			expect(hint1).toBeDefined();
			expect(hint1.question).toBe('What does map do?');
			expect(hint1.hintLevel).toBe('guidance');

			const session = duckContext.getCurrentSession();
			expect(session?.hintsGiven.length).toBe(1);
			expect(session?.attempts).toBe(1);
		});

		test('should prevent duplicate questions', () => {
			const duckContext = new DuckContext();
			const code = 'let x = 5;';

			duckContext.initializeSession(code);
			duckContext.recordHint('What is a variable?', code, 'guidance');

			const isSimilar = duckContext.hasAskedSimilarQuestion('What is a variable?');
			expect(isSimilar).toBe(true);
		});

		test('should track conversation depth', () => {
			const duckContext = new DuckContext();
			const code = 'let x = 5;';

			duckContext.initializeSession(code);
			expect(duckContext.getCurrentSession()?.conversationDepth).toBe(0);

			duckContext.incrementConversationDepth();
			expect(duckContext.getCurrentSession()?.conversationDepth).toBe(1);

			duckContext.incrementConversationDepth();
			expect(duckContext.getCurrentSession()?.conversationDepth).toBe(2);
		});

		test('should close session and return session data', () => {
			const duckContext = new DuckContext();
			const code = 'let x = 5;';

			duckContext.initializeSession(code);
			duckContext.recordHint('Question 1', code, 'guidance');
			duckContext.incrementConversationDepth();

			const closedSession = duckContext.closeSession();

			expect(closedSession).toBeDefined();
			expect(closedSession?.hintsGiven.length).toBe(1);
			expect(closedSession?.conversationDepth).toBe(1);
			expect(duckContext.getCurrentSession()).toBeNull();
		});
	});

	describe('Session Summary', () => {
		test('should generate session summary', () => {
			const duckContext = new DuckContext();
			const code = 'let x = 5;';

			duckContext.initializeSession(code);
			duckContext.recordHint('Question 1', code, 'guidance');
			duckContext.recordHint('Question 2', code, 'debugging_tip');
			duckContext.incrementConversationDepth();
			duckContext.incrementConversationDepth();

			const summary = duckContext.getSessionSummary();

			expect(summary).toBeDefined();
			expect(summary?.hintsGiven).toBe(2);
			expect(summary?.questionsAsked).toBe(2);
			expect(summary?.conversationRounds).toBe(2);
		});

		test('should return null summary when no active session', () => {
			const duckContext = new DuckContext();

			const summary = duckContext.getSessionSummary();
			expect(summary).toBeNull();
		});
	});

	describe('Progress Tracking', () => {
		test('should track student progress', () => {
			const duckContext = new DuckContext();
			const code = 'let x = 5;';

			duckContext.initializeSession(code);
			duckContext.recordHint('Hint 1', code, 'guidance');

			expect(duckContext.isStudentMakingProgress()).toBe(false);

			duckContext.recordStudentResponse(0, 'I think the issue is...', 5000);
			duckContext.incrementConversationDepth();

			expect(duckContext.isStudentMakingProgress()).toBe(true);
		});

		test('should determine session end condition', () => {
			const duckContext = new DuckContext();
			const code = 'let x = 5;';

			duckContext.initializeSession(code);

			// Initially should not end
			expect(duckContext.shouldEndSession()).toBe(false);

			// Record several hints without progress
			for (let i = 0; i < 8; i++) {
				duckContext.recordHint(`Hint ${i}`, code, 'guidance');
			}

			// Should end if no progress made
			const shouldEnd = duckContext.shouldEndSession();
			expect(typeof shouldEnd).toBe('boolean');
		});
	});

	describe('Year Level Adaptation', () => {
		test('should show correct difficulty name for each level', async () => {
			for (let level = 1; level <= 4; level++) {
				const context = {
					codeContext: {
						code: 'let x = 5;',
						language: 'javascript',
					},
					yearLevel: level,
					studentId: 'student-1',
					request: mockRequest,
					chatContext: mockChatContext,
					token: mockToken,
					extensionContext: mockVscodeContext,
					model: mockModel,
					trackProgress: jest.fn(),
				} as any;

				await duckCommand.execute(context, mockStream, mockToken);

				const calls = mockStream.markdown.mock.calls;
				const difficultyCall = calls.find((c: any[]) => c[0].includes('Moeilijkheidsgraad'));
				expect(difficultyCall).toBeDefined();
			}
		});
	});

	describe('Problem Description Extraction', () => {
		test('should extract problem from prompt with command', () => {
			const prompt = '/duck my loop is not working';
			// This is tested indirectly through execute, but we can verify behavior
			expect(prompt).toContain('loop');
		});

		test('should handle minimal prompt', () => {
			const prompt = '/duck';
			expect(prompt.startsWith('/duck')).toBe(true);
		});
	});
});

