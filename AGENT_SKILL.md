---
name: social-automation-feature-suite
description: Use this skill ONLY when implementing or modifying features in the Social Automation project (Express.js + React). Enforces strict separation between client/server, module boundaries, convention consistency, and minimal impact changes.
---

# SOCIAL AUTOMATION FEATURE ENGINEERING SUITE

You are operating inside the Social Automation production codebase.

**Stack:**

- Backend: Express.js (Node.js) + Controllers/Services pattern
- Frontend: React 18 + Hooks
- Storage: File-based JSON (data/articles.json, data/output/)
- LLM: OpenAI SDK + Groq API
- Scraping: Cheerio + Axios

This skill must ONLY be used when:

- Implementing new features
- Modifying existing features
- Adding API endpoints
- Updating crawling logic
- Adding Facebook/platform integrations
- Updating UI components
- Fixing bugs that require code changes

Do NOT use this skill for:

- General explanations
- Architecture discussions without implementation
- Other projects

---

# GLOBAL ARCHITECTURE GUARDIAN

## Architectural Principles

You must always prioritize:

1. **Client/Server Separation** - No mixing of concerns
2. **Controller → Service → Data** pattern on backend
3. **Component → API Service → Backend** pattern on frontend
4. **Convention Consistency** - Match existing patterns exactly
5. **Minimal Surface Change** - Touch only what's necessary
6. **Production Safety** - No breaking changes
7. **File-based Storage Integrity** - Proper JSON read/write with error handling

## Project Structure Rules

### Backend Structure (`/server`)

```
server/
├── server.js              # Express app entry
├── controllers/           # Request handlers (no business logic)
├── platforms/            # Platform integrations (Facebook, Shopee, etc.)
├── flows/                # Business logic pipelines (crawl, rewrite, etc.)
├── routes/               # Express route definitions
├── data/                 # JSON storage
│   ├── articles.json     # Article sources
│   ├── output/           # Rewritten content
│   └── images/           # Downloaded images
└── uploads/              # Temporary file uploads
```

### Frontend Structure (`/client/src`)

```
client/src/
├── App.js                # Router setup
├── index.js              # React entry
├── components/           # React components
├── pages/                # Page-level components
└── services/
    └── api.js            # Axios API client
```

## Never:

- Mix controller and business logic in Express routes
- Access file system directly from controllers
- Put business logic in React components
- Break API response format conventions
- Create circular dependencies between modules
- Change global configuration (ports, CORS, etc.) without explicit request
- Modify file storage structure without migration plan
- Add new dependencies without justification

## Always:

- Analyze existing code structure first
- Mirror naming conventions (camelCase for variables/functions, PascalCase for components)
- Mirror folder organization exactly
- Mirror error handling patterns
- Mirror response format: `{ success: boolean, message?: string, data/results/contents?: any }`
- Keep async/await consistent
- Use existing color scheme: Orange (#FF6B35, #FF8C42) + Blue (#004E89, #1A535C)

---

# MULTI-PHASE EXECUTION WORKFLOW

Execute phases in strict order. Do not skip.

---

# PHASE 1 — REQUIREMENT CLARIFICATION

Convert user request into technical specification.

## OUTPUT (Internal Analysis):

### FEATURE SPEC

- **Feature Name:**
- **Affected Modules:** [Backend/Frontend/Both]
- **API Endpoints:** [Method + Path]
- **Request Format:** [DTO/Body shape]
- **Response Format:** [JSON structure]
- **Business Rules:**
- **Validation Rules:**
- **Error Cases:**
- **Frontend Components:** [New/Modified]
- **Backend Controllers:** [New/Modified]
- **Services/Flows:** [New/Modified]
- **Data Storage Impact:** [articles.json, output/, images/, etc.]
- **Requires File I/O?:** [Yes/No]
- **Requires LLM Call?:** [Yes/No]
- **Requires Platform API?:** [Facebook/Shopee/None]
- **UI/UX Changes:**

Do not generate code yet.

---

# PHASE 2 — ARCHITECTURE GUARDIAN CHECK

Before implementation, verify:

### Backend Checks:

- Correct controller ownership (facebook, platform, article, content)
- No business logic in routes
- Service/flow properly separated
- File I/O uses fs/promises with error handling
- JSON files read/written atomically
- Proper module exports/requires

### Frontend Checks:

- Component hierarchy correct (Page → Component)
- API calls through services/api.js only
- No direct backend calls from components
- State management follows existing useState/useEffect patterns
- CSS follows existing class naming (kebab-case)
- No inline styles unless existing pattern

### Cross-Cutting Checks:

- API response format matches existing: `{ success, message?, data/results/contents? }`
- Error handling consistent with existing patterns
- No circular imports
- No duplicate logic

If violation detected:

- Adjust approach to preserve architecture
- Never introduce new patterns for convenience

---

# PHASE 3 — BACKEND IMPLEMENTATION

Implement backend changes following strict layering.

## Layer 1: Routes (`/routes`)

```javascript
// ONLY routing, delegate to controller
router.post("/endpoint", controllerName.methodName);
```

Rules:

- No business logic
- No file I/O
- No direct response formatting beyond status codes
- Use existing middleware patterns

## Layer 2: Controllers (`/controllers`)

```javascript
// Request validation, call service, format response
exports.methodName = async (req, res) => {
  try {
    // 1. Extract and validate request
    // 2. Call service/flow
    // 3. Format response with { success: true, ... }
    // 4. res.json(response)
  } catch (error) {
    // 5. Error handling with { success: false, message, error }
  }
};
```

Rules:

- Request/response handling only
- Call services/flows for business logic
- Use existing error response format
- No direct file system access
- No LLM calls
- No platform API calls

## Layer 3: Services/Flows (`/flows`, `/platforms`)

```javascript
// Business logic, file I/O, external API calls
async function businessLogic(params) {
  // 1. Validate business rules
  // 2. Perform operations (file I/O, API calls, LLM, etc.)
  // 3. Return data (not response object)
  // 4. Throw errors, don't handle HTTP responses
}
```

Rules:

- Contains all business logic
- File I/O with fs/promises
- JSON read/write with error handling
- LLM calls if needed (OpenAI SDK)
- Platform API integrations
- Return data, not HTTP responses
- Throw errors with meaningful messages

## Layer 4: Data Access (`/data`)

```javascript
// JSON file operations with atomic read/write
const data = JSON.parse(await fs.readFile(filePath, "utf-8"));
await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
```

Rules:

- Use fs/promises
- Wrap in try/catch
- Ensure directory exists before write
- Use JSON.stringify with 2-space indent
- Handle file not found gracefully

---

# PHASE 4 — FRONTEND IMPLEMENTATION

Implement frontend changes following component hierarchy.

## Layer 1: API Service (`/services/api.js`)

```javascript
// Add API method
methodName: async (params) => {
  const response = await axios.post("/api/endpoint", params);
  return response;
};
```

Rules:

- All backend calls through this service
- Use existing axios instance
- Return full response, let component handle data

## Layer 2: Components (`/components`)

```javascript
function ComponentName() {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // Data fetching
  }, [dependencies]);

  const handleAction = async () => {
    try {
      const response = await api.methodName(params);
      if (response.data.success) {
        // Handle success
      }
    } catch (error) {
      // Handle error
    }
  };

  return (/* JSX */);
}
```

Rules:

- One component per file
- Hooks at top level
- Event handlers prefixed with `handle`
- API calls in event handlers or useEffect
- No business logic - just UI state and presentation
- CSS in separate .css file with same name
- Follow existing className patterns
- Use existing color CSS variables

## Layer 3: Styling (`/components/*.css`)

```css
.component-name {
  /* Use CSS variables */
  color: var(--primary-orange);
  background: linear-gradient(
    135deg,
    var(--primary-orange),
    var(--secondary-orange)
  );
}
```

Rules:

- Match existing class naming (kebab-case)
- Use CSS variables from index.css
- Mirror existing spacing/sizing patterns
- Follow gradient patterns for primary actions
- Maintain responsive design if exists

---

# PHASE 5 — CODE REVIEW & CLEANUP

Before finalizing, perform internal review:

## Backend Review:

- [ ] No business logic in controllers
- [ ] No file I/O in controllers
- [ ] Proper async/await usage
- [ ] Error handling with try/catch
- [ ] Response format matches existing: `{ success, message?, data? }`
- [ ] No unused requires
- [ ] No console.log (use console.error for errors only)
- [ ] File paths use path.join()
- [ ] JSON files have proper error handling

## Frontend Review:

- [ ] No direct backend calls (all through api.js)
- [ ] State management uses hooks
- [ ] No business logic in components
- [ ] Event handlers named `handleXxx`
- [ ] CSS in separate file
- [ ] Class names follow kebab-case
- [ ] No unused imports
- [ ] No console.log (except for debugging that should be removed)
- [ ] Colors use CSS variables

## Cross-Cutting Review:

- [ ] Naming matches existing conventions
- [ ] Code formatted consistently (2-space indent)
- [ ] No duplicate logic
- [ ] Error messages are clear and consistent
- [ ] No breaking changes to existing features
- [ ] Would pass existing linting rules

If any check fails: **Fix immediately before proceeding.**

---

# PHASE 6 — FORMAT & PRETTIFY

Apply project formatting standards:

```javascript
// Formatting rules:
- 2-space indentation
- Double quotes for strings
- Semicolons required
- No trailing commas in objects
- async/await over .then()
- Arrow functions for simple callbacks
- Template literals for string concatenation
- Destructuring where appropriate
```

CSS:

- 2-space indentation
- Properties ordered: display, position, sizing, colors, typography
- Hex colors uppercase
- Use CSS variables for theme colors

Remove:

- Unused imports/requires
- Commented-out code
- console.log statements
- Temporary variables
- Dead code paths

---

# PHASE 7 — END-TO-END VALIDATION

Verify complete feature flow:

## Backend Validation:

1. Route → Controller → Service → Data flow works
2. Request validation catches bad input
3. Success case returns proper JSON
4. Error cases return proper error format
5. File operations succeed (if applicable)
6. No unhandled promise rejections

## Frontend Validation:

1. Component renders without errors
2. API call triggers correctly
3. Loading state shows during request
4. Success state updates UI
5. Error state shows user-friendly message
6. No React warnings in console

## Integration Validation:

1. Frontend → Backend → Frontend flow works
2. Data format matches on both ends
3. Error messages propagate to UI
4. State updates trigger re-renders
5. No CORS issues
6. No authentication issues (if applicable)

## Testing Checklist:

- [ ] Happy path works end-to-end
- [ ] Error handling works
- [ ] Edge cases handled (empty data, null values, etc.)
- [ ] No console errors
- [ ] No network errors
- [ ] File operations succeed (create/read/update/delete)
- [ ] UI updates correctly
- [ ] No memory leaks (event listeners cleaned up)

---

# FINAL SAFETY CHECK (MANDATORY)

Before delivering final output, verify:

- [ ] **No Breaking Changes:** Existing features still work
- [ ] **Minimal Impact:** Only modified necessary files
- [ ] **Architecture Intact:** Controller/Service/Component separation maintained
- [ ] **Convention Consistent:** Code looks like existing codebase
- [ ] **No New Dependencies:** Unless explicitly requested
- [ ] **No Config Changes:** Ports, CORS, env variables unchanged
- [ ] **Error Handling:** All async operations wrapped in try/catch
- [ ] **File I/O Safe:** Directories exist, JSON parsing safe
- [ ] **API Format:** Response matches `{ success, message?, data? }`
- [ ] **CSS Variables:** Used for colors, not hardcoded
- [ ] **No Dead Code:** Removed unused imports/variables
- [ ] **No Debug Code:** Removed console.log statements
- [ ] **Would Original Author Recognize This?** YES

If ANY answer is NO → **Fix before final output.**

---

# OUTPUT RULES

## Strict Scope Control

**ONLY output:**

- Files that were modified
- New files that were created
- Exact file paths (absolute)
- Production-ready code

**NEVER output:**

- Unmodified files
- Explanation sections (unless explicitly requested)
- Analysis or reasoning
- Alternative approaches
- "You could also..." suggestions
- Architecture diagrams
- Code that doesn't directly implement the request

## Output Format

Use tool calls only:

- `create_file` for new files
- `replace_string_in_file` or `multi_replace_string_in_file` for edits
- No markdown code blocks
- No explanatory text unless user asks for explanation

## Change Minimization

When editing existing files:

- Include minimum context (3-5 lines before/after)
- Change only necessary lines
- Preserve existing formatting
- Keep whitespace consistent
- Don't reformat unrelated code
- Don't fix unrelated issues
- Don't optimize unrelated code

## Verification Statement

After implementation, provide ONE brief line:

```
✅ [Feature name] implemented: [backend/frontend/both] - [X files modified, Y files created]
```

Nothing more unless user requests details.

---

# FINAL MANDATE

The implementation must be:

**Consistent** - Matches existing codebase patterns exactly
**Safe** - No breaking changes, proper error handling
**Minimal** - Smallest possible change surface
**Architecturally Sound** - Respects layer boundaries
**Production-Ready** - Can be deployed immediately

If you cannot achieve all five qualities, **STOP and ask for clarification** rather than delivering suboptimal code.
