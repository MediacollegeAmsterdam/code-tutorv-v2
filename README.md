# Code Tutor V2

An AI-powered programming tutor for VS Code that helps students learn to code with progressive feedback, interactive exercises, and adaptive difficulty levels. Powered by GitHub Copilot.

## Features

🎓 **Multiple Programming Languages**
- Support for JavaScript, TypeScript, Python, Java, C#, C++, C, Go, Rust, PHP, and Ruby

📚 **Four Core Commands**
- **Explain** (`/explain`) - Get detailed explanations of code concepts with difficulty-appropriate language
- **Feedback** (`/feedback`) - Receive progressive feedback on your code using the Socratic method
- **Exercise** (`/exercise`) - Generate or list programming exercises tailored to your skill level
- **Level** (`/level`) - Adjust your difficulty level (1-4 based on your experience)

🤖 **AI-Powered Learning**
- Integrates seamlessly with GitHub Copilot's chat system
- Adaptive explanations based on your experience level
- Progressive feedback that guides learning without giving away answers

## Requirements

- **VS Code 1.109.0 or later**
- **GitHub Copilot** installed and activated in VS Code
- An active GitHub Copilot subscription

## How to Use

1. Open any code file in VS Code
2. Open the GitHub Copilot Chat panel
3. Interact with the Code Tutor:
   - Type `@tutor /explain` to get explanations
   - Type `@tutor /feedback` for code review feedback
   - Type `@tutor /exercise` to generate exercises
   - Type `@tutor /level 2` to change difficulty

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

## Known Issues

- Requires GitHub Copilot to be installed and activated
- Full functionality depends on Copilot API availability

## Release Notes

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
