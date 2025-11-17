# Test Type Helper Functions - projections.ts

**Refer to ./code-coverage.md**

## Goal
Create tests for calculation and helper functions in types/projections.ts (421 lines, currently 0% coverage).

## Context
Projections contains the core financial calculation logic - this is critical business logic that needs thorough testing.

## Implementation Steps

1. **Review projections.ts**
   - Identify calculateScenarioProjection function
   - Identify other calculation helpers
   - Understand projection data structures

2. **Create test file**
   - Location: `app/types/__tests__/projections.test.ts`

3. **Test projection calculations**
   - Basic projection calculation
   - Inflation adjustments
   - Investment return calculations
   - Account-specific calculations
   - Contribution calculations
   - Withdrawal calculations
   - Age-based logic
   - Bucket transitions

4. **Test edge cases**
   - Zero values
   - Negative values where applicable
   - Boundary conditions (retirement age, etc.)

## Success Criteria
- [ ] Calculation functions thoroughly tested
- [ ] Edge cases covered
- [ ] projections.ts coverage > 60%

## Expected Impact
- Lines changed: ~200 (new test file)
- Coverage improvement: projections.ts 0% → 60%+

## Note
This is critical business logic - take time to ensure accuracy.
