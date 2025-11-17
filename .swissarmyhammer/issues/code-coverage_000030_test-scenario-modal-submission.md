# Test ScenarioModal Component - Form Submission

**Refer to ./code-coverage.md**

## Goal
Complete ScenarioModal testing with submission tests.

## Context
Final step for ScenarioModal - test save/update operations.

## Implementation Steps

1. **Extend test file** `app/components/__tests__/ScenarioModal.test.tsx`

2. **Mock API**
   - Mock POST /api/scenarios
   - Mock PUT /api/scenarios/[id]
   - Mock success responses
   - Mock error responses

3. **Test submission**
   - Create scenario calls POST
   - Update scenario calls PUT
   - Loading state shows
   - Success calls onClose(true)
   - Error displays
   - Error doesn't close modal

4. **Test edge cases**
   - Submit with invalid data prevented
   - Cancel calls onClose(false)
   - Network errors handled

## Success Criteria
- [ ] Submission fully tested
- [ ] Success and error paths covered
- [ ] ScenarioModal coverage > 85%

## Expected Impact
- Lines changed: ~130 (extend test file)
- Coverage improvement: ScenarioModal 65% → 85%+
