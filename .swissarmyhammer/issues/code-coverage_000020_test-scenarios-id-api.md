# Test /api/scenarios/[id] Route - GET, PUT, DELETE

**Refer to ./code-coverage.md**

## Goal
Test individual scenario operations.

## Context
Large route file (455 lines) - focus on core CRUD operations.

## Implementation Steps

1. **Create test file**
   - Location: `app/api/scenarios/[id]/__tests__/route.test.ts`

2. **Test GET /api/scenarios/[id]**
   - Returns 401 when not authenticated
   - Returns 400 for invalid UUID format
   - Returns 404 when scenario not found
   - Returns 403 when scenario belongs to different user
   - Returns scenario data with assumption buckets

3. **Test PUT /api/scenarios/[id]**
   - Returns 401 when not authenticated
   - Returns 400 for invalid UUID
   - Updates scenario properties
   - Updates assumption buckets
   - Validates bucket age ranges don't overlap
   - Validates bucket order
   - Updates timestamps
   - Returns 403 for other user's scenario

4. **Test DELETE /api/scenarios/[id]**
   - Returns 401 when not authenticated
   - Returns 400 for invalid UUID
   - Deletes scenario
   - Returns 403 for other user's scenario
   - Handles default scenario deletion

## Success Criteria
- [ ] Core CRUD operations tested
- [ ] Authorization covered
- [ ] route.ts coverage > 50%

## Expected Impact
- Lines changed: ~200 (new test file)
- Coverage improvement: api/scenarios/[id]/route.ts 0% → 50%+
