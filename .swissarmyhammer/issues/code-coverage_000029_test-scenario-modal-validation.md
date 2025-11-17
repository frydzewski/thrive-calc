# Test ScenarioModal Component - Validation

**Refer to ./code-coverage.md**

## Goal
Test form validation logic in ScenarioModal.

## Context
Complex validation rules for scenarios and buckets.

## Implementation Steps

1. **Extend test file** `app/components/__tests__/ScenarioModal.test.tsx`

2. **Test scenario validation**
   - Name is required
   - Retirement age must be valid
   - Social security age must be valid
   - Investment return must be valid percentage

3. **Test bucket validation**
   - Age ranges don't overlap
   - Age ranges are valid (start < end)
   - Bucket amounts are non-negative
   - Contributions are valid

4. **Test error display**
   - Error messages show
   - Errors clear when fixed
   - Submit blocked when invalid

## Success Criteria
- [ ] Validation logic tested
- [ ] Error handling covered
- [ ] ScenarioModal coverage > 65%

## Expected Impact
- Lines changed: ~120 (extend test file)
- Coverage improvement: ScenarioModal 50% → 65%+
