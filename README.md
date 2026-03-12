# Code Tutor V2

An AI-powered programming tutor for VS Code that helps students learn to code with progressive feedback, interactive exercises, Socratic debugging, and adaptive difficulty levels. Powered by GitHub Copilot.

## Features

🎓 **Multiple Programming Languages**
- Support for JavaScript, TypeScript, Python, Java, C#, C++, C, Go, Rust, PHP, and Ruby

📚 **Six Core Commands**
- **Explain** (`/explain`) - Get detailed explanations of code concepts with difficulty-appropriate language
- **Feedback** (`/feedback`) - Receive progressive feedback on your code using the Socratic method
- **Exercise** (`/exercise`) - Generate exercises tailored to your skill level (optionally analyze your code for concepts)
- **Review** (`/review`) - Get structured feedback on completed exercises with targeted improvement tips
- **Duck** (`/duck`) - Rubber duck debugging using Socratic hints (questions not answers)
- **Level** (`/level`) - Adjust your difficulty level (1-4 based on your experience)

🤖 **AI-Powered Learning**
- Integrates seamlessly with GitHub Copilot's chat system
- Adaptive explanations based on your experience level
- Progressive feedback that guides learning without giving away answers
- Socratic method for true problem-solving skill development

🦆 **Rubber Duck Debugging**
- Ask for hints instead of direct answers
- Year-level adapted question difficulty
- Session tracking prevents hint repetition
- Auto-sessions end after 8 hints without progress

📋 **Targeted Learning**
- Generate exercises focused on specific code concepts
- Exercises automatically saved as markdown files for persistent reference
- Easy switching between exercise file and your code
- Get structured feedback comparing your solution to requirements
- Confidence scoring to assess understanding
- Complete learning cycle: Exercise → Complete → Review → Improve

## Requirements

- **VS Code 1.109.0 or later**
- **GitHub Copilot** installed and activated in VS Code
- An active GitHub Copilot subscription

## How to Use

### Basic Setup

1. Open any code file in VS Code
2. Open the GitHub Copilot Chat panel
3. Interact with Code Tutor using the commands below

### The Six Commands

**Getting Help:**
```
@tutor /explain [what you want explained]
```
Explains code concepts at your level (1-4).

**Getting Feedback:**
```
@tutor /feedback [describe your problem]
```
Progressive feedback using the Socratic method (hints → tips → examples).

**Generating Exercises:**
```
@tutor /exercise [select code first for targeted, or ask for a topic]
```
- Select code in editor for concept-targeted exercises
- Or ask for exercises on a specific topic
- Includes examples and code snippets
- **Automatically creates a markdown file** in the `exercises/` folder
- Open the exercise file to work alongside your code

**Rubber Duck Debugging:**
```
@tutor /duck [describe your problem]
```
Socratic debugging with guiding questions:
- Never gives direct answers
- Asks questions to guide your thinking
- Year-level adapted question difficulty
- Tracks hints to prevent repetition

**Exercise Review:**
```
@tutor /review [describe what exercise this was for]
```
Structured feedback on completed exercises:
- ✅ What you did well
- ❌ What needs fixing (specific issues)
- 💡 How to improve (without spoilers)
- 📊 Confidence score (1-10)

**Changing Difficulty:**
```
@tutor /level 2
```
Set difficulty 1-4 based on your year/experience.

### Complete Learning Cycle

1. Generate an exercise: `@tutor /exercise [topic or code]`
2. An exercise markdown file opens automatically in a side panel
3. Switch between the exercise file and your code to work on it
4. Complete the exercise in your code editor
5. Review your work: `@tutor /review [what exercise was this]`
6. If stuck: `@tutor /duck [describe your problem]`
7. Review again: `@tutor /review [your improved code]`

### Exercise Files

Each time you generate an exercise, Code Tutor automatically creates a markdown file:
- **Location:** `exercises/` folder in your workspace
- **Format:** `exercise_[topic]_[difficulty]_[date]_[time].md`
- **Display:** Opens in VS Code's markdown preview for beautiful, formatted view
- **Features:**
  - Complete exercise with learning goals and instructions
  - Code examples and hints
  - Quick access to get feedback (`/feedback`) or hints (`/duck`)
  - Easy switching between exercise preview and your code files

**Example:** Running `@tutor /exercise loops` creates:
```
exercises/exercise_loops_beginner_2026-03-12_13-28-45.md
```

And opens it in markdown preview so you can see the exercise clearly while coding!

### Difficulty Levels

- **Level 1**: Beginner (Year 1 CS student)
- **Level 2**: Early Intermediate (Year 2)
- **Level 3**: Advanced (Year 3)
- **Level 4**: Expert (Year 4+)

## Extension Settings

This extension contributes the following configuration through VS Code:

The extension stores your profile data locally including:
- Current difficulty level
- Learning history
- Progress tracking

No data is sent to external servers beyond what's required for GitHub Copilot integration.

## Architecture

The extension is built with:
- **TypeScript** - Fully type-safe implementation
- **VS Code Chat API** - Integration with GitHub Copilot
- **Modular Command System** - Each feature is a separate command implementing ICommand interface
- **Comprehensive Testing** - 130+ tests with 71% code coverage

## Testing

Run the test suite:
```bash
npm test                              # All tests
npm test -- --testNamePattern="Duck"  # Duck feature tests
npm test:coverage                     # Coverage report
```

**Current Status:** 130+ tests passing, 71% code coverage

## Externaly Required

- Requires GitHub Copilot to be installed and activated
- Full functionality depends on Copilot API availability

## Release Notes

### 0.0.2

New features released:
- **Rubber Duck Command** (`/duck`) - Socratic debugging with hints
- **Targeted Exercises** - `/exercise` now analyzes your code for concept-focused exercises
- **Exercise Review** (`/review`) - Structured feedback on completed exercises
- **Exercise Markdown Files** - Exercises automatically save as `.md` files in the `exercises/` folder for easy reference while coding
- Improved hint escalation system
- Extended test suite (130+ tests)

### 0.0.1

Initial release of Code Tutor V2 with:
- Explain command for code explanations
- Feedback command for Socratic method feedback
- Exercise command for generating learning exercises
- Level command for adjusting difficulty
- Support for 11 programming languages
- GitHub Copilot Chat integration

---

## For More Information

- [VS Code Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [VS Code Chat Extension API](https://code.visualstudio.com/api/extension-guides/chat)
- [Rubber Duck Guide](./RUBBER_DUCK.md) - Detailed feature documentation
