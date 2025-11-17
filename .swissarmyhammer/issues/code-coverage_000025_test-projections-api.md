# Test /api/projections Routes

**Refer to ./code-coverage.md**

## Goal
Test projection retrieval and comparison endpoints.

## Context
Projections store calculated scenario results.

## Implementation Steps

1. **Create test files**
   - Location: `app/api/projections/__tests__/route.test.ts`
   - Location: `app/api/projections/[id]/__tests__/route.test.ts`
   - Location: `app/api/projections/compare/__tests__/route.test.ts`

2. **Test GET /api/projections**
   - Returns 401 when not authenticated
   - Returns user's projections
   - Filters by username

3. **Test GET /api/projections/[id]**
   - Returns 401 when not authenticated
   - Returns projection data
   - Returns 403 for other user's projection
   - Returns 404 when not found

4. **Test POST /api/projections/compare**
   - Returns 401 when not authenticated
   - Compares multiple projections
   - Validates projection IDs
   - Returns comparison data

## Success Criteria
- [ ] All projection endpoints tested
- [ ] Comparison logic covered
- [ ] All route files > 60% coverage

## Expected Impact
- Lines changed: ~180 (three new test files)
- Coverage improvement: projection routes 0% → 60%+
