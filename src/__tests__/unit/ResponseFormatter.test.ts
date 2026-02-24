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
            const input = '##Header\n###Subheader';
            const output = formatter.fixMarkdownIssues(input);
            expect(output).toBe('## Header\n### Subheader');
        });
        it('should fix lists without spaces', () => {
            const input = '-Item 1\n-Item 2';
            const output = formatter.fixMarkdownIssues(input);
            expect(output).toBe('- Item 1\n- Item 2');
        });
        it('should remove excessive blank lines', () => {
            const input = 'Line 1\n\n\n\nLine 2';
            const output = formatter.fixMarkdownIssues(input);
            expect(output).toBe('Line 1\n\nLine 2');
        });
    });
    describe('fixCodeBlocks()', () => {
        it('should add default language', () => {
            const input = '`\nconst x = 5;\n`';
            const output = formatter.fixCodeBlocks(input);
            expect(output).toContain('`plaintext');
        });
        it('should trim whitespace', () => {
            const input = '`javascript\n\n  code  \n\n`';
            const output = formatter.fixCodeBlocks(input);
            expect(output).toBe('`javascript\ncode\n`');
        });
    });
    describe('addCodeBlockLabels()', () => {
        it('should add label to code block', () => {
            const input = '`javascript\ncode\n`';
            const output = formatter.addCodeBlockLabels(input);
            expect(output).toContain('**Example (javascript):**');
        });
        it('should number multiple blocks', () => {
            const input = '`js\n1\n`\n`py\n2\n`';
            const output = formatter.addCodeBlockLabels(input);
            expect(output).toContain('**Example (js):**');
            expect(output).toContain('**Example 2 (py):**');
        });
    });
    describe('normalizeHeadings()', () => {
        it('should fix skipped levels', () => {
            const input = '# H1\n### H3';
            const output = formatter.normalizeHeadings(input);
            expect(output).toBe('# H1\n## H3');
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
        it('should warn about colors', () => {
            formatter.validateAccessibility('**red:** text');
            expect(consoleWarnSpy).toHaveBeenCalled();
        });
        it('should warn about tables', () => {
            formatter.validateAccessibility('| col |');
            expect(consoleWarnSpy).toHaveBeenCalled();
        });
    });
    describe('formatResponse() integration', () => {
        it('should apply all steps', () => {
            const input = '##Header\n`\ncode\n`';
            const output = formatter.formatResponse(input);
            expect(output).toContain('## Header');
            expect(output).toContain('**Example');
        });
    });
});
