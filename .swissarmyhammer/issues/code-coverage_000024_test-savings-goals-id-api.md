# Test /api/savings-goals/[id] Route

**Refer to ./code-coverage.md**

## Goal
Test individual savings goal operations.

## Implementation Steps

1. **Create test file**
   - Location: `app/api/savings-goals/[id]/__tests__/route.test.ts`

2. **Test GET /api/savings-goals/[id]**
   - Returns 401 when not authenticated
   - Returns 400 for invalid UUID
   - Returns 404 when not found
   - Returns 403 for other user's goal
   - Returns goal data

3. **Test PUT /api/savings-goals/[id]**
   - Returns 401 when not authenticated
   - Updates goal with valid data
   - Validates updated fields
   - Returns 403 for other user's goal

4. **Test DELETE /api/savings-goals/[id]**
   - Returns 401 when not authenticated
   - Deletes goal
   - Returns 403 for other user's goal

## Success Criteria
- [ ] All endpoints tested
- [ ] Authorization covered
- [ ] route.ts coverage > 75%

## Expected Impact
- Lines changed: ~140 (new test file)
- Coverage improvement: api/savings-goals/[id]/route.ts 0% → 75%+
