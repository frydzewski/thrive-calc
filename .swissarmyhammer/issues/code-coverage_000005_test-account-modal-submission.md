# Test AccountModal Component - Form Submission

**Refer to ./code-coverage.md**

## Goal
Add tests for AccountModal form submission, API calls, and completion flow.

## Context
Complete the AccountModal test coverage by testing save/update operations.

## Implementation Steps

1. **Extend test file** `app/components/__tests__/AccountModal.test.tsx`

2. **Mock fetch API**
   - Mock successful POST (create)
   - Mock successful PUT (update)
   - Mock error responses

3. **Test submission scenarios**
   - Successful account creation calls correct API endpoint
   - Successful account update calls correct API endpoint
   - Loading state shows during submission
   - Success calls onClose(true)
   - Error displays to user
   - Error doesn't close modal
   - Handles network failures

4. **Test edge cases**
   - Submit with invalid data (shouldn't call API)
   - Cancel button calls onClose(false)

## Success Criteria
- [ ] Submission tests added
- [ ] API mocking properly configured
- [ ] Success and error paths tested
- [ ] AccountModal coverage > 90%

## Expected Impact
- Lines changed: ~100 (extend existing test file)
- Coverage improvement: AccountModal 50% → 90%+
