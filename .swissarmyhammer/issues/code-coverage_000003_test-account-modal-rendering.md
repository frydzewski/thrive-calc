# Test AccountModal Component - Rendering

**Refer to ./code-coverage.md**

## Goal
Create tests for AccountModal rendering logic (265 lines, currently 0% coverage). Focus on display and initial state.

## Context
AccountModal is a form for creating/editing financial accounts. This step focuses on rendering tests only.

## Implementation Steps

1. **Create test file**
   - Location: `app/components/__tests__/AccountModal.test.tsx`

2. **Test rendering scenarios**
   - Modal renders in "create new account" mode (account prop is null)
   - Modal renders in "edit account" mode (account prop populated)
   - All form fields display correctly
   - Account type dropdown shows all options
   - Close button is present
   - Form labels and placeholders are correct

3. **Test initial state**
   - New account mode: fields are empty/default values
   - Edit mode: fields pre-populated with account data
   - Loading state not shown initially

## Success Criteria
- [ ] Test file created
- [ ] Rendering tests cover modal display in both modes
- [ ] Tests verify all form fields are present
- [ ] AccountModal coverage > 30%

## Expected Impact
- Lines changed: ~100 (new test file)
- Coverage improvement: AccountModal 0% → 30%+
