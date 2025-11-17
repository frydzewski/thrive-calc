# Add Edge Case Tests for Pages

**Refer to ./code-coverage.md**

## Goal
Review page test coverage and add missing edge case tests.

## Context
After main page tests, add edge cases.

## Implementation Steps

1. **Review coverage report**
   - Identify uncovered lines in pages
   - Focus on error boundaries and edge cases

2. **Add edge case tests**
   - Network failures during load
   - Slow network (loading states)
   - Empty state handling
   - Invalid URL parameters
   - Missing required data
   - Concurrent updates
   - Browser back/forward navigation

3. **Target pages**
   - Dashboard
   - Accounts
   - Profile
   - Scenarios (list and detail)
   - Savings goals
   - Portfolio
   - Reports
   - Retirement calculator

## Success Criteria
- [ ] Edge cases identified
- [ ] Tests added
- [ ] Page coverage improved by 10-15%

## Expected Impact
- Lines changed: ~120 (extend multiple test files)
- Coverage improvement: Pages +10-15% average
