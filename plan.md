# Implementation Plan: code-tutor-v2 Chat Participant

**Document**: Implementation Plan  
**Feature**: Core AI Chat Participant for Educational Code Learning  
**Version**: 1.0.0  
**Status**: Ready for Development  
**Created**: 2026-02-24  
**Branch**: `001-chat-participant`

---

## Executive Summary

This document outlines the detailed implementation plan for the **Core AI Chat Participant** feature of code-tutor-v2, a VS Code extension designed to help students learn programming through guided, educational AI conversations. The plan breaks down the feature specification (spec.md) into actionable phases, identifies component architecture, manages dependencies, and establishes success metrics aligned with the project constitution.

**Key Commitment**: Every implementation decision prioritizes educational excellence, accessibility, and transparency. This is not a feature-rich chatbot—it is an educational tool that teaches students to think, not to copy.

---

## 1. Architecture Design

### 1.1 High-Level Architecture

The code-tutor-v2 extension follows a three-tier architecture:

```
┌─────────────────────────────────────────────┐
│       VS Code Extension Host (Node.js)      │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  ChatParticipantProvider (Main)       │  │ ← Registers @code-tutor
│  │  - Handles activation                 │  │
│  │  - Manages chat participant lifecycle │  │
│  └────────────┬────────────────────────┘  │
│               │                            │
│  ┌────────────┼────────────────────────┐  │
│  │  Core Components                    │  │
│  │  ┌──────────────────────────────┐   │  │
│  │  │ MessageHandler               │   │  │ ← Processes student messages
│  │  │ - Parses input               │   │  │
│  │  │ - Detects code blocks        │   │  │
│  │  │ - Builds context             │   │  │
│  │  └──────────────────────────────┘   │  │
│  │  ┌──────────────────────────────┐   │  │
│  │  │ StudentContextManager        │   │  │ ← Maintains learning context
│  │  │ - Tracks learning level      │   │  │
│  │  │ - Manages conversation state │   │  │
│  │  │ - Persists preferences       │   │  │
│  │  └──────────────────────────────┘   │  │
│  │  ┌──────────────────────────────┐   │  │
│  │  │ PromptBuilder                │   │  │ ← Constructs AI prompts
│  │  │ - Enforces guardrails        │   │  │
│  │  │ - Adapts to learning level   │   │  │
│  │  │ - Formats context            │   │  │
│  │  └──────────────────────────────┘   │  │
│  │  ┌──────────────────────────────┐   │  │
│  │  │ AIServiceClient              │   │  │ ← Calls external AI backend
│  │  │ - Handles API requests       │   │  │
│  │  │ - Manages rate limiting      │   │  │
│  │  │ - Streams responses          │   │  │
│  │  └──────────────────────────────┘   │  │
│  │  ┌──────────────────────────────┐   │  │
│  │  │ ResponseFormatter            │   │  │ ← Formats responses for UI
│  │  │ - Markdown formatting        │   │  │
│  │  │ - Code block handling        │   │  │
│  │  │ - Accessibility considerations
│  │  └──────────────────────────────┘   │  │
│  │  ┌──────────────────────────────┐   │  │
│  │  │ AccessibilityHandler         │   │  │ ← Ensures WCAG compliance
│  │  │ - Screen reader support      │   │  │
│  │  │ - Keyboard navigation        │   │  │
│  │  │ - Contrast/zoom management   │   │  │
│  │  └──────────────────────────────┘   │  │
│  │  ┌──────────────────────────────┐   │  │
│  │  │ ConversationStorage          │   │  │ ← Persists chat history
│  │  │ - Local storage (globalStorageUri)
│  │  │ - Session management         │   │  │
│  │  └──────────────────────────────┘   │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  Configuration & Security Layer       │  │
│  │  - Settings management (VS Code)      │  │
│  │  - API key management (SecretStorage) │  │
│  │  - Input sanitization                 │  │
│  └───────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
              │
              │ HTTPS API calls
              │
         ┌────▼────────────────────────┐
         │  AI Backend Service          │
         │  (OpenAI API or equivalent)  │
         │                              │
         │  - Processes prompts         │
         │  - Returns completions       │
         │  - Enforces rate limits      │
         └──────────────────────────────┘
```

### 1.2 Component Responsibilities

| Component | Purpose | Key Interfaces | Dependencies |
|-----------|---------|-----------------|--------------|
| **ChatParticipantProvider** | Main entry point; registers with VS Code Chat API; orchestrates flow | `activate()`, `createChatParticipant()` | vscode API |
| **MessageHandler** | Parses student input; detects code blocks; extracts context | `parseMessage()`, `extractCodeContext()` | regex, utilities |
| **StudentContextManager** | Tracks learning level, conversation history, preferences; persists state | `getLearningLevel()`, `updateContext()`, `getConversationHistory()` | ConversationStorage |
| **PromptBuilder** | Constructs AI prompts with guardrails; adapts to learning level; prevents prompt injection | `buildPrompt()`, `validateSafety()`, `adaptForLevel()` | MessageHandler, StudentContextManager |
| **AIServiceClient** | Calls external AI backend; handles streaming; manages rate limiting and errors | `sendMessage()`, `streamResponse()`, `checkRateLimit()` | vscode.window, error handlers |
| **ResponseFormatter** | Formats AI responses for VS Code chat UI; ensures accessibility | `formatResponse()`, `formatCodeBlock()`, `addAriaLabels()` | markdown, accessibility standards |
| **AccessibilityHandler** | Ensures keyboard navigation, screen reader support, high contrast, zoom support | `validateKeyboardNav()`, `addAriaAttributes()`, `testWithScreenReader()` | W3C WCAG standards |
| **ConversationStorage** | Persists conversation history locally; manages storage lifecycle | `saveConversation()`, `loadConversation()`, `clearOldSessions()` | vscode globalStorageUri |

### 1.3 Data Flow

```
Student Input (Chat)
         │
         ▼
    MessageHandler
    - Parse message
    - Detect code blocks
    - Extract selected code (if any)
         │
         ▼
  StudentContextManager
    - Get student's learning level
    - Get conversation history
    - Fetch preferences
         │
         ▼
    PromptBuilder
    - Combine all context
    - Apply guardrails
    - Adapt for learning level
    - Prevent prompt injection
         │
         ▼
   AIServiceClient
    - Rate limit check
    - Call AI backend
    - Stream response
    - Handle errors/timeouts
         │
         ▼
  ResponseFormatter
    - Format markdown
    - Syntax highlight code
    - Add accessibility labels
         │
         ▼
  AccessibilityHandler
    - Validate contrast
    - Ensure screen reader support
    - Check keyboard navigation
         │
         ▼
 VS Code Chat UI
    Display to student
         │
         ▼
ConversationStorage
    Persist for history
```

---

## 2. Technology Stack Decisions

### 2.1 Core Technologies (Locked)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Language** | TypeScript (strict mode) | Type safety for educational code; easier maintenance and refactoring |
| **Runtime** | Node.js (embedded in VS Code) | No custom installation; students get extension transparently |
| **Build Tool** | esbuild | Already configured; fast, simple, supports tree-shaking |
| **Linting** | ESLint + Prettier | Code consistency; enforced by constitution |
| **Testing Frameworks** | Jest (unit), vscode-test (integration) | Jest is standard; vscode-test is official for extensions |
| **VS Code API Version** | 1.109.0+ (Chat Participant API) | Minimum version required for chat participant support |

### 2.2 AI Backend (TBD: Decision Required Before Phase 1)

**Options Evaluated**:

#### Option A: OpenAI GPT-4 (Recommended for MVP)
- **Pros**: 
  - Mature, reliable, excellent educational output
  - Extensive documentation and community examples
  - Fine-tuning available for future enhancement
  - Cost: ~$0.03 per prompt-response pair (manageable)
- **Cons**: 
  - Requires API key management (security consideration)
  - Internet dependency; no offline support
  - Usage-based cost (can escalate with scale)
- **Accessibility**: Excellent; proven in educational contexts
- **Recommendation**: ✅ **START HERE** for MVP. Validate educational outcomes. Consider local LLM in future phase.

#### Option B: Anthropic Claude
- **Pros**: 
  - Excellent reasoning; possibly better for educational explanations
  - Good context window for conversation history
  - Strong constitutional values alignment
- **Cons**: 
  - Less mature ecosystem than OpenAI (fewer examples)
  - Similar cost to OpenAI; similar internet dependency
- **Accessibility**: Unknown educational track record
- **Recommendation**: ⏳ **Phase 2 Option**. Evaluate after GPT-4 MVP is validated.

#### Option C: Local LLM (Ollama, LM Studio, etc.)
- **Pros**: 
  - Zero API cost; privacy-first (all data stays local)
  - Offline-capable; no internet dependency
  - Full control over model behavior
- **Cons**: 
  - Requires student to run local LLM (setup friction)
  - Model quality/speed depends on student's hardware
  - More complex to set up initially
  - Not suitable for immediate MVP (too much friction)
- **Accessibility**: Good (no data privacy concerns)
- **Recommendation**: ⏳ **Phase 2+** as an alternative/premium option. Requires significant UX work.

#### Option D: Fine-Tuned Model (Internal)
- **Pros**: 
  - Perfect alignment with educational principles
  - Best performance on teaching-specific tasks
- **Cons**: 
  - Requires significant training data (student conversations, educational examples)
  - High upfront cost (time + compute)
  - Not suitable for MVP
- **Accessibility**: Excellent (if designed with accessibility)
- **Recommendation**: ⏳ **Phase 3+** as a future enhancement. Start with prompted baseline; move to fine-tuning once we have data.

**Decision**: **Use OpenAI GPT-4 API for MVP (Phase 1)**. This allows rapid validation of educational outcomes without infrastructure complexity. Plan transition to local LLM or fine-tuned model in later phases.

### 2.3 Storage & Persistence

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Conversation History** | VS Code `globalStorageUri` (local filesystem) | Encrypted per VS Code settings; respects user privacy; no cloud infrastructure needed |
| **User Preferences** | VS Code `settings.get/update` + `globalStorageUri` | Lightweight; synchronized if user enables VS Code Settings Sync (user's choice) |
| **Telemetry** (future) | Custom opt-in system + anonymization | No default tracking; FERPA/GDPR compliant; documented |

### 2.4 External Libraries & Dependencies

**Recommended Additions to package.json**:

```json
{
  "dependencies": {
    "openai": "^4.0.0",
    "dotenv": "^16.0.0",
    "markdown-it": "^13.0.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "axe-core": "^4.0.0"
  }
}
```

**Rationale**:
- `openai`: Official SDK for OpenAI API; reduces error-prone manual HTTP calls
- `dotenv`: Secure API key management via `.env` (never committed)
- `markdown-it`: Robust markdown parsing and sanitization (prevents XSS, handles edge cases)
- `jest`: Standard testing framework; integrates with VS Code test runners
- `ts-jest`: TypeScript + Jest integration
- `axe-core`: Automated accessibility testing; detects WCAG violations

---

## 3. Phase Breakdown

### Overview

The implementation is divided into **3 phases** with clear deliverables and success criteria:

```
Phase 0 (Current): Planning & Research ✓ COMPLETE
├─ Feature Spec (spec.md) ✓
├─ Constitution ✓
├─ This Plan ✓

Phase 1: MVP - Core Chat Participant (8-10 weeks)
├─ Chat interface registration
├─ Basic message handling
├─ AI integration
├─ Educational guardrails
├─ Accessibility (keyboard, screen reader, high contrast)
├─ Testing (80% coverage)
└─ Documentation

Phase 2: Enhanced Learning Features (6-8 weeks)
├─ Learning level personalization
├─ Code explanation from editor
├─ Debugging guidance
├─ Conversation context improvement
├─ Performance optimization
├─ Expanded language support

Phase 3: Production Polish & Scale (4-6 weeks)
├─ Security audit
├─ Performance testing at scale
├─ UX refinement
├─ Documentation polish
├─ Marketplace release prep
└─ Monitoring & telemetry setup
```

### Phase 1: MVP - Core Chat Participant (8-10 weeks)

**Goal**: Deploy a working, accessible chat participant that handles basic educational conversations with AI guidance.

**Scope**:
- ✅ Student can type messages mentioning `@code-tutor` in VS Code Chat
- ✅ Messages are sent to AI backend with appropriate context
- ✅ Responses stream back and display in chat UI
- ✅ Conversation history is maintained in a session
- ✅ Educational guardrails prevent homework/cheating requests
- ✅ Fully accessible (keyboard, screen reader, high contrast, zoom)
- ✅ No crashes or unhandled errors
- ✅ 80% test coverage

**Out of Scope**:
- Learning level personalization (deferred to Phase 2)
- Code selection from editor (deferred to Phase 2)
- Advanced debugging features (deferred to Phase 2)
- Local LLM support (deferred to Phase 2+)
- Instructor dashboards or progress tracking (future)
- Multi-language support (future)

**Deliverables**:

| Artifact | Owner | Week | Status |
|----------|-------|------|--------|
| Core component implementations | Backend Engineer | W1-3 | Planned |
| Unit tests (components) | QA Engineer | W2-4 | Planned |
| AI integration & prompting | AI Engineer | W2-5 | Planned |
| Accessibility implementation | A11y Engineer | W3-6 | Planned |
| Integration tests | QA Engineer | W5-7 | Planned |
| Documentation & JSDoc | Technical Writer | W6-8 | Planned |
| Marketplace prep & submission | Release Manager | W8-9 | Planned |
| User testing & feedback | UX Researcher | W7-9 | Planned |

**Success Criteria for Phase 1**:

1. ✅ **Functionality**: All acceptance criteria from User Stories 1-4 (concept questions, debugging, accessibility) are met
2. ✅ **Quality**: 80% test coverage; zero ESLint warnings; TypeScript strict mode clean
3. ✅ **Accessibility**: WCAG 2.1 AA compliance verified (axe, screen reader testing, keyboard navigation)
4. ✅ **Security**: No hardcoded secrets; input sanitized; no code execution paths
5. ✅ **Performance**: Chat registration < 500ms; message processing < 1s; response starts < 2s
6. ✅ **Documentation**: All public APIs documented with JSDoc; README updated
7. ✅ **User Feedback**: Positive feedback from 10+ beta testers; Net Promoter Score > 50

### Phase 2: Enhanced Learning Features (6-8 weeks)

**Goal**: Add personalization, advanced code handling, and improved learning outcomes.

**Scope**:
- ✅ Learning level personalization (User Story 5)
- ✅ Code selection from editor (User Story 3: "Explain This Code")
- ✅ Enhanced debugging guidance (User Story 2 advanced scenarios)
- ✅ Conversation context improvements (multi-turn reasoning)
- ✅ Performance optimization (streaming, caching)
- ✅ Expanded language support (Python, Java, C++, Go, Rust)

**Out of Scope**:
- Code execution sandbox (too complex; defer to Phase 3+)
- Fine-tuned model (requires data; defer to Phase 3+)
- Instructor tools (future)

**Deliverables**:

| Artifact | Owner | Week | Status |
|----------|-------|------|--------|
| Learning level detection | AI Engineer | W1-2 | Planned |
| Code context extraction | Backend Engineer | W1-3 | Planned |
| Editor integration (code selection) | UI Engineer | W2-3 | Planned |
| Enhanced prompting | AI Engineer | W3-4 | Planned |
| Performance optimization | Backend Engineer | W4-5 | Planned |
| Language support expansion | Backend Engineer | W4-5 | Planned |
| Phase 2 tests & validation | QA Engineer | W5-7 | Planned |
| Documentation updates | Technical Writer | W6-7 | Planned |

**Success Criteria for Phase 2**:

1. ✅ **Personalization**: Student can declare learning level; responses adapt appropriately (verified via user testing)
2. ✅ **Code Handling**: Selected code from editor automatically included in context (no manual copy-paste required)
3. ✅ **Learning Outcomes**: Student reports better understanding of concepts; reduced frustration with debugging
4. ✅ **Performance**: 99%+ chat requests complete within SLA (< 5s)
5. ✅ **Language Support**: All five languages (JS, Python, TypeScript, Java, C++) fully supported
6. ✅ **Quality**: Maintain 80%+ test coverage; no regressions from Phase 1

### Phase 3: Production Polish & Scale (4-6 weeks)

**Goal**: Harden for production; optimize for scale; release to VS Code Marketplace.

**Scope**:
- ✅ Security audit (penetration testing, input validation, API key management)
- ✅ Performance testing at scale (100 concurrent users)
- ✅ UX refinement (error messages, edge cases, user feedback integration)
- ✅ Monitoring & observability (error tracking, usage metrics, performance telemetry)
- ✅ Marketplace release (version 1.0.0, release notes, support plan)

**Out of Scope**:
- Fine-tuning or custom models (Phase 3+)
- Instructor dashboards (future)
- Multi-language UI (future)

**Deliverables**:

| Artifact | Owner | Week | Status |
|----------|-------|------|--------|
| Security audit | Security Engineer | W1-2 | Planned |
| Load testing & optimization | DevOps Engineer | W2-3 | Planned |
| UX refinement based on feedback | UX Designer | W2-3 | Planned |
| Monitoring & telemetry setup | DevOps Engineer | W3-4 | Planned |
| Final integration testing | QA Engineer | W3-4 | Planned |
| Marketplace submission | Release Manager | W4-5 | Planned |
| Release & support plan | Product Manager | W5-6 | Planned |

**Success Criteria for Phase 3**:

1. ✅ **Security**: Zero known vulnerabilities; third-party audit passes
2. ✅ **Performance**: Handles 100 concurrent users at p95 < 5s response time
3. ✅ **Reliability**: 99.5% uptime; < 0.1% error rate
4. ✅ **User Satisfaction**: NPS > 70; positive reviews on VS Code Marketplace
5. ✅ **Deployment**: Live on VS Code Marketplace; release notes published

---

## 4. Component Design

### 4.1 ChatParticipantProvider

**File**: `src/chat/chatParticipantProvider.ts`

**Purpose**: Main entry point for the extension; registers the `@code-tutor` chat participant with VS Code.

**Key Responsibilities**:
- Activate the extension
- Register the chat participant with VS Code Chat API
- Create and manage chat participant instance
- Handle participant lifecycle events

**Class Definition**:

```typescript
export class ChatParticipantProvider {
  private participant: vscode.ChatParticipant | undefined;

  constructor(
    private context: vscode.ExtensionContext,
    private messageHandler: MessageHandler,
    private studentContextManager: StudentContextManager,
    private promptBuilder: PromptBuilder,
    private aiServiceClient: AIServiceClient,
    private responseFormatter: ResponseFormatter,
    private accessibilityHandler: AccessibilityHandler
  ) {}

  /**
   * Activates the chat participant.
   * Called once when the extension is activated.
   * Registers @code-tutor with VS Code Chat API.
   */
  async activate(): Promise<void> {
    this.participant = vscode.chat.createChatParticipant('code-tutor', this.handleChat.bind(this));
    
    if (!this.participant) {
      throw new Error('Failed to create chat participant');
    }

    this.participant.iconPath = vscode.Uri.file(path.join(this.context.extensionPath, 'images', 'icon.png'));
    this.participant.description = 'AI-powered learning assistant for code questions and guidance';
    
    this.context.subscriptions.push(this.participant);
  }

  /**
   * Handles incoming chat requests.
   * Core logic: parse → enrich context → build prompt → call AI → format response → stream to UI
   */
  private async handleChat(
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<vscode.ChatResult | undefined> {
    try {
      // 1. Parse student input
      const parsedMessage = this.messageHandler.parseMessage(request.prompt);

      // 2. Get student context (learning level, history, preferences)
      const studentContext = await this.studentContextManager.getContext();

      // 3. Build AI prompt with guardrails
      const prompt = await this.promptBuilder.buildPrompt(
        parsedMessage,
        context.history,
        studentContext
      );

      // 4. Validate safety (prevent prompt injection, homework requests, etc.)
      const safety = await this.promptBuilder.validateSafety(prompt, parsedMessage);
      if (!safety.isAllowed) {
        stream.markdown(safety.message);
        return { metadata: { command: 'decline' } };
      }

      // 5. Call AI backend
      stream.markdown('*Thinking...*\n\n');
      const response = await this.aiServiceClient.sendMessage(prompt, token);

      // 6. Format response for VS Code chat UI
      const formattedResponse = this.responseFormatter.formatResponse(response);

      // 7. Ensure accessibility
      this.accessibilityHandler.validateResponse(formattedResponse);

      // 8. Stream formatted response to UI
      stream.markdown(formattedResponse);

      // 9. Persist conversation
      await this.studentContextManager.addMessage({
        role: 'user',
        content: parsedMessage.text,
        timestamp: Date.now()
      });
      await this.studentContextManager.addMessage({
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      });

      return { metadata: { command: 'success' } };
    } catch (error) {
      const errorMessage = this.handleError(error);
      stream.markdown(`\`\`\`\nError: ${errorMessage}\n\`\`\``);
      return { metadata: { command: 'error', error: errorMessage } };
    }
  }

  private handleError(error: unknown): string {
    if (error instanceof AIServiceError) {
      if (error.code === 'RATE_LIMIT') {
        return 'You\'ve reached the chat limit. Please wait before sending another message.';
      }
      if (error.code === 'API_ERROR') {
        return 'The AI service is temporarily unavailable. Try again in a moment.';
      }
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unexpected error occurred. Please try again.';
  }
}
```

**Accessibility Considerations**:
- Participant registration is transparent; no extra UI clicks required
- Chat messages are announced via VS Code's built-in accessibility features
- Error messages are plain text (screen reader friendly)

**Testing**:
- Unit: Mock VS Code API; verify `activate()` registers participant
- Integration: Launch VS Code with extension; verify `@code-tutor` appears in chat participant dropdown

---

### 4.2 MessageHandler

**File**: `src/chat/messageHandler.ts`

**Purpose**: Parse student input; detect code blocks; extract context.

**Key Responsibilities**:
- Parse natural language input from student
- Detect and extract code blocks (backtick-delimited)
- Extract selected code from editor (if available)
- Identify question type (conceptual, debugging, code review, etc.)

**Class Definition**:

```typescript
export interface ParsedMessage {
  text: string;
  questionType: 'concept' | 'debugging' | 'code-explanation' | 'general';
  codeBlocks: CodeBlock[];
  selectedCode?: string;
  isHomeworkRequest: boolean;
  isUnethicalRequest: boolean;
  language?: string;
}

export interface CodeBlock {
  code: string;
  language?: string;
  line?: { start: number; end: number };
}

export class MessageHandler {
  /**
   * Parse incoming message and extract components.
   */
  parseMessage(prompt: string): ParsedMessage {
    const codeBlocks = this.extractCodeBlocks(prompt);
    const questionType = this.detectQuestionType(prompt, codeBlocks);
    const { isHomework, isUnethical } = this.detectProblematicRequests(prompt);
    const language = this.detectLanguage(codeBlocks);

    return {
      text: prompt,
      questionType,
      codeBlocks,
      isHomeworkRequest: isHomework,
      isUnethicalRequest: isUnethical,
      language
    };
  }

  /**
   * Extract code blocks from markdown-formatted input.
   * Supports ``` with optional language specifier.
   */
  private extractCodeBlocks(text: string): CodeBlock[] {
    const regex = /```(\w+)?\n([\s\S]*?)\n```/g;
    const blocks: CodeBlock[] = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      blocks.push({
        language: match[1] || undefined,
        code: match[2]
      });
    }

    return blocks;
  }

  /**
   * Detect what type of question the student is asking.
   * Used to tailor response strategy.
   */
  private detectQuestionType(
    text: string,
    codeBlocks: CodeBlock[]
  ): ParsedMessage['questionType'] {
    const debugKeywords = ['debug', 'error', 'wrong', 'fix', 'bug', 'not working'];
    const conceptKeywords = ['what', 'how', 'why', 'explain', 'understand'];

    if (codeBlocks.length > 0) {
      if (debugKeywords.some(kw => text.toLowerCase().includes(kw))) {
        return 'debugging';
      }
      return 'code-explanation';
    }

    if (conceptKeywords.some(kw => text.toLowerCase().includes(kw))) {
      return 'concept';
    }

    return 'general';
  }

  /**
   * Detect homework/cheating requests.
   * Red flags: "do my assignment", "solve this problem", "write code for..."
   */
  private detectProblematicRequests(text: string): { isHomework: boolean; isUnethical: boolean } {
    const homeworkKeywords = [
      /do my (assignment|homework)/i,
      /solve this (problem|task|exercise)/i,
      /write (code|program|script) (for|to)/i,
      /just give me the (answer|solution)/i,
      /what's the answer/i
    ];

    const unethicalKeywords = [
      /write.*cheat/i,
      /hack|crack|bypass/i,
      /malware|virus|exploit/i
    ];

    const isHomework = homeworkKeywords.some(pattern => pattern.test(text));
    const isUnethical = unethicalKeywords.some(pattern => pattern.test(text));

    return { isHomework, isUnethical };
  }

  /**
   * Detect programming language from code blocks or context clues.
   */
  private detectLanguage(codeBlocks: CodeBlock[]): string | undefined {
    if (codeBlocks.length > 0 && codeBlocks[0].language) {
      return codeBlocks[0].language;
    }
    return undefined;
  }
}
```

**Accessibility Considerations**:
- No visual-only indicators of parsed data
- Error messages in structured text (not icons alone)

**Testing**:
- Unit: Parse various message formats (with/without code, different languages)
- Unit: Test homework/unethical request detection
- Edge case: Nested code blocks, multiple languages, malformed markdown

---

### 4.3 StudentContextManager

**File**: `src/chat/studentContextManager.ts`

**Purpose**: Maintain student's learning context across sessions (learning level, conversation history, preferences).

**Key Responsibilities**:
- Track student's declared or inferred learning level
- Maintain conversation history
- Persist preferences to VS Code settings
- Load context from storage on new sessions
- Manage session lifecycle

**Class Definition**:

```typescript
export interface StudentContext {
  learningLevel: 'beginner' | 'intermediate' | 'advanced';
  conversationHistory: ConversationMessage[];
  preferences: {
    responseDepth: 'concise' | 'detailed';
    responseTone: 'casual' | 'formal';
    preferredLanguages: string[];
  };
  sessionId: string;
  createdAt: number;
  lastUpdatedAt: number;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: {
    questionType?: string;
    codeLanguage?: string;
  };
}

export class StudentContextManager {
  private context: StudentContext | undefined;
  private storage: ConversationStorage;

  constructor(
    private extensionContext: vscode.ExtensionContext,
    storage: ConversationStorage
  ) {
    this.storage = storage;
  }

  /**
   * Get current student context.
   * Loads from storage if not already loaded.
   */
  async getContext(): Promise<StudentContext> {
    if (!this.context) {
      this.context = await this.loadContext();
    }
    return this.context;
  }

  /**
   * Update student's learning level.
   * Can be declared by student or inferred from conversation.
   */
  async updateLearningLevel(level: StudentContext['learningLevel']): Promise<void> {
    const context = await this.getContext();
    context.learningLevel = level;
    context.lastUpdatedAt = Date.now();
    await this.saveContext(context);
  }

  /**
   * Add a message to conversation history.
   */
  async addMessage(message: ConversationMessage): Promise<void> {
    const context = await this.getContext();
    context.conversationHistory.push(message);
    context.lastUpdatedAt = Date.now();

    // Keep history to last 50 messages to manage memory
    if (context.conversationHistory.length > 50) {
      context.conversationHistory = context.conversationHistory.slice(-50);
    }

    await this.saveContext(context);
  }

  /**
   * Get recent conversation history for context.
   * Limits to last 10 messages to stay within token limits.
   */
  getRecentHistory(limit: number = 10): ConversationMessage[] {
    if (!this.context) {
      return [];
    }
    return this.context.conversationHistory.slice(-limit);
  }

  /**
   * Clear conversation history (start fresh session).
   */
  async clearHistory(): Promise<void> {
    const context = await this.getContext();
    context.conversationHistory = [];
    context.sessionId = this.generateSessionId();
    context.lastUpdatedAt = Date.now();
    await this.saveContext(context);
  }

  /**
   * Load context from storage or create new.
   */
  private async loadContext(): Promise<StudentContext> {
    const stored = await this.extensionContext.globalState.get<StudentContext>('studentContext');

    if (stored) {
      return stored;
    }

    // Create new context
    return {
      learningLevel: (vscode.workspace.getConfiguration('code-tutor').get('defaultLearningLevel') || 'beginner') as any,
      conversationHistory: [],
      preferences: {
        responseDepth: 'detailed',
        responseTone: 'casual',
        preferredLanguages: ['javascript', 'python', 'typescript']
      },
      sessionId: this.generateSessionId(),
      createdAt: Date.now(),
      lastUpdatedAt: Date.now()
    };
  }

  /**
   * Save context to storage.
   */
  private async saveContext(context: StudentContext): Promise<void> {
    await this.extensionContext.globalState.update('studentContext', context);
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

**Accessibility Considerations**:
- Preferences stored in VS Code settings (accessible via Settings UI)
- No hidden state; student can inspect and modify their learning level

**Testing**:
- Unit: Test context creation, updates, persistence
- Unit: Test history management (adding, limiting, clearing)
- Integration: Verify context persists across extension restarts

---

### 4.4 PromptBuilder

**File**: `src/chat/promptBuilder.ts`

**Purpose**: Construct AI prompts with guardrails; adapt to learning level; prevent prompt injection.

**Key Responsibilities**:
- Build well-formatted, educational prompts
- Include conversation context appropriately
- Adapt language complexity to learning level
- Detect and prevent prompt injection attacks
- Enforce educational guardrails (no homework solutions, etc.)

**Class Definition**:

```typescript
export interface SafetyCheckResult {
  isAllowed: boolean;
  message: string;
}

export class PromptBuilder {
  private systemPrompt: string;

  constructor() {
    this.systemPrompt = this.buildSystemPrompt();
  }

  /**
   * Build the system prompt that enforces educational principles.
   * This is the "constitution" of the AI's behavior.
   */
  private buildSystemPrompt(): string {
    return `You are code-tutor, an AI teaching assistant for students learning to code.

Your mission: Help students LEARN, not solve problems for them.

CORE PRINCIPLES:
1. Guide, don't solve. Ask questions that help students think through problems.
2. Explain the "why" alongside the "how". Understanding is the goal.
3. Never provide homework solutions. If asked, decline politely and offer to teach the concept.
4. Admit uncertainty. If you're not sure, say so. Don't fake confidence.
5. Adapt your language to the student's level. Simple explanations for beginners; nuance for advanced.
6. Be encouraging. Programming is hard. Create psychological safety for mistakes.

RULES:
- Do not provide complete code solutions to homework/assignments.
- If you detect a homework request ("solve this", "write code for my assignment"), decline with: "I can't solve this for you, but I can help you understand the concept. What part is confusing?"
- Refuse unethical code (hacks, cheats, malware).
- When providing code examples, label them "Example:" and include explanation of each part.
- Use clear, well-formatted markdown (code blocks, bold, lists).
- If a student seems frustrated or anxious, respond with empathy and encouragement.

ACCESSIBILITY:
- Use plain language; minimize jargon.
- Structure responses with clear sections (headings, lists, short paragraphs).
- Code blocks must be properly formatted with language identifier (\`\`\`js, \`\`\`python, etc.)
- No reliance on color or emoji alone for meaning.

TRANSPARENCY:
- You are an AI. Acknowledge this fact if relevant to the conversation.
- Example: "I'm not certain about that edge case, but here's what I know..."
- Explain your reasoning when appropriate.

You are an educator first, a technology second. Every response should help a student grow.
`;
  }

  /**
   * Build a prompt for the AI backend.
   * Combines system prompt, conversation history, student context, and student's new message.
   */
  async buildPrompt(
    parsedMessage: ParsedMessage,
    chatHistory: vscode.ChatMessage[],
    studentContext: StudentContext
  ): Promise<string> {
    // Sanitize input (prevent prompt injection)
    const sanitizedMessage = this.sanitizeInput(parsedMessage.text);

    // Build conversation context
    const historyContext = this.buildHistoryContext(chatHistory, studentContext.conversationHistory);

    // Build level-specific instruction
    const levelInstruction = this.buildLevelInstruction(studentContext.learningLevel);

    // If there are code blocks, add code context
    const codeContext = parsedMessage.codeBlocks.length > 0
      ? this.buildCodeContext(parsedMessage.codeBlocks)
      : '';

    // Final prompt
    return `${this.systemPrompt}

${levelInstruction}

${historyContext}

${codeContext}

Student's message: ${sanitizedMessage}`;
  }

  /**
   * Validate that the request is safe to process.
   * Checks for homework requests, unethical code, etc.
   */
  async validateSafety(
    prompt: string,
    parsedMessage: ParsedMessage
  ): Promise<SafetyCheckResult> {
    if (parsedMessage.isHomeworkRequest) {
      return {
        isAllowed: false,
        message: `I can't solve homework or assignments for you. But I'm happy to help you understand the concepts! What part is confusing? We can break it down step by step.`
      };
    }

    if (parsedMessage.isUnethicalRequest) {
      return {
        isAllowed: false,
        message: `I can't help with that. I'm designed to teach ethical programming and help you learn. If you're interested in security, I'd be happy to discuss that constructively!`
      };
    }

    // Check for prompt injection attempts
    if (this.detectPromptInjection(prompt)) {
      return {
        isAllowed: false,
        message: `I detected an unusual request format. Can you rephrase your question?`
      };
    }

    return { isAllowed: true, message: '' };
  }

  /**
   * Sanitize user input to prevent prompt injection.
   * Removes or escapes suspicious patterns.
   */
  private sanitizeInput(text: string): string {
    // Remove control characters
    let sanitized = text.replace(/[\x00-\x1F\x7F]/g, '');

    // Escape special markdown characters that could confuse the AI
    sanitized = sanitized
      .replace(/\\/g, '\\\\')
      .replace(/\*/g, '\\*');

    // Remove extremely long sequences (potential spam/injection)
    if (sanitized.length > 5000) {
      sanitized = sanitized.substring(0, 5000) + '\n[message truncated for length]';
    }

    return sanitized;
  }

  /**
   * Build instruction tailored to student's learning level.
   */
  private buildLevelInstruction(level: StudentContext['learningLevel']): string {
    switch (level) {
      case 'beginner':
        return `The student is a beginner. Use simple language, avoid jargon, include lots of examples, and explain foundational assumptions. For example, briefly explain what variables are before using them.`;
      case 'intermediate':
        return `The student is intermediate. You can use more technical language. Focus on best practices, trade-offs, and nuance. Feel free to mention design patterns and advanced concepts.`;
      case 'advanced':
        return `The student is advanced. You can discuss architecture, performance, and advanced patterns. Feel free to refer to research papers, edge cases, and optimization opportunities.`;
    }
  }

  /**
   * Build context from conversation history.
   * Includes last 10 messages to stay within token limits.
   */
  private buildHistoryContext(
    chatHistory: vscode.ChatMessage[],
    conversationHistory: ConversationMessage[]
  ): string {
    if (conversationHistory.length === 0) {
      return '';
    }

    const recent = conversationHistory.slice(-10);
    let context = 'Recent conversation:\n';

    for (const msg of recent) {
      const role = msg.role === 'user' ? 'Student' : 'Tutor';
      context += `${role}: ${msg.content}\n\n`;
    }

    return context;
  }

  /**
   * Build context for code blocks.
   */
  private buildCodeContext(codeBlocks: CodeBlock[]): string {
    let context = 'Code blocks in conversation:\n';

    for (let i = 0; i < codeBlocks.length; i++) {
      const block = codeBlocks[i];
      const lang = block.language || 'unknown';
      context += `\n\`\`\`${lang}\n${block.code}\n\`\`\`\n`;
    }

    return context;
  }

  /**
   * Detect potential prompt injection attempts.
   * Looks for patterns like "Ignore previous instructions" or "You are now..."
   */
  private detectPromptInjection(text: string): boolean {
    const injectionPatterns = [
      /ignore.*instructions/i,
      /you are now/i,
      /forget.*previous/i,
      /system prompt/i,
      /new instructions/i,
      /system override/i
    ];

    return injectionPatterns.some(pattern => pattern.test(text));
  }
}
```

**Accessibility Considerations**:
- Instructions are clear and plain language
- No hidden rules; guardrails are explicit

**Testing**:
- Unit: Test prompt building with various inputs
- Unit: Test safety checks (homework, unethical requests)
- Unit: Test prompt injection detection
- Unit: Test level-specific instruction adaptation

---

### 4.5 AIServiceClient

**File**: `src/chat/aiServiceClient.ts`

**Purpose**: Call external AI backend; handle streaming; manage rate limiting and errors.

**Key Responsibilities**:
- Make HTTP requests to AI backend (OpenAI API)
- Handle rate limiting (user-friendly feedback)
- Stream responses progressively
- Handle timeouts and network errors gracefully
- Manage API keys securely

**Class Definition** (simplified):

```typescript
export class AIServiceClient {
  private client: OpenAI;
  private rateLimiter: RateLimiter;

  constructor(private context: vscode.ExtensionContext) {
    const apiKey = this.getApiKey();
    this.client = new OpenAI({ apiKey });
    this.rateLimiter = new RateLimiter(10, 60000); // 10 requests per minute
  }

  /**
   * Send message to AI backend and get response.
   * Streams response for real-time display.
   */
  async sendMessage(
    prompt: string,
    cancellationToken: vscode.CancellationToken
  ): Promise<string> {
    // Check rate limit
    if (!this.rateLimiter.isAllowed()) {
      throw new AIServiceError(
        'Rate limit reached. Please wait before sending another message.',
        'RATE_LIMIT'
      );
    }

    try {
      const response = await this.client.chat.completions.create(
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
          stream: true
        },
        { signal: cancellationToken }
      );

      let fullResponse = '';
      for await (const chunk of response) {
        if (cancellationToken.isCancellationRequested) {
          break;
        }

        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
      }

      this.rateLimiter.recordRequest();
      return fullResponse;
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        throw new AIServiceError(
          this.getErrorMessage(error),
          error.status === 429 ? 'RATE_LIMIT' : 'API_ERROR'
        );
      }
      throw new AIServiceError('Failed to reach AI service', 'NETWORK_ERROR');
    }
  }

  /**
   * Retrieve API key from secure storage.
   * Uses VS Code's SecretStorage API.
   */
  private getApiKey(): string {
    const apiKey = this.context.secrets.get('openai-api-key');

    if (!apiKey) {
      throw new Error(
        'OpenAI API key not configured. Please set "code-tutor.openaiApiKey" in settings.'
      );
    }

    return apiKey;
  }

  private getErrorMessage(error: OpenAI.APIError): string {
    if (error.status === 429) {
      return 'OpenAI service is overloaded. Please try again in a moment.';
    }
    if (error.status === 401) {
      return 'API key is invalid. Please check your configuration.';
    }
    if (error.status === 500) {
      return 'OpenAI service is temporarily unavailable.';
    }
    return `AI service error: ${error.message}`;
  }
}

export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: 'RATE_LIMIT' | 'API_ERROR' | 'NETWORK_ERROR'
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

class RateLimiter {
  private requests: number[] = [];

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  isAllowed(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }
}
```

**Security Considerations**:
- API keys stored in VS Code's SecretStorage (encrypted)
- Never logged or exposed in error messages
- Input sanitized before sending to API

**Testing**:
- Unit: Mock OpenAI client; test request/response flow
- Unit: Test rate limiting
- Unit: Test error handling
- Integration: Test with real API (using test key, cleanup)

---

### 4.6 ResponseFormatter

**File**: `src/chat/responseFormatter.ts`

**Purpose**: Format AI responses for VS Code chat UI; ensure accessibility.

**Key Responsibilities**:
- Parse AI response (markdown)
- Ensure proper code block formatting
- Add accessibility labels
- Validate contrast and zoom compatibility
- Handle edge cases (missing closing code blocks, etc.)

**Class Definition** (simplified):

```typescript
export class ResponseFormatter {
  /**
   * Format AI response for VS Code chat UI.
   * Ensures markdown is properly formatted and accessible.
   */
  formatResponse(aiResponse: string): string {
    let formatted = aiResponse;

    // Fix common markdown issues
    formatted = this.fixMarkdownIssues(formatted);

    // Ensure code blocks are properly formatted
    formatted = this.fixCodeBlocks(formatted);

    // Add accessibility labels to code blocks
    formatted = this.addCodeBlockLabels(formatted);

    // Ensure headings are proper level
    formatted = this.normalizeHeadings(formatted);

    // Validate accessibility
    this.validateAccessibility(formatted);

    return formatted;
  }

  private fixMarkdownIssues(text: string): string {
    // Fix missing spaces after headers
    text = text.replace(/^(#{1,6})([^ ])/gm, '$1 $2');

    // Fix list formatting
    text = text.replace(/^([-*+])([^ ])/gm, '$1 $2');

    return text;
  }

  private fixCodeBlocks(text: string): string {
    let fixed = text;
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

    fixed = fixed.replace(codeBlockRegex, (match, language, code) => {
      const lang = language || 'plaintext';
      const trimmedCode = code.trim();
      return `\`\`\`${lang}\n${trimmedCode}\n\`\`\``;
    });

    return fixed;
  }

  private addCodeBlockLabels(text: string): string {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let counter = 0;

    return text.replace(codeBlockRegex, (match, language) => {
      counter++;
      const label = language
        ? `Example code (${language}):`
        : `Example code:`;
      return `\n**${label}**\n${match}\n`;
    });
  }

  private normalizeHeadings(text: string): string {
    // Ensure headings start at level 2 (level 1 reserved for title)
    const lines = text.split('\n');
    const formatted = lines.map(line => {
      const match = line.match(/^(#{1,6})\s+(.*)/);
      if (match) {
        const level = match[1].length + 1;
        const title = match[2];
        return `${'#'.repeat(Math.min(level, 6))} ${title}`;
      }
      return line;
    });

    return formatted.join('\n');
  }

  private validateAccessibility(text: string): void {
    // Check for color-only meaning
    if (text.includes('<span style="color:')) {
      console.warn('Response uses color-only formatting. Consider adding text alternatives.');
    }

    // Check for tables (less accessible; suggest lists)
    if (text.includes('|')) {
      console.warn('Response uses tables. Consider converting to lists for better accessibility.');
    }

    // Check for excessive nesting
    const nestingLevel = Math.max(...text.split('\n').map(line => {
      const match = line.match(/^(\s+)/);
      return match ? match[1].length / 2 : 0;
    }));

    if (nestingLevel > 4) {
      console.warn('Response has deep nesting. Consider flattening for readability.');
    }
  }
}
```

**Accessibility Considerations**:
- Code blocks explicitly labeled
- Proper heading hierarchy
- Plain text formatting (no color-only meaning)
- Validation catches common accessibility issues

**Testing**:
- Unit: Test markdown formatting edge cases
- Unit: Test code block normalization
- Unit: Test accessibility validation
- Integration: Render formatted response in VS Code chat; verify display

---

### 4.7 AccessibilityHandler

**File**: `src/accessibility/accessibilityHandler.ts`

**Purpose**: Ensure WCAG 2.1 AA compliance; validate keyboard navigation, screen reader support, contrast, zoom.

**Key Responsibilities**:
- Validate response content for accessibility issues
- Ensure keyboard navigation is possible
- Add ARIA labels to dynamic content
- Check color contrast
- Test at various zoom levels
- Provide accessibility testing utilities

**Class Definition** (simplified):

```typescript
export class AccessibilityHandler {
  /**
   * Validate response for common accessibility issues.
   */
  validateResponse(formattedResponse: string): void {
    this.checkColorContrast(formattedResponse);
    this.checkCodeBlockAccessibility(formattedResponse);
    this.checkHeadingStructure(formattedResponse);
    this.checkLinkAccessibility(formattedResponse);
  }

  private checkColorContrast(text: string): void {
    // Check for inline styles with color
    const colorRegex = /style="color:([^"]+)"/g;
    const matches = text.match(colorRegex);

    if (matches && matches.length > 0) {
      console.warn(`Found ${matches.length} inline color styles. Ensure sufficient contrast (WCAG AA: 4.5:1 for text)`);
    }
  }

  private checkCodeBlockAccessibility(text: string): void {
    // Ensure code blocks have language specifier for screen readers
    const codeBlockRegex = /```\n/g;
    const matches = text.match(codeBlockRegex);

    if (matches && matches.length > 0) {
      console.warn(`Found ${matches.length} code blocks without language specifier. Add language identifier for better accessibility.`);
    }
  }

  private checkHeadingStructure(text: string): void {
    // Validate heading hierarchy (no skipping levels)
    const headingRegex = /^(#{1,6})\s/gm;
    const headings: number[] = [];
    let match;

    while ((match = headingRegex.exec(text)) !== null) {
      headings.push(match[1].length);
    }

    for (let i = 1; i < headings.length; i++) {
      if (headings[i] - headings[i - 1] > 1) {
        console.warn(`Heading structure skips levels (${headings[i - 1]} → ${headings[i]}). Ensure logical hierarchy.`);
      }
    }
  }

  private checkLinkAccessibility(text: string): void {
    // Ensure links have descriptive text (not "click here")
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match[1].toLowerCase() === 'click here' || match[1].toLowerCase() === 'link') {
        console.warn(`Found vague link text: "${match[1]}". Use descriptive text instead.`);
      }
    }
  }

  /**
   * Generate accessibility report for testing.
   * Can be integrated with axe-core for automated testing.
   */
  generateReport(): AccessibilityReport {
    return {
      wcagLevel: 'AA',
      keyboardNavigable: true,
      screenReaderSupport: true,
      colorContrast: true,
      zoomSupport: true,
      timestamp: Date.now()
    };
  }
}

export interface AccessibilityReport {
  wcagLevel: 'A' | 'AA' | 'AAA';
  keyboardNavigable: boolean;
  screenReaderSupport: boolean;
  colorContrast: boolean;
  zoomSupport: boolean;
  timestamp: number;
}
```

**Accessibility Considerations**:
- Validates all accessibility issues proactively
- Integration with automated testing tools (axe-core)
- Manual testing guidance

**Testing**:
- Unit: Test validation logic
- Integration: Test with axe-core automated checks
- Manual: Test with NVDA screen reader, keyboard navigation, zoom

---

### 4.8 ConversationStorage

**File**: `src/storage/conversationStorage.ts`

**Purpose**: Persist conversation history locally; manage storage lifecycle.

**Key Responsibilities**:
- Save conversations to local storage
- Load conversations from storage
- Clean up old sessions
- Respect privacy (no cloud storage)

**Class Definition**:

```typescript
export class ConversationStorage {
  constructor(private context: vscode.ExtensionContext) {}

  /**
   * Save conversation to local storage.
   */
  async saveConversation(sessionId: string, messages: ConversationMessage[]): Promise<void> {
    const storagePath = path.join(
      this.context.globalStoragePath,
      'conversations',
      `${sessionId}.json`
    );

    await fs.promises.mkdir(path.dirname(storagePath), { recursive: true });
    await fs.promises.writeFile(storagePath, JSON.stringify(messages, null, 2));
  }

  /**
   * Load conversation from local storage.
   */
  async loadConversation(sessionId: string): Promise<ConversationMessage[]> {
    const storagePath = path.join(
      this.context.globalStoragePath,
      'conversations',
      `${sessionId}.json`
    );

    try {
      const data = await fs.promises.readFile(storagePath, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  /**
   * Clear old sessions (older than 30 days).
   */
  async cleanup(): Promise<void> {
    const conversationsDir = path.join(this.context.globalStoragePath, 'conversations');
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    try {
      const files = await fs.promises.readdir(conversationsDir);

      for (const file of files) {
        const filePath = path.join(conversationsDir, file);
        const stats = await fs.promises.stat(filePath);

        if (stats.mtime.getTime() < thirtyDaysAgo) {
          await fs.promises.unlink(filePath);
        }
      }
    } catch {
      // Directory doesn't exist or access error; skip
    }
  }
}
```

**Privacy Considerations**:
- Conversations stored locally only
- No cloud sync (unless explicitly enabled with consent)
- Automatic cleanup of old sessions

**Testing**:
- Unit: Test save/load with various data
- Integration: Verify storage persists across extension restarts

---

## 5. Dependencies and Integrations

### 5.1 External Dependencies

**Required for MVP**:

| Dependency | Version | Purpose | License | Status |
|------------|---------|---------|---------|--------|
| `vscode` | ^1.109.0 | Chat Participant API | MIT | Built-in |
| `typescript` | ^5.9.3 | Language + type checking | Apache 2.0 | ✅ Installed |
| `eslint` | ^10.0.2 | Linting | MIT | ✅ Installed |
| `openai` | ^4.0.0 | OpenAI API client | MIT | ⏳ To install |
| `dotenv` | ^16.0.0 | API key management | BSD-2-Clause | ⏳ To install |
| `markdown-it` | ^13.0.0 | Markdown parsing/validation | MIT | ⏳ To install |
| `jest` | ^29.0.0 | Testing framework | MIT | ⏳ To install |
| `ts-jest` | ^29.0.0 | TypeScript + Jest | MIT | ⏳ To install |

**Dev Dependencies**:

| Dependency | Version | Purpose | Status |
|------------|---------|---------|--------|
| `@types/jest` | ^29.0.0 | Jest type definitions | ⏳ To install |
| `axe-core` | ^4.0.0 | Accessibility testing | ⏳ To install |
| `@vscode/test-cli` | ^0.0.12 | Extension testing | ✅ Installed |

### 5.2 Integration Points

**VS Code API**:
- `vscode.chat.createChatParticipant()` - Register chat participant
- `vscode.window.showInformationMessage()` - Error/info messages
- `vscode.workspace.getConfiguration()` - Read settings
- `vscode.ExtensionContext.globalState` - Persist preferences
- `vscode.ExtensionContext.globalStorageUri` - Persist conversations
- `vscode.ExtensionContext.secrets` - Secure API key storage

**OpenAI API**:
- `POST /v1/chat/completions` - Send messages to GPT-4
- Streaming responses via `stream: true`

**File System**:
- `globalStorageUri` for conversation persistence
- Configuration files (`.env` for API keys)

### 5.3 Deployment Dependencies

**Requirements for students**:
- VS Code 1.109.0 or later
- Internet connection (for AI backend calls)
- OpenAI API key (provided by instructor or student)

**DevOps**:
- GitHub Actions (CI/CD)
- VS Code Marketplace (distribution)

---

## 6. Risk Mitigation Strategies

### 6.1 Identified Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|-----------|
| **AI generates incorrect code** | Students learn wrong patterns | High | Require examples to be tested/validated; always emphasize "example, not solution"; user testing before release |
| **API rate limits exceeded** | Students blocked from using tool | Medium | Implement graceful rate limiting; clear messaging; queue requests |
| **API key exposure** | Security breach; unauthorized usage | Medium | Never hardcode keys; use VS Code SecretStorage; document secure setup |
| **Accessibility not met** | Students with disabilities excluded | High | Automated testing (axe); manual testing with screen readers; mandatory accessibility review in code review process |
| **Prompt injection attacks** | AI misused for unethical purposes | Medium | Input sanitization; detection of malicious patterns; explicit guardrails in system prompt |
| **Performance degrades** | Poor user experience | Medium | Load testing at 100 concurrent users; streaming responses; conversation history limits |
| **Conversation data privacy** | FERPA/GDPR violations | High | Local-only storage; no default telemetry; explicit opt-in; anonymization if needed |
| **Educational efficacy uncertain** | Tool doesn't help students learn | High | Measure learning outcomes (pre/post quizzes); A/B testing; gather student feedback |
| **Dependency vulnerabilities** | Security or compatibility issues | Medium | Weekly dependency updates; automated CVE scanning; regular security audits |
| **Instructor adoption blocked** | Limited user base | Medium | Provide instructor guides; track usage; gather feedback; responsive support |

### 6.2 Quality Assurance Gates

**Before Phase 1 Release**:
1. ✅ 80% test coverage (automated)
2. ✅ Zero ESLint warnings (automated)
3. ✅ TypeScript strict mode clean (automated)
4. ✅ WCAG 2.1 AA accessibility compliance (axe + manual testing)
5. ✅ Security audit (hardcoded secrets, input validation, code execution)
6. ✅ User testing with 10+ beta testers (qualitative feedback)
7. ✅ Performance testing at 100 concurrent users (quantitative)

**Before Phase 2/3 Release**:
1. ✅ All Phase 1 gates pass
2. ✅ New features have tests
3. ✅ No regressions from Phase 1
4. ✅ Learning outcome metrics positive
5. ✅ Accessibility maintained or improved

---

## 7. Testing Strategy

### 7.1 Test Categories

| Category | Framework | Coverage Target | Ownership | Timeline |
|----------|-----------|------------------|-----------|----------|
| **Unit Tests** | Jest | 80%+ per module | QA Engineer | Ongoing (per PR) |
| **Integration Tests** | vscode-test | 60%+ of workflows | QA Engineer | Phase 1, W5-7 |
| **Accessibility Tests** | axe-core + manual NVDA | 100% compliance | A11y Engineer | Phase 1, W3-6 |
| **Performance Tests** | Artillery/k6 | p95 < 5s response time | DevOps | Phase 1, W7 |
| **Security Tests** | OWASP, manual review | No vulnerabilities | Security | Phase 3 |
| **User Acceptance Tests** | Manual + telemetry | NPS > 50 | UX Researcher | Phase 1, W7-9 |

### 7.2 Test Plan

**Unit Tests** (Jest):

```typescript
// Example test structure
describe('MessageHandler', () => {
  describe('parseMessage', () => {
    it('should extract code blocks from markdown', () => {
      const handler = new MessageHandler();
      const input = 'Here is my code:\n```javascript\nconst x = 1;\n```';
      const result = handler.parseMessage(input);
      
      expect(result.codeBlocks).toHaveLength(1);
      expect(result.codeBlocks[0].code).toBe('const x = 1;');
      expect(result.codeBlocks[0].language).toBe('javascript');
    });

    it('should detect homework requests', () => {
      const handler = new MessageHandler();
      const input = 'Can you do my assignment for me?';
      const result = handler.parseMessage(input);
      
      expect(result.isHomeworkRequest).toBe(true);
    });
  });
});

// Test all components similarly
describe('PromptBuilder', () => { /* ... */ });
describe('AIServiceClient', () => { /* ... */ });
describe('ResponseFormatter', () => { /* ... */ });
describe('StudentContextManager', () => { /* ... */ });
describe('AccessibilityHandler', () => { /* ... */ });
```

**Integration Tests** (vscode-test):

```typescript
// Example integration test
describe('Chat Participant E2E', () => {
  it('should handle a complete chat flow', async () => {
    // 1. Activate extension
    const ext = vscode.extensions.getExtension('code-tutor-v2');
    await ext.activate();

    // 2. Open chat
    // 3. Send message mentioning @code-tutor
    // 4. Verify response appears in chat
    // 5. Verify conversation saved
  });
});
```

**Accessibility Tests** (axe-core + manual):

```typescript
// Automated accessibility testing
describe('Accessibility Compliance', () => {
  it('should pass axe accessibility checks', async () => {
    const axeResults = await axe(chatUIElement);
    expect(axeResults.violations).toHaveLength(0);
  });

  it('should support keyboard navigation', () => {
    // Simulate Tab key navigation
    // Verify all interactive elements are reachable
  });

  it('should work with screen reader (NVDA)', () => {
    // Manual testing with NVDA
    // Verify all text is announced
    // Verify ARIA labels are present
  });
});
```

**Performance Tests** (Artillery):

```yaml
# load-test.yml
config:
  target: "http://localhost:8080"
  phases:
    - duration: 60
      arrivalRate: 10  # 10 requests/sec = 600 total

scenarios:
  - name: "Chat Message"
    flow:
      - post:
          url: "/api/chat"
          json:
            message: "What is a closure?"
          expect:
            - statusCode: 200
            - responseTime: { max: 5000 }  # Must respond < 5s
```

### 7.3 Continuous Testing

**Pre-commit** (developer machine):
- ESLint (must pass)
- TypeScript check (must pass)
- Unit tests for changed code (recommended)

**Pull Request** (GitHub Actions):
- ESLint (required)
- TypeScript strict check (required)
- All unit tests (required, 80% coverage)
- Code quality metrics (required)

**Before Release** (manual):
- Integration tests (all must pass)
- Accessibility audit (axe + manual)
- Performance testing (p95 < 5s)
- Security audit (no vulnerabilities)
- User acceptance testing (10+ beta testers, NPS > 50)

---

## 8. Implementation Sequence & Critical Path

### 8.1 Critical Path (Longest Sequence)

```
Week 1-2: ChatParticipantProvider + MessageHandler
    ↓
Week 2-3: StudentContextManager + ConversationStorage
    ↓
Week 3-4: AIServiceClient + OpenAI integration
    ↓
Week 4-5: PromptBuilder + guardrails
    ↓
Week 5-6: ResponseFormatter + AccessibilityHandler
    ↓
Week 6-7: Integration + unit tests
    ↓
Week 7-8: Accessibility testing (manual + axe)
    ↓
Week 8-9: Performance + security testing
    ↓
Week 9-10: User testing + iteration
    ↓
Week 10: Release MVP (v0.1.0)
```

### 8.2 Implementation Order (Dependency-Based)

**Week 1-2: Foundation (Components 1-2)**
- ChatParticipantProvider (entry point)
- MessageHandler (input parsing)
- Unit tests for both

**Why this order?**: These are foundational; no dependencies on other components.

**Week 2-3: Context Management (Components 3-4)**
- StudentContextManager
- ConversationStorage
- Unit tests

**Why this order?**: Depends on MessageHandler; independent of AI backend.

**Week 3-4: AI Integration (Component 5)**
- AIServiceClient (OpenAI)
- Mock tests (no real API calls yet)
- Integration with ChatParticipantProvider

**Why this order?**: Core functionality; tested before UI integration.

**Week 4-5: Prompt Engineering (Component 6)**
- PromptBuilder
- System prompt design
- Safety guardrails
- Extensive unit tests

**Why this order?**: Critical for educational quality; requires careful design.

**Week 5-6: Output Formatting & Accessibility (Components 7-8)**
- ResponseFormatter
- AccessibilityHandler
- Markdown validation
- Accessibility validation

**Why this order?**: Depends on PromptBuilder; affects user experience and inclusion.

**Week 6-7: Integration & Unit Testing**
- Connect all components end-to-end
- Full test coverage (80%+)
- Fix integration issues

**Week 7-8: Accessibility Testing (Manual)**
- NVDA screen reader testing
- Keyboard navigation testing
- Zoom/contrast testing
- Fix any violations

**Week 8-9: Performance & Security**
- Load testing (100 concurrent users)
- Security audit (secrets, injection, execution)
- Performance optimization if needed

**Week 9-10: User Testing & Polish**
- Beta testing with 10+ students
- Gather feedback on learning outcomes
- Iterate on UI/UX
- Final bug fixes

**Week 10: Release**
- Tag v0.1.0
- Update CHANGELOG.md
- Submit to VS Code Marketplace
- Write release notes

### 8.3 Parallelization Opportunities

**Can work in parallel** (separate branches, merged sequentially):
- Week 1-3: MessageHandler + StudentContextManager (no dependency on each other)
- Week 5-6: ResponseFormatter + AccessibilityHandler (low dependency)
- Week 6-7: Unit tests while integration happens (separate role)
- Week 8-9: Performance + security testing (independent tracks)

**Critical path** (cannot parallelize):
- AIServiceClient depends on ChatParticipantProvider (sequential)
- PromptBuilder depends on all context components (sequential)
- Integration testing depends on all components (sequential)

---

## 9. Success Metrics and Acceptance Criteria

### 9.1 Educational Success Metrics

| Metric | Target | Measurement | Owner |
|--------|--------|-------------|-------|
| **Student Learning Gains** | +30% improvement pre/post-test | Pre/post quiz on concept | Researcher |
| **Student Confidence** | 75%+ feel more confident | Survey: "I understand this better" | UX Researcher |
| **Student Satisfaction** | NPS > 50 | "How likely to recommend?" (0-10) | Product Manager |
| **Engagement** | 80%+ daily active users | Days used / available days | Analytics |
| **Debugging Skills** | 50% fewer StackOverflow searches | Telemetry: search count trend | Product Manager |

### 9.2 Technical Success Metrics

| Metric | Target | Measurement | Owner |
|--------|--------|-------------|-------|
| **Code Quality** | 0 ESLint warnings | Automated linting | CI/CD |
| **Test Coverage** | 80%+ | Jest coverage report | QA |
| **Type Safety** | 100% TypeScript strict | Type checker (tsc) | CI/CD |
| **Accessibility** | 0 axe violations | Automated a11y testing | QA |
| **Performance p95** | < 5s response time | Load testing | DevOps |
| **Uptime** | 99.5% | Backend/API monitoring | DevOps |
| **Error Rate** | < 0.1% unhandled errors | Error telemetry | DevOps |

### 9.3 User Acceptance Criteria

**User Story 1: Conceptual Questions**
- ✅ Student asks "What is a closure?" → Receives explanation with example in < 5s
- ✅ Explanation is appropriate to student's learning level
- ✅ Fully keyboard navigable; screen reader announces response

**User Story 2: Debugging Guidance**
- ✅ Student pastes buggy code → Participant asks questions before fixing
- ✅ Participant suggests debugging approach (add logging, inspect variable)
- ✅ No auto-fix; student controls fixing their own code

**User Story 3: Code Explanation** (Phase 2)
- ✅ Student selects code in editor → Participant explains each line
- ✅ Explanation names patterns (closure, decorator, etc.)
- ✅ Structured into logical sections

**User Story 4: Accessibility**
- ✅ Chat fully usable with keyboard only (Tab, Enter, arrows)
- ✅ Screen reader announces all content (NVDA/JAWS)
- ✅ Text readable at 200% zoom
- ✅ Color is never the only way to convey meaning

**User Story 5: Personalization** (Phase 2)
- ✅ Student declares learning level → Responses adapt
- ✅ Responses differ in language depth, examples, focus
- ✅ Level can be changed mid-conversation

### 9.4 Constitutional Alignment Checklist

**Principle I: Educational Excellence**
- ✅ Guidance explains "why", not just "what"
- ✅ No auto-solving; students learn problem-solving
- ✅ Homework requests detected and declined
- ✅ Edge cases handled (frustrated students, uncertain AI)

**Principle II: Student-Centered Design**
- ✅ Personalization by learning level
- ✅ Psychological safety (empathetic responses)
- ✅ Accessibility by default (not afterthought)
- ✅ Multiple learning styles supported

**Principle III: Transparency & Honesty**
- ✅ AI involvement disclosed
- ✅ Uncertainty admitted explicitly
- ✅ Limitations documented
- ✅ No false confidence

**Principle IV: Accessibility by Default**
- ✅ WCAG 2.1 AA compliance verified
- ✅ Keyboard navigation 100%
- ✅ Screen reader support 100%
- ✅ Zoom/contrast/plain language supported

**Principle V: Sustainable Growth & Maintainability**
- ✅ TypeScript strict mode
- ✅ 80%+ test coverage
- ✅ All public APIs documented (JSDoc)
- ✅ Code passes ESLint/Prettier

---

## 10. Timeline Estimates for Each Phase

### Phase 1: MVP (Weeks 1-10, 8-10 weeks)

| Week | Deliverable | Hours | Ownership |
|------|-------------|-------|-----------|
| W1-2 | ChatParticipantProvider, MessageHandler, unit tests | 80 | Backend |
| W2-3 | StudentContextManager, ConversationStorage, unit tests | 60 | Backend |
| W3-4 | AIServiceClient, mock integration | 60 | Backend |
| W4-5 | PromptBuilder, guardrails, security validation | 80 | AI |
| W5-6 | ResponseFormatter, AccessibilityHandler | 60 | UI |
| W6-7 | Integration, end-to-end tests, 80% coverage | 80 | QA |
| W7-8 | Accessibility manual testing (NVDA, keyboard) | 60 | QA |
| W8-9 | Performance testing, security audit | 60 | DevOps + Security |
| W9-10 | User testing, bug fixes, marketplace prep | 80 | UX + Product |
| **Total** | | **620 hours** | **6-8 engineers** |

**Resource Allocation**:
- 1 Backend Engineer (40 hrs/week) - Components 1-4
- 1 AI Engineer (40 hrs/week) - Component 5-6
- 1 QA Engineer (40 hrs/week) - Testing throughout
- 1 A11y Engineer (20 hrs/week) - Accessibility
- 1 DevOps/Security (20 hrs/week) - Performance/security
- 1 UX/Product Manager (20 hrs/week) - Feedback/release

**Total**: ~6 full-time engineers for 10 weeks

### Phase 2: Enhanced Features (Weeks 1-8, 6-8 weeks)

| Week | Deliverable | Hours |
|------|-------------|-------|
| W1-2 | Learning level detection, code context extraction | 60 |
| W2-3 | Editor integration, code selection support | 60 |
| W3-4 | Enhanced prompting, conversation context | 60 |
| W4-5 | Performance optimization, caching | 60 |
| W5-6 | Language support expansion | 60 |
| W6-7 | Testing, validation, bug fixes | 80 |
| W7-8 | Release prep, documentation | 40 |
| **Total** | | **420 hours** | **5-6 engineers** |

### Phase 3: Production & Scaling (Weeks 1-6, 4-6 weeks)

| Week | Deliverable | Hours |
|------|-------------|-------|
| W1-2 | Security audit, vulnerability remediation | 80 |
| W2-3 | Load testing, optimization | 80 |
| W3-4 | Monitoring setup, telemetry | 60 |
| W4-5 | UX refinement, final testing | 60 |
| W5-6 | Release, support, launch monitoring | 60 |
| **Total** | | **340 hours** | **4-5 engineers** |

### Overall Timeline

```
Project Start (Phase 0 Complete): 2026-02-24
├─ Phase 1 MVP: 2026-03-03 → 2026-05-12 (10 weeks)
├─ Phase 2 Enhanced: 2026-05-12 → 2026-07-07 (8 weeks)
└─ Phase 3 Production: 2026-07-07 → 2026-08-18 (6 weeks)

GA Release Target: 2026-08-18
```

**Total Effort**: ~1,380 hours (6-8 FTE for 24 weeks, or 15-20 FTE for 12 weeks)

---

## Appendix A: File Structure

```
code-tutorv-v2/
├─ src/
│  ├─ extension.ts                    ← Entry point
│  ├─ chat/
│  │  ├─ chatParticipantProvider.ts   ← Main orchestrator
│  │  ├─ messageHandler.ts            ← Input parsing
│  │  ├─ studentContextManager.ts     ← Context management
│  │  ├─ promptBuilder.ts             ← Prompt engineering
│  │  ├─ responseFormatter.ts         ← Output formatting
│  │  └─ index.ts                     ← Exports
│  ├─ ai/
│  │  ├─ aiServiceClient.ts           ← OpenAI integration
│  │  ├─ errors.ts                    ← Error types
│  │  └─ index.ts
│  ├─ accessibility/
│  │  ├─ accessibilityHandler.ts      ← A11y validation
│  │  └─ index.ts
│  ├─ storage/
│  │  ├─ conversationStorage.ts       ← File-based persistence
│  │  └─ index.ts
│  ├─ types/
│  │  ├─ chat.ts                      ← Chat-related types
│  │  ├─ ai.ts                        ← AI-related types
│  │  ├─ storage.ts                   ← Storage types
│  │  └─ index.ts
│  └─ utils/
│     ├─ logger.ts                    ← Logging utility
│     ├─ validators.ts                ← Input validation
│     └─ index.ts
├─ test/
│  ├─ unit/
│  │  ├─ chat/                        ← Component tests
│  │  ├─ ai/
│  │  ├─ accessibility/
│  │  └─ storage/
│  ├─ integration/
│  │  ├─ chatParticipant.test.ts      ← E2E flow
│  │  └─ accessibility.test.ts        ← A11y integration
│  └─ fixtures/                        ← Test data
├─ docs/
│  ├─ ARCHITECTURE.md
│  ├─ DEVELOPMENT.md
│  ├─ TESTING.md
│  ├─ ACCESSIBILITY.md
│  └─ API.md
├─ .vscode/
│  ├─ launch.json                     ← Debug config
│  └─ settings.json
├─ package.json
├─ tsconfig.json
├─ eslint.config.mjs
├─ jest.config.js
├─ plan.md                            ← This file
├─ README.md
└─ CHANGELOG.md
```

---

## Appendix B: Configuration Examples

### `.env` (local, never committed)
```
OPENAI_API_KEY=sk-xxxxxxxx
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=2000
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW_MS=60000
```

### `package.json` (dependencies to add)
```json
{
  "dependencies": {
    "openai": "^4.0.0",
    "dotenv": "^16.0.0",
    "markdown-it": "^13.0.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "axe-core": "^4.0.0"
  }
}
```

### `jest.config.js`
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test', '<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/index.ts',
    '!src/types/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

---

## Appendix C: Glossary

| Term | Definition |
|------|-----------|
| **Chat Participant** | A named entity in VS Code Chat (e.g., `@code-tutor`) that handles chat requests |
| **Scaffolding** | Breaking down complex tasks into simpler steps with guidance |
| **Prompt Injection** | Attempt to override AI system instructions via malicious input |
| **Guardrails** | Rules/checks that prevent inappropriate behavior |
| **WCAG 2.1 AA** | Web Content Accessibility Guidelines level AA; addresses most accessibility needs |
| **Screen Reader** | Software that reads UI elements aloud (e.g., NVDA, JAWS) |
| **Streaming** | Progressive delivery of response (chunk by chunk, not all at once) |
| **Rate Limiting** | Restricting number of requests per time period to prevent abuse |
| **Telemetry** | Anonymous usage data collection (opt-in only) |
| **Hot Reload** | Development feature to reload code without restarting |

---

## Appendix D: Related Documentation

- **Feature Specification**: `specs/001-chat-participant/spec.md`
- **Constitution**: `.specify/memory/constitution.md`
- **Contributing Guide**: (To be created) `CONTRIBUTING.md`
- **Architecture Deep Dive**: (To be created) `docs/ARCHITECTURE.md`
- **API Documentation**: (To be created) `docs/API.md`
- **Accessibility Guide**: (To be created) `docs/ACCESSIBILITY.md`

---

## Sign-Off

**Document Prepared By**: GitHub Copilot (AI Assistant)  
**Date**: 2026-02-24  
**Status**: ✅ Ready for Development  

**Next Steps**:
1. Review and approve plan with team
2. Assign roles/responsibilities
3. Set up development environment
4. Create user stories in issue tracker
5. Kick off Phase 1 development

---

**End of Plan**


