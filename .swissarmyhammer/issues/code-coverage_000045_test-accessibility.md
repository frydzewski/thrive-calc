# Add Accessibility Tests

**Refer to ./code-coverage.md**

## Goal
Add accessibility (a11y) tests to ensure application is accessible.

## Context
While not strictly "code coverage," accessibility is important quality.

## Implementation Steps

1. **Install testing library**
   - `npm install --save-dev jest-axe` (if not already installed)

2. **Add a11y tests to components**
   - Test all interactive components
   - Navigation
   - Modals (AccountModal, ScenarioModal, OnboardingModal)
   - Forms
   - Buttons and links

3. **Test for common issues**
   - Missing alt text
   - Missing form labels
   - Insufficient color contrast
   - Missing ARIA attributes
   - Keyboard navigation

4. **Add to existing test files**
   - Extend component tests with axe checks

## Success Criteria
- [ ] jest-axe integrated
- [ ] A11y tests added to all components
- [ ] All a11y tests pass

## Expected Impact
- Lines changed: ~80 (extend existing test files)
- Coverage improvement: Minor, but improves test quality
