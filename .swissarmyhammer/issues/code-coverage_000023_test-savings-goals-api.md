# Test /api/savings-goals Routes

**Refer to ./code-coverage.md**

## Goal
Test savings goals listing and creation endpoints.

## Context
Savings goals track financial objectives.

## Implementation Steps

1. **Create test file**
   - Location: `app/api/savings-goals/__tests__/route.test.ts`

2. **Test GET /api/savings-goals**
   - Returns 401 when not authenticated
   - Returns user's savings goals
   - Returns empty array when none exist
   - Filters by username

3. **Test POST /api/savings-goals**
   - Returns 401 when not authenticated
   - Creates goal with valid data
   - Validates required fields
   - Validates amounts are positive
   - Validates target date is in future
   - Generates UUID
   - Sets timestamps

## Success Criteria
- [ ] GET and POST endpoints tested
- [ ] Validation logic covered
- [ ] route.ts coverage > 60%

## Expected Impact
- Lines changed: ~110 (new test file)
- Coverage improvement: api/savings-goals/route.ts 0% → 60%+
