# Test Scenarios Page

**Refer to ./code-coverage.md**

## Goal
Test scenarios listing page (291 lines, currently 0% coverage).

## Context
Page showing all user scenarios.

## Implementation Steps

1. **Create test file**
   - Location: `app/scenarios/__tests__/page.test.tsx`

2. **Test rendering**
   - Page renders scenario list
   - Shows empty state
   - Shows scenarios when they exist
   - Default scenario marked
   - Create scenario button present

3. **Test data fetching**
   - Fetches scenarios on load
   - Handles loading
   - Handles errors

4. **Test interactions**
   - Create scenario opens modal
   - Edit scenario opens modal
   - Delete scenario prompts confirmation
   - View scenario navigates to detail
   - Set default scenario works

## Success Criteria
- [ ] Scenarios page tested
- [ ] Scenario management covered
- [ ] page.tsx coverage > 60%

## Expected Impact
- Lines changed: ~140 (new test file)
- Coverage improvement: scenarios/page.tsx 0% → 60%+
