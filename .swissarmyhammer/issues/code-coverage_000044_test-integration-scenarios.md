# Add Integration Tests for Key User Flows

**Refer to ./code-coverage.md**

## Goal
Create integration tests that test complete user workflows.

## Context
Individual unit tests are good, but integration tests ensure features work end-to-end.

## Implementation Steps

1. **Create integration test file**
   - Location: `app/__tests__/integration/user-flows.test.tsx`

2. **Test complete workflows**
   - User onboarding flow (profile → first scenario)
   - Account management flow (create → edit → delete)
   - Scenario creation and calculation flow
   - Savings goal tracking flow
   - Report generation flow

3. **Mock minimal dependencies**
   - Use real components where possible
   - Mock only external APIs (DynamoDB, auth)
   - Test component interactions

## Success Criteria
- [ ] Integration tests created
- [ ] Key user flows covered
- [ ] Tests pass consistently

## Expected Impact
- Lines changed: ~200 (new integration test file)
- Coverage improvement: Fills gaps between unit tests
