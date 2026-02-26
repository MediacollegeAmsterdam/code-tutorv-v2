import * as vscode from "vscode";
import { AccessibilityHandler } from "./AccessibilityHandler";

export interface FormattedResponde {
    content: string;
    hasCodeBlocks: boolean;
    warnings: string[];
}

/**
 * ResponseFormatter - Formats and validates AI responses
 *
 * Now includes optional AccessibilityHandler integration for
 * comprehensive WCAG 2.1 AA validation (T044+)
 */
export class ResponseFormatter {
    private accessibilityHandler?: AccessibilityHandler;

    constructor(accessibilityHandler?: AccessibilityHandler) {
        this.accessibilityHandler = accessibilityHandler;
    }

    public formatResponse(aiResponse: string): string {
        let formatted = aiResponse;
        formatted = this.fixMarkdownIssues(formatted);
        formatted = this.fixCodeBlocks(formatted);
        formatted = this.addCodeBlockLabels(formatted);
        formatted = this.normalizeHeadings(formatted);

        this.validateAccessibility(formatted);

        // Optional: Use AccessibilityHandler for enhanced validation (T044-T049)
        if (this.accessibilityHandler) {
            const report = this.accessibilityHandler.generateReport(formatted);
            if (report.warnings.length > 0) {
                console.log('Accessibility warnings:', report.warnings);
            }
        }

        return formatted;
    }

    public fixMarkdownIssues(markdown: string): string {
        // Fixes headers
        markdown = markdown.replace(/(#{1,6})([^ #])/g, '$1 $2');
        // fixes lists
        markdown = markdown.replace(/^([-*+])([^ ])/gm, '$1 $2');
        // Removes excessive blank lines
        markdown = markdown.replace(/\n{3,}/g, '\n\n');
        return markdown;
    }

    // Code Formatting
    public fixCodeBlocks(markdown: string): string {
        return markdown.replace(
            /```(\w+)?\n([\s\S]*?)```/g,
            (match, lang, code) => {
                const language = lang || 'plaintext';
                const trimmedCode = code.trim();
                return `\`\`\`${language}\n${trimmedCode}\n\`\`\``;
            }
        );
    }

    // Adds labels
    public addCodeBlockLabels(markdown: string): string {
        let counter = 0;
        return markdown.replace(
            /```(\w+)?\n([\s\S]*?)```/g,
            (match, lang) => {
                counter++;
                const language = lang || 'code';
                const label = `\n**Example ${counter > 1 ? counter + ' ' : ''}(${language}):**\n`;
                return label + match;
            }
        );
    }

    public normalizeHeadings(markdown: string): string {
        // Tracks heading levels to ensure no level is skipped.
        // The first heading in a response may be at any level (e.g. h2 is fine).
        let currentLevel = 0;

        return markdown.replace(
            /^(#{1,6})\s+(.*)$/gm,
            (match, hashes, text) => {
                const proposedLevel = hashes.length;

                if (currentLevel === 0) {
                    // First heading – accept whatever level it is
                    currentLevel = proposedLevel;
                    return match;
                }

                // Subsequent headings: allow going down freely, but cap jumps up to +1
                const maxAllowed = Math.min(currentLevel + 1, 6);
                const actualLevel = Math.min(proposedLevel, maxAllowed);

                currentLevel = actualLevel;
                return '#'.repeat(actualLevel) + ' ' + text;
            }
        );
    }

    public validateAccessibility(markdown: string): void {
        const warnings: string[] = [];

        // Check for color-only meaning
        if (/\*\*(red|green|blue):/i.test(markdown)) {
            warnings.push('Uses color words - ensure meaning is conveyed without color');
        }

        // Check for tables (suggest lists)
        if (/\|.*\|/.test(markdown)) {
            warnings.push('Contains tables - consider using lists for better screen reader support');
        }

        // Log warnings
        if (warnings.length > 0) {
            console.warn('Accessibility warnings:', warnings.join(', '));
        }
    }
}