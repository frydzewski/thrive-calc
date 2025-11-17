# Test /api/scenarios Route - GET and POST

**Refer to ./code-coverage.md**

## Goal
Test scenario listing and creation endpoints.

## Context
Scenarios are financial planning scenarios with assumptions and projections.

## Implementation Steps

1. **Create test file**
   - Location: `app/api/scenarios/__tests__/route.test.ts`

2. **Test GET /api/scenarios**
   - Returns 401 when not authenticated
   - Returns empty array when no scenarios
   - Returns user's scenarios
   - Filters by username
   - Includes default scenario flag
   - Handles database errors

3. **Test POST /api/scenarios**
   - Returns 401 when not authenticated
   - Creates scenario with valid data
   - Validates required fields (name)
   - Generates UUID for new scenario
   - Sets default flag appropriately
   - Initializes empty assumption buckets
   - Sets timestamps
   - Returns created scenario

## Success Criteria
- [ ] GET and POST endpoints tested
- [ ] Default scenario logic covered
- [ ] route.ts coverage > 40%

## Expected Impact
- Lines changed: ~140 (new test file)
- Coverage improvement: api/scenarios/route.ts 0% → 40%+
