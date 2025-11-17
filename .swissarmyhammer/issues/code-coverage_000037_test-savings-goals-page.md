# Test Savings Goals Page

**Refer to ./code-coverage.md**

## Goal
Test savings goals page (363 lines, currently 0% coverage).

## Context
Page for managing savings goals.

## Implementation Steps

1. **Create test file**
   - Location: `app/savings-goals/__tests__/page.test.tsx`

2. **Test rendering**
   - Page renders goals list
   - Shows empty state
   - Shows goals when they exist
   - Add goal button present
   - Progress indicators show

3. **Test data fetching**
   - Fetches goals on load
   - Handles loading
   - Handles errors

4. **Test interactions**
   - Add goal opens modal
   - Edit goal opens modal
   - Delete goal prompts confirmation
   - Progress calculation correct

## Success Criteria
- [ ] Savings goals page tested
- [ ] Goal management covered
- [ ] page.tsx coverage > 60%

## Expected Impact
- Lines changed: ~140 (new test file)
- Coverage improvement: savings-goals/page.tsx 0% → 60%+
