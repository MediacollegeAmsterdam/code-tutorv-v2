# Code Tutor V2 - Concise Test Plan (20 Tests)

## Overview
This test plan focuses on the **20 most critical tests** for Code Tutor V2 extension. Tests are prioritized by impact and coverage of core functionality.

---

## 1. EXTENSION INITIALIZATION (3 Tests)

### Test 1.1: Extension Activation
**Purpose:** Verify extension loads without errors
```
Steps:
  1. Install extension in VS Code
  2. Wait for activation
  3. Check console for errors
Expected: Extension loads, no errors in console
Priority: P0 (Critical)
```

### Test 1.2: Chat Participant Registration
**Purpose:** Verify @tutor chat participant is available
```
Steps:
  1. Open chat panel (Ctrl+L)
  2. Type @
  3. Look for "tutor" in suggestions
Expected: @tutor appears in autocomplete list
Priority: P0 (Critical)
```

### Test 1.3: Icon Display
**Purpose:** Verify extension icon displays
```
Steps:
  1. Open chat panel
  2. Check @tutor icon next to name
Expected: Icon displays correctly
Priority: P2
```

---

## 2. COMMAND RECOGNITION & PARSING (4 Tests)

### Test 2.1: Command /explain Recognized
**Purpose:** Verify /explain command is parsed correctly
```
Steps:
  1. Type: "@tutor /explain what is a loop"
  2. Submit
Expected: Command parsed as 'explain', not treated as unknown
Priority: P1
```

### Test 2.2: Command /feedback Recognized
**Purpose:** Verify /feedback command is parsed
```
Steps:
  1. Type: "@tutor /feedback my code has a bug"
  2. Submit
Expected: Command parsed as 'feedback'
Priority: P1
```

### Test 2.3: Command /exercise Recognized
**Purpose:** Verify /exercise command is parsed
```
Steps:
  1. Type: "@tutor /exercise"
  2. Submit
Expected: Command parsed as 'exercise'
Priority: P1
```

### Test 2.4: Command /level Recognized
**Purpose:** Verify /level command is parsed
```
Steps:
  1. Type: "@tutor /level 2"
  2. Submit
Expected: Command parsed as 'level'
Priority: P1
```

---

## 3. GITHUB COPILOT INTEGRATION (2 Tests)

### Test 3.1: Model Selection Success
**Purpose:** Verify GitHub Copilot model is available
```
Steps:
  1. Execute any command (e.g., /explain)
  2. Check if AI model is selected
Expected: Response generated from Copilot
Priority: P0 (Critical)
```

### Test 3.2: Missing Copilot Handling
**Purpose:** Graceful error when Copilot not installed
```
Steps:
  1. Disable GitHub Copilot extension
  2. Execute /explain command
Expected: Error message: "No AI model available"
Priority: P1
```

---

## 4. EXPLAIN COMMAND (3 Tests)

### Test 4.1: Explain with Selected Code
**Purpose:** Verify explain works with code selection
```
Preconditions:
  - Select a code block in editor
Steps:
  1. Type: "@tutor /explain what does this loop do?"
  2. Submit
Expected: 
  - Code context included in request
  - Explanation provided
  - No code generation (explanation only)
Priority: P1
```

### Test 4.2: Explain Year Level Adaptation
**Purpose:** Verify explanation changes by year level
```
Steps:
  1. Set /level 1 (beginner)
  2. Ask /explain what is a variable
  3. Note response (simple, with analogies)
  4. Set /level 4 (expert)
  5. Ask /explain what is a variable
  6. Note response (technical, advanced)
Expected: Responses differ significantly by level
Priority: P1
```

### Test 4.3: Explain Multiple Languages
**Purpose:** Verify explain works for different languages
```
Steps:
  For JavaScript, Python, Java:
    1. Select code in that language
    2. Type "@tutor /explain"
    3. Verify explanation given
Expected: Explanation provided for each language
Priority: P2
```

---

## 5. FEEDBACK COMMAND (2 Tests)

### Test 5.1: Feedback Requires Code Selection
**Purpose:** Verify feedback needs selected code
```
Steps:
  1. No code selected
  2. Type: "@tutor /feedback"
  3. Submit
Expected: Message asking to select code, no crash
Priority: P1
```

### Test 5.2: Feedback Provides Hints Not Solutions
**Purpose:** Verify Socratic method (guiding, not solving)
```
Preconditions:
  - Select buggy code
Steps:
  1. Type: "@tutor /feedback my code has a bug"
  2. Submit
Expected: 
  - Response includes guiding questions
  - Response includes hints
  - No complete solution code
Priority: P1
```

---

## 6. EXERCISE COMMAND (2 Tests)

### Test 6.1: Exercise with Example Code
**Purpose:** Verify exercise includes example code
```
Steps:
  1. Type: "@tutor /exercise"
  2. Submit
Expected: 
  - Response includes "### 💻 Voorbeeld" section
  - Code block with syntax highlighting
  - Working example code
Priority: P1
```

### Test 6.2: Exercise Difficulty Adaptation
**Purpose:** Verify exercise changes by year level
```
Steps:
  1. Set /level 1
  2. Request /exercise loops
  3. Note difficulty (very basic)
  4. Set /level 4
  5. Request /exercise loops
  6. Note difficulty (advanced algorithms)
Expected: Difficulty increases with level
Priority: P1
```

---

## 7. LEVEL COMMAND (2 Tests)

### Test 7.1: Set and Persist Level
**Purpose:** Verify level changes and persists
```
Steps:
  1. Type: "@tutor /level 3"
  2. Submit
  3. Verify confirmation message
  4. Close VS Code
  5. Reopen
  6. Type: "@tutor /level"
Expected: Level still 3 after restart
Priority: P1
```

### Test 7.2: Level Affects Other Commands
**Purpose:** Verify /level changes affect /explain responses
```
Steps:
  1. Set /level 1
  2. Ask: "/explain recursion"
  3. Note: Simple explanation
  4. Set /level 3
  5. Ask: "/explain recursion"
  6. Note: Complex explanation
Expected: Responses differ significantly
Priority: P1
```

---

## 8. CODE CONTEXT EXTRACTION (1 Test)

### Test 8.1: Code Context from Selection and Editor
**Purpose:** Verify code is properly extracted
```
Steps:
  1. Open JavaScript file
  2. Select 5 lines of code
  3. Type: "@tutor /explain"
  4. Verify selected code in context
  5. No selection, type: "@tutor /explain visible code"
  6. Verify visible code included (if < 3000 chars)
Expected: Code extracted correctly in both cases
Priority: P1
```

---

## 9. ERROR HANDLING (1 Test)

### Test 9.1: Invalid Command Shows Help
**Purpose:** Graceful handling of unrecognized commands
```
Steps:
  1. Type: "@tutor /invalid"
  2. Submit
Expected:
  - Shows: "🤖 I don't recognize that command"
  - Lists available commands
  - No crash/error
Priority: P2
```

---

## TEST EXECUTION CHECKLIST

```
[ ] Test 1.1: Extension Activation
[ ] Test 1.2: Chat Participant Registration
[ ] Test 1.3: Icon Display

[ ] Test 2.1: /explain Command
[ ] Test 2.2: /feedback Command
[ ] Test 2.3: /exercise Command
[ ] Test 2.4: /level Command

[ ] Test 3.1: Copilot Model Selection
[ ] Test 3.2: Missing Copilot Handling

[ ] Test 4.1: Explain with Code
[ ] Test 4.2: Explain Year Level Adaptation
[ ] Test 4.3: Explain Multiple Languages

[ ] Test 5.1: Feedback Requires Code
[ ] Test 5.2: Feedback Provides Hints

[ ] Test 6.1: Exercise with Example
[ ] Test 6.2: Exercise Difficulty Adaptation

[ ] Test 7.1: Level Set and Persist
[ ] Test 7.2: Level Affects Commands

[ ] Test 8.1: Code Context Extraction

[ ] Test 9.1: Invalid Command Handling
```

---

## PASS/FAIL CRITERIA

**MUST PASS (Go/No-Go):**
- Test 1.1, 1.2 (Extension loads & registers)
- Test 3.1 (Copilot works)
- Test 2.1-2.4 (Commands recognized)
- Test 4.1 (Explain works)
- Test 5.1, 6.1, 7.1 (Commands execute)

**SHOULD PASS:**
- All remaining tests (P1 priority)

**NICE TO HAVE:**
- Tests 1.3, 9.1 (P2 priority)

---

## ENVIRONMENT SETUP

**Required:**
- GitHub Copilot extension installed
- VS Code 1.109.0+
- JavaScript, Python, Java sample files

**Test Duration:** ~2 hours

---

## SIGN-OFF

| Role | Name | Date | Result |
|------|------|------|--------|
| Tester | _______ | ____ | PASS/FAIL |
| QA Lead | _______ | ____ | PASS/FAIL |

---

**Total Tests: 20**
**Status: Ready for Testing**
**Date: March 3, 2026**

