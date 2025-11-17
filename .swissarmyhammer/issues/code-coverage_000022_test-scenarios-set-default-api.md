# Test /api/scenarios/[id]/set-default Route

**Refer to ./code-coverage.md**

## Goal
Test the set default scenario endpoint.

## Context
Allows users to mark a scenario as their default.

## Implementation Steps

1. **Create test file**
   - Location: `app/api/scenarios/[id]/set-default/__tests__/route.test.ts`

2. **Test POST /api/scenarios/[id]/set-default**
   - Returns 401 when not authenticated
   - Returns 400 for invalid UUID
   - Returns 404 when scenario not found
   - Returns 403 for other user's scenario
   - Sets scenario as default
   - Unsets previous default scenario
   - Returns success response
   - Handles case when no previous default exists

3. **Test logic**
   - Only one scenario can be default at a time
   - Previous default is properly cleared
   - Updates are atomic

## Success Criteria
- [ ] Set default logic fully tested
- [ ] Default flag management covered
- [ ] route.ts coverage > 80%

## Expected Impact
- Lines changed: ~100 (new test file)
- Coverage improvement: api/scenarios/[id]/set-default/route.ts 0% → 80%+
