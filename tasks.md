# Implementation Tasks: code-tutor-v2 Chat Participant (Phase 1 MVP)

**Document**: Task Breakdown and Execution Plan  
**Feature**: Core AI Chat Participant for Educational Code Learning  
**Phase**: 1 (MVP - Core Functionality)  
**Status**: Ready for Implementation  
**Created**: 2026-02-24  
**Target Completion**: 2026-05-12 (10 weeks)

---

## Executive Summary

This document breaks down the Phase 1 MVP deliverables from `plan.md` and `spec.md` into 87 actionable, prioritized, dependency-ordered tasks for implementing the code-tutor-v2 chat participant extension. Each task is granular enough for a single developer to complete, includes clear acceptance criteria, effort estimates, dependencies, and implementation notes aligned with the project constitution.

**Key Principles**:
- Tasks are ordered by dependency (setup → foundation → features → testing → accessibility)
- Effort estimates (story points) account for complexity, risk, and testing
- Acceptance criteria are testable and measurable
- Dependencies are explicitly mapped
- Parallel opportunities are identified to enable concurrent work
- All tasks include educational and accessibility considerations

---

## Phase Overview

### Phase 1 Deliverables
1. **Functional MVP**: Students can ask questions, get AI-guided responses, debug code
2. **Accessibility**: Full WCAG 2.1 AA compliance (keyboard, screen reader, zoom, contrast)
3. **Educational Safeguards**: Homework detection, prompt injection prevention, guardrails
4. **Testing**: 80% code coverage, integration tests, accessibility validation
5. **Documentation**: API docs, user guides, contribution guidelines

### Task Grouping Strategy

Tasks are organized into 7 work packages (groups), executing sequentially but with parallelization opportunities:

1. **WP1 - Environment Setup** (W1, 1-2 weeks): Project initialization, dependencies, tooling
2. **WP2 - Core Components** (W1-3, 3-4 weeks): Chat provider, message handler, context manager
3. **WP3 - AI Integration** (W3-5, 3-4 weeks): AI service client, prompt builder, safety checks
4. **WP4 - Output & Accessibility** (W5-6, 2-3 weeks): Response formatter, accessibility handler
5. **WP5 - Testing Framework** (W2-7, Ongoing): Unit tests, integration tests, test setup
6. **WP6 - Accessibility Testing** (W7-8, 2 weeks): Manual testing, axe automation, compliance
7. **WP7 - Performance, Security & Polish** (W8-10, 3 weeks): Load testing, security audit, release prep

---

## Task Dependencies & Execution Map

```
WP1: Environment Setup (W1)
  └─ Enables all other work packages

WP2: Core Components (W1-3)
  ├─ ChatParticipantProvider (needs WP1)
  ├─ MessageHandler (needs WP1, then enables WP3)
  ├─ StudentContextManager (needs WP1, independent)
  └─ ConversationStorage (needs WP1, independent)

WP3: AI Integration (W3-5)
  ├─ AIServiceClient (needs WP2: ChatParticipantProvider)
  ├─ PromptBuilder (needs WP2: MessageHandler + StudentContextManager)
  └─ Guardrails & Safety (needs PromptBuilder)

WP4: Output & Accessibility (W5-6)
  ├─ ResponseFormatter (needs WP3)
  └─ AccessibilityHandler (needs WP3)

WP5: Testing (W2-7, Parallel)
  ├─ Test setup (needs WP1)
  ├─ Unit tests (per component, as they're built)
  └─ Integration tests (needs WP4)

WP6: Accessibility Compliance Testing (W7-8)
  ├─ Automated testing (needs WP5)
  └─ Manual testing (needs WP4)

WP7: Performance, Security, Release (W8-10)
  ├─ Load testing (needs WP5)
  ├─ Security audit (needs all components)
  └─ Release prep (needs WP6)
```

### Parallelization Opportunities

**Can work in parallel (separate branches, merged sequentially)**:
- W1: WP1 (single-threaded: environment)
- W1-2: WP2 tasks can split: MessageHandler (Dev A) + StudentContextManager (Dev B) + ConversationStorage (Dev C)
- W2-7: WP5 testing can happen in parallel with feature development
- W5-6: ResponseFormatter (Dev A) + AccessibilityHandler (Dev B) simultaneously
- W8-9: Performance testing (DevOps) + Security audit (Security) in parallel

**Cannot parallelize** (sequential dependencies):
- ChatParticipantProvider must complete before AIServiceClient
- MessageHandler must complete before PromptBuilder
- All components must complete before integration testing

---

## Work Package 1: Environment Setup (W1, 1-2 weeks)

### Overview
Set up the development environment, configure build tools, install dependencies, configure TypeScript and ESLint, set up test infrastructure.

### Tasks

- [x] **T001 [P]** Update package.json with MVP dependencies (openai, dotenv, markdown-it, jest, ts-jest, axe-core) in `package.json`
  - **Acceptance Criteria**:
    - All dependencies listed in plan.md are added with correct versions
    - `npm install` completes successfully with no errors
    - No breaking changes to existing dependencies
  - **Effort**: 2 SP (Story Points)
  - **Dependencies**: None (first task)
  - **Implementation Notes**:
    - Add production dependencies: openai^4.0.0, dotenv^16.0.0, markdown-it^13.0.0
    - Add dev dependencies: jest^29.0.0, ts-jest^29.0.0, @types/jest^29.0.0, axe-core^4.0.0
    - Document why each dependency is needed (educational transparency)
  - **Educational Consideration**: Document in comments why each library was chosen and its educational/safety role
  - **Accessibility**: N/A (build task)

- [x] **T002 [P]** Configure TypeScript strict mode in `tsconfig.json`
  - **Acceptance Criteria**:
    - `tsc --noEmit` passes with strict mode enabled
    - All strictness options enabled: `noImplicitAny`, `strict`, `strictNullChecks`, etc.
    - Zero type errors in existing code
  - **Effort**: 3 SP
  - **Dependencies**: T001
  - **Implementation Notes**:
    - Enable: strict, noImplicitAny, strictNullChecks, strictFunctionTypes, strictPropertyInitialization, noImplicitThis, alwaysStrict
    - Document in CONSTITUTION.md why strict mode matters for educational code
  - **Educational Consideration**: Strict mode enforces best practices; students learn correct patterns
  - **Accessibility**: Type safety ensures predictable error messages (better for all learners)

- [x] **T003 [P]** Configure ESLint rules in `eslint.config.mjs` with educational focus
  - **Acceptance Criteria**:
    - ESLint runs on all src/ files with zero warnings
    - Rules configured per eslint.config.mjs
    - Documentation of custom rules and their educational purpose
  - **Effort**: 3 SP
  - **Dependencies**: T001
  - **Implementation Notes**:
    - Add rules for: no-eval (security), no-console (production), no-nested-ternary (readability), prefer-const (best practice)
    - Document each rule's educational purpose in a comment
    - Ensure accessibility rules included (no color-only meaning, proper contrast, semantic HTML)
  - **Educational Consideration**: Rules enforce educational best practices; code review becomes teaching moment
  - **Accessibility**: Rules ensure accessible patterns (semantic HTML, ARIA, plain language)

- [x] **T004 [P]** Create Jest configuration in `jest.config.js`
  - **Acceptance Criteria**:
    - `jest --version` works
    - `npm test` runs all test suites successfully
    - Coverage reports generated in `coverage/` directory
    - TypeScript tests compile via ts-jest
  - **Effort**: 3 SP
  - **Dependencies**: T001, T002
  - **Implementation Notes**:
    - Create jest.config.js with: preset: 'ts-jest', testEnvironment: 'node', collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts']
    - Set coverageThreshold: { global: { branches: 80, functions: 80, lines: 80, statements: 80 } }
    - Configure testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts']
  - **Educational Consideration**: Tests demonstrate expected behavior; good teaching tool
  - **Accessibility**: Testing accessible code paths validates inclusion

- [x] **T005 [P]** Create project directory structure for MVP in `src/`
  - **Acceptance Criteria**:
    - All required directories created: src/chat/, src/accessibility/, src/storage/, src/models/, src/utils/, src/__tests__/
    - README.md in each directory explaining its purpose
    - Directory structure matches plan.md's "Appendix A: File Structure"
  - **Effort**: 2 SP
  - **Dependencies**: T001
  - **Implementation Notes**:
    - Create: src/chat/, src/accessibility/, src/storage/, src/models/, src/utils/, src/__tests__/
    - Create stub files for each component with JSDoc headers
    - Document directory purpose in each README.md
  - **Educational Consideration**: Clear structure helps learners understand architecture
  - **Accessibility**: Organized code is easier to navigate for all learning styles

- [x] **T006 [P]** Create .env.example template and document API key setup in `docs/SETUP.md`
  - **Acceptance Criteria**:
    - .env.example file created with OPENAI_API_KEY placeholder
    - docs/SETUP.md documents secure API key setup using VS Code SecretStorage
    - Instructions include warnings about not hardcoding keys
    - Example shows how to use vscode.ExtensionContext.secrets API
  - **Effort**: 2 SP
  - **Dependencies**: T001
  - **Implementation Notes**:
    - Create .env.example: OPENAI_API_KEY=sk-...
    - Add to .gitignore: .env (prevent accidental commits)
    - Document in SETUP.md that keys must use SecretStorage, not .env
    - Include screenshot of VS Code settings flow for key management
  - **Educational Consideration**: Teaches secure credential handling (important life skill)
  - **Accessibility**: Document should be screen-reader friendly, high contrast

- [x] **T007 [P]** Set up GitHub Actions CI/CD pipeline in `.github/workflows/ci.yml`
  - **Acceptance Criteria**:
    - CI pipeline runs on every PR: lint, type-check, test, coverage
    - All checks must pass before merge
    - Coverage reports uploaded (Codecov or similar)
    - ESLint and TypeScript checks fail PR if violations found
  - **Effort**: 3 SP
  - **Dependencies**: T002, T003, T004
  - **Implementation Notes**:
    - Create .github/workflows/ci.yml with: checkout, node setup, npm install, lint, check-types, test, coverage upload
    - Set required checks: lint, check-types, test coverage > 80%
    - Document in CONTRIBUTING.md what CI checks locally before committing
  - **Educational Consideration**: CI enforces educational standards consistently
  - **Accessibility**: Automated checks catch accessibility issues early

- [x] **T008 [P]** Create CONTRIBUTING.md with developer guidelines and code standards
  - **Acceptance Criteria**:
    - Document explains: code style, testing requirements (80% coverage), accessibility standards, constitutional alignment
    - Examples of good/bad code patterns provided
    - Step-by-step guide to set up dev environment locally
    - Guidelines for commit messages, PR descriptions
  - **Effort**: 3 SP
  - **Dependencies**: T003, T004
  - **Implementation Notes**:
    - Include: setup steps, testing before commit, coverage requirements, accessibility checklist, educational principles
    - Provide example: how to write a test, how to check accessibility, how to verify guardrails
    - Section on "Why we do this" (constitution alignment)
  - **Educational Consideration**: Contributors learn by example; code review becomes mentoring
  - **Accessibility**: Contributing guidelines should model accessible writing

**WP1 Summary**:
- **Total Effort**: 21 SP (roughly 5-6 days for 1 person, or 1 week for 1 FTE with other overhead)
- **Dependencies**: None (WP1 is blocking all others)
- **Parallel Opportunities**: T001-T007 can be split among 2-3 developers (they're independent)
- **Risk**: Low (standard setup tasks)
- **Key Deliverable**: Dev environment ready; first test passes; CI pipeline running

---

## Work Package 2: Core Components (W1-3, 3-4 weeks)

### Overview
Build the foundational components: ChatParticipantProvider (entry point), MessageHandler (parsing), StudentContextManager (context), ConversationStorage (persistence). These are the backbone of the extension.

### Tasks

#### ChatParticipantProvider Component

- [x] **T009 [P] [Core]** Implement ChatParticipantProvider class skeleton in `src/chat/chatParticipantProvider.ts`
  - **Acceptance Criteria**:
    - Class created with constructor, activate() method, and handleChat() method stubs
    - activate() registers @code-tutor chat participant with VS Code API
    - handleChat() signature matches ChatRequest → ChatResult
    - Extension loads without errors; `@code-tutor` appears in chat participant dropdown
    - JSDoc comments document each method's purpose
  - **Effort**: 5 SP
  - **Dependencies**: T005 (directory structure)
  - **Implementation Notes**:
    - Skeleton methods: activate(), handleChat(), private handleError()
    - Register participant: vscode.chat.createChatParticipant('code-tutor', this.handleChat.bind(this))
    - Add iconPath and description for chat UI
    - Plan: handleChat will orchestrate all downstream components (message parsing → context → prompt → AI → format)
  - **Educational Consideration**: Document the educational flow in comments (explain → guide → check understanding)
  - **Accessibility**: Handle errors gracefully; provide clear error messages for all users

- [x] **T010 [P] [Core]** Implement ChatParticipantProvider.activate() method in `src/chat/chatParticipantProvider.ts`
  - **Acceptance Criteria**:
    - activate() successfully registers @code-tutor participant
    - Participant appears in VS Code chat UI
    - activate() completes in < 500ms (NFR-001)
    - Error handling: if registration fails, clear error message shown
    - Extension can be activated multiple times without duplication
  - **Effort**: 3 SP
  - **Dependencies**: T009
  - **Implementation Notes**:
    - Use vscode.chat.createChatParticipant() with name 'code-tutor'
    - Set icon, description, tooltip
    - Handle failure case: throw descriptive error if registration fails
    - Test: manually activate extension, verify @code-tutor in chat menu
  - **Educational Consideration**: Transparent initialization; logging shows educational flow
  - **Accessibility**: Participant is keyboard-accessible via chat UI

- [x] **T011 [P] [Core]** Implement ChatParticipantProvider.handleChat() orchestration logic in `src/chat/chatParticipantProvider.ts`
  - **Acceptance Criteria**:
    - handleChat() orchestrates full flow: parse → enrich context → build prompt → validate safety → call AI → format → stream → persist
    - Each step has try/catch error handling
    - Errors are caught and formatted for display (no stack traces to user)
    - Response streams progressively to VS Code chat UI
    - Conversation is persisted after successful response
    - Completes within NFR-002 (< 1s for message processing, < 2s for response start)
  - **Effort**: 8 SP
  - **Dependencies**: T009, T012 (MessageHandler), T016 (StudentContextManager), T020 (PromptBuilder), T024 (AIServiceClient), T030 (ResponseFormatter)
  - **Implementation Notes**:
    - Orchestration pattern: parse message → get context → build prompt → check safety → call AI → format response → stream to UI → persist
    - Handle cancellationToken: if user cancels, stop and clean up gracefully
    - Log each step (DEBUG level) for troubleshooting
    - Test with mock responses; verify streaming works
  - **Educational Consideration**: Clear orchestration shows how all pieces fit together
  - **Accessibility**: Error messages are plain text; progressive streaming keeps screen readers updated

- [x] **T012 [P] [Core]** Implement MessageHandler.parseMessage() in `src/chat/messageHandler.ts`
  - **Acceptance Criteria**:
    - parseMessage(prompt: string) returns ParsedMessage with all fields populated
    - Code blocks extracted (backtick-delimited markdown)
    - Question type detected: concept, debugging, code-explanation, general
    - Homework request flags detected (isHomeworkRequest)
    - Unethical request flags detected (isUnethicalRequest)
    - Language detection from code blocks
    - All test cases pass: no code, single code block, multiple blocks, malformed markdown
  - **Effort**: 5 SP
  - **Dependencies**: T005
  - **Implementation Notes**:
    - extractCodeBlocks(): regex /```(\w+)?\n([\s\S]*?)\n```/g
    - detectQuestionType(): keywords like "debug", "fix", "explain", "why", "how"
    - detectProblematicRequests(): regex patterns for homework ("do my assignment", "solve this") and unethical ("hack", "cheat")
    - detectLanguage(): extract from code block or context clues
    - Edge cases: nested backticks, missing closing backticks, language with number (js3 → js)
  - **Educational Consideration**: Message parsing is first step toward understanding; document patterns for learners
  - **Accessibility**: Structured output (not free text) is more accessible to tools

- [x] **T013 [P] [Core]** Implement MessageHandler unit tests in `src/__tests__/messageHandler.test.ts`
  - **Acceptance Criteria**:
    - 100% line coverage of MessageHandler
    - Test cases for: code extraction, question detection, homework detection, unethical detection, language detection
    - Edge cases tested: empty input, no code blocks, multiple languages, malformed markdown, injection attempts
    - All tests pass; no failing assertions
  - **Effort**: 4 SP
  - **Dependencies**: T004 (Jest), T012 (MessageHandler)
  - **Implementation Notes**:
    - Test each method independently: parseMessage, extractCodeBlocks, detectQuestionType, etc.
    - Test data includes: valid code, malformed code, homework requests, unethical requests, edge cases
    - Use snapshots for complex outputs
    - Mock any external dependencies
  - **Educational Consideration**: Tests show how parser works; good learning tool
  - **Accessibility**: Test coverage ensures message parsing works for all users

- [x] **T014 [P] [Core]** Implement StudentContextManager class skeleton in `src/chat/studentContextManager.ts`
  - **Acceptance Criteria**:
    - Class created with all required methods: getContext(), updateLearningLevel(), addMessage(), getRecentHistory(), clearHistory()
    - Constructor accepts vscode.ExtensionContext and ConversationStorage
    - All methods have JSDoc documentation
    - TypeScript compiles without errors
  - **Effort**: 3 SP
  - **Dependencies**: T005, T015 (ConversationStorage)
  - **Implementation Notes**:
    - Define interfaces: StudentContext, ConversationMessage, Preferences
    - Skeleton implementation (stubs that compile)
    - Document expected behavior in comments
  - **Educational Consideration**: Context manager centralizes student state; document for transparency
  - **Accessibility**: Preferences centralized makes customization accessible

- [x] **T015 [P] [Core]** Implement ConversationStorage class in `src/storage/conversationStorage.ts`
  - **Acceptance Criteria**:
    - saveConversation(sessionId, messages) persists to local filesystem (globalStoragePath)
    - loadConversation(sessionId) retrieves saved conversation
    - cleanup() removes conversations older than 30 days
    - Paths are created recursively (no errors if dir exists)
    - All async operations complete successfully
    - Privacy verified: no cloud storage, no data collection
  - **Effort**: 4 SP
  - **Dependencies**: T005
  - **Implementation Notes**:
    - Use vscode.ExtensionContext.globalStoragePath for storage location
    - Save as JSON files: globalStoragePath/conversations/{sessionId}.json
    - Handle errors gracefully: if directory doesn't exist, create it
    - cleanup() runs on extension activation
    - Document privacy guarantees in comments
  - **Educational Consideration**: Transparent local-only storage; document for student trust
  - **Accessibility**: Students can review their own conversations (downloadable, portable)

- [x] **T016 [P] [Core]** Implement ConversationStorage unit tests in `src/__tests__/conversationStorage.test.ts`
  - **Acceptance Criteria**:
    - 100% line coverage
    - Test saveConversation, loadConversation, cleanup()
    - Tests verify files created in correct location
    - Tests verify old files are deleted
    - Mock filesystem not required; use real temp files
  - **Effort**: 3 SP
  - **Dependencies**: T004 (Jest), T015 (ConversationStorage)
  - **Implementation Notes**:
    - Use temp directory for test files
    - Test data: sample conversations with multiple messages
    - Verify file format (JSON), parseable, correct content
  - **Educational Consideration**: Tests demonstrate persistence behavior
  - **Accessibility**: Verified storage ensures data is recoverable

- [x] **T017 [P] [Core]** Implement StudentContextManager.getContext() and initialization in `src/chat/studentContextManager.ts`
  - **Acceptance Criteria**:
    - getContext() returns StudentContext with all fields initialized
    - If context exists in storage, load it; otherwise create new
    - New context has: learningLevel (from settings or default 'beginner'), empty conversationHistory, defaultPreferences, unique sessionId
    - getContext() called multiple times returns same instance (caching)
    - Completes in < 100ms
  - **Effort**: 4 SP
  - **Dependencies**: T014 (StudentContextManager skeleton), T015 (ConversationStorage)
  - **Implementation Notes**:
    - Load from vscode.ExtensionContext.globalState.get('studentContext')
    - If not found, create new with: learningLevel from settings (or default 'beginner'), empty conversationHistory, default preferences
    - Generate unique sessionId: `session-${Date.now()}-${random}`
    - Cache in private this.context field; return cached instance on subsequent calls
  - **Educational Consideration**: Context persists across sessions; students see their own progress
  - **Accessibility**: Learning level preference is stored; customization is accessible

- [x] **T018 [P] [Core]** Implement StudentContextManager.addMessage() in `src/chat/studentContextManager.ts`
  - **Acceptance Criteria**:
    - addMessage(message: ConversationMessage) adds to conversationHistory
    - Limit history to last 50 messages (prevent unbounded memory growth)
    - Message includes: role ('user' or 'assistant'), content, timestamp, optional metadata
    - Context is saved to storage after each message
    - Completes in < 50ms
  - **Effort**: 2 SP
  - **Dependencies**: T017 (getContext)
  - **Implementation Notes**:
    - Push message to context.conversationHistory
    - If length > 50, slice to remove oldest: .slice(-50)
    - Update context.lastUpdatedAt = Date.now()
    - Call saveContext() to persist
  - **Educational Consideration**: Message history shows learning progress; transparent for students
  - **Accessibility**: History can be exported/reviewed by students

- [x] **T019 [P] [Core]** Implement StudentContextManager unit tests in `src/__tests__/studentContextManager.test.ts`
  - **Acceptance Criteria**:
    - 100% line coverage
    - Test getContext (new and cached), addMessage, updateLearningLevel, getRecentHistory, clearHistory
    - Test persistence: context persists across getContext() calls
    - Test history limit: adding 60 messages results in only last 50 kept
    - All tests pass
  - **Effort**: 4 SP
  - **Dependencies**: T004 (Jest), T017-T018 (StudentContextManager methods)
  - **Implementation Notes**:
    - Mock vscode.ExtensionContext
    - Mock ConversationStorage
    - Test scenarios: new context, loaded context, history limits, message metadata
  - **Educational Consideration**: Tests verify transparent behavior
  - **Accessibility**: Test coverage ensures context works for all users

- [x] **T020 [P] [Core]** Implement StudentContextManager.updateLearningLevel() in `src/chat/studentContextManager.ts`
  - **Acceptance Criteria**:
    - updateLearningLevel(level: 'beginner' | 'intermediate' | 'advanced') updates context
    - New level is saved to storage
    - Subsequent getContext() calls return updated level
    - lastUpdatedAt timestamp is updated
  - **Effort**: 1 SP
  - **Dependencies**: T017 (getContext)
  - **Implementation Notes**:
    - Update context.learningLevel
    - Update context.lastUpdatedAt
    - Call saveContext()
  - **Educational Consideration**: Learning level is self-assessed; students understand scaffolding
  - **Accessibility**: Students can change their level at any time

- [x] **T021 [P] [Core]** Implement StudentContextManager.getRecentHistory() in `src/chat/studentContextManager.ts`
  - **Acceptance Criteria**:
    - getRecentHistory(limit?: number) returns last N messages from history
    - Default limit is 10
    - Returns empty array if no history
    - Messages returned in chronological order (oldest first)
  - **Effort**: 1 SP
  - **Dependencies**: T017 (getContext)
  - **Implementation Notes**:
    - Return context.conversationHistory.slice(-limit) for last N messages
    - Handle edge case: limit > history.length (just return all)
  - **Educational Consideration**: Recent history keeps AI prompt focused; efficient context
  - **Accessibility**: Limited history prevents overwhelming screen reader output

**WP2 Summary**:
- **Total Effort**: 51 SP (roughly 2-3 weeks for 1-2 developers)
- **Dependencies**: WP1 (all tasks depend on T005 for directory structure)
- **Parallel Opportunities**:
  - T012-T013 (MessageHandler) can be done by Dev A
  - T014-T021 (StudentContextManager) can be done by Dev B
  - T015-T016 (ConversationStorage) can be done by Dev C
  - All three can work in parallel (no inter-component dependencies yet)
- **Risk**: Low (foundational components, well-specified)
- **Key Deliverable**: Core components can parse messages, maintain context, persist conversations

---

## Work Package 3: AI Integration (W3-5, 3-4 weeks)

### Overview
Implement AI integration: AIServiceClient (OpenAI API calls), PromptBuilder (prompt engineering with guardrails), safety validation, rate limiting. This is the "brain" of the extension.

### Tasks

#### AIServiceClient Component

- [x] **T022 [P] [Core]** Implement AIServiceClient class skeleton in `src/chat/aiServiceClient.ts`
  - **Acceptance Criteria**:
    - Class created with: constructor, sendMessage(), getApiKey(), getErrorMessage() methods
    - OpenAI client initialized in constructor
    - All methods have JSDoc documentation
    - TypeScript compiles
    - Error classes defined: AIServiceError
  - **Effort**: 3 SP
  - **Dependencies**: T005 (directory structure), T001 (openai dependency installed)
  - **Implementation Notes**:
    - Import OpenAI from 'openai'
    - Constructor: initialize OpenAI client with API key from SecretStorage
    - Define AIServiceError class extending Error with code property
    - Plan: sendMessage will handle streaming, rate limiting, error handling
  - **Educational Consideration**: Document how AI integration works transparently
  - **Accessibility**: Error handling ensures clear messages for all users

- [x] **T023 [P] [Core]** Implement AIServiceClient.sendMessage() in `src/chat/aiServiceClient.ts`
  - **Acceptance Criteria**:
    - sendMessage(prompt: string, cancellationToken: CancellationToken) sends to OpenAI API
    - Handles streaming response (stream: true)
    - Returns full response text when complete
    - Respects cancellationToken (stops if user cancels)
    - Error handling: catches OpenAI errors, converts to AIServiceError with code (RATE_LIMIT, API_ERROR, NETWORK_ERROR)
    - Rate limiting enforced: throws error if limit reached
    - Completes within NFR-003 (< 2s to start streaming)
  - **Effort**: 6 SP
  - **Dependencies**: T022 (AIServiceClient skeleton), T026 (RateLimiter)
  - **Implementation Notes**:
    - Create chat.completions.create() call with: model: 'gpt-4', temperature: 0.7, max_tokens: 2000, stream: true
    - Handle streaming: iterate through response chunks, collect content
    - Check cancellationToken.isCancellationRequested in loop
    - Rate limiter check: if !rateLimiter.isAllowed(), throw AIServiceError('RATE_LIMIT')
    - Error handling: catch OpenAI.APIError, convert to AIServiceError with appropriate code
    - Test with mock OpenAI response
  - **Educational Consideration**: Transparent streaming shows "thinking in progress"
  - **Accessibility**: Streaming allows progressive announcement to screen readers

- [x] **T024 [P] [Core]** Implement AIServiceClient rate limiting (RateLimiter class) in `src/chat/aiServiceClient.ts`
  - **Acceptance Criteria**:
    - RateLimiter class implements sliding window: max N requests per time window (e.g., 10 per 60s)
    - isAllowed() returns true if within limit, false if exceeded
    - recordRequest() increments request count
    - Window slides: old requests outside window are forgotten
    - Completes in < 1ms
  - **Effort**: 3 SP
  - **Dependencies**: T022 (AIServiceClient skeleton)
  - **Implementation Notes**:
    - Sliding window: track timestamps of recent requests
    - isAllowed(): filter out old requests (now - timestamp > windowMs), check length < maxRequests
    - recordRequest(): push Date.now() to array
    - Default: 10 requests per 60 seconds
    - Test: send 11 requests, verify 11th is rejected
  - **Educational Consideration**: Rate limiting teaches responsible API usage
  - **Accessibility**: Fair rate limiting ensures all students get responses

- [x] **T025 [P] [Core]** Implement AIServiceClient.getApiKey() in `src/chat/aiServiceClient.ts`
  - **Acceptance Criteria**:
    - getApiKey() retrieves API key from vscode.ExtensionContext.secrets
    - If key is missing, throws clear error message
    - Error message guides user to set up key via settings
    - Key is never logged or exposed
  - **Effort**: 2 SP
  - **Dependencies**: T022 (AIServiceClient skeleton), T006 (SETUP documentation)
  - **Implementation Notes**:
    - Use context.secrets.get('openai-api-key')
    - If not found, throw Error with message: "OpenAI API key not configured. Please set code-tutor.openaiApiKey in settings."
    - No logging of key value
    - Document secure setup in SETUP.md
  - **Educational Consideration**: Teaches secure credential handling
  - **Accessibility**: Clear error messages help all users troubleshoot

- [x] **T026 [P] [Core]** Implement AIServiceClient unit tests in `src/__tests__/aiServiceClient.test.ts`
  - **Acceptance Criteria**:
    - 100% line coverage
    - Test sendMessage with mock OpenAI response
    - Test rate limiting (allow/reject)
    - Test error handling (rate limit, API error, network error)
    - Test cancellation token
    - All tests pass
  - **Effort**: 5 SP
  - **Dependencies**: T004 (Jest), T023-T025 (AIServiceClient methods)
  - **Implementation Notes**:
    - Mock OpenAI client with jest.mock()
    - Test successful response, streaming, error cases
    - Test rate limiter: create limiter, make 10 requests (pass), 11th request (fail)
    - Test error conversion: OpenAI 429 → AIServiceError RATE_LIMIT, 401 → API_ERROR, network error → NETWORK_ERROR
  - **Educational Consideration**: Tests show API integration patterns
  - **Accessibility**: Test coverage ensures reliable AI calls

#### PromptBuilder Component

- [x] **T027 [P] [Core]** Implement PromptBuilder class skeleton in `src/chat/promptBuilder.ts`
  - **Acceptance Criteria**:
    - Class created with: constructor, buildPrompt(), validateSafety(), sanitizeInput()
    - System prompt defined and documented (constitution-aligned)
    - All methods have JSDoc
    - TypeScript compiles
  - **Effort**: 3 SP
  - **Dependencies**: T005 (directory structure)
  - **Implementation Notes**:
    - System prompt: explains educational mission, core principles (guide not solve), rules (no homework, no unethical), accessibility, transparency
    - Include in system prompt: "You are code-tutor, an AI teaching assistant for students learning to code."
    - Document why each principle is included (educational excellence)
  - **Educational Consideration**: System prompt is the "constitution" of AI behavior; document carefully
  - **Accessibility**: System prompt directs AI to use accessible language

- [x] **T028 [P] [Core]** Implement PromptBuilder.buildSystemPrompt() in `src/chat/promptBuilder.ts`
  - **Acceptance Criteria**:
    - buildSystemPrompt() returns complete system prompt
    - Prompt includes: mission, core principles (guide/explain/admit uncertainty), rules (no homework/unethical), accessibility guidance, transparency
    - Prompt is clear, well-structured, and documented
    - Each principle includes rationale
  - **Effort**: 4 SP
  - **Dependencies**: T027 (PromptBuilder skeleton)
  - **Implementation Notes**:
    - Structure: mission statement → core principles (5 bullets) → rules (5 bullets) → accessibility → transparency
    - Include examples: "Decline: 'I can't solve this for you, but I can help you understand the concept.'"
    - Document educational reasoning for each principle
    - Keep prompt concise (< 1000 tokens) to preserve token budget
  - **Educational Consideration**: System prompt embodies educational philosophy; this is key
  - **Accessibility**: Prompt directs AI to use plain language, clear structure

- [x] **T029 [P] [Core]** Implement PromptBuilder.buildPrompt() in `src/chat/promptBuilder.ts`
  - **Acceptance Criteria**:
    - buildPrompt(parsedMessage, chatHistory, studentContext) returns complete prompt
    - Prompt includes: system prompt + level instruction + conversation history + code context + student message
    - Prompt is sanitized (input validation)
    - Conversation history limited to last 10 messages (token efficiency)
    - Code blocks properly formatted in prompt
    - Total prompt length < 4000 tokens (OpenAI budget)
  - **Effort**: 5 SP
  - **Dependencies**: T028 (buildSystemPrompt), T012 (MessageHandler/ParsedMessage), T017 (StudentContextManager/StudentContext)
  - **Implementation Notes**:
    - Combine: systemPrompt + levelInstruction + historyContext + codeContext + sanitizedMessage
    - Level instruction: "The student is a beginner/intermediate/advanced. [adapt accordingly]"
    - History context: "Recent conversation:\nStudent: ...\nTutor: ...\n" for last 10 messages
    - Code context: format code blocks with language identifiers
    - Sanitize input: call sanitizeInput(parsedMessage.text)
    - Handle edge cases: no history, no code, very long messages
  - **Educational Consideration**: Prompt structure shows how context is preserved across conversation
  - **Accessibility**: Structured prompt ensures AI output is organized

- [x] **T030 [P] [Core]** Implement PromptBuilder.sanitizeInput() in `src/chat/promptBuilder.ts`
  - **Acceptance Criteria**:
    - sanitizeInput(text) removes control characters, escapes special characters, truncates long inputs
    - Prevents prompt injection attacks (detects "Ignore previous instructions", "You are now", etc.)
    - Removes: \x00-\x1F, \x7F (control characters)
    - Escapes: \, * (markdown special chars)
    - Truncates: messages > 5000 chars → 5000 chars + "[message truncated for length]"
    - Returns sanitized string safe for AI input
  - **Effort**: 3 SP
  - **Dependencies**: T027 (PromptBuilder skeleton)
  - **Implementation Notes**:
    - Remove control chars: text.replace(/[\x00-\x1F\x7F]/g, '')
    - Escape markdown: .replace(/\\/g, '\\\\').replace(/\*/g, '\\*')
    - Truncate: if length > 5000, substring(0, 5000) + '\n[message truncated for length]'
    - Test: various inputs (normal, injection attempts, very long, special chars)
  - **Educational Consideration**: Teaches input validation and security
  - **Accessibility**: Sanitization prevents malformed prompt output

- [x] **T031 [P] [Core]** Implement PromptBuilder.validateSafety() in `src/chat/promptBuilder.ts`
  - **Acceptance Criteria**:
    - validateSafety(prompt, parsedMessage) returns SafetyCheckResult { isAllowed, message }
    - Checks: isHomeworkRequest, isUnethicalRequest, prompt injection
    - If homework detected: return { isAllowed: false, message: "I can't solve this for you, but I can help you understand..." }
    - If unethical detected: return { isAllowed: false, message: "I can't help with that. I'm designed to teach ethical programming..." }
    - If injection detected: return { isAllowed: false, message: "I detected an unusual request format. Can you rephrase?" }
    - Else: return { isAllowed: true, message: '' }
  - **Effort**: 3 SP
  - **Dependencies**: T030 (sanitizeInput), T012 (ParsedMessage with flags)
  - **Implementation Notes**:
    - Check parsedMessage.isHomeworkRequest (from MessageHandler)
    - Check parsedMessage.isUnethicalRequest (from MessageHandler)
    - Detect injection: regex patterns in prompt (ignore previous, you are now, system prompt, etc.)
    - Return SafetyCheckResult with clear messages
    - Test: homework request, unethical request, injection attempts, normal requests
  - **Educational Consideration**: Safety checks enforce educational principles
  - **Accessibility**: Clear decline messages explain why request is declined

- [x] **T032 [P] [Core]** Implement PromptBuilder.buildLevelInstruction() in `src/chat/promptBuilder.ts`
  - **Acceptance Criteria**:
    - buildLevelInstruction(level) returns instruction for AI based on learning level
    - Beginner: "Use simple language, avoid jargon, include lots of examples, explain foundational assumptions"
    - Intermediate: "Use technical language, focus on best practices, trade-offs, design patterns"
    - Advanced: "Discuss architecture, performance, research papers, edge cases"
    - Instructions are clear and guide AI behavior
  - **Effort**: 2 SP
  - **Dependencies**: T028 (buildSystemPrompt)
  - **Implementation Notes**:
    - Switch on level: 'beginner' | 'intermediate' | 'advanced'
    - Return instruction string for each level
    - Example: "The student is a beginner. Use simple language, avoid jargon, include lots of examples..."
  - **Educational Consideration**: Scaffolding per learning level; personalized instruction
  - **Accessibility**: Beginner instructions include more explanation (helpful for all)

- [x] **T033 [P] [Core]** Implement PromptBuilder.buildHistoryContext() in `src/chat/promptBuilder.ts`
  - **Acceptance Criteria**:
    - buildHistoryContext(conversationHistory) returns formatted context string
    - Includes last 10 messages in format: "Student: ...\nTutor: ...\n"
    - Handles empty history (returns '')
    - Properly formatted markdown with clear speaker labels
  - **Effort**: 2 SP
  - **Dependencies**: T028 (buildSystemPrompt), T017 (StudentContextManager for history)
  - **Implementation Notes**:
    - Take last 10 messages: conversationHistory.slice(-10)
    - Format as: "Recent conversation:\nStudent: message\nTutor: response\n..."
    - If no history, return ''
    - Preserve message content exactly (already sanitized from earlier)
  - **Educational Consideration**: Conversation context shows learning progression
  - **Accessibility**: Clear speaker labels help screen readers

- [x] **T034 [P] [Core]** Implement PromptBuilder.buildCodeContext() in `src/chat/promptBuilder.ts`
  - **Acceptance Criteria**:
    - buildCodeContext(codeBlocks) formats code blocks for AI input
    - Each block formatted as: \`\`\`language\ncode\n\`\`\`
    - Language identifier included (default 'unknown' if not specified)
    - Returns string ready for inclusion in prompt
  - **Effort**: 1 SP
  - **Dependencies**: T028 (buildSystemPrompt), T012 (MessageHandler/CodeBlock)
  - **Implementation Notes**:
    - Iterate through codeBlocks
    - Format: "```${language}\n${code}\n```"
    - If no language, use 'unknown'
    - Return combined context string
  - **Educational Consideration**: Code context is preserved for accuracy
  - **Accessibility**: Language identifier helps AI provide appropriate help

- [x] **T035 [P] [Core]** Implement PromptBuilder unit tests in `src/__tests__/promptBuilder.test.ts`
  - **Acceptance Criteria**:
    - 100% line coverage
    - Test buildPrompt, sanitizeInput, validateSafety, buildLevelInstruction, buildHistoryContext, buildCodeContext
    - Test safety validation: homework request, unethical request, normal request, injection attempt
    - Test prompt building with various contexts
    - All tests pass
  - **Effort**: 6 SP
  - **Dependencies**: T004 (Jest), T027-T034 (PromptBuilder methods)
  - **Implementation Notes**:
    - Test sanitizeInput: normal input, control chars, long input, special chars
    - Test validateSafety: homework requests (do assignment, solve problem), unethical requests (hack, cheat), injection patterns, normal requests
    - Test buildLevelInstruction: each level returns appropriate instruction
    - Test buildHistoryContext: empty history, 10 messages, > 10 messages
    - Test buildCodeContext: single block, multiple blocks, missing language
  - **Educational Consideration**: Tests demonstrate prompt building logic
  - **Accessibility**: Test coverage ensures prompt building works for all cases

**WP3 Summary**:
- **Total Effort**: 46 SP (roughly 2-2.5 weeks for 1-2 developers)
- **Dependencies**: WP1 (T001 for dependencies), WP2 (T012 for MessageHandler, T017 for StudentContextManager)
- **Parallel Opportunities**:
  - T022-T026 (AIServiceClient) can be done by Dev A (weeks 3-4)
  - T027-T035 (PromptBuilder) can be done by Dev B (weeks 3-4)
  - Both can work in parallel; only integrate in week 5
- **Risk**: Medium (AI integration is critical; prompt injection is security risk)
- **Key Deliverable**: AI can be called securely; prompts are well-engineered; safety checks work

---

## Work Package 4: Output Formatting & Accessibility (W5-6, 2-3 weeks)

### Overview
Implement response formatting (ResponseFormatter) and accessibility validation (AccessibilityHandler). These ensure AI responses are readable, formatted properly, and WCAG compliant.

### Tasks

#### ResponseFormatter Component

- [x] **T036 [P] [Core]** Implement ResponseFormatter class skeleton in `src/chat/ResponseFormatter.ts`
  - **Acceptance Criteria**:
    - Class created with: formatResponse(), fixMarkdownIssues(), fixCodeBlocks(), addCodeBlockLabels(), normalizeHeadings(), validateAccessibility()
    - All methods have JSDoc
    - TypeScript compiles
  - **Effort**: 2 SP
  - **Dependencies**: T005 (directory structure)
  - **Implementation Notes**:
    - Plan: formatResponse orchestrates all formatting steps
    - Validate on each step (catch formatting issues early)
  - **Educational Consideration**: Response formatting affects learning (clarity matters)
  - **Accessibility**: Formatting is foundation of accessible output

- [x] **T037 [P] [Core]** Implement ResponseFormatter.formatResponse() in `src/chat/ResponseFormatter.ts`
  - **Acceptance Criteria**:
    - formatResponse(aiResponse) orchestrates all formatting steps
    - Returns well-formatted markdown ready for VS Code chat UI
    - Steps: fixMarkdownIssues → fixCodeBlocks → addCodeBlockLabels → normalizeHeadings → validateAccessibility
    - Output is validated before returning
    - No crashes on edge cases (malformed markdown, missing closing backticks, etc.)
  - **Effort**: 3 SP
  - **Dependencies**: T036 (ResponseFormatter skeleton)
  - **Implementation Notes**:
    - Orchestration pattern: fix markdown → fix code blocks → add labels → normalize headings → validate
    - Each step returns modified string
    - Final validation catches any remaining issues
    - Test: various markdown formats, edge cases
  - **Educational Consideration**: Formatting ensures clarity for learning
  - **Accessibility**: Validation catches accessibility issues early

- [x] **T038 [P] [Core]** Implement ResponseFormatter.fixMarkdownIssues() in `src/chat/ResponseFormatter.ts`
  - **Acceptance Criteria**:
    - Fixes common markdown formatting issues
    - Adds spaces after headers: `##Text` → `## Text`
    - Fixes list formatting: `-Text` → `- Text`
    - Returns corrected markdown
  - **Effort**: 2 SP
  - **Dependencies**: T036 (ResponseFormatter skeleton)
  - **Implementation Notes**:
    - Fix headers: /(#{1,6})([^ ])/gm → '$1 $2'
    - Fix lists: /^([-*+])([^ ])/gm → '$1 $2'
    - Test: inputs with and without issues
  - **Educational Consideration**: Proper formatting aids readability
  - **Accessibility**: Correct markdown structure is required for screen readers

- [x] **T039 [P] [Core]** Implement ResponseFormatter.fixCodeBlocks() in `src/chat/ResponseFormatter.ts`
  - **Acceptance Criteria**:
    - Ensures code blocks are properly formatted: \`\`\`language\ncode\n\`\`\`
    - Handles missing language identifier (default to 'plaintext')
    - Trims unnecessary whitespace in code
    - Handles nested backticks gracefully
    - Returns formatted markdown
  - **Effort**: 3 SP
  - **Dependencies**: T036 (ResponseFormatter skeleton)
  - **Implementation Notes**:
    - Regex: /```(\w+)?\n([\s\S]*?)```/g
    - Ensure language specified; if not, add 'plaintext'
    - Trim code: code.trim()
    - Handle edge case: code with backticks (escape or warn)
    - Test: various code block formats
  - **Educational Consideration**: Proper code formatting is crucial for understanding
  - **Accessibility**: Language identifier helps AI explain code appropriately

- [x] **T040 [P] [Core]** Implement ResponseFormatter.addCodeBlockLabels() in `src/chat/ResponseFormatter.ts`
  - **Acceptance Criteria**:
    - Adds labels above each code block: "Example code (javascript):" or "Example code:"
    - Labels are clear and educational ("Example", not "Code")
    - Labels are emphasized (bold markdown)
    - Returns formatted response
  - **Effort**: 2 SP
  - **Dependencies**: T039 (fixCodeBlocks)
  - **Implementation Notes**:
    - Find code blocks: /```(\w+)?\n([\s\S]*?)```/g
    - For each block, prepend label: `\n**Example code (${language}):**\n${block}\n`
    - Counter tracks multiple blocks
    - Test: single block, multiple blocks, various languages
  - **Educational Consideration**: Clear labels help students understand examples vs. solutions
  - **Accessibility**: Labels are announced by screen readers

- [x] **T041 [P] [Core]** Implement ResponseFormatter.normalizeHeadings() in `src/chat/ResponseFormatter.ts`
  - **Acceptance Criteria**:
    - Ensures heading hierarchy is correct (no skipping levels, max 6 levels)
    - Adjusts heading levels as needed
    - Returns properly structured markdown
    - Preserves heading text
  - **Effort**: 2 SP
  - **Dependencies**: T036 (ResponseFormatter skeleton)
  - **Implementation Notes**:
    - Parse lines, find heading pattern: /^(#{1,6})\s+(.*)/
    - Adjust level (ensure no jumps): current level + 1 (max 6)
    - Rebuild heading with corrected level
    - Test: various heading hierarchies
  - **Educational Consideration**: Proper heading structure helps navigation
  - **Accessibility**: Heading hierarchy is critical for screen reader navigation

- [x] **T042 [P] [Core]** Implement ResponseFormatter.validateAccessibility() in `src/chat/ResponseFormatter.ts`
  - **Acceptance Criteria**:
    - Validates response for common accessibility issues
    - Checks for color-only meaning (warns)
    - Checks for tables (suggests lists)
    - Checks for excessive nesting
    - Logs warnings (not errors; formatting still succeeds)
  - **Effort**: 2 SP
  - **Dependencies**: T036 (ResponseFormatter skeleton)
  - **Implementation Notes**:
    - Check for style="color: patterns (warn about color-only meaning)
    - Check for tables (| separator, warn to use lists)
    - Check nesting depth: max 4 levels (warn if deeper)
    - Warnings logged to console (DEBUG level)
  - **Educational Consideration**: Validation teaches accessibility best practices
  - **Accessibility**: Early validation prevents inaccessible output

- [x] **T043 [P] [Core]** Implement ResponseFormatter unit tests in `src/__tests__/responseFormatter.test.ts`
  - **Acceptance Criteria**:
    - 100% line coverage
    - Test formatResponse, fixMarkdownIssues, fixCodeBlocks, addCodeBlockLabels, normalizeHeadings, validateAccessibility
    - Test edge cases: malformed markdown, missing backticks, various languages, excessive nesting
    - All tests pass
  - **Effort**: 5 SP
  - **Dependencies**: T004 (Jest), T036-T042 (ResponseFormatter methods)
  - **Implementation Notes**:
    - Test data: normal markdown, malformed markdown, code blocks without language, multiple code blocks, headings with jumps
    - Verify output is valid markdown
    - Snapshot tests for complex formatting
  - **Educational Consideration**: Tests show formatting logic
  - **Accessibility**: Test coverage ensures accessible output

#### AccessibilityHandler Component

- [x] **T044 [P] [Core]** Implement AccessibilityHandler class skeleton in `src/accessibility/accessibilityHandler.ts`
  - **Acceptance Criteria**:
    - Class created with: validateResponse(), checkColorContrast(), checkCodeBlockAccessibility(), checkHeadingStructure(), checkLinkAccessibility(), generateReport()
    - All methods have JSDoc
    - TypeScript compiles
  - **Effort**: 2 SP
  - **Dependencies**: T005 (directory structure)
  - **Implementation Notes**:
    - Plan: validateResponse orchestrates all checks
    - generateReport provides accessibility audit result
  - **Educational Consideration**: Accessibility handler ensures inclusive design
  - **Accessibility**: This component is foundational to meeting WCAG 2.1 AA

- [x] **T045 [P] [Core]** Implement AccessibilityHandler.validateResponse() in `src/accessibility/accessibilityHandler.ts`
  - **Acceptance Criteria**:
    - validateResponse(formattedResponse) runs all accessibility checks
    - Calls: checkColorContrast, checkCodeBlockAccessibility, checkHeadingStructure, checkLinkAccessibility
    - Reports warnings (not errors) for violations
    - Does not prevent response display (validation is guidance)
  - **Effort**: 2 SP
  - **Dependencies**: T044 (AccessibilityHandler skeleton)
  - **Implementation Notes**:
    - Call all check functions
    - Log warnings to console (DEBUG level)
    - Catch any exceptions in checks (don't crash on validation error)
  - **Educational Consideration**: Validation teaches accessibility principles
  - **Accessibility**: Proactive validation prevents accessibility violations

- [x] **T046 [P] [Core]** Implement AccessibilityHandler.checkColorContrast() in `src/accessibility/accessibilityHandler.ts`
  - **Acceptance Criteria**:
    - Detects inline style color specifications
    - Warns if color-only meaning detected (e.g., "red text for error")
    - Suggests using text + icons for meaning
  - **Effort**: 2 SP
  - **Dependencies**: T044 (AccessibilityHandler skeleton)
  - **Implementation Notes**:
    - Regex: /style="color:([^"]+)"/g
    - If found, warn: "Found inline color styles. Ensure sufficient contrast (WCAG AA: 4.5:1)"
    - Suggest: use text + icons, not color alone
  - **Educational Consideration**: Teaches color accessibility
  - **Accessibility**: Prevents color-only meaning (critical for colorblind users)

- [x] **T047 [P] [Core]** Implement AccessibilityHandler.checkCodeBlockAccessibility() in `src/accessibility/accessibilityHandler.ts`
  - **Acceptance Criteria**:
    - Detects code blocks without language specifier
    - Warns to add language identifier
  - **Effort**: 1 SP
  - **Dependencies**: T044 (AccessibilityHandler skeleton)
  - **Implementation Notes**:
    - Regex: /```\n/g (code blocks without language)
    - If found, warn: "Found code blocks without language specifier. Add language identifier for better accessibility."
  - **Educational Consideration**: Language specifier helps AI and screen readers
  - **Accessibility**: Screen readers need context to announce code properly

- [x] **T048 [P] [Core]** Implement AccessibilityHandler.checkHeadingStructure() in `src/accessibility/accessibilityHandler.ts`
  - **Acceptance Criteria**:
    - Validates heading hierarchy (no level skipping)
    - Warns if hierarchy violates: (h2 → h4 skips h3)
  - **Effort**: 2 SP
  - **Dependencies**: T044 (AccessibilityHandler skeleton)
  - **Implementation Notes**:
    - Extract headings: /^(#{1,6})\s/gm
    - Track levels, check each is ≤ previous + 1
    - If violation, warn: "Heading structure skips levels. Ensure logical hierarchy."
  - **Educational Consideration**: Proper heading structure improves comprehension
  - **Accessibility**: Heading hierarchy is critical for screen reader navigation

- [x] **T049 [P] [Core]** Implement AccessibilityHandler.checkLinkAccessibility() in `src/accessibility/accessibilityHandler.ts`
  - **Acceptance Criteria**:
    - Detects vague link text ("click here", "link")
    - Warns to use descriptive text
  - **Effort**: 1 SP
  - **Dependencies**: T044 (AccessibilityHandler skeleton)
  - **Implementation Notes**:
    - Regex: /\[([^\]]+)\]\(([^)]+)\)/g
    - If text is "click here" or "link", warn: "Found vague link text. Use descriptive text instead."
  - **Educational Consideration**: Descriptive links help all users
  - **Accessibility**: Critical for screen reader users (they scan link list)

- [x] **T050 [P] [Core]** Implement AccessibilityHandler.generateReport() in `src/accessibility/accessibilityHandler.ts`
  - **Acceptance Criteria**:
    - generateReport() returns AccessibilityReport with: wcagLevel, keyboardNavigable, screenReaderSupport, colorContrast, zoomSupport, timestamp
    - Report can be used for compliance verification
  - **Effort**: 1 SP
  - **Dependencies**: T044 (AccessibilityHandler skeleton)
  - **Implementation Notes**:
    - Return report: { wcagLevel: 'AA', keyboardNavigable: true, screenReaderSupport: true, colorContrast: true, zoomSupport: true, timestamp: Date.now() }
    - This is a baseline; will be verified by manual testing
  - **Educational Consideration**: Report documents accessibility commitment
  - **Accessibility**: Report can be published as accessibility statement

- [x] **T051 [P] [Core]** Implement AccessibilityHandler unit tests in `src/__tests__/accessibilityHandler.test.ts`
  - **Acceptance Criteria**:
    - 100% line coverage
    - Test all check functions: color contrast, code blocks, heading structure, links
    - Test with accessible and inaccessible content
    - Verify warnings are logged
    - Test generateReport
    - All tests pass
  - **Effort**: 4 SP
  - **Dependencies**: T004 (Jest), T044-T050 (AccessibilityHandler methods)
  - **Implementation Notes**:
    - Test data: accessible content (no warnings), inaccessible content (warnings)
    - Mock console.warn to verify warnings are logged
    - Test each check independently
  - **Educational Consideration**: Tests demonstrate accessibility validation
  - **Accessibility**: Test coverage ensures accessibility checks work

**WP4 Summary**:
- **Total Effort**: 35 SP (roughly 1.5-2 weeks for 1-2 developers)
- **Dependencies**: WP3 (T023-T035 PromptBuilder/AIServiceClient for response generation)
- **Parallel Opportunities**:
  - T036-T043 (ResponseFormatter) can be done by Dev A (week 5-6)
  - T044-T051 (AccessibilityHandler) can be done by Dev B (week 5-6)
  - Both can work in parallel
- **Risk**: Low (formatting is straightforward; accessibility is well-understood)
- **Key Deliverable**: Responses are properly formatted and accessible; validators catch issues

---

## Work Package 5: Testing Framework (W2-7, Ongoing)

### Overview
Set up testing infrastructure, write unit tests for all components, ensure 80% coverage. Testing happens throughout the project (not just at the end).

### Tasks (Integrated with Component Development)

- [ ] **T052 [P]** Create test setup and configuration in `src/__tests__/setup.ts`
  - **Acceptance Criteria**:
    - Test setup file configures Jest environment
    - Mocks VS Code API (vscode module)
    - Provides test helpers (createMockContext, createMockChatRequest, etc.)
    - All tests can import and use these mocks
  - **Effort**: 3 SP
  - **Dependencies**: T004 (Jest config)
  - **Implementation Notes**:
    - Create src/__tests__/setup.ts
    - Mock vscode module: vscode.chat.createChatParticipant, vscode.window, vscode.workspace, etc.
    - Provide helpers: createMockExtensionContext(), createMockChatRequest(), etc.
    - Export mocks for use in other tests
  - **Educational Consideration**: Test setup shows mocking patterns
  - **Accessibility**: Tests verify accessible code paths

- [ ] **T053 [P]** Create test utilities for accessibility testing in `src/__tests__/a11y-helpers.ts`
  - **Acceptance Criteria**:
    - Helper functions for accessibility testing
    - validateKeyboardNav(element), validateScreenReaderText(element), validateColorContrast(element)
    - Helpers use axe-core for automated checks
    - Can be used in accessibility tests
  - **Effort**: 3 SP
  - **Dependencies**: T004 (Jest config), T001 (axe-core installed)
  - **Implementation Notes**:
    - Create src/__tests__/a11y-helpers.ts
    - Import axe-core: const axe = require('axe-core')
    - Helper: validateAccessibility(element) → run axe checks, return violations
    - Helper: validateKeyboardNav(element) → check Tab order, visible focus
  - **Educational Consideration**: Helpers teach accessibility testing patterns
  - **Accessibility**: Automated testing catches violations

- [ ] **T054 [P]** Create integration test setup for VS Code in `src/__tests__/extension.integration.test.ts`
  - **Acceptance Criteria**:
    - Test template for end-to-end chat flows
    - Can launch VS Code extension, send chat message, verify response
    - Tests are slow (integration) but comprehensive
    - Template can be extended for Phase 2 tests
  - **Effort**: 4 SP
  - **Dependencies**: T004 (Jest config), T052 (Test setup)
  - **Implementation Notes**:
    - Create src/__tests__/extension.integration.test.ts
    - Template for chat flow: activate extension → open chat → send message → verify response appears
    - Use vscode-test API
    - Note: Will be completed in WP6 (integration testing)
  - **Educational Consideration**: Integration tests show full flow
  - **Accessibility**: End-to-end tests validate accessibility in context

- [ ] **T055 [P]** Achieve 80% line coverage across all WP2 components (Target: Week 3)
  - **Acceptance Criteria**:
    - `npm test -- --coverage` reports 80%+ coverage for: messageHandler.ts, studentContextManager.ts, conversationStorage.ts
    - Coverage report includes: lines, branches, functions, statements
    - Zero uncovered critical paths
  - **Effort**: Distributed across T013, T016, T019
  - **Dependencies**: T013, T016, T019 (unit tests)
  - **Implementation Notes**:
    - Tests already written in T013, T016, T019
    - Verify coverage: `npm test -- --coverage src/chat/`
    - If < 80%, add tests for uncovered paths
    - Check coverage report in coverage/lcov-report/
  - **Educational Consideration**: Coverage targets encourage comprehensive testing
  - **Accessibility**: Coverage ensures all code paths are tested

- [ ] **T056 [P]** Achieve 80% line coverage across all WP3 components (Target: Week 5)
  - **Acceptance Criteria**:
    - `npm test -- --coverage` reports 80%+ coverage for: aiServiceClient.ts, promptBuilder.ts
    - All critical paths covered (safety checks, error handling, edge cases)
  - **Effort**: Distributed across T026, T035
  - **Dependencies**: T026, T035 (unit tests)
  - **Implementation Notes**:
    - Verify coverage: `npm test -- --coverage src/chat/`
    - Special attention to: safety validation (homework, unethical, injection), error handling, rate limiting
    - Edge cases: empty history, no code blocks, malformed input
  - **Educational Consideration**: Coverage enforces testing of safety features
  - **Accessibility**: All code paths tested ensures reliability

- [ ] **T057 [P]** Achieve 80% line coverage across all WP4 components (Target: Week 6)
  - **Acceptance Criteria**:
    - `npm test -- --coverage` reports 80%+ coverage for: ResponseFormatter.ts, accessibilityHandler.ts
    - All formatting and accessibility checks covered
  - **Effort**: Distributed across T043, T051
  - **Dependencies**: T043, T051 (unit tests)
  - **Implementation Notes**:
    - Verify coverage: `npm test -- --coverage src/`
    - Test normal and edge cases for formatting
    - Test all accessibility checks with accessible and inaccessible content
  - **Educational Consideration**: Coverage ensures formatting and accessibility work
  - **Accessibility**: Thorough testing of accessibility handler

- [ ] **T058 [P]** Set up coverage reporting and tracking in CI/CD (Target: Week 2)
  - **Acceptance Criteria**:
    - Coverage reports uploaded to Codecov or similar service
    - CI/CD requires coverage > 80% to merge
    - PR comments show coverage changes
    - Coverage dashboard accessible to team
  - **Effort**: 2 SP
  - **Dependencies**: T007 (CI/CD setup)
  - **Implementation Notes**:
    - Add to CI pipeline: npm run test -- --coverage, upload to Codecov
    - Create Codecov config in codecov.yml (optional but recommended)
    - Set coverage threshold in jest.config.js
    - Document in CONTRIBUTING.md how to check coverage locally
  - **Educational Consideration**: Public coverage encourages quality focus
  - **Accessibility**: Coverage tracking holds team accountable

**WP5 Summary**:
- **Total Effort**: 19 SP (distributed across development phases)
- **Dependencies**: WP1 (T004 Jest config), WP2-4 (component tests)
- **Parallel Opportunities**: Tests can be written in parallel with components
- **Risk**: Low (testing is straightforward; Jest is standard)
- **Key Deliverable**: 80%+ code coverage; all tests passing; CI/CD enforcing coverage

---

## Work Package 6: Accessibility Compliance Testing (W7-8, 2 weeks)

### Overview
Manual and automated accessibility testing to verify WCAG 2.1 AA compliance. This is critical per the constitution.

### Tasks

- [ ] **T059 [P]** Set up automated accessibility testing with axe-core in `src/__tests__/accessibility.test.ts`
  - **Acceptance Criteria**:
    - Jest tests using axe-core to check rendered chat UI
    - Tests verify: no color-only meaning, proper heading hierarchy, link text, form labels, ARIA attributes
    - Zero axe violations (errors) allowed; warnings logged
    - Tests can be run in CI/CD
  - **Effort**: 4 SP
  - **Dependencies**: T001 (axe-core), T004 (Jest), T053 (a11y helpers)
  - **Implementation Notes**:
    - Create src/__tests__/accessibility.test.ts
    - Test: chat UI render → run axe(element) → expect violations.length === 0
    - Test various UI states: empty chat, message displayed, error shown, loading state
    - Document any violations found and how to fix
  - **Educational Consideration**: Automated testing teaches accessibility standards
  - **Accessibility**: Automated tests catch violations early

- [ ] **T060 [P]** Keyboard navigation testing - Chat Input (Target: Week 7)
  - **Acceptance Criteria**:
    - Chat input field is reachable with Tab key
    - Focus indicator is visible (border, outline, or highlight)
    - Enter key sends message
    - Escape key clears focus or closes chat (depending on context)
    - No mouse required to interact
  - **Effort**: 2 SP
  - **Dependencies**: T011 (handleChat implementation)
  - **Implementation Notes**:
    - Manual testing: open VS Code, open chat, press Tab until input field is focused
    - Verify focus indicator is visible (3:1 contrast minimum)
    - Press Enter to send message
    - Verify message is sent
    - Press Escape to close or clear focus
    - Document findings; fix any issues
  - **Educational Consideration**: Keyboard navigation is foundational
  - **Accessibility**: Critical for motor disabilities

- [ ] **T061 [P]** Keyboard navigation testing - Chat History (Target: Week 7)
  - **Acceptance Criteria**:
    - Chat history is navigable with arrow keys (Up/Down to scroll through messages)
    - Tab key navigates through selectable elements (code blocks, buttons)
    - All elements are reachable without mouse
  - **Effort**: 2 SP
  - **Dependencies**: T011 (handleChat), T030 (ResponseFormatter)
  - **Implementation Notes**:
    - Manual testing: open chat, send messages, use arrow keys to scroll history
    - Verify messages are accessible
    - Test Tab key navigation through message, code block copy button, etc.
    - Document any barriers; fix them
  - **Educational Consideration**: Navigation patterns consistency matters
  - **Accessibility**: Required for keyboard-only users

- [ ] **T062 [P]** Screen reader testing with NVDA (Target: Week 7)
  - **Acceptance Criteria**:
    - Chat UI is fully navigable with NVDA screen reader (Windows)
    - All elements are announced: input field, button labels, messages, error messages
    - Chat responses are announced via ARIA live region (not missed by screen reader users)
    - Heading structure is announced correctly
    - Code blocks are readable (either inline text or exportable as plain text)
  - **Effort**: 4 SP
  - **Dependencies**: T011 (handleChat), T030 (ResponseFormatter), T044 (AccessibilityHandler)
  - **Implementation Notes**:
    - Install NVDA (free screen reader for Windows)
    - Manual testing: open VS Code with code-tutor installed
    - Activate NVDA, navigate chat with arrow keys, Tab key
    - Listen for proper announcements: "Chat input field", "Send button", "Message: ...", etc.
    - Verify new messages are announced (requires ARIA live region: aria-live="polite")
    - Document any issues; fix them
    - Create accessibility test document with findings
  - **Educational Consideration**: Screen reader testing ensures true inclusion
  - **Accessibility**: Critical for blind and low-vision users

- [ ] **T063 [P]** Screen reader testing with JAWS (if available) (Target: Week 7)
  - **Acceptance Criteria**:
    - Chat UI tested with JAWS (commercial screen reader, more users than NVDA)
    - Results should match or exceed NVDA testing
    - Any JAWS-specific issues documented and fixed
  - **Effort**: 3 SP
  - **Dependencies**: T062 (NVDA testing)
  - **Implementation Notes**:
    - If JAWS is available (may need trial license), repeat T062 testing
    - Document any differences from NVDA
    - File issues for JAWS-specific problems
    - Note: JAWS testing may be skipped if license unavailable (NVDA is sufficient for WCAG AA)
  - **Educational Consideration**: Multiple screen reader testing ensures compatibility
  - **Accessibility**: JAWS is most popular screen reader among professionals

- [ ] **T064 [P]** High contrast theme testing (Target: Week 7)
  - **Acceptance Criteria**:
    - VS Code high contrast theme applied
    - All text is readable (contrast 4.5:1 for normal text, 3:1 for large)
    - Colors are distinct (colorblind-friendly if applicable)
    - No essential information conveyed by color alone
  - **Effort**: 2 SP
  - **Dependencies**: T030 (ResponseFormatter), T044 (AccessibilityHandler)
  - **Implementation Notes**:
    - Open VS Code, select high contrast theme
    - Verify all text is readable
    - Use contrast checker tool (e.g., WebAIM Contrast Checker) to verify ratios
    - Check: headings, body text, code blocks, error messages, links
    - Document any violations; fix them
  - **Educational Consideration**: High contrast benefits all users (low vision, bright environments)
  - **Accessibility**: WCAG AA requires 4.5:1 for text

- [ ] **T065 [P]** Zoom testing at 200% (Target: Week 7)
  - **Acceptance Criteria**:
    - VS Code zoomed to 200% (Ctrl+Plus or Cmd+Plus)
    - All content is visible without horizontal scrolling
    - Text is readable
    - All interactive elements are reachable with Tab key
    - No layout breaks or content overflow
  - **Effort**: 2 SP
  - **Dependencies**: T030 (ResponseFormatter), T044 (AccessibilityHandler)
  - **Implementation Notes**:
    - Open VS Code, zoom to 200% (Ctrl++ multiple times)
    - Open chat, send message, verify response is visible without scrolling
    - Check code blocks, headings, error messages
    - Document any layout breaks; fix them
  - **Educational Consideration**: Zoom accessibility benefits low vision users
  - **Accessibility**: WCAG AA requires zoom to 200% without loss of functionality

- [ ] **T066 [P]** Color blindness testing (Protanopia, Deuteranopia, Tritanopia) (Target: Week 8)
  - **Acceptance Criteria**:
    - Use color blindness simulator (e.g., ChromeVox, Stark for VS Code)
    - Verify no information conveyed by color alone
    - Error messages use text + icons, not red alone
    - Syntax highlighting is distinguishable in colorblind modes
  - **Effort**: 2 SP
  - **Dependencies**: T030 (ResponseFormatter), T044 (AccessibilityHandler)
  - **Implementation Notes**:
    - Use Stark (VS Code extension) or other color blindness simulator
    - Simulate each type: protanopia (red-blind), deuteranopia (green-blind), tritanopia (blue-blind)
    - Check error messages, links, code highlighting
    - Document any issues; fix them (usually by adding text or icons alongside colors)
  - **Educational Consideration**: Color blindness affects ~8% of males, 0.5% of females
  - **Accessibility**: WCAG AA requires color not to be only differentiator

- [ ] **T067 [P]** Accessibility audit documentation (Target: Week 8)
  - **Acceptance Criteria**:
    - Document generated: ACCESSIBILITY.md
    - Includes: WCAG 2.1 AA compliance checklist, test results, any known issues, remediation plans
    - Evidence: screenshots, test notes, tool outputs (axe, NVDA, etc.)
    - Publicly available for transparency
  - **Effort**: 2 SP
  - **Dependencies**: T059-T066 (all accessibility tests)
  - **Implementation Notes**:
    - Create ACCESSIBILITY.md in root
    - Checklist: each WCAG AA criterion (68 criteria total)
    - For each criterion: status (pass/fail), test method, evidence
    - Known issues: list any violations, planned fixes, timeline
    - Standards: "This extension meets WCAG 2.1 Level AA standards"
    - Publish in documentation
  - **Educational Consideration**: Transparency builds trust
  - **Accessibility**: Public accessibility statement is best practice

- [ ] **T068 [P]** Accessibility review checklist (Target: Week 8)
  - **Acceptance Criteria**:
    - Checklist document created: ACCESSIBILITY-CHECKLIST.md
    - For developers: quick reference of accessibility requirements
    - Includes: keyboard nav, screen reader, color contrast, zoom, color blindness, semantic HTML, ARIA
    - Used in code review process
  - **Effort**: 2 SP
  - **Dependencies**: T067 (Accessibility audit)
  - **Implementation Notes**:
    - Create ACCESSIBILITY-CHECKLIST.md
    - Format: checklist with examples
    - Include: "Have you tested with keyboard only?", "Have you tested with screen reader?", etc.
    - Link to ACCESSIBILITY.md for details
    - Require checklist sign-off in code review
  - **Educational Consideration**: Checklist helps team maintain standards
  - **Accessibility**: Consistent review ensures ongoing compliance

**WP6 Summary**:
- **Total Effort**: 25 SP (roughly 2 weeks for 1-2 people, week 7-8)
- **Dependencies**: WP4 (T036-T051 ResponseFormatter/AccessibilityHandler must be complete)
- **Parallel Opportunities**:
  - T059 (automated testing) can be done by Dev A
  - T060-T066 (manual testing) can be split among multiple people (different test types)
  - Testing can happen while other work continues
- **Risk**: Medium (accessibility testing is manual and time-consuming; may find violations requiring rework)
- **Key Deliverable**: WCAG 2.1 AA compliance verified; accessibility audit complete

---

## Work Package 7: Performance, Security & Release (W8-10, 3 weeks)

### Overview
Load testing, security audit, bug fixes, release preparation.

### Tasks

- [ ] **T069 [P]** Load testing setup with k6 or Artillery in `load-tests/chat.load.js`
  - **Acceptance Criteria**:
    - Load test script created: simulates 100 concurrent users sending chat messages
    - Script tests: message latency, response streaming, error handling under load
    - Passes with p95 < 5s (NFR-003)
    - Script is repeatable and documentable
  - **Effort**: 3 SP
  - **Dependencies**: T023 (AIServiceClient)
  - **Implementation Notes**:
    - Use k6 (https://k6.io/) for load testing
    - Create load-tests/chat.load.js with: 100 virtual users, each sending 10 chat messages
    - Measure: response time (p95 < 5s), error rate (< 0.1%), throughput (requests/sec)
    - Test with mock AI backend (not real API to avoid costs)
    - Document: how to run, expected results
  - **Educational Consideration**: Load testing teaches scalability concepts
  - **Accessibility**: Load testing ensures tool works under high demand

- [ ] **T070 [P]** Run load test and analyze results (Target: Week 8)
  - **Acceptance Criteria**:
    - Load test executed: 100 concurrent users
    - Results measured: p95 response time, error rate, throughput
    - All metrics pass requirements (p95 < 5s, error rate < 0.1%)
    - Performance report generated
    - If failures, optimize and retest
  - **Effort**: 4 SP
  - **Dependencies**: T069 (Load test setup)
  - **Implementation Notes**:
    - Run: k6 run load-tests/chat.load.js
    - Analyze output: response time distribution, error patterns
    - If p95 > 5s: identify bottleneck (AI latency, network, code), optimize, retest
    - Generate report: PERFORMANCE.md with results, graphs, analysis
  - **Educational Consideration**: Real data informs optimization decisions
  - **Accessibility**: Performance ensures tool is usable for all

- [ ] **T071 [P]** Security audit - Code review for vulnerabilities (Target: Week 8)
  - **Acceptance Criteria**:
    - Code review checklist completed: no hardcoded secrets, no eval(), no code injection, input sanitization verified
    - All components reviewed for security issues
    - Third-party dependencies scanned for CVEs (npm audit)
    - Report generated: SECURITY.md
  - **Effort**: 4 SP
  - **Dependencies**: T001-T051 (all code)
  - **Implementation Notes**:
    - Checklist:
      - [ ] No hardcoded API keys, passwords, secrets
      - [ ] No eval(), exec(), or dynamic code generation
      - [ ] No SQL injection vulnerabilities (if applicable)
      - [ ] Input sanitized before use (especially for AI calls)
      - [ ] No XSS vulnerabilities (VS Code is protected, but check custom UI)
      - [ ] Dependencies scanned: npm audit --audit-level=moderate
    - Review: extension.ts, ChatParticipantProvider, PromptBuilder, AIServiceClient
    - Document findings in SECURITY.md
  - **Educational Consideration**: Security review teaches best practices
  - **Accessibility**: Security ensures student data is protected

- [ ] **T072 [P]** Dependency vulnerability scanning (Target: Week 8)
  - **Acceptance Criteria**:
    - Run `npm audit` and resolve vulnerabilities
    - All dependencies at latest patch version (security updates)
    - Vulnerable packages identified and either updated or removed
    - Audit report clean (zero critical vulnerabilities)
  - **Effort**: 2 SP
  - **Dependencies**: T001 (dependencies installed)
  - **Implementation Notes**:
    - Run: npm audit
    - For each vulnerability: update package, test, or remove if not needed
    - Document in SECURITY.md: which packages scanned, when, results
    - Schedule: weekly npm audit in CI/CD
  - **Educational Consideration**: Teaches dependency management
  - **Accessibility**: Dependencies are vetted for security

- [ ] **T073 [P]** Fix critical bugs from testing (Target: Week 8-9)
  - **Acceptance Criteria**:
    - All critical bugs (P0) fixed
    - All high bugs (P1) either fixed or documented with workarounds
    - Zero known blockers for release
    - Regression tests added for fixed bugs
  - **Effort**: 5 SP
  - **Dependencies**: T055-T068 (testing reveals bugs)
  - **Implementation Notes**:
    - Triage bugs: P0 (release blocker), P1 (important), P2 (nice to fix)
    - P0 bugs: fixed before release
    - P1 bugs: fixed if time allows, otherwise documented
    - For each fixed bug: add regression test to prevent re-occurrence
    - Document in CHANGELOG.md
  - **Educational Consideration**: Bug fixes improve reliability
  - **Accessibility**: Bug fixes ensure accessibility compliance

- [ ] **T074 [P]** Performance optimization if needed (Target: Week 8-9)
  - **Acceptance Criteria**:
    - If load testing showed issues: optimize code
    - Common optimizations: conversation history caching, response streaming tuning, error handling efficiency
    - After optimization: rerun load test, verify p95 < 5s
    - No functionality changes; optimization only
  - **Effort**: Variable (0 if no issues, 3-5 SP if optimization needed)
  - **Dependencies**: T070 (Load test results)
  - **Implementation Notes**:
    - If p95 < 5s: no action needed
    - If p95 > 5s: profile code, identify bottleneck
    - Common issues: slow AI API (not extension's issue), network latency, message parsing
    - Optimizations: cache system prompt, limit history to 10 messages (already done), async processing
    - Verify optimization with retest
  - **Educational Consideration**: Performance optimization teaches efficiency
  - **Accessibility**: Faster responses benefit all users

- [ ] **T075 [P]** Update CHANGELOG.md with Phase 1 summary (Target: Week 9)
  - **Acceptance Criteria**:
    - CHANGELOG.md updated with v0.1.0-alpha release
    - Includes: features added, bugs fixed, breaking changes (if any), known limitations
    - Format: follows changelog conventions (semver, category headings)
    - Accessible and well-formatted
  - **Effort**: 2 SP
  - **Dependencies**: T073 (bugs documented)
  - **Implementation Notes**:
    - Entries for MVP (v0.1.0-alpha):
      - Features: chat participant, message handling, AI integration, educational guardrails, accessibility
      - Bugs fixed: list from T073
      - Known limitations: learning level personalization (Phase 2), code selection (Phase 2), debugging UX (Phase 2)
      - Breaking changes: none (first release)
    - Format: markdown with clear sections
  - **Educational Consideration**: Changelog documents progress transparently
  - **Accessibility**: Changelog should be readable

- [ ] **T076 [P]** Create user documentation (Target: Week 9)
  - **Acceptance Criteria**:
    - Documentation created: docs/USER_GUIDE.md
    - Explains: how to install, set up API key, use chat participant, what to expect
    - Includes: example conversations, tips for best learning
    - Accessible format (plain text, high contrast, screen reader friendly)
  - **Effort**: 3 SP
  - **Dependencies**: T006 (SETUP.md), T030 (ResponseFormatter)
  - **Implementation Notes**:
    - Structure:
      - Installation (from VS Code Marketplace)
      - API key setup (with screenshots, security warning)
      - How to use (open chat, mention @code-tutor, ask question)
      - Example conversations (debugging, concepts, error help)
      - Tips for learning (ask "why", try things yourself first)
      - Limitations (no homework solutions, AI uncertainty, offline not supported)
      - Troubleshooting (API key not set, rate limited, no response)
    - Format: markdown, plain language, accessible
  - **Educational Consideration**: Good documentation enables learning
  - **Accessibility**: User guide must be accessible

- [ ] **T077 [P]** Create instructor documentation (Target: Week 9)
  - **Acceptance Criteria**:
    - Documentation created: docs/INSTRUCTOR_GUIDE.md
    - Explains: how students benefit, how to encourage ethical use, how to provide feedback
    - Includes: tips for integrating into course, expected outcomes, privacy guarantees
  - **Effort**: 2 SP
  - **Dependencies**: T076 (User guide)
  - **Implementation Notes**:
    - Structure:
      - What is code-tutor (educational philosophy, how it helps)
      - Privacy and data (local-only storage, no tracking, FERPA compliant)
      - Encouraging ethical use (emphasize learning, not shortcuts)
      - Integration tips (syllabus mention, in-class demo, assignment notes)
      - FAQ (Can I see student conversations? No, privacy. Does it replace me? No, it supplements. Is it accurate? Usually, but AI can make mistakes.)
      - Support (how to report issues, request features)
    - Format: markdown, professional tone
  - **Educational Consideration**: Instructors are key to adoption
  - **Accessibility**: Instructor guide should be accessible

- [ ] **T078 [P]** Prepare for VS Code Marketplace submission (Target: Week 9)
  - **Acceptance Criteria**:
    - README.md updated with: feature summary, installation, quick start, constitution, transparency statement
    - Extension icon/artwork finalized
    - Extension manifest (package.json) complete: name, description, version, license
    - License file added (MIT recommended)
    - Repository link verified
  - **Effort**: 3 SP
  - **Dependencies**: T075 (CHANGELOG)
  - **Implementation Notes**:
    - Update README.md:
      - Headline: "code-tutor-v2: AI-Powered Educational Code Learning"
      - Subheading: "Learn programming with guided AI assistance that teaches, not solves"
      - Features: chat participant, AI guidance, safety guardrails, accessibility, local privacy
      - Installation: "Install from VS Code Marketplace"
      - Quick start: "Open chat, mention @code-tutor, ask a question"
      - Constitution: link to CONSTITUTION.md
      - Privacy: "Conversations are stored locally on your computer. No data sent to servers."
      - License: MIT
      - Contributing: link to CONTRIBUTING.md
    - Icon: design or find suitable image (code-tutor logo)
    - package.json: verify all fields correct
    - LICENSE.md: add MIT license
    - .vscodeignore: exclude unnecessary files (tests, docs, .git)
  - **Educational Consideration**: Clear communication builds trust
  - **Accessibility**: Marketplace description should be accessible

- [ ] **T079 [P]** Final integration test run (Target: Week 9)
  - **Acceptance Criteria**:
    - End-to-end test: activate extension → open chat → ask question → get response → verify response is correct
    - Test with multiple question types: concept question, debugging question, error question
    - Verify all components work together
    - No crashes or unexpected errors
  - **Effort**: 2 SP
  - **Dependencies**: T011 (handleChat complete), T054 (integration test template)
  - **Implementation Notes**:
    - Manual testing or automation (depending on available time)
    - Test flows:
      - "What is a closure?" → receives explanation with example
      - (Paste code with bug) "Why doesn't this work?" → receives debugging guidance
      - Error message → gets help understanding error
    - Verify: message parsed correctly, context maintained, response streamed, accessibility preserved
    - Document results
  - **Educational Consideration**: Integration testing validates full learning flow
  - **Accessibility**: E2E testing includes accessibility

- [ ] **T080 [P]** Release v0.1.0-alpha (Target: Week 10)
  - **Acceptance Criteria**:
    - Tag created: git tag v0.1.0-alpha
    - Extension built: npm run package
    - Package uploaded to local repo (pre-release step)
    - Release notes published
    - Announce release to early testers
  - **Effort**: 2 SP
  - **Dependencies**: T078 (marketplace prep), T079 (final testing)
  - **Implementation Notes**:
    - Run: npm run package (builds dist/extension.js)
    - Verify: package created successfully
    - Create git tag: git tag v0.1.0-alpha
    - Push tag: git push origin v0.1.0-alpha
    - Create GitHub release with: changelog summary, installation instructions, known limitations
    - Announce in project channels (email, chat, etc.)
    - Collect early feedback
  - **Educational Consideration**: Transparent release process
  - **Accessibility**: Release notes should be accessible

- [ ] **T081 [P]** Collect early feedback from testers (Target: Week 10)
  - **Acceptance Criteria**:
    - 10+ beta testers recruited
    - Feedback survey created and distributed
    - Feedback collected on: usefulness, clarity, accessibility, bugs
    - Net Promoter Score (NPS) calculated: target > 50
    - Issues logged for Phase 2 work
  - **Effort**: 3 SP
  - **Dependencies**: T080 (Release alpha)
  - **Implementation Notes**:
    - Recruit testers: invite from community, educational institutions, internal team
    - Survey: brief 5-min survey (SurveyMonkey, Google Forms, etc.)
      - Q1: How likely to recommend? (NPS score 0-10)
      - Q2: What was most useful?
      - Q3: What could improve?
      - Q4: Did you find any bugs?
      - Q5: Was it accessible?
    - Analyze: calculate NPS (% 9-10) - (% 0-6), list feedback themes, log bugs
    - Target: NPS > 50 (promoters - detractors > 20 percentage points)
  - **Educational Consideration**: Student feedback validates educational value
  - **Accessibility**: Feedback includes accessibility experiences

- [ ] **T082 [P]** Resolve critical issues from early feedback (Target: Week 10)
  - **Acceptance Criteria**:
    - Critical issues (blockers) fixed
    - High-priority issues documented for Phase 2
    - Code updated, tested, released as v0.1.0-beta or v0.1.0
    - No showstopper bugs remaining
  - **Effort**: 3 SP
  - **Dependencies**: T081 (Feedback collected)
  - **Implementation Notes**:
    - Triage feedback: critical (release blocker), high (important), medium (nice to fix), low (future)
    - Fix critical issues: do not release until fixed
    - Document high/medium/low for Phase 2 planning
    - Retest: ensure fixes work and don't introduce regressions
    - Bump version: v0.1.0-beta or v0.1.0
  - **Educational Consideration**: Responsive fixes build trust
  - **Accessibility**: Fix any accessibility issues found

**WP7 Summary**:
- **Total Effort**: 38 SP (roughly 3 weeks for 1-2 people)
- **Dependencies**: WP1-6 (all components, testing, accessibility must be complete)
- **Parallel Opportunities**:
  - T069-T070 (Performance) by Dev A (week 8)
  - T071-T072 (Security) by Dev B (week 8)
  - T075-T077 (Documentation) by Dev C (week 9)
  - T079-T082 (Testing & release) (week 9-10)
- **Risk**: Medium (performance/security issues may require significant rework)
- **Key Deliverable**: MVP released; feedback collected; ready for Phase 2

---

## Summary Statistics

### Total Effort Estimate

| Work Package | Effort (SP) | Duration | FTE |
|--------------|-------------|----------|-----|
| WP1: Environment Setup | 21 | 1-2 weeks | 1-2 |
| WP2: Core Components | 51 | 3-4 weeks | 1-2 |
| WP3: AI Integration | 46 | 3-4 weeks | 1-2 |
| WP4: Output & Accessibility | 35 | 2-3 weeks | 1-2 |
| WP5: Testing Framework | 19 | Ongoing (4-6 weeks) | 1 |
| WP6: Accessibility Testing | 25 | 2 weeks | 1-2 |
| WP7: Performance & Release | 38 | 3 weeks | 1-2 |
| **TOTAL** | **235 SP** | **10 weeks** | **6-8 FTE** |

### Task Distribution by Category

| Category | Count | Effort |
|----------|-------|--------|
| Implementation | 45 | 140 SP |
| Testing (Unit/Integration) | 24 | 60 SP |
| Accessibility | 15 | 20 SP |
| Documentation | 8 | 10 SP |
| Performance & Security | 7 | 5 SP |
| **TOTAL** | **82** | **235 SP** |

### Timeline

```
Week 1:  WP1 (Setup) + WP2 start (ChatParticipantProvider)
Week 2:  WP2 continues (MessageHandler, StudentContextManager)
Week 3:  WP2 completes + WP3 start (AIServiceClient, PromptBuilder)
Week 4:  WP3 continues
Week 5:  WP3 completes + WP4 start (ResponseFormatter, AccessibilityHandler)
Week 6:  WP4 completes + WP5 peak (unit tests)
Week 7:  WP6 start (automated & manual accessibility testing)
Week 8:  WP6 continues + WP7 start (load testing, security audit)
Week 9:  WP7 continues (bug fixes, documentation, marketplace prep)
Week 10: WP7 completes (release, feedback collection)

Release: v0.1.0-alpha end of week 10
```

### Parallelization Opportunities

**By Week**:
- **Week 1**: WP1 can be split 2-3 ways (dependencies, TypeScript, ESLint, Jest, structure, git, CI/CD)
- **Week 2-3**: WP2 split 3 ways: MessageHandler (Dev A) + StudentContextManager (Dev B) + ConversationStorage (Dev C)
- **Week 3-4**: WP3 split 2 ways: AIServiceClient (Dev A) + PromptBuilder (Dev B)
- **Week 5-6**: WP4 split 2 ways: ResponseFormatter (Dev A) + AccessibilityHandler (Dev B)
- **Week 7-8**: WP6 testing split among 3-4: automated testing (Dev A), keyboard nav (Dev B), screen reader (Dev C), contrast/zoom (Dev D)
- **Week 8-9**: WP7 split: performance (Dev A) + security (Dev B) + documentation (Dev C)

**Team Structure (Recommended)**:
- **1 Backend Engineer** (full-time): WP1 setup, WP2 core components, WP3 AI integration (Weeks 1-5)
- **1 QA/Testing Engineer** (full-time): WP5 test setup & execution, WP6 accessibility testing (Weeks 2-8)
- **1 A11y Specialist** (part-time, 20 hrs/week): WP4 accessibility handler, WP6 manual testing (Weeks 5-8)
- **1 DevOps/Security Engineer** (part-time, 20 hrs/week): WP1 CI/CD, WP7 performance & security (Weeks 1, 8-9)
- **1 Documentation/Product Manager** (part-time, 20 hrs/week): CONTRIBUTING, guides, marketplace prep (Weeks 6-9)
- **1 UX Tester** (part-time, 20 hrs/week): WP7 user feedback collection (Week 9-10)

**Total**: 5-6 FTE for 10 weeks (or 2 FTE for 25 weeks)

---

## Quality Gates & Acceptance Criteria

### Before WP2 Completes (End of Week 3)
- [ ] All core components tested (80%+ coverage)
- [ ] ChatParticipantProvider registers @code-tutor chat participant
- [ ] MessageHandler correctly parses messages and detects problematic requests
- [ ] StudentContextManager persists student context
- [ ] ConversationStorage saves/loads conversations

### Before WP3 Completes (End of Week 5)
- [ ] AIServiceClient successfully calls OpenAI API (mock first, then real)
- [ ] PromptBuilder creates well-formed prompts with guardrails
- [ ] Safety validation detects homework requests, unethical requests, injection attempts
- [ ] All components integrated; end-to-end flow works (message → AI → response)
- [ ] Rate limiting works; graceful error handling
- [ ] 80% test coverage across all components

### Before WP6 Completes (End of Week 8)
- [ ] All automated accessibility tests pass (axe-core, zero violations)
- [ ] Keyboard navigation works (chat input, history, all elements)
- [ ] Screen reader support verified (NVDA)
- [ ] High contrast mode works; zoom to 200% works
- [ ] Color blindness testing passes (no color-only meaning)
- [ ] Accessibility audit document completed
- [ ] WCAG 2.1 AA compliance verified

### Before Release (End of Week 10)
- [ ] All critical bugs fixed
- [ ] Load testing passes (p95 < 5s, error rate < 0.1%)
- [ ] Security audit passed (no hardcoded secrets, input sanitized, no code execution)
- [ ] Performance optimized if needed
- [ ] User documentation complete and accessible
- [ ] Marketplace listing prepared and approved
- [ ] Beta testing completed with NPS > 50
- [ ] Release notes published

### Constitutional Alignment (Every Phase)
- [ ] **Principle I (Educational Excellence)**: Guidance explains "why"; no auto-solving; homework/cheating detected
- [ ] **Principle II (Student-Centered)**: Personalization by level; psychological safety; respects autonomy
- [ ] **Principle III (Transparency)**: AI involvement disclosed; uncertainty admitted; limitations documented
- [ ] **Principle IV (Accessibility)**: WCAG AA compliance; keyboard nav; screen reader support
- [ ] **Principle V (Maintainability)**: TypeScript strict; JSDoc documented; 80% test coverage; ESLint compliant

---

## Risk Mitigation Summary

| Risk | Mitigation | Owner | Timeline |
|------|-----------|-------|----------|
| AI generates incorrect code | Emphasize "example, not solution"; user testing; code review | QA | W7-9 |
| API rate limits exceeded | Implement graceful limiting; clear messaging | Backend | W3-4 |
| API key exposure | Use VS Code SecretStorage; no hardcoding; docs | DevOps | W1 |
| Accessibility not met | Automated testing (axe); manual testing (NVDA); checklist | A11y | W6-8 |
| Prompt injection attacks | Input sanitization; pattern detection; guardrails | Backend | W4-5 |
| Performance degrades | Load testing; streaming; history limits | DevOps | W8 |
| Data privacy violations | Local-only storage; no default telemetry; documentation | Product | W1, W9 |
| Educational efficacy uncertain | Pre/post quizzes; feedback surveys; learning metrics | UX | W10 |
| Dependency vulnerabilities | Weekly npm audit; automated CVE scanning | DevOps | W1 (setup), ongoing |
| Instructor adoption blocked | Instructor guides; responsive support; examples | Product | W9 |

---

## Next Steps (After Phase 1 MVP)

### Phase 2: Enhanced Learning Features (Weeks 11-18, 6-8 weeks)

**Scope** (planned for future; not in Phase 1):
- Learning level personalization (dynamic adaptation)
- Code selection from editor ("Explain This Code")
- Advanced debugging guidance
- Conversation context improvements
- Performance optimization & caching
- Expanded language support (Python, Java, C++, Go, Rust)

**High-Level Tasks** (examples, not detailed):
- Implement learning level inference from conversation patterns
- Add editor integration to extract selected code
- Build advanced debugging prompt strategies
- Optimize prompt building for context efficiency
- Add syntax highlighting for more languages

### Phase 3: Production Polish & Scale (Weeks 19-24, 4-6 weeks)

**Scope** (planned for future; not in Phase 1):
- Fine-tune model for educational contexts (if data available)
- Multi-language support for UI (not just teaching content)
- Instructor dashboard (view anonymized patterns)
- Analytics and learning metrics
- Offline/local LLM support
- Code execution sandbox (optional, risky)

---

## Document Usage

### For Project Managers
- Use task list to track progress (update checkboxes weekly)
- Monitor effort estimates vs. actual (for future planning)
- Watch critical path: WP1 → WP2 → WP3 → WP4 → WP5-6 → WP7
- Identify risks early; escalate blockers

### For Developers
- Pick tasks from your assigned WP
- Read acceptance criteria carefully (these are your contract)
- Write tests as you go (don't defer)
- Check off boxes as you complete
- Flag blockers or questions immediately

### For QA/Testing
- Integrate testing with development (not after)
- Use test setup (T052-T054) for consistency
- Maintain 80% coverage target (automated in CI/CD)
- Plan accessibility testing in WP6 (manual is essential)

### For Accessibility Specialist
- Review component design for accessibility (early)
- Implement AccessibilityHandler (T044-T051)
- Lead accessibility testing in WP6
- Create accessibility audit document (T067)

### For DevOps/Security
- Set up CI/CD pipeline in WP1 (T007)
- Monitor test coverage and code quality
- Run security audit in WP7 (T071-T072)
- Monitor load test results (T069-T070)

### For Product/Documentation
- Collect feedback in WP7 (T081)
- Create user & instructor guides (T076-T077)
- Prepare marketplace submission (T078)
- Manage release schedule

---

## Glossary & Definitions

- **SP (Story Points)**: Relative effort estimate (1 SP ≈ 1-2 hours of focused work)
- **MVP (Minimum Viable Product)**: Phase 1; core chat participant with safety guardrails
- **WCAG 2.1 AA**: Web Content Accessibility Guidelines level AA; industry standard for accessibility
- **Prompt Injection**: Attack where user input tricks AI into ignoring system prompt
- **Conversation History**: Previous messages in a chat session; used to maintain context
- **Learning Level**: Beginner, intermediate, or advanced; determines response complexity
- **Guardrails**: Rules and checks that prevent unethical or harmful use of AI
- **Acceptance Criteria**: Specific, measurable conditions that must be met for task completion
- **Test Coverage**: Percentage of code paths executed by tests (target 80% for MVP)

---

## Appendix: File Structure Created by Tasks

```
code-tutorv-v2/
├─ src/
│  ├─ extension.ts                    (entry point)
│  ├─ chat/
│  │  ├─ chatParticipantProvider.ts   (T009-T011)
│  │  ├─ messageHandler.ts            (T012-T013)
│  │  ├─ studentContextManager.ts     (T014, T017-T021)
│  │  ├─ promptBuilder.ts             (T027-T035)
│  │  ├─ aiServiceClient.ts           (T022-T026)
│  ├─ accessibility/
│  │  ├─ accessibilityHandler.ts      (T044-T051)
│  ├─ storage/
│  │  ├─ conversationStorage.ts       (T015-T016)
│  ├─ __tests__/
│  │  ├─ setup.ts                     (T052)
│  │  ├─ a11y-helpers.ts              (T053)
│  │  ├─ extension.integration.test.ts (T054)
│  │  ├─ messageHandler.test.ts       (T013)
│  │  ├─ studentContextManager.test.ts (T019)
│  │  ├─ conversationStorage.test.ts  (T016)
│  │  ├─ aiServiceClient.test.ts      (T026)
│  │  ├─ promptBuilder.test.ts        (T035)
│  │  ├─ responseFormatter.test.ts    (T043)
│  │  ├─ accessibilityHandler.test.ts (T051)
│  │  ├─ accessibility.test.ts        (T059)
│  ├─ chat/
│  │  ├─ ResponseFormatter.ts         (T036-T043)
│
├─ docs/
│  ├─ SETUP.md                        (T006)
│  ├─ CONTRIBUTING.md                 (T008)
│  ├─ USER_GUIDE.md                   (T076)
│  ├─ INSTRUCTOR_GUIDE.md             (T077)
│  ├─ ACCESSIBILITY.md                (T067)
│  ├─ ACCESSIBILITY-CHECKLIST.md      (T068)
│  ├─ PERFORMANCE.md                  (T070)
│  ├─ SECURITY.md                     (T071)
│
├─ .github/
│  ├─ workflows/
│  │  ├─ ci.yml                       (T007)
│
├─ load-tests/
│  ├─ chat.load.js                    (T069)
│
├─ .env.example                       (T006)
├─ .gitignore                         (T006)
├─ jest.config.js                     (T004)
├─ CHANGELOG.md                       (T075, updated)
├─ LICENSE.md                         (T078)
├─ README.md                          (T078, updated)
├─ CONSTITUTION.md                    (existing)
├─ plan.md                            (existing)
└─ package.json                       (T001, updated)
```

---

## Final Notes

### Success Criteria for Phase 1 Completion

The MVP (Phase 1) is complete when:
1. ✅ All 82 tasks marked complete
2. ✅ 235 SP of work delivered
3. ✅ 80%+ test coverage verified
4. ✅ WCAG 2.1 AA compliance validated
5. ✅ Zero critical bugs; all high bugs fixed
6. ✅ Performance: p95 < 5s response time
7. ✅ Security: zero hardcoded secrets, input sanitized
8. ✅ Documentation: guides, API docs, accessibility audit
9. ✅ Beta testing: 10+ testers, NPS > 50
10. ✅ Release: v0.1.0-alpha published

### Deferred to Phase 2 & Beyond

The following features are explicitly deferred and will be tackled in Phase 2 or later:
- Learning level personalization (dynamic adaptation)
- Code selection from editor
- Advanced debugging UX
- Code execution sandbox
- Fine-tuned model
- Multi-language UI
- Instructor dashboards
- Local LLM support

### Constitutional Alignment Checklist

Every task must respect the five principles of the constitution:
1. **Educational Excellence**: Guidance > solutions; students learn problem-solving
2. **Student-Centered Design**: Accessibility by default; personalization; psychological safety
3. **Transparency & Honesty**: Disclose AI involvement; admit uncertainty; document limitations
4. **Accessibility by Default**: WCAG AA compliance; keyboard nav; screen reader support
5. **Sustainable Growth**: TypeScript strict; JSDoc; tests; ESLint compliance

If a task conflicts with any principle, escalate immediately.

---

**Version**: 1.0.0  
**Last Updated**: 2026-02-24  
**Status**: Ready for Implementation  
**Next Review**: End of Week 5 (mid-point checkpoint)

---

## Quick Reference: Task Checklist (By Priority)

### 🔴 Critical Path (Must Complete in Order)
- T001-T008 (Setup)
- T009-T011 (ChatParticipantProvider)
- T012 (MessageHandler)
- T014-T021 (StudentContextManager)
- T022-T026 (AIServiceClient)
- T027-T035 (PromptBuilder)
- T036-T042 (ResponseFormatter)
- T044-T051 (AccessibilityHandler)

### 🟠 High Priority (Parallel OK, Before Release)
- T013, T016, T019, T026, T035, T043, T051 (Unit Tests)
- T052-T054 (Test Setup)
- T055-T057 (Coverage Targets)

### 🟡 Medium Priority (Parallel OK)
- T059-T068 (Accessibility Testing)
- T069-T074 (Performance & Security)

### 🟢 Lower Priority (Can Defer to Phase 2 if Needed)
- T075-T082 (Release Prep, Documentation, Feedback)

---

**Ready to implement! Questions? Escalate to project lead.**

