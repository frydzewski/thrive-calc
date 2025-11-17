# Test Retirement Calculator Page

**Refer to ./code-coverage.md**

## Goal
Test retirement calculator page (200 lines, currently 0% coverage).

## Context
Standalone retirement calculation tool.

## Implementation Steps

1. **Create test file**
   - Location: `app/retirement-calculator/__tests__/page.test.tsx`

2. **Test rendering**
   - Page renders calculator form
   - Input fields present
   - Calculate button present

3. **Test calculation**
   - Enter values in form
   - Click calculate
   - Results display
   - Results are accurate

4. **Test validation**
   - Required fields validated
   - Numeric fields validated
   - Error messages show

## Success Criteria
- [ ] Calculator page tested
- [ ] Calculations verified
- [ ] page.tsx coverage > 65%

## Expected Impact
- Lines changed: ~100 (new test file)
- Coverage improvement: retirement-calculator/page.tsx 0% → 65%+
