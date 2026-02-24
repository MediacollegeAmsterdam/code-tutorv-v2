/**
 * MessageHandler - Parses and validates student messages
 *
 * Responsibilities:
 * - Extract code blocks from messages
 * - Detect question type (concept, debugging, explanation, general)
 * - Flag homework requests
 * - Flag unethical requests
 * - Detect programming language
 *
 * This is the first filter in the educational pipeline.
 * All messages go through here before reaching the AI.
 */

export interface CodeBlock {
    language: string;
    code: string;
}

export interface ParsedMessage {
    text: string;
    codeBlocks: CodeBlock[];
    questionType: 'concept' | 'debugging' | 'explanation' | 'general';
    isHomeworkRequest: boolean;
    isUnethicalRequest: boolean;
    detectedLanguages: string[];
}

/**
 * MessageHandler - Parses student input for safety and context
 */
export class MessageHandler {
    /**
     * Parse a student message and extract structured information
     *
     * @param prompt - The student's question or message
     * @returns ParsedMessage with extracted information
     */
    public parseMessage(prompt: string): ParsedMessage {
        const text = prompt.trim();
        const codeBlocks = this.extractCodeBlocks(text);
        const questionType = this.detectQuestionType(text);
        const isHomeworkRequest = this.detectHomeworkRequest(text);
        const isUnethicalRequest = this.detectUnethicalRequest(text);
        const detectedLanguages = this.detectLanguages(codeBlocks);

        return {
            text,
            codeBlocks,
            questionType,
            isHomeworkRequest,
            isUnethicalRequest,
            detectedLanguages,
        };
    }

    /**
     * Extract code blocks from markdown text
     * Looks for triple-backtick code blocks with optional language identifier
     *
     * Example:
     * ```typescript
     * const x = 5;
     * ```
     */
    private extractCodeBlocks(text: string): CodeBlock[] {
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
        const blocks: CodeBlock[] = [];
        let match;

         
        while ((match = codeBlockRegex.exec(text)) !== null) {
            const language = match[1] || 'unknown';
            const code = match[2];

            blocks.push({
                language: this.normalizeLanguage(language),
                code,
            });
        }

        return blocks;
    }

    /**
     * Detect the type of question being asked
     * Uses keywords to categorize the student's intent
     */
    private detectQuestionType(text: string): 'concept' | 'debugging' | 'explanation' | 'general' {
        const lowerText = text.toLowerCase();

        // Debugging keywords
        if (/(debug|fix|error|bug|wrong|not work|broken)/i.test(lowerText)) {
            return 'debugging';
        }

        // Explanation keywords
        if (/(explain|why|how|understand|teach|meaning|purpose)/i.test(lowerText)) {
            return 'explanation';
        }

        // Concept keywords
        if (/(concept|what|define|what is|learn|algorithm|data structure)/i.test(lowerText)) {
            return 'concept';
        }

        // Default to general
        return 'general';
    }

    /**
     * Detect if this looks like a homework request
     * Students should learn by understanding, not by having answers done for them
     */
    private detectHomeworkRequest(text: string): boolean {
        const homeworkPatterns = [
            /do (my|this|our) (homework|assignment|project|exercise)/i,
            /solve (this|for me)/i,
            /write (code|a program|a solution)/i,
            /complete (my|this|the) (assignment|project|homework)/i,
            /(is )?due (today|tomorrow|in \d+ (hours?|days?))/i,
            /urgent.*code/i,
            /asap.*fix/i,
        ];

        return homeworkPatterns.some(pattern => pattern.test(text));
    }

    /**
     * Detect if this looks like an unethical request
     * We don't help with hacking, cheating, or harmful code
     */
    private detectUnethicalRequest(text: string): boolean {
        const unethicalPatterns = [
            /hack|crack|exploit|vulnerability|bypass/i,
            /cheat|plagiarize|copy (code|answer)/i,
            /malware|virus|trojan|ransomware/i,
            /password.*crack|brute force/i,
            /steal|unauthorized access/i,
        ];

        return unethicalPatterns.some(pattern => pattern.test(text));
    }

    /**
     * Extract programming languages from code blocks
     */
    private detectLanguages(codeBlocks: CodeBlock[]): string[] {
        const languages = codeBlocks.map(block => block.language);
        // Return unique languages
        return [...new Set(languages)];
    }

    /**
     * Normalize language names to standard identifiers
     * Examples: js → javascript, py → python, ts → typescript
     */
    private normalizeLanguage(language: string): string {
        const normalizations: { [key: string]: string } = {
            js: 'javascript',
            ts: 'typescript',
            py: 'python',
            java: 'java',
            cpp: 'cpp',
            c: 'c',
            cs: 'csharp',
            rb: 'ruby',
            go: 'go',
            rs: 'rust',
            php: 'php',
            sql: 'sql',
            html: 'html',
            css: 'css',
            json: 'json',
            xml: 'xml',
            yaml: 'yaml',
            bash: 'bash',
            sh: 'shell',
            unknown: 'unknown',
        };

        const lower = language.toLowerCase();
        return normalizations[lower] || lower;
    }
}