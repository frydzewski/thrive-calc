# Test Type Helper Functions - scenarios.ts

**Refer to ./code-coverage.md**

## Goal
Create tests for helper functions in types/scenarios.ts (453 lines, currently 0% coverage).

## Context
This is a large types file - likely contains business logic for scenarios, buckets, and assumptions.

## Implementation Steps

1. **Review scenarios.ts**
   - Identify all exported functions
   - Focus on business logic functions
   - Identify validation, calculation, or transformation utilities

2. **Create test file**
   - Location: `app/types/__tests__/scenarios.test.ts`

3. **Test helper functions**
   - Scenario creation/initialization
   - Assumption bucket management
   - Validation functions
   - Any calculation helpers
   - Transformation functions

## Success Criteria
- [ ] All helper functions tested
- [ ] scenarios.ts coverage > 50%

## Expected Impact
- Lines changed: ~150 (new test file)
- Coverage improvement: scenarios.ts 0% → 50%+

## Note
Large file - may need to split into multiple test describe blocks.
