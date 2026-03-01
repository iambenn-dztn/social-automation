# GitHub Copilot Instructions for Social Automation

## 🤖 Engineering Protocol

**ALWAYS read and follow `AGENT_SKILL.md` in root folder project before implementing any feature.**

### When user requests a feature:

1. **Read** `AGENT_SKILL.md` first
2. **Execute** all 7 phases in order:
   - Phase 1: Requirement Clarification
   - Phase 2: Architecture Guardian Check
   - Phase 3: Backend Implementation (Controller → Service → Data)
   - Phase 4: Frontend Implementation (API Service → Component → CSS)
   - Phase 5: Code Review & Cleanup
   - Phase 6: Format & Prettify
   - Phase 7: End-to-End Validation
3. **Verify** all safety checks pass
4. **Output** only modified/new files

### Architecture Rules:

**Backend (Express.js):**

```
server/
├── routes/           # Express routing only
├── controllers/      # Request/response handling, NO business logic
├── flows/            # Business logic, LLM calls, crawling
├── platforms/        # Facebook, Shopee integrations
└── data/            # JSON file storage
```

**Frontend (React):**

```
client/src/
├── pages/           # Page components
├── components/      # UI components
└── services/api.js  # All backend API calls
```

**Layer separation:**

- Backend: `Controller → Service/Flow → File I/O`
- Frontend: `Component → API Service → Backend`
- NO business logic in controllers or components
- File-based JSON storage with atomic read/write
- Response format: `{ success: boolean, message?: string, data?: any }`

### Convention Rules:

- **Naming:** camelCase for variables/functions, PascalCase for React components
- **Indentation:** 2 spaces
- **Quotes:** Double quotes
- **Async:** Always async/await, never .then()
- **Colors:** Orange (#FF6B35, #FF8C42) + Blue (#004E89, #1A535C)
- **CSS:** Separate .css file, use CSS variables
- **Error handling:** try/catch for all async operations
- **File I/O:** Use fs/promises with proper error handling

### Output Rules:

- ✅ Output ONLY modified/new files
- ✅ Use exact file paths
- ✅ Production-ready code only
- ❌ No explanations unless requested
- ❌ No unrelated refactoring
- ❌ No alternative suggestions
- ❌ Minimal impact changes only

### Safety Checks (Mandatory):

Before completing ANY feature:

- [ ] No breaking changes to existing features
- [ ] Controller has no business logic
- [ ] Service/Flow contains all business logic
- [ ] Component has no business logic
- [ ] API calls through services/api.js only
- [ ] Response format: `{ success, message?, data? }`
- [ ] Error handling with try/catch
- [ ] File I/O safe (directory exists, JSON parsing safe)
- [ ] Colors use CSS variables
- [ ] No unused imports
- [ ] No console.log statements
- [ ] Code matches existing patterns exactly

**If ANY check fails → Fix before output**

---

## Example Prompts:

### ✅ Good prompts:

```
Implement: Add search filter to ContentManagement
```

```
Fix: Image deletion not working in PostManagement
```

```
Add: Export to CSV button in article list
```

### ❌ Bad prompts (Copilot will still follow skill):

```
How does the crawling work?  # Explanation, not implementation
```

```
Should we use MongoDB?  # Architecture discussion, not feature
```

---

## Quick Reference:

| Task           | Backend Pattern              | Frontend Pattern            |
| -------------- | ---------------------------- | --------------------------- |
| Add endpoint   | Route → Controller → Service | Component → api.js          |
| Business logic | In Service/Flow              | Never in Component          |
| File I/O       | In Service with fs/promises  | Never in Frontend           |
| Error handling | try/catch + throw            | try/catch + setState        |
| Response       | `{ success, data }`          | Check response.data.success |

---

**🎯 Remember: AGENT_SKILL.md is the source of truth. This file is a quick reference.**
