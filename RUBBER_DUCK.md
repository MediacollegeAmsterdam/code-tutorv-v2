# Rubber Duck, Targeted Exercises & Exercise Review

AI-powered learning features: Socratic debugging, concept-targeted exercises, and structured exercise review.

## Commands

### /duck - Guided Debugging

```
@tutor /duck [describe your problem]
```

- Asks guiding questions based on your year level (1-4)
- Tracks hints to prevent repetition
- Monitors code changes
- Detects progress and ends sessions after 8 hints without progress
- **Never provides direct code answers**

### /exercise - Targeted Practice

```
@tutor /exercise [select code first]
```

- Analyzes your code to identify concepts
- Generates exercises for those specific concepts
- Year-level adapted difficulty
- Includes examples without spoilers

Or ask for general exercises:

```
@tutor /exercise loops
```

### /review - Exercise Feedback (NEW!)

```
@tutor /review [what exercise was this for]
```

- Structured feedback on completed exercises
- Highlights what you did well (✅)
- Identifies specific issues (❌)
- Provides targeted improvement tips (💡)
- Confidence score (not a grade)
- Year-level adapted feedback

## Features

### Rubber Duck (/duck)

- **Socratic Method** - Questions guide learning
- **Year-Level Adaptation** - Different question depth for each year
- **Session Management** - Tracks hints, progress, code snapshots
- **Code Change Detection** - Detects modifications via SHA256
- **No Direct Answers** - Encourages problem-solving skills
- **Hint Escalation** - guidance → debugging tips → concepts

### Targeted Exercises (/exercise)

- **Code Analysis** - Identifies concepts in your code
- **Concept-Focused** - Generates exercises for what you're working on
- **Year-Level Adapted** - Difficulty matches your year
- **With Examples** - Shows patterns without giving away answers

### Exercise Review (/review)

- **Structured Feedback** - ✅ Good, ❌ Issues, 💡 Tips
- **Exercise Context** - Reviews against what was asked
- **No Spoilers** - Tips without full solutions
- **Confidence Scoring** - Helps assess understanding
- **Attempt Tracking** - Monitors practice progress
- **Year-Level Adapted** - Feedback matches difficulty

## How They Work Together

**Complete Learning Cycle:**

1. Student uses `/exercise` to get a targeted exercise (based on code or topic)
2. Student completes the exercise
3. Student uses `/review` to get structured feedback on the exercise
4. If stuck while working on the exercise, uses `/duck` for Socratic guidance
5. After fixing issues, uses `/review` again to verify improvements

## Files

**Core Features:**

- `src/commands/DuckCommand.ts` - Socratic debugging
- `src/commands/ExerciseCommand.ts` - Exercise generation with code analysis
- `src/commands/ReviewCommand.ts` - Exercise review with feedback
- `src/core/DuckContext.ts` - Session state (98.59% coverage)
- `src/core/duck-prompts.ts` - Socratic prompt templates

**Tests:**

- `src/test/commands/DuckCommand.test.ts` - 40+ tests
- `src/test/core/DuckContext.test.ts` - 30+ tests
- `src/test/commands/ReviewCommand.test.ts` - 15+ tests

## Testing

```bash
npm test -- --testNamePattern="Duck"     # Duck tests
npm test -- --testNamePattern="Review"   # Review tests
npm test -- --testNamePattern="Exercise" # Exercise tests
npm test:coverage                         # Full coverage
```

**Result:** 130+ tests passing, 71% coverage

## Example: Complete Learning Cycle

```
1. EXERCISE GENERATION
   You: @tutor /exercise [select array code]
   AI:  Found concepts: array iteration, indexing
        Exercise 1: Create loop summing all elements
        Exercise 2: Find maximum value in array

2. EXERCISE COMPLETION
   [You write your solution code]

3. EXERCISE REVIEW
   You: @tutor /review create loop that sums array elements
   AI:  ✅ What good is:
        - Correct loop structure
        - Good variable naming
        
        ❌ What's wrong:
        - Off-by-one error: loop starts at 1 instead of 0
        
        💡 How to improve:
        - Try: for(let i = 0; i < array.length; i++)
        - Test with console.log to verify sum
        
        📊 Confidence: 7/10

4. DEBUGGING WITH DUCK (if stuck)
   You: @tutor /duck my sum keeps being wrong
   AI:  What index should the first element have?
   You: Index 0...
   AI:  Good. What index does your loop start with?

5. REVIEW AGAIN
   You: @tutor /review [fixed code]
   AI:  ✅ Perfect! Now you have the correct logic
```

---

Status: Production ready. All 130+ tests passing. Zero errors.
