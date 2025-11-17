# Test Dashboard Page (app/page.tsx)

**Refer to ./code-coverage.md**

## Goal
Test the main dashboard page (754 lines, currently 0% coverage).

## Context
Dashboard shows scenarios, onboarding, and key metrics.

## Implementation Steps

1. **Create test file**
   - Location: `app/__tests__/page.test.tsx`

2. **Test rendering**
   - Page renders for authenticated user
   - Shows onboarding modal when needed
   - Hides onboarding when complete
   - Shows default scenario
   - Shows scenario list

3. **Test data fetching**
   - Fetches user profile
   - Fetches scenarios
   - Handles loading states
   - Handles errors

4. **Test interactions**
   - Create scenario button works
   - Scenario selection works
   - Onboarding completion flow

## Success Criteria
- [ ] Dashboard rendering tested
- [ ] Data fetching covered
- [ ] page.tsx coverage > 40%

## Expected Impact
- Lines changed: ~180 (new test file)
- Coverage improvement: app/page.tsx 0% → 40%+
