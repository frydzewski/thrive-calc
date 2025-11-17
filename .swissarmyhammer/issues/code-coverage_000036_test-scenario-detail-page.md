# Test Scenario Detail Page

**Refer to ./code-coverage.md**

## Goal
Test individual scenario detail page (326 lines, currently 0% coverage).

## Context
Page for viewing and editing a specific scenario.

## Implementation Steps

1. **Create test file**
   - Location: `app/scenarios/[id]/__tests__/page.test.tsx`

2. **Test rendering**
   - Page renders scenario details
   - Shows scenario name and description
   - Shows assumption buckets
   - Shows projection button
   - Edit button present

3. **Test data fetching**
   - Fetches scenario by ID
   - Handles invalid ID
   - Handles not found
   - Handles unauthorized

4. **Test interactions**
   - Edit opens modal
   - Calculate projection calls API
   - Shows projection results
   - Error handling for calculations

## Success Criteria
- [ ] Scenario detail tested
- [ ] Projection triggering covered
- [ ] page.tsx coverage > 60%

## Expected Impact
- Lines changed: ~150 (new test file)
- Coverage improvement: scenarios/[id]/page.tsx 0% → 60%+
