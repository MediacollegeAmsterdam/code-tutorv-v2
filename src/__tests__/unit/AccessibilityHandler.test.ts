/**
 * Unit tests for AccessibilityHandler
 * T051: AccessibilityHandler unit tests ✅
 *
 * Tests all validation methods:
 * - validateResponse() orchestration
 * - checkColorContrast()
 * - checkCodeBlockAccessibility()
 * - checkHeadingStructure()
 * - checkLinkAccessibility()
 * - generateReport()
 */

import { AccessibilityHandler } from '../../services/AccessibilityHandler';

describe('AccessibilityHandler', () => {
    let handler: AccessibilityHandler;
    let consoleLogSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        handler = new AccessibilityHandler();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    // ─── Constructor ──────────────────────────────────────────────────────────

    describe('Constructor', () => {
        it('should create AccessibilityHandler instance', () => {
            expect(handler).toBeDefined();
            expect(handler).toBeInstanceOf(AccessibilityHandler);
        });
    });

    // ─── checkColorContrast ───────────────────────────────────────────────────

    describe('checkColorContrast()', () => {
        it('should return no warnings for accessible content', () => {
            const response = '## Hello\n\nThis is some normal text without color styles.';
            const warnings = handler.checkColorContrast(response);
            expect(warnings).toHaveLength(0);
        });

        it('should warn on inline color styles', () => {
            const response = '<span style="color: red">Error</span>';
            const warnings = handler.checkColorContrast(response);
            expect(warnings.length).toBeGreaterThan(0);
            expect(warnings[0].type).toBe('color');
            expect(warnings[0].message).toContain('inline color styles');
        });

        it('should warn on bold color-only meaning', () => {
            const response = '**red:** this indicates an error';
            const warnings = handler.checkColorContrast(response);
            expect(warnings.length).toBeGreaterThan(0);
            expect(warnings[0].type).toBe('color');
        });

        it('should warn on "text is <color>" pattern', () => {
            const response = 'The text is red when there is an error.';
            const warnings = handler.checkColorContrast(response);
            expect(warnings.length).toBeGreaterThan(0);
        });

        it('should warn on "<color> means" pattern', () => {
            const response = 'Green means the test passed.';
            const warnings = handler.checkColorContrast(response);
            expect(warnings.length).toBeGreaterThan(0);
        });

        it('should include a suggestion in warnings', () => {
            const response = '<p style="color:blue">Note</p>';
            const warnings = handler.checkColorContrast(response);
            expect(warnings[0].suggestion).toBeDefined();
            expect(warnings[0].suggestion).toContain('contrast');
        });

        it('should only warn once for color-only meaning', () => {
            const response = '**red:** error **green:** success **blue:** info';
            const colorMeaningWarnings = handler
                .checkColorContrast(response)
                .filter(w => w.message.includes('color-only'));
            expect(colorMeaningWarnings).toHaveLength(1);
        });
    });

    // ─── checkCodeBlockAccessibility ─────────────────────────────────────────

    describe('checkCodeBlockAccessibility()', () => {
        it('should return no warnings for labelled code blocks', () => {
            const response = '```javascript\nconst x = 5;\n```';
            const warnings = handler.checkCodeBlockAccessibility(response);
            expect(warnings).toHaveLength(0);
        });

        it('should warn on code blocks without language identifier', () => {
            const response = '```\nconst x = 5;\n```';
            const warnings = handler.checkCodeBlockAccessibility(response);
            expect(warnings.length).toBeGreaterThan(0);
            expect(warnings[0].type).toBe('code-block');
            expect(warnings[0].message).toContain('without language identifier');
        });

        it('should count multiple unlabelled code blocks', () => {
            // Two opening fences without language
            const response = '```\ncode1\n```\n\n```\ncode2\n```';
            const warnings = handler.checkCodeBlockAccessibility(response);
            const unlabelled = warnings.find(w => w.message.includes('without language'));
            expect(unlabelled).toBeDefined();
            expect(unlabelled!.message).toContain('2');
        });

        it('should warn on very long code blocks (>50 lines)', () => {
            const longCode = Array.from({ length: 55 }, (_, i) => `line ${i}`).join('\n');
            const response = `\`\`\`javascript\n${longCode}\n\`\`\``;
            const warnings = handler.checkCodeBlockAccessibility(response);
            const longWarning = warnings.find(w => w.message.includes('very long'));
            expect(longWarning).toBeDefined();
        });

        it('should not warn on short code blocks', () => {
            const response = '```javascript\nconst x = 5;\nconst y = 10;\n```';
            const warnings = handler.checkCodeBlockAccessibility(response);
            const longWarning = warnings.find(w => w.message.includes('very long'));
            expect(longWarning).toBeUndefined();
        });

        it('should include suggestion with WCAG reference', () => {
            const response = '```\ncode\n```';
            const warnings = handler.checkCodeBlockAccessibility(response);
            expect(warnings[0].suggestion).toContain('WCAG 3.1.1');
        });
    });

    // ─── checkHeadingStructure ────────────────────────────────────────────────

    describe('checkHeadingStructure()', () => {
        it('should return no warnings for correct hierarchy', () => {
            const response = '# H1\n\n## H2\n\n### H3';
            const warnings = handler.checkHeadingStructure(response);
            expect(warnings).toHaveLength(0);
        });

        it('should warn when heading level is skipped', () => {
            const response = '# H1\n\n### H3 (skipped H2)';
            const warnings = handler.checkHeadingStructure(response);
            expect(warnings.length).toBeGreaterThan(0);
            expect(warnings[0].type).toBe('heading');
            expect(warnings[0].message).toContain('h1 → h3');
        });

        it('should include the line number in location', () => {
            const response = '# H1\n\n### Skipped';
            const warnings = handler.checkHeadingStructure(response);
            expect(warnings[0].location).toContain('Line');
        });

        it('should include the heading text in location', () => {
            const response = '# Title\n\n### Section';
            const warnings = handler.checkHeadingStructure(response);
            expect(warnings[0].location).toContain('Section');
        });

        it('should include WCAG reference in suggestion', () => {
            const response = '# H1\n\n### H3';
            const warnings = handler.checkHeadingStructure(response);
            expect(warnings[0].suggestion).toContain('WCAG 1.3.1');
        });

        it('should allow heading level to decrease freely', () => {
            const response = '# H1\n\n## H2\n\n### H3\n\n## Back to H2\n\n# Back to H1';
            const warnings = handler.checkHeadingStructure(response);
            expect(warnings).toHaveLength(0);
        });

        it('should handle multiple hierarchy violations', () => {
            const response = '# H1\n\n### Skip1\n\n##### Skip2';
            const warnings = handler.checkHeadingStructure(response);
            expect(warnings.length).toBeGreaterThanOrEqual(2);
        });

        it('should return no warnings when no headings present', () => {
            const response = 'Just plain text\n\nNo headings here.';
            const warnings = handler.checkHeadingStructure(response);
            expect(warnings).toHaveLength(0);
        });
    });

    // ─── checkLinkAccessibility ───────────────────────────────────────────────

    describe('checkLinkAccessibility()', () => {
        it('should return no warnings for descriptive links', () => {
            const response = '[Read the installation guide](https://example.com)';
            const warnings = handler.checkLinkAccessibility(response);
            expect(warnings).toHaveLength(0);
        });

        it('should warn on "click here" link text', () => {
            const response = '[click here](https://example.com)';
            const warnings = handler.checkLinkAccessibility(response);
            expect(warnings.length).toBeGreaterThan(0);
            expect(warnings[0].type).toBe('link');
            expect(warnings[0].message).toContain('click here');
        });

        it('should warn on "here" link text', () => {
            const response = 'See [here](https://example.com) for more.';
            const warnings = handler.checkLinkAccessibility(response);
            expect(warnings.length).toBeGreaterThan(0);
        });

        it('should warn on "link" link text', () => {
            const response = 'Check out this [link](https://example.com).';
            const warnings = handler.checkLinkAccessibility(response);
            expect(warnings.length).toBeGreaterThan(0);
        });

        it('should warn on "read more" link text', () => {
            const response = '[read more](https://example.com)';
            const warnings = handler.checkLinkAccessibility(response);
            expect(warnings.length).toBeGreaterThan(0);
        });

        it('should count multiple vague links in one warning', () => {
            const response = '[click here](url1) and [here](url2) and [link](url3)';
            const warnings = handler.checkLinkAccessibility(response);
            expect(warnings).toHaveLength(1);
            expect(warnings[0].message).toContain('3');
        });

        it('should include WCAG reference in suggestion', () => {
            const response = '[click here](https://example.com)';
            const warnings = handler.checkLinkAccessibility(response);
            expect(warnings[0].suggestion).toContain('WCAG 2.4.4');
        });

        it('should return no warnings when no links present', () => {
            const response = 'Just text without any links.';
            const warnings = handler.checkLinkAccessibility(response);
            expect(warnings).toHaveLength(0);
        });
    });

    // ─── validateResponse ─────────────────────────────────────────────────────

    describe('validateResponse()', () => {
        it('should return passed:true for fully accessible content', () => {
            const response = '## Hello\n\nParagraph text.\n\n```javascript\ncode\n```';
            const report = handler.validateResponse(response);
            expect(report.passed).toBe(true);
            expect(report.warnings).toHaveLength(0);
        });

        it('should collect warnings from all checks', () => {
            // This has: missing code lang + color meaning + vague link
            const response = [
                '# Title',
                '**red:** error',
                '```\ncode\n```',
                '[click here](url)',
            ].join('\n');

            const report = handler.validateResponse(response);
            expect(report.warnings.length).toBeGreaterThan(0);

            const types = report.warnings.map(w => w.type);
            expect(types).toContain('color');
            expect(types).toContain('code-block');
            expect(types).toContain('link');
        });

        it('should log warnings to console', () => {
            const response = '```\ncode\n```';
            handler.validateResponse(response);
            expect(consoleLogSpy).toHaveBeenCalled();
        });

        it('should not log when no warnings', () => {
            const response = '## Safe content\n\nNo issues here.';
            handler.validateResponse(response);
            expect(consoleLogSpy).not.toHaveBeenCalled();
        });

        it('should handle validation errors gracefully', () => {
            // Force error by passing null (simulates unexpected input)
            expect(() => handler.validateResponse(null as unknown as string)).not.toThrow();
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it('should always return a valid report structure', () => {
            const report = handler.validateResponse('some text');
            expect(report).toHaveProperty('passed');
            expect(report).toHaveProperty('warnings');
            expect(report).toHaveProperty('errors');
            expect(Array.isArray(report.warnings)).toBe(true);
            expect(Array.isArray(report.errors)).toBe(true);
        });
    });

    // ─── generateReport ───────────────────────────────────────────────────────

    describe('generateReport() - T050', () => {
        it('should return a complete compliance report', () => {
            const response = '## Hello\n\n```javascript\ncode\n```';
            const report = handler.generateReport(response);

            expect(report.passed).toBe(true);
            expect(report.wcagLevel).toBe('AA');
            expect(report.keyboardNavigable).toBe(true);
            expect(report.screenReaderSupport).toBe(true);
            expect(report.zoomSupport).toBe(true);
            expect(typeof report.timestamp).toBe('number');
        });

        it('should set colorContrast:true when no color warnings', () => {
            const response = '## Heading\n\nSafe content.';
            const report = handler.generateReport(response);
            expect(report.colorContrast).toBe(true);
        });

        it('should set colorContrast:false when color warnings found', () => {
            const response = '<p style="color:red">error</p>';
            const report = handler.generateReport(response);
            expect(report.colorContrast).toBe(false);
        });

        it('should include warnings in report', () => {
            const response = '[click here](url)';
            const report = handler.generateReport(response);
            expect(report.warnings.length).toBeGreaterThan(0);
        });

        it('should include a recent timestamp', () => {
            const before = Date.now();
            const report = handler.generateReport('text');
            const after = Date.now();
            expect(report.timestamp).toBeGreaterThanOrEqual(before);
            expect(report.timestamp).toBeLessThanOrEqual(after);
        });

        it('should still pass with warnings (warnings are not errors)', () => {
            const response = '```\ncode without language\n```';
            const report = handler.generateReport(response);
            expect(report.passed).toBe(true); // Warnings don't cause failure
            expect(report.warnings.length).toBeGreaterThan(0);
        });
    });

    // ─── Integration ──────────────────────────────────────────────────────────

    describe('Integration - real-world responses', () => {
        it('should validate a fully accessible educational response', () => {
            const accessibleResponse = `## Understanding Loops

A loop lets you repeat code multiple times.

### For Loop

Use a \`for\` loop when you know how many times to iterate:

**Example (javascript):**
\`\`\`javascript
for (let i = 0; i < 10; i++) {
    console.log(i);
}
\`\`\`

Learn more in the [JavaScript MDN documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for).`;

            const report = handler.generateReport(accessibleResponse);
            expect(report.passed).toBe(true);
            // Only labelled code blocks, descriptive link, valid hierarchy → no warnings
            const nonCodeWarnings = report.warnings.filter(w => w.type !== 'code-block');
            expect(nonCodeWarnings).toHaveLength(0);
        });

        it('should catch multiple issues in a poorly-formatted response', () => {
            const badResponse = `# Loops

**green:** good code, **red:** bad code

\`\`\`
for(i=0;i<10;i++) {}
\`\`\`

#### Deep heading (skipped h2, h3)

[click here](url) for docs.`;

            const report = handler.generateReport(badResponse);
            const types = report.warnings.map(w => w.type);

            expect(types).toContain('color');
            expect(types).toContain('code-block');
            expect(types).toContain('heading');
            expect(types).toContain('link');
        });
    });
});

