# Add Edge Case Tests for Components

**Refer to ./code-coverage.md**

## Goal
Review component test coverage and add missing edge case tests.

## Context
After main functionality tests, add edge cases to improve coverage.

## Implementation Steps

1. **Review coverage report**
   - Run `npm run test:coverage`
   - Identify uncovered lines in components
   - Focus on error handling, edge cases

2. **Add edge case tests**
   - Empty state handling
   - Null/undefined prop handling
   - Network timeouts
   - Race conditions
   - Rapid user interactions
   - Invalid data formats

3. **Target components**
   - Navigation
   - OnboardingModal
   - AccountModal
   - ScenarioModal
   - SessionProvider

## Success Criteria
- [ ] Edge cases identified
- [ ] Tests added for uncovered scenarios
- [ ] Component coverage improved by 5-10%

## Expected Impact
- Lines changed: ~100 (extend multiple test files)
- Coverage improvement: Components +5-10% average
