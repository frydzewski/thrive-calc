# Test /api/accounts Route - GET and POST

**Refer to ./code-coverage.md**

## Goal
Test account listing and creation endpoints.

## Context
Accounts API allows managing multiple financial accounts.

## Implementation Steps

1. **Create test file**
   - Location: `app/api/accounts/__tests__/route.test.ts`

2. **Test GET /api/accounts**
   - Returns 401 when not authenticated
   - Returns empty array when no accounts
   - Returns user's accounts
   - Filters by username (doesn't return other users' accounts)
   - Handles database errors

3. **Test POST /api/accounts**
   - Returns 401 when not authenticated
   - Creates account with valid data
   - Validates required fields (accountName, accountType, balance)
   - Validates balance is non-negative
   - Validates accountType is valid
   - Generates UUID for new account
   - Sets timestamps
   - Returns created account

## Success Criteria
- [ ] GET and POST endpoints tested
- [ ] Validation covered
- [ ] route.ts coverage > 50%

## Expected Impact
- Lines changed: ~150 (new test file)
- Coverage improvement: api/accounts/route.ts 0% → 50%+
