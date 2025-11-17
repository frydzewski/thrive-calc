# Test ScenarioModal Component - Setup and Structure

**Refer to ./code-coverage.md**

## Goal
Begin testing ScenarioModal (768 lines!) - start with basic rendering and structure.

## Context
This is the largest component. Break testing into multiple steps.

## Implementation Steps

1. **Create test file**
   - Location: `app/components/__tests__/ScenarioModal.test.tsx`

2. **Test basic rendering**
   - Modal renders in create mode
   - Modal renders in edit mode
   - Modal title shows correctly
   - Close button present
   - Tab navigation present
   - Form sections visible

3. **Test tabs/sections**
   - Basic Info tab shows
   - Assumptions tab shows
   - Tab switching works

## Success Criteria
- [ ] Test file created
- [ ] Basic rendering tested
- [ ] ScenarioModal coverage > 15%

## Expected Impact
- Lines changed: ~100 (new test file)
- Coverage improvement: ScenarioModal 0% → 15%+

## Note
This is step 1 of multiple ScenarioModal test steps.
