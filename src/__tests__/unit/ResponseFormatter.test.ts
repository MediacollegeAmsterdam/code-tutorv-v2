/**
 * Unit tests for ResponseFormatter
 * T043: ResponseFormatter unit tests
 */
import { ResponseFormatter } from '../../services/ResponseFormatter';

describe('ResponseFormatter', () => {
    let formatter: ResponseFormatter;

    beforeEach(() => {
        formatter = new ResponseFormatter();
    });

    describe('Constructor', () => {
        it('should create ResponseFormatter instance', () => {
            expect(formatter).toBeDefined();
            expect(formatter).toBeInstanceOf(ResponseFormatter);
        });
    });

    describe('fixMarkdownIssues()', () => {
        it('should fix headers without spaces', () => {
            expect(formatter.fixMarkdownIssues('##Header\n###Sub')).toBe('## Header\n### Sub');
        });

        it('should fix lists without spaces', () => {
            expect(formatter.fixMarkdownIssues('-Item 1\n-Item 2')).toBe('- Item 1\n- Item 2');
        });

        it('should remove excessive blank lines', () => {
            expect(formatter.fixMarkdownIssues('Line 1\n\n\n\nLine 2')).toBe('Line 1\n\nLine 2');
        });

        it('should leave correct markdown unchanged', () => {
            const input = '## Header\n\n- Item 1';
            expect(formatter.fixMarkdownIssues(input)).toBe(input);
        });
    });

    describe('fixCodeBlocks()', () => {
        it('should add default language to unlabelled blocks', () => {
            const input = '```\nconst x = 5;\n```';
            expect(formatter.fixCodeBlocks(input)).toContain('```plaintext');
        });

        it('should preserve existing language identifier', () => {
            const input = '```javascript\nconst x = 5;\n```';
            expect(formatter.fixCodeBlocks(input)).toContain('```javascript');
        });

        it('should trim whitespace inside code blocks', () => {
            const input = '```javascript\n\n  code  \n\n```';
            expect(formatter.fixCodeBlocks(input)).toBe('```javascript\ncode\n```');
        });
    });

    describe('addCodeBlockLabels()', () => {
        it('should add label to a single code block', () => {
            const input = '```javascript\ncode\n```';
            expect(formatter.addCodeBlockLabels(input)).toContain('**Example (javascript):**');
        });

        it('should number multiple code blocks', () => {
            const input = '```js\n1\n```\n\n```py\n2\n```';
            const output = formatter.addCodeBlockLabels(input);
            expect(output).toContain('**Example (js):**');
            expect(output).toContain('**Example 2 (py):**');
        });

        it('should add label before the code block', () => {
            const input = 'Text\n```javascript\ncode\n```';
            const output = formatter.addCodeBlockLabels(input);
            expect(output.indexOf('**Example')).toBeLessThan(output.indexOf('```javascript'));
        });
    });

    describe('normalizeHeadings()', () => {
        it('should preserve correct hierarchy', () => {
            expect(formatter.normalizeHeadings('# H1\n## H2\n### H3')).toBe('# H1\n## H2\n### H3');
        });

        it('should fix skipped heading levels', () => {
            expect(formatter.normalizeHeadings('# H1\n### H3')).toBe('# H1\n## H3');
        });

        it('should preserve heading text', () => {
            expect(formatter.normalizeHeadings('## Important Section')).toContain('Important Section');
        });
    });

    describe('validateAccessibility()', () => {
        let consoleWarnSpy: jest.SpyInstance;

        beforeEach(() => {
            consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        });

        afterEach(() => {
            consoleWarnSpy.mockRestore();
        });

        it('should warn about color-only meaning', () => {
            formatter.validateAccessibility('**red:** text');
            expect(consoleWarnSpy).toHaveBeenCalled();
        });

        it('should warn about tables', () => {
            formatter.validateAccessibility('| col | col |');
            expect(consoleWarnSpy).toHaveBeenCalled();
        });

        it('should not warn for accessible content', () => {
            formatter.validateAccessibility('## Heading\n\nSafe text.');
            expect(consoleWarnSpy).not.toHaveBeenCalled();
        });
    });

    describe('formatResponse() - integration', () => {
        it('should apply all formatting steps', () => {
            const input = '##Header\n\n```\ncode\n```';
            const output = formatter.formatResponse(input);
            expect(output).toContain('## Header');
            expect(output).toContain('```plaintext');
            expect(output).toContain('**Example');
        });

        it('should handle empty input', () => {
            expect(formatter.formatResponse('')).toBe('');
        });

        it('should handle plain text', () => {
            const input = 'Just plain text';
            expect(formatter.formatResponse(input)).toBe(input);
        });

        it('should format multiple code blocks with numbers', () => {
            const input = '```javascript\nconst a = 1;\n```\n\n```python\nb = 2\n```';
            const output = formatter.formatResponse(input);
            expect(output).toContain('**Example (javascript):**');
            expect(output).toContain('**Example 2 (python):**');
        });

        it('should handle a realistic AI response', () => {
            const input = [
                '##Understanding Loops',
                '',
                '-For loops',
                '-While loops',
                '',
                '```javascript',
                'for(let i=0; i<10; i++) {',
                '  console.log(i);',
                '}',
                '```',
            ].join('\n');

            const output = formatter.formatResponse(input);
            expect(output).toContain('## Understanding Loops');
            expect(output).toContain('- For loops');
            expect(output).toContain('**Example (javascript):**');
        });
    });
});
