# code-tutor-v2

AI Chat Participant for VS Code - Help students learn to code.

## Quick Start

```bash
npm install
npm run compile
npm run watch
```

## Project Structure

```
src/
├── services/        # ChatParticipantProvider, MessageHandler, PromptBuilder
├── models/          # TypeScript interfaces (StudentContext, Message)
├── storage/         # ConversationStorage
├── accessibility/   # Accessibility handlers
├── utils/           # Helper utilities
├── __tests__/       # Unit and integration tests
└── extension.ts     # Extension entry point
```

## Development

- **Compile**: `npm run compile`
- **Watch**: `npm run watch`
- **Test**: `npm test`
- **Lint**: `npm run lint`

## Documentation

- **Constitution**: `.specify/memory/constitution.md`
- **Quick Reference**: `.specify/CONSTITUTION-QUICK-REF.md`
- **Feature Spec**: `specs/001-chat-participant/spec.md`
- **Implementation Plan**: `plan.md`
- **Tasks**: `tasks.md`
- **Setup**: `docs/GITHUB_COPILOT_SETUP.md`

## Architecture

code-tutor-v2 consists of 8 core components:

1. **ChatParticipantProvider** - Registers with VS Code chat
2. **MessageHandler** - Parses user input, detects concerns
3. **StudentContextManager** - Tracks learning level
4. **PromptBuilder** - Creates educational prompts
5. **CopilotClient** - Integrates with GitHub Copilot
6. **ResponseFormatter** - Formats responses (markdown, accessibility)
7. **AccessibilityHandler** - WCAG 2.1 AA compliance
8. **ConversationStorage** - Persists conversations locally

## License

See LICENSE file

