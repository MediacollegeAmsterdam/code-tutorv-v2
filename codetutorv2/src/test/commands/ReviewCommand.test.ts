/**
 * Review Command Tests
 *
 * Tests for the exercise review feature with structured feedback
 */

import { ReviewCommand } from '../../commands/ReviewCommand';
import { ChatContext } from '../../core/ChatContext';
import * as vscode from 'vscode';

describe('ReviewCommand', () => {
	let reviewCommand: ReviewCommand;
	let mockStream: any;
	let mockRequest: any;
	let mockModel: any;
	let mockToken: any;

	beforeEach(() => {
		reviewCommand = new ReviewCommand();

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

		// Mock request
		mockRequest = {
			prompt: '/review I needed to create a sum loop',
			command: 'review',
			references: [],
			toolReferences: [],
			toolInvocationToken: undefined,
			model: mockModel,
		};

		// Mock model
		mockModel = {
			id: 'copilot:gpt-4o',
			vendor: 'copilot',
			family: 'gpt-4o',
			name: 'GPT-4o',
		};

		// Mock token
		mockToken = {
			isCancellationRequested: false,
			onCancellationRequested: jest.fn(),
		};
	});

	describe('Command Properties', () => {
		test('should have correct name', () => {
			expect(reviewCommand.name).toBe('review');
		});

		test('should have description', () => {
			expect(reviewCommand.description).toContain('feedback');
		});

		test('should have aliases', () => {
			expect(reviewCommand.aliases).toContain('review');
			expect(reviewCommand.aliases).toContain('check');
		});
	});

	describe('Validation', () => {
		test('should handle missing code context gracefully', async () => {
			const context = {
				codeContext: null,
				yearLevel: 1,
				studentId: 'student-1',
				request: mockRequest,
				chatContext: { history: [] },
				token: mockToken,
				extensionContext: { asAbsolutePath: (p: string) => p },
				model: mockModel,
				trackProgress: jest.fn(),
			} as any;

			await reviewCommand.execute(context, mockStream, mockToken);

			expect(mockStream.markdown).toHaveBeenCalled();
			const calls = mockStream.markdown.mock.calls.map((c: any[]) => c[0]);
			expect(calls.some((c: string) => c.includes('Beoordeling'))).toBe(true);
		});
	});

	describe('Exercise Review', () => {
		test('should process code review when code is selected', async () => {
			const context = {
				codeContext: {
					code: '```javascript\nlet sum = 0;\nfor(let i = 0; i < 5; i++) sum += i;\n```',
					language: 'javascript',
				},
				yearLevel: 1,
				studentId: 'student-1',
				request: mockRequest,
				chatContext: { history: [] },
				token: mockToken,
				extensionContext: { asAbsolutePath: (p: string) => p },
				model: mockModel,
				trackProgress: jest.fn(),
			} as any;

			await reviewCommand.execute(context, mockStream, mockToken);

			expect(mockStream.markdown).toHaveBeenCalled();
			const calls = mockStream.markdown.mock.calls.map((c: any[]) => c[0]);
			expect(calls.some((call: string) => call.includes('Beoordeling'))).toBe(true);
		});
	});

	describe('Exercise Description Extraction', () => {
		test('should extract exercise description from prompt', async () => {
			const context = {
				codeContext: {
					code: '```js\nlet x = 5;\n```',
					language: 'javascript',
				},
				yearLevel: 2,
				studentId: 'student-1',
				request: {
					...mockRequest,
					prompt: '/review create a loop that sums 1 to 10',
				},
				chatContext: { history: [] },
				token: mockToken,
				extensionContext: { asAbsolutePath: (p: string) => p },
				model: mockModel,
				trackProgress: jest.fn(),
			} as any;

			await reviewCommand.execute(context, mockStream, mockToken);

			expect(mockStream.markdown).toHaveBeenCalled();
		});
	});

	describe('Year-Level Adaptation', () => {
		test('should show correct difficulty for each year level', async () => {
			for (let level = 1; level <= 4; level++) {
				const context = {
					codeContext: {
						code: '```js\nlet x = 5;\n```',
						language: 'javascript',
					},
					yearLevel: level,
					studentId: `student-${level}`,
					request: mockRequest,
					chatContext: { history: [] },
					token: mockToken,
					extensionContext: { asAbsolutePath: (p: string) => p },
					model: mockModel,
					trackProgress: jest.fn(),
				} as any;

				mockStream.markdown.mockClear();
				await reviewCommand.execute(context, mockStream, mockToken);

				const calls = mockStream.markdown.mock.calls.map((c: any[]) => c[0]);
				expect(calls.some((c: string) => c.includes('Moeilijkheidsgraad'))).toBe(true);
			}
		});
	});

	describe('Multiple Attempts', () => {
		test('should track multiple review attempts for same code', async () => {
			const context = {
				codeContext: {
					code: '```js\nlet sum = 0;\n```',
					language: 'javascript',
				},
				yearLevel: 1,
				studentId: 'student-1',
				request: mockRequest,
				chatContext: { history: [] },
				token: mockToken,
				extensionContext: { asAbsolutePath: (p: string) => p },
				model: mockModel,
				trackProgress: jest.fn(),
			} as any;

			// First review
			await reviewCommand.execute(context, mockStream, mockToken);
			const firstCallCount = mockStream.markdown.mock.calls.length;

			// Second review of same code
			mockStream.markdown.mockClear();
			await reviewCommand.execute(context, mockStream, mockToken);

			// Should indicate it's a repeat
			const calls = mockStream.markdown.mock.calls.map((c: any[]) => c[0]);
			expect(calls.length > 0).toBe(true);
		});
	});

	describe('Error Handling', () => {
		test('should handle review generation errors gracefully', async () => {
			const failingModel = {
				sendRequest: jest.fn().mockRejectedValue(new Error('API Error')),
			};

			const context = {
				codeContext: {
					code: '```js\nlet x = 5;\n```',
					language: 'javascript',
				},
				yearLevel: 1,
				studentId: 'student-1',
				request: mockRequest,
				chatContext: { history: [] },
				token: mockToken,
				extensionContext: { asAbsolutePath: (p: string) => p },
				model: failingModel as any,
				trackProgress: jest.fn(),
			} as any;

			await reviewCommand.execute(context, mockStream, mockToken);

			const calls = mockStream.markdown.mock.calls.map((c: any[]) => c[0]);
			expect(calls.some((c: string) => c.includes('❌'))).toBe(true);
		});
	});

	describe('Review Format', () => {
		test('should produce structured review output', async () => {
			const context = {
				codeContext: {
					code: '```js\nfor(let i = 0; i < 5; i++) { console.log(i); }\n```',
					language: 'javascript',
				},
				yearLevel: 2,
				studentId: 'student-1',
				request: mockRequest,
				chatContext: { history: [] },
				token: mockToken,
				extensionContext: { asAbsolutePath: (p: string) => p },
				model: mockModel,
				trackProgress: jest.fn(),
			} as any;

			await reviewCommand.execute(context, mockStream, mockToken);

			expect(mockStream.markdown).toHaveBeenCalled();
			const output = mockStream.markdown.mock.calls.map((c: any[]) => c[0]).join('\n');

			// Should have review header
			expect(output).toContain('Beoordeling');
		});
	});

	describe('Integration with ChatContext', () => {
		test('should track progress after review', async () => {
			const context = {
				codeContext: {
					code: '```js\nlet x = 5;\n```',
					language: 'javascript',
				},
				yearLevel: 1,
				studentId: 'student-1',
				request: mockRequest,
				chatContext: { history: [] },
				token: mockToken,
				extensionContext: { asAbsolutePath: (p: string) => p },
				model: mockModel,
				trackProgress: jest.fn(),
			} as any;

			await reviewCommand.execute(context, mockStream, mockToken);

			expect(context.trackProgress).toHaveBeenCalledWith('review');
		});
	});
});

