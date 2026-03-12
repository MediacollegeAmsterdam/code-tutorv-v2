import {expect, test, describe} from '@jest/globals';
import {
    getDuckSystemPrompt,
    getInitialAnalysisPrompt,
    getFollowUpPrompt,
    getDebuggingHintPrompt,
    getConceptPrompt,
    getSuccessValidationPrompt,
    getHintTypesForLevel
} from '../../core/duck-prompts';

describe('duck-prompts', () => {
    describe('getDuckSystemPrompt', () => {
        test('should return year 1 prompt for beginners', () => {
            const prompt = getDuckSystemPrompt(1);
            expect(prompt).toContain('eerstejaars');
            expect(prompt).toContain('Socratische methode');
            expect(prompt).toContain('GEEN werkende code');
        });

        test('should return year 2 prompt', () => {
            const prompt = getDuckSystemPrompt(2);
            expect(prompt).toContain('2de jaars');
            expect(prompt).toContain('problem-solving');
        });

        test('should return year 3 prompt', () => {
            const prompt = getDuckSystemPrompt(3);
            expect(prompt).toContain('3de jaars');
            expect(prompt).toContain('design patterns');
        });

        test('should return year 4 prompt for advanced', () => {
            const prompt = getDuckSystemPrompt(4);
            expect(prompt).toContain('4de jaars');
            expect(prompt).toContain('expert programming mentor');
            expect(prompt).toContain('architectuur');
        });

        test('should return year 2 prompt as default for unknown year', () => {
            const prompt = getDuckSystemPrompt(99);
            expect(prompt).toContain('2de jaars');
        });

        test('should contain HINT LEVELS for all year prompts', () => {
            for (let year = 1; year <= 4; year++) {
                const prompt = getDuckSystemPrompt(year);
                expect(prompt).toContain('HINT LEVELS');
            }
        });

        test('should contain Socratic method guidelines', () => {
            const prompt = getDuckSystemPrompt(1);
            expect(prompt).toContain('Stel VRAGEN');
            expect(prompt).toContain('REGELS');
        });

        test('all prompts should be in Dutch', () => {
            for (let year = 1; year <= 4; year++) {
                const prompt = getDuckSystemPrompt(year);
                expect(prompt).toMatch(/je|coach|hints?|geen/i);
            }
        });
    });

    describe('getInitialAnalysisPrompt', () => {
        const code = 'const x = 1;';
        const language = 'javascript';
        const yearLevel = 1;
        const studentDescription = 'My code is not working';

        test('should include system prompt', () => {
            const prompt = getInitialAnalysisPrompt(code, language, yearLevel, studentDescription);
            expect(prompt).toContain(getDuckSystemPrompt(yearLevel));
        });

        test('should include student description', () => {
            const prompt = getInitialAnalysisPrompt(code, language, yearLevel, studentDescription);
            expect(prompt).toContain('STUDENT BESCHRIJVING');
            expect(prompt).toContain(studentDescription);
        });

        test('should include code to analyze', () => {
            const prompt = getInitialAnalysisPrompt(code, language, yearLevel, studentDescription);
            expect(prompt).toContain('CODE OM TE ANALYSEREN');
            expect(prompt).toContain(code);
            expect(prompt).toContain(language);
        });

        test('should instruct to analyze and ask first question', () => {
            const prompt = getInitialAnalysisPrompt(code, language, yearLevel, studentDescription);
            expect(prompt).toContain('Analyseer');
            expect(prompt).toContain('EERSTE vraag');
        });

        test('should contain max 3 paragraphs constraint', () => {
            const prompt = getInitialAnalysisPrompt(code, language, yearLevel, studentDescription);
            expect(prompt).toContain('max 3 alinea');
        });

        test('should emphasize NOT giving answers', () => {
            const prompt = getInitialAnalysisPrompt(code, language, yearLevel, studentDescription);
            expect(prompt).toMatch(/NOOIT.*antwoord|stel.*vragen/i);
        });

        test('should work with different programming languages', () => {
            const pythonPrompt = getInitialAnalysisPrompt('x = 1', 'python', 1, 'test');
            const javaPrompt = getInitialAnalysisPrompt('int x = 1;', 'java', 1, 'test');

            expect(pythonPrompt).toContain('python');
            expect(javaPrompt).toContain('java');
        });
    });

    describe('getFollowUpPrompt', () => {
        const code = 'const x = 1;';
        const language = 'javascript';
        const yearLevel = 2;
        const studentResponse = 'I think the variable is undefined';
        const previousHints = ['Look at line 1', 'Check your initialization'];

        test('should include system prompt', () => {
            const prompt = getFollowUpPrompt(code, language, yearLevel, studentResponse, previousHints);
            expect(prompt).toContain(getDuckSystemPrompt(yearLevel));
        });

        test('should include code', () => {
            const prompt = getFollowUpPrompt(code, language, yearLevel, studentResponse, previousHints);
            expect(prompt).toContain('CODE:');
            expect(prompt).toContain(code);
        });

        test('should include previous hints', () => {
            const prompt = getFollowUpPrompt(code, language, yearLevel, studentResponse, previousHints);
            expect(prompt).toContain('VORIGE HINTS');
            previousHints.forEach(hint => {
                expect(prompt).toContain(hint);
            });
        });

        test('should include student response', () => {
            const prompt = getFollowUpPrompt(code, language, yearLevel, studentResponse, previousHints);
            expect(prompt).toContain('STUDENT ANTWOORD');
            expect(prompt).toContain(studentResponse);
        });

        test('should ask for next question', () => {
            const prompt = getFollowUpPrompt(code, language, yearLevel, studentResponse, previousHints);
            expect(prompt).toContain('VOLGENDE VRAAG');
        });

        test('should warn against repetition', () => {
            const prompt = getFollowUpPrompt(code, language, yearLevel, studentResponse, previousHints);
            expect(prompt).toContain('Vermijd repetitie');
        });

        test('should contain max 2 paragraphs constraint', () => {
            const prompt = getFollowUpPrompt(code, language, yearLevel, studentResponse, previousHints);
            expect(prompt).toContain('Max 2 alinea');
        });

        test('should work with empty hints list', () => {
            const prompt = getFollowUpPrompt(code, language, yearLevel, studentResponse, []);
            expect(prompt).toContain('VORIGE HINTS');
        });
    });

    describe('getDebuggingHintPrompt', () => {
        const code = 'const x = undefined;';
        const language = 'typescript';
        const yearLevel = 2;
        const problemArea = 'null pointer exception';

        test('should include system prompt', () => {
            const prompt = getDebuggingHintPrompt(code, language, yearLevel, problemArea);
            expect(prompt).toContain(getDuckSystemPrompt(yearLevel));
        });

        test('should include code', () => {
            const prompt = getDebuggingHintPrompt(code, language, yearLevel, problemArea);
            expect(prompt).toContain(code);
        });

        test('should include problem area', () => {
            const prompt = getDebuggingHintPrompt(code, language, yearLevel, problemArea);
            expect(prompt).toContain('PROBLEEM GEBIED');
            expect(prompt).toContain(problemArea);
        });

        test('should ask for debugging hint', () => {
            const prompt = getDebuggingHintPrompt(code, language, yearLevel, problemArea);
            expect(prompt).toContain('DEBUGGING HINT');
        });

        test('should focus on where to look', () => {
            const prompt = getDebuggingHintPrompt(code, language, yearLevel, problemArea);
            expect(prompt).toContain('Waar ze moeten kijken');
        });

        test('should not show working code', () => {
            const prompt = getDebuggingHintPrompt(code, language, yearLevel, problemArea);
            expect(prompt).toMatch(/GEEN werkende code/i);
        });
    });

    describe('getConceptPrompt', () => {
        const code = 'for (let i = 0; i < 10; i++) {}';
        const language = 'javascript';
        const yearLevel = 1;
        const conceptArea = 'loop iterations';

        test('should include system prompt', () => {
            const prompt = getConceptPrompt(code, language, yearLevel, conceptArea);
            expect(prompt).toContain(getDuckSystemPrompt(yearLevel));
        });

        test('should include code', () => {
            const prompt = getConceptPrompt(code, language, yearLevel, conceptArea);
            expect(prompt).toContain(code);
        });

        test('should include concept to explain', () => {
            const prompt = getConceptPrompt(code, language, yearLevel, conceptArea);
            expect(prompt).toContain('CONCEPT OM UIT TE LEGGEN');
            expect(prompt).toContain(conceptArea);
        });

        test('should not fix the code', () => {
            const prompt = getConceptPrompt(code, language, yearLevel, conceptArea);
            expect(prompt).toContain('ZONDER de code te "fixen"');
        });

        test('should explain what concept means', () => {
            const prompt = getConceptPrompt(code, language, yearLevel, conceptArea);
            expect(prompt).toContain('Wat het concept betekent');
        });

        test('should mention relevance to code', () => {
            const prompt = getConceptPrompt(code, language, yearLevel, conceptArea);
            expect(prompt).toContain('Hoe het relevant is');
        });

        test('should not provide working code', () => {
            const prompt = getConceptPrompt(code, language, yearLevel, conceptArea);
            expect(prompt).toMatch(/GEEN werkende code/i);
        });
    });

    describe('getSuccessValidationPrompt', () => {
        const code = 'const x = 1; console.log(x);';
        const language = 'javascript';
        const yearLevel = 3;

        test('should include system prompt', () => {
            const prompt = getSuccessValidationPrompt(code, language, yearLevel);
            expect(prompt).toContain(getDuckSystemPrompt(yearLevel));
        });

        test('should include code', () => {
            const prompt = getSuccessValidationPrompt(code, language, yearLevel);
            expect(prompt).toContain(code);
        });

        test('should ask if problem is solved', () => {
            const prompt = getSuccessValidationPrompt(code, language, yearLevel);
            expect(prompt).toContain('opgelost');
        });

        test('should ask about edge cases', () => {
            const prompt = getSuccessValidationPrompt(code, language, yearLevel);
            expect(prompt).toContain('edge cases');
        });

        test('should ask what was learned', () => {
            const prompt = getSuccessValidationPrompt(code, language, yearLevel);
            expect(prompt).toContain('geleerd');
        });

        test('should not tell how to improve', () => {
            const prompt = getSuccessValidationPrompt(code, language, yearLevel);
            expect(prompt).toContain('NIET hoe je het beter zou maken');
        });
    });

    describe('getHintTypesForLevel', () => {
        test('should return 4 hint types for year 1', () => {
            const hints = getHintTypesForLevel(1);
            expect(hints.length).toBe(4);
        });

        test('should return guidance first for year 1', () => {
            const hints = getHintTypesForLevel(1);
            expect(hints[0]).toBe('guidance');
        });

        test('should return debugging tips for year 2', () => {
            const hints = getHintTypesForLevel(2);
            expect(hints).toContain('debugging_tip');
        });

        test('should return concept clarification for year 3', () => {
            const hints = getHintTypesForLevel(3);
            expect(hints).toContain('concept_clarification');
        });

        test('should return advanced sequence for year 4', () => {
            const hints = getHintTypesForLevel(4);
            expect(hints[0]).toBe('concept_clarification');
        });

        test('should return year 2 sequence for unknown year', () => {
            const hints = getHintTypesForLevel(99);
            const year2Hints = getHintTypesForLevel(2);
            expect(hints).toEqual(year2Hints);
        });

        test('all hint types should be valid', () => {
            const validHints = ['guidance', 'debugging_tip', 'concept_clarification'];
            for (let year = 1; year <= 4; year++) {
                const hints = getHintTypesForLevel(year);
                hints.forEach(hint => {
                    expect(validHints).toContain(hint);
                });
            }
        });

        test('hints should escalate in complexity', () => {
            const year1 = getHintTypesForLevel(1);
            const year4 = getHintTypesForLevel(4);

            // Year 1 should start with guidance
            expect(year1[0]).toBe('guidance');

            // Year 4 should start with concept clarification (advanced)
            expect(year4[0]).toBe('concept_clarification');
        });
    });

    describe('prompt content validation', () => {
        test('all prompts should be in Dutch', () => {
            const code = 'const x = 1;';
            const language = 'javascript';
            const yearLevel = 1;

            const prompts = [
                getInitialAnalysisPrompt(code, language, yearLevel, 'test'),
                getFollowUpPrompt(code, language, yearLevel, 'response', []),
                getDebuggingHintPrompt(code, language, yearLevel, 'area'),
                getConceptPrompt(code, language, yearLevel, 'concept'),
                getSuccessValidationPrompt(code, language, yearLevel)
            ];

            prompts.forEach(prompt => {
                // Check for Dutch words
                expect(prompt.toLowerCase()).toMatch(/je|het|een|geen|zeg|stel|vraag/);
            });
        });

        test('all prompts should include code block formatting', () => {
            const code = 'const x = 1;';
            const language = 'javascript';
            const yearLevel = 1;

            const prompts = [
                getInitialAnalysisPrompt(code, language, yearLevel, 'test'),
                getFollowUpPrompt(code, language, yearLevel, 'response', []),
                getDebuggingHintPrompt(code, language, yearLevel, 'area'),
                getConceptPrompt(code, language, yearLevel, 'concept'),
                getSuccessValidationPrompt(code, language, yearLevel)
            ];

            prompts.forEach(prompt => {
                expect(prompt).toContain('```');
                expect(prompt).toContain(language);
            });
        });

        test('should handle special characters in input', () => {
            const code = 'const x = "'; // unclosed string
            const language = 'javascript';
            const yearLevel = 1;

            const prompt = getInitialAnalysisPrompt(code, language, yearLevel, 'test with "quotes"');
            expect(prompt).toContain(code);
        });
    });
});

