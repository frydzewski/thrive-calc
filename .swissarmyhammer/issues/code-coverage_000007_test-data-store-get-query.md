# Test data-store.ts - Get and Query Functions

**Refer to ./code-coverage.md**

## Goal
Add tests for getUserData, queryUserData, and listUserData functions.

## Context
Building on the previous data-store tests, add read operations.

## Implementation Steps

1. **Extend test file** `app/lib/__tests__/data-store.test.ts`

2. **Mock additional commands**
   - Mock GetCommand
   - Mock QueryCommand

3. **Test getUserData**
   - Retrieves user data by recordKey
   - Returns null when not found
   - Handles DynamoDB errors

4. **Test queryUserData**
   - Queries by dataType
   - Returns array of records
   - Returns empty array when no results
   - Handles DynamoDB errors

5. **Test listUserData**
   - Lists all data for user
   - Returns array of records
   - Handles pagination (if implemented)
   - Handles DynamoDB errors

## Success Criteria
- [ ] Get and query functions tested
- [ ] Error handling covered
- [ ] data-store.ts coverage > 40%

## Expected Impact
- Lines changed: ~100 (extend test file)
- Coverage improvement: data-store.ts 15% → 40%+
