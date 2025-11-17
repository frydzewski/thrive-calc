# Test data-store.ts - Update and Delete Functions

**Refer to ./code-coverage.md**

## Goal
Add tests for updateUserData and deleteUserData functions to complete data-store coverage.

## Context
Final tests for data-store module write operations.

## Implementation Steps

1. **Extend test file** `app/lib/__tests__/data-store.test.ts`

2. **Mock additional commands**
   - Mock UpdateCommand
   - Mock DeleteCommand

3. **Test updateUserData**
   - Updates existing record
   - Updates updatedAt timestamp
   - Returns success
   - Handles record not found
   - Handles DynamoDB errors

4. **Test deleteUserData**
   - Deletes record by recordKey
   - Returns success
   - Handles record not found
   - Handles DynamoDB errors

## Success Criteria
- [ ] Update and delete functions tested
- [ ] All data-store functions have test coverage
- [ ] data-store.ts coverage > 80%

## Expected Impact
- Lines changed: ~80 (extend test file)
- Coverage improvement: data-store.ts 40% → 80%+
