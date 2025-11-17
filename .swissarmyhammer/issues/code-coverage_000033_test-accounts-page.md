# Test Accounts Page

**Refer to ./code-coverage.md**

## Goal
Test accounts management page (398 lines, currently 0% coverage).

## Context
Page for managing financial accounts.

## Implementation Steps

1. **Create test file**
   - Location: `app/accounts/__tests__/page.test.tsx`

2. **Test rendering**
   - Page renders account list
   - Shows empty state when no accounts
   - Shows accounts when they exist
   - Add account button present

3. **Test data fetching**
   - Fetches accounts on load
   - Handles loading state
   - Handles fetch errors

4. **Test interactions**
   - Add account opens modal
   - Edit account opens modal with data
   - Delete account prompts confirmation
   - Account created updates list
   - Account updated refreshes list

## Success Criteria
- [ ] Accounts page tested
- [ ] CRUD interactions covered
- [ ] page.tsx coverage > 60%

## Expected Impact
- Lines changed: ~150 (new test file)
- Coverage improvement: accounts/page.tsx 0% → 60%+
