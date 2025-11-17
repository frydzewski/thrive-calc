# Test /api/scenarios/[id]/calculate Route

**Refer to ./code-coverage.md**

## Goal
Test scenario projection calculation endpoint.

## Context
This route performs complex financial calculations - critical business logic.

## Implementation Steps

1. **Create test file**
   - Location: `app/api/scenarios/[id]/calculate/__tests__/route.test.ts`

2. **Test POST /api/scenarios/[id]/calculate**
   - Returns 401 when not authenticated
   - Returns 400 for invalid scenario UUID
   - Returns 404 when scenario not found
   - Returns 403 for other user's scenario
   - Fetches required data (profile, accounts, scenario)
   - Calls calculateScenarioProjection
   - Stores projection result
   - Returns projection with ID
   - Handles missing profile
   - Handles calculation errors

3. **Test data integration**
   - Correctly combines scenario + profile + accounts
   - Passes data to calculation function
   - Stores result with proper structure

## Success Criteria
- [ ] Calculation endpoint tested
- [ ] Data fetching and integration covered
- [ ] route.ts coverage > 70%

## Expected Impact
- Lines changed: ~140 (new test file)
- Coverage improvement: api/scenarios/[id]/calculate/route.ts 0% → 70%+
