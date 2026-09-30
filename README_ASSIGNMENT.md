# Task Manager API - Assignment Submission

## Summary

Completed take-home assignment including comprehensive testing, bug fixes, and a new feature implementation.

**Test Coverage:** 98.11% (requirement: 80%+)  
**Total Tests:** 92  
**Bugs Found:** 3 (1 fixed, 2 documented)

## Test Results

```
Coverage:        98.11%
Tests Passed:    92/92
Test Files:      3
```

Test breakdown:
- `tests/taskService.test.js` - 34 unit tests
- `tests/api.test.js` - 42 integration tests  
- `tests/assign.test.js` - 16 feature tests

## Bugs Identified

See `BUG_REPORT.md` for complete details.

1. Pagination offset calculation (Critical) - Fixed
2. Status filter substring matching (Medium) - Documented
3. Generic error handler (Medium) - Documented

## New Feature: Task Assignment

Added `PATCH /tasks/:id/assign` endpoint for assigning tasks to users.

**Request:**
```http
PATCH /tasks/:id/assign
Content-Type: application/json

{
  "assignee": "John Doe"
}
```

**Response:**
```json
{
  "id": "abc-123",
  "title": "Task title",
  "assignee": "John Doe",
  "status": "todo",
  ...
}
```

Implementation includes:
- Input validation
- 404 handling for non-existent tasks
- 400 responses for invalid input
- Support for reassignment
- Whitespace trimming

## Running the Project

```bash
npm install       # Install dependencies
npm test          # Run test suite
npm run coverage  # Generate coverage report
npm start         # Start API server (port 3000)
```

## Documentation

- `BUG_REPORT.md` - Detailed bug analysis
- `SUBMISSION_NOTES.md` - Implementation notes and observations

## Files Changed

Created:
- tests/taskService.test.js
- tests/api.test.js
- tests/assign.test.js
- BUG_REPORT.md
- SUBMISSION_NOTES.md

Modified:
- src/services/taskService.js
- src/utils/validators.js
- src/routes/tasks.js
