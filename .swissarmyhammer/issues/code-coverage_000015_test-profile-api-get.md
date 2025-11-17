# Test /api/profile Route - GET

**Refer to ./code-coverage.md**

## Goal
Test GET endpoint for user profile API route.

## Context
Uses the API testing infrastructure from previous step.

## Implementation Steps

1. **Create test file**
   - Location: `app/api/profile/__tests__/route.test.ts`

2. **Test GET /api/profile**
   - Returns 401 when not authenticated
   - Returns 404 when profile doesn't exist
   - Returns profile data when exists
   - Handles database errors gracefully
   - Returns correct response format

3. **Use test utilities**
   - Mock getServerSession from api-test-utils
   - Mock getUserData from data-store

## Success Criteria
- [ ] GET endpoint fully tested
- [ ] All response codes covered
- [ ] route.ts coverage > 20%

## Expected Impact
- Lines changed: ~80 (new test file)
- Coverage improvement: api/profile/route.ts 0% → 20%+
