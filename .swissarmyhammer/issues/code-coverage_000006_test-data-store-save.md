# Test data-store.ts - saveUserData Function

**Refer to ./code-coverage.md**

## Goal
Create tests for the saveUserData function in data-store.ts (216 lines, currently 0% coverage).

## Context
The data-store module handles DynamoDB operations. Testing this requires mocking AWS SDK.

## Implementation Steps

1. **Create test file**
   - Location: `app/lib/__tests__/data-store.test.ts`

2. **Setup mocks**
   - Mock `@aws-sdk/client-dynamodb`
   - Mock `@aws-sdk/lib-dynamodb` PutCommand
   - Mock `uuid` for deterministic IDs

3. **Test saveUserData scenarios**
   - Saves with auto-generated recordId
   - Saves with provided recordId
   - Constructs correct recordKey format
   - Sets createdAt and updatedAt timestamps
   - Calls DynamoDB with correct parameters
   - Returns the recordId
   - Handles DynamoDB errors

## Success Criteria
- [ ] Test file created
- [ ] saveUserData function fully tested
- [ ] AWS SDK properly mocked
- [ ] data-store.ts coverage > 15%

## Expected Impact
- Lines changed: ~120 (new test file)
- Coverage improvement: data-store.ts 0% → 15%+
