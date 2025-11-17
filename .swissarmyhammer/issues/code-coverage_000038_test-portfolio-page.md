# Test Portfolio Page

**Refer to ./code-coverage.md**

## Goal
Test portfolio overview page (252 lines, currently 0% coverage).

## Context
Page showing portfolio allocation and value.

## Implementation Steps

1. **Create test file**
   - Location: `app/portfolio/__tests__/page.test.tsx`

2. **Test rendering**
   - Page renders portfolio summary
   - Shows total value
   - Shows account breakdown
   - Shows allocation chart (if applicable)

3. **Test data fetching**
   - Fetches accounts on load
   - Calculates totals
   - Handles loading
   - Handles errors

4. **Test calculations**
   - Total portfolio value correct
   - Account type grouping correct
   - Percentage calculations correct

## Success Criteria
- [ ] Portfolio page tested
- [ ] Calculations covered
- [ ] page.tsx coverage > 60%

## Expected Impact
- Lines changed: ~120 (new test file)
- Coverage improvement: portfolio/page.tsx 0% → 60%+
