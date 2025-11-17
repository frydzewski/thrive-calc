# Add Edge Case Tests for API Routes

**Refer to ./code-coverage.md**

## Goal
Review API route test coverage and add missing edge case tests.

## Context
After main API tests, add edge cases and error scenarios.

## Implementation Steps

1. **Review coverage report**
   - Identify uncovered lines in API routes
   - Focus on error handling

2. **Add edge case tests**
   - Malformed request bodies
   - Missing content-type headers
   - Database connection failures
   - Concurrent update conflicts
   - Rate limiting (if applicable)
   - Invalid JSON payloads
   - SQL injection attempts (if applicable)
   - XSS attempts in input

3. **Target routes**
   - All profile routes
   - All account routes
   - All scenario routes
   - All savings goal routes
   - All projection routes

## Success Criteria
- [ ] Edge cases identified
- [ ] Security tests added
- [ ] API route coverage improved by 10-15%

## Expected Impact
- Lines changed: ~150 (extend multiple test files)
- Coverage improvement: API routes +10-15% average
