# Bug Report

## Summary

During testing, I identified 3 bugs in the codebase. Bug #1 has been fixed as part of this submission. The other two are documented below with recommended solutions.

## Bug #1: Incorrect Pagination Offset Calculation (FIXED)

**Severity:** Critical

The pagination implementation used an incorrect offset calculation, causing page navigation to skip records.

**Issue:**
```javascript
// Before (incorrect)
const offset = page * limit;
```

**Fix Applied:**
```javascript
// After (correct)
const offset = (page - 1) * limit;
```

**Example:**
With 25 total tasks and requesting page 2 (limit: 10):
- Expected: Tasks 11-20
- Was returning: Tasks 21-25
- Now returns: Tasks 11-20

**Location:** `src/services/taskService.js`, line 12

---

## Bug #2: Status Filter Uses Substring Matching

**Severity:** Medium

The status filtering endpoint uses substring matching instead of exact equality, returning unintended results.

**Current Implementation:**
```javascript
const getByStatus = (status) => tasks.filter((t) => t.status.includes(status));
```

**Problem:**
- `?status=in` returns tasks with status `in_progress`
- `?status=do` returns both `done` and `todo` tasks

**Recommended Fix:**
```javascript
const getByStatus = (status) => tasks.filter((t) => t.status === status);
```

**Location:** `src/services/taskService.js`, line 9

---

## Bug #3: Generic Error Handler for All HTTP Errors

**Severity:** Medium

The error middleware returns HTTP 500 for all errors, including client-side validation errors and malformed requests.

**Current Implementation:**
```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});
```

**Problem:**
- Malformed JSON returns 500 (should be 400)
- Validation failures return 500 (should be 400)
- Makes debugging difficult for API consumers

**Recommended Fix:**
```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  
  if (err.status && err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: err.message });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});
```

**Location:** `src/app.js`, lines 9-12

---

## Additional Note

The `completeTask()` function resets task priority to "medium" regardless of its original value. This may be intentional, but it results in loss of the original priority information.

```javascript
const updated = {
  ...task,
  priority: 'medium',  // Always resets
  status: 'done',
  completedAt: new Date().toISOString(),
};
```

Worth confirming whether this behavior is expected.
