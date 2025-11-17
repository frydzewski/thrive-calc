# Test Profile Page

**Refer to ./code-coverage.md**

## Goal
Test user profile page (259 lines, currently 0% coverage).

## Context
Page for viewing/editing user profile information.

## Implementation Steps

1. **Create test file**
   - Location: `app/profile/__tests__/page.test.tsx`

2. **Test rendering**
   - Page renders profile form
   - Fields pre-populated with existing data
   - Empty fields when new profile

3. **Test form fields**
   - First name field
   - Date of birth field
   - Marital status field
   - Number of dependents field

4. **Test submission**
   - Form submits with valid data
   - Validation errors show
   - Success message displays
   - Loading state shows during save

## Success Criteria
- [ ] Profile page tested
- [ ] Form submission covered
- [ ] page.tsx coverage > 65%

## Expected Impact
- Lines changed: ~130 (new test file)
- Coverage improvement: profile/page.tsx 0% → 65%+
