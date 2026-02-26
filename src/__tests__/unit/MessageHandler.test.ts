import {MessageHandler, ParsedMessage} from '../../services/MessageHandler';

describe('MessageHandler', () => {
    let handler: MessageHandler;

    beforeEach(() => {
        handler = new MessageHandler();
    });

    describe('parseMessage', () => {
        it('should parse a simple question', () => {
            const result = handler.parseMessage('What is a loop?');

            expect(result.text).toBe('What is a loop?');
            expect(result.codeBlocks).toHaveLength(0);
            expect(result.questionType).toBe('concept');
            expect(result.isHomeworkRequest).toBe(false);
            expect(result.isUnethicalRequest).toBe(false);
        });

        it('should handle empty input', () => {
            const result = handler.parseMessage('');

            expect(result.text).toBe('');
            expect(result.codeBlocks).toHaveLength(0);
        });

        it('should trim whitespace', () => {
            const result = handler.parseMessage('  Hello world  ');

            expect(result.text).toBe('Hello world');
        });
    });

    describe('Code block extraction', () => {
        it('should extract a single code block', () => {
            const message = `Here's my code:
\`\`\`javascript
const x = 5;
\`\`\``;

            const result = handler.parseMessage(message);

            expect(result.codeBlocks).toHaveLength(1);
            expect(result.codeBlocks[0].language).toBe('javascript');
            expect(result.codeBlocks[0].code).toBe('const x = 5;');
        });

        it('should extract multiple code blocks', () => {
            const message = `\`\`\`typescript
const a = 1;
\`\`\`
And another:
\`\`\`python
x = 1
\`\`\``;

            const result = handler.parseMessage(message);

            expect(result.codeBlocks).toHaveLength(2);
            expect(result.codeBlocks[0].language).toBe('typescript');
            expect(result.codeBlocks[1].language).toBe('python');
        });

        it('should handle code blocks without language identifier', () => {
            const message = `\`\`\`
some code
\`\`\``;

            const result = handler.parseMessage(message);

            expect(result.codeBlocks).toHaveLength(1);
            expect(result.codeBlocks[0].language).toBe('unknown');
        });
    });

    describe('Question type detection', () => {
        it('should detect debugging questions', () => {
            const tests = [
                'Why is my code not working?',
                'How do I fix this bug?',
                'My code has an error',
            ];

            tests.forEach(text => {
                const result = handler.parseMessage(text);
                expect(result.questionType).toBe('debugging');
            });
        });

        it('should detect explanation questions', () => {
            const tests = [
                'Can you explain loops?',
                'How does recursion work?',
                'Why would I use this?',
            ];

            tests.forEach(text => {
                const result = handler.parseMessage(text);
                expect(result.questionType).toBe('explanation');
            });
        });

        it('should detect concept questions', () => {
            const tests = [
                'What is a closure?',
                'Define polymorphism',
                'What is an algorithm?',
            ];

            tests.forEach(text => {
                const result = handler.parseMessage(text);
                expect(result.questionType).toBe('concept');
            });
        });

        it('should default to general for unmatched questions', () => {
            const result = handler.parseMessage('Hello there');

            expect(result.questionType).toBe('general');
        });
    });

    describe('Homework detection', () => {
        it('should flag homework requests', () => {
            expect(handler.parseMessage('Do my homework').isHomeworkRequest).toBe(true);
            expect(handler.parseMessage('Solve this assignment for me').isHomeworkRequest).toBe(true);
            expect(handler.parseMessage('Complete my project').isHomeworkRequest).toBe(true);
            expect(handler.parseMessage('This is due today').isHomeworkRequest).toBe(true);
        });

        it('should not flag legitimate learning questions', () => {
            const tests = [
                'How do I approach this problem?',
                'What concept should I use here?',
                'Can you guide me through this?',
            ];

            tests.forEach(text => {
                const result = handler.parseMessage(text);
                expect(result.isHomeworkRequest).toBe(false);
            });
        });
    });

    describe('Unethical request detection', () => {
        it('should flag unethical requests', () => {
            const tests = [
                'How do I hack into a system?',
                'How do I crack passwords?',
                'Can you help me exploit a vulnerability?',
                'How do I cheat on an exam?',
            ];

            tests.forEach(text => {
                const result = handler.parseMessage(text);
                expect(result.isUnethicalRequest).toBe(true);
            });
        });

        it('should not flag legitimate security questions', () => {
            const tests = [
                'How does encryption work?',
                'What is a firewall?',
                'How do I secure my password?',
            ];

            tests.forEach(text => {
                const result = handler.parseMessage(text);
                expect(result.isUnethicalRequest).toBe(false);
            });
        });
    });

    describe('Language detection', () => {
        it('should detect languages from code blocks', () => {
            const message = `\`\`\`javascript
const x = 1;
\`\`\`
\`\`\`python
x = 1
\`\`\``;

            const result = handler.parseMessage(message);

            expect(result.detectedLanguages).toContain('javascript');
            expect(result.detectedLanguages).toContain('python');
        });

        it('should normalize language identifiers', () => {
            const message = `\`\`\`js
const x = 1;
\`\`\`
\`\`\`py
x = 1
\`\`\``;

            const result = handler.parseMessage(message);

            expect(result.detectedLanguages).toContain('javascript');
            expect(result.detectedLanguages).toContain('python');
        });

        it('should return empty array if no code blocks', () => {
            const result = handler.parseMessage('No code here');

            expect(result.detectedLanguages).toHaveLength(0);
        });
    });

    describe('Integration - complete parsing', () => {
        it('should parse a realistic debugging question with code', () => {
            const message = `My JavaScript code has a bug. Here it is:

\`\`\`javascript
function add(a, b) {
    return a + b;
}
const result = add(5, "3");
console.log(result);
\`\`\`

Why is this happening and how do I fix it?`;

            const result = handler.parseMessage(message);

            expect(result.codeBlocks).toHaveLength(1);
            expect(result.codeBlocks[0].language).toBe('javascript');
            expect(result.questionType).toBe('debugging');
            expect(result.isHomeworkRequest).toBe(false);
            expect(result.isUnethicalRequest).toBe(false);
            expect(result.detectedLanguages).toContain('javascript');
        });
    });
});