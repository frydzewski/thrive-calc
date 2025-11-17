# Test SessionProvider Component

**Refer to ./code-coverage.md**

## Goal
Create comprehensive tests for the SessionProvider component (currently 0% coverage, 17 lines).

## Context
SessionProvider is a simple wrapper around next-auth's SessionProvider. It's small but important for authentication flow.

## Implementation Steps

1. **Create test file**
   - Location: `app/components/__tests__/SessionProvider.test.tsx`

2. **Test scenarios**
   - Renders children correctly
   - Passes session prop to NextAuth SessionProvider
   - Handles null/undefined session
   - Works with authenticated session

3. **Setup**
   - Mock `next-auth/react` SessionProvider
   - Use test utilities from `app/__tests__/test-utils.tsx`

## Success Criteria
- [ ] Test file created with comprehensive coverage
- [ ] SessionProvider.tsx reaches 100% coverage
- [ ] All tests pass

## Expected Impact
- Lines changed: ~50 (new test file)
- Coverage improvement: SessionProvider 0% → 100%
