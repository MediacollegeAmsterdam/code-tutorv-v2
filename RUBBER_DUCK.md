# Rubber Duck & Targeted Exercises

AI-powered Socratic debugging and concept-targeted exercises.

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

### /exercise - Targeted Practice (NEW!)

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

## How They Work Together

1. Student has buggy code
2. Uses `/duck` to work through debugging (asks guiding questions)
3. After solving, uses `/exercise` with the same code to practice that concept
4. Generates targeted exercises for strengthening understanding

## Files

**Duck Feature:**

- `src/commands/DuckCommand.ts` - Socratic debugging
- `src/core/DuckContext.ts` - Session state (98.59% coverage)
- `src/core/duck-prompts.ts` - Socratic prompts

**Exercise Enhancement:**

- `src/commands/ExerciseCommand.ts` - Now with code analysis

**Tests:**

- `src/test/commands/DuckCommand.test.ts` - 40+ tests
- `src/test/core/DuckContext.test.ts` - 30+ tests

## Testing

```bash
npm test -- --testNamePattern="Duck"     # Duck tests
npm test -- --testNamePattern="Exercise" # Exercise tests
npm test:coverage                         # Full coverage
```

**Result:** 120+ tests passing, 70% coverage

## Examples

### Using /duck for debugging

```
You: @tutor /duck my loop isn't working
AI:  What does your loop do? What's the first element it should process?
You: The first element at index 0, should sum them...
AI:  Good, you noticed it should process from 0. How does your loop start?
```

### Using /exercise for targeted practice

```
You: @tutor /exercise [select loop code]
AI:  Found concepts: array iteration, loop conditions
     Here are exercises to practice:
     1. Iterate backward through array
     2. Filter array with condition
     3. Sum every other element
```

---

Status: Production ready. All tests passing. Zero errors.
