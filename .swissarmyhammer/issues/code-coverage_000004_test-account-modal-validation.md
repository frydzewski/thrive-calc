# Test AccountModal Component - Form Validation

**Refer to ./code-coverage.md**

## Goal
Add tests for AccountModal form validation logic.

## Context
Building on previous rendering tests, now test the validation rules.

## Implementation Steps

1. **Extend test file** `app/components/__tests__/AccountModal.test.tsx`

2. **Test validation rules**
   - Account name is required
   - Balance must be a valid number
   - Balance must be >= 0
   - As of date is required
   - Error messages display correctly
   - Error state clears when corrected

3. **Test user interactions**
   - Typing in form fields updates state
   - Account type selection works
   - Date picker interaction

## Success Criteria
- [ ] Validation tests added
- [ ] All validation rules covered
- [ ] Error message display tested
- [ ] AccountModal coverage > 50%

## Expected Impact
- Lines changed: ~80 (extend existing test file)
- Coverage improvement: AccountModal 30% → 50%+
