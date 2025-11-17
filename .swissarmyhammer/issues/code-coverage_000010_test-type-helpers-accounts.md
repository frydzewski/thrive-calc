# Test Type Helper Functions - accounts.ts

**Refer to ./code-coverage.md**

## Goal
Create tests for helper functions in types/accounts.ts (134 lines, currently 0% coverage).

## Context
The accounts types file likely contains helper functions like getAccountTypeLabel and other utilities.

## Implementation Steps

1. **Review accounts.ts**
   - Identify all exported functions
   - Identify testable logic (not just type definitions)

2. **Create test file**
   - Location: `app/types/__tests__/accounts.test.ts`

3. **Test helper functions**
   - getAccountTypeLabel returns correct labels
   - Any validation functions
   - Any calculation functions
   - Any transformation functions

4. **Test type guards** (if any)
   - Type checking functions work correctly

## Success Criteria
- [ ] All helper functions tested
- [ ] accounts.ts coverage > 70%

## Expected Impact
- Lines changed: ~60 (new test file)
- Coverage improvement: accounts.ts 0% → 70%+

## Note
If accounts.ts contains only type definitions, coverage will be minimal. Adjust expectations based on actual content.
