# Test ScenarioModal Component - Basic Form Fields

**Refer to ./code-coverage.md**

## Goal
Test basic form fields in ScenarioModal.

## Context
Building on structure tests, add form field tests.

## Implementation Steps

1. **Extend test file** `app/components/__tests__/ScenarioModal.test.tsx`

2. **Test basic info fields**
   - Scenario name field
   - Description field
   - Retirement age field
   - Social security age field
   - Social security income field
   - Investment return rate field

3. **Test field interactions**
   - Typing updates state
   - Pre-populated in edit mode
   - Empty in create mode
   - Number fields accept numeric input

## Success Criteria
- [ ] Basic form fields tested
- [ ] ScenarioModal coverage > 30%

## Expected Impact
- Lines changed: ~100 (extend test file)
- Coverage improvement: ScenarioModal 15% → 30%+
