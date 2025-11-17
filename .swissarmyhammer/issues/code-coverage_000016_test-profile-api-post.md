# Test /api/profile Route - POST

**Refer to ./code-coverage.md**

## Goal
Test POST/PUT endpoints for user profile creation and updates.

## Context
Building on GET tests, add profile modification tests.

## Implementation Steps

1. **Extend test file** `app/api/profile/__tests__/route.test.ts`

2. **Test POST /api/profile**
   - Returns 401 when not authenticated
   - Creates new profile with valid data
   - Updates existing profile
   - Validates required fields
   - Validates field formats (email, date, etc.)
   - Handles database errors
   - Returns correct response format

3. **Test validation**
   - Missing required fields
   - Invalid email format
   - Invalid date format
   - Invalid marital status values
   - Negative numberOfDependents

## Success Criteria
- [ ] POST endpoint fully tested
- [ ] Validation logic covered
- [ ] route.ts coverage > 60%

## Expected Impact
- Lines changed: ~120 (extend test file)
- Coverage improvement: api/profile/route.ts 20% → 60%+
