# Test /api/accounts/[id] Route - GET, PUT, DELETE

**Refer to ./code-coverage.md**

## Goal
Test individual account operations (retrieve, update, delete).

## Context
Account detail endpoints for specific account IDs.

## Implementation Steps

1. **Create test file**
   - Location: `app/api/accounts/[id]/__tests__/route.test.ts`

2. **Test GET /api/accounts/[id]**
   - Returns 401 when not authenticated
   - Returns 400 for invalid UUID format
   - Returns 404 when account not found
   - Returns 403 when account belongs to different user
   - Returns account data for valid request

3. **Test PUT /api/accounts/[id]**
   - Returns 401 when not authenticated
   - Returns 400 for invalid UUID
   - Updates account with valid data
   - Validates updated fields
   - Updates updatedAt timestamp
   - Returns 403 for other user's account

4. **Test DELETE /api/accounts/[id]**
   - Returns 401 when not authenticated
   - Returns 400 for invalid UUID
   - Deletes account
   - Returns 403 for other user's account
   - Returns 404 when account not found

## Success Criteria
- [ ] All endpoints tested
- [ ] Authorization logic covered
- [ ] route.ts coverage > 80%

## Expected Impact
- Lines changed: ~180 (new test file)
- Coverage improvement: api/accounts/[id]/route.ts 0% → 80%+
