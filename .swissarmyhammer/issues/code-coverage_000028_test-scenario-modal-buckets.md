# Test ScenarioModal Component - Assumption Buckets

**Refer to ./code-coverage.md**

## Goal
Test assumption bucket management in ScenarioModal.

## Context
Assumption buckets are a key feature - age-based assumptions.

## Implementation Steps

1. **Extend test file** `app/components/__tests__/ScenarioModal.test.tsx`

2. **Test bucket management**
   - Add new bucket
   - Remove bucket
   - Bucket displays with correct fields
   - Age range fields work
   - Bucket order maintained

3. **Test bucket fields**
   - Annual income field
   - Annual spending field
   - Contribution fields per account type
   - Travel budget field
   - Healthcare costs field

4. **Test bucket interactions**
   - Edit bucket values
   - Values save to state
   - Multiple buckets can exist

## Success Criteria
- [ ] Bucket management tested
- [ ] Bucket fields tested
- [ ] ScenarioModal coverage > 50%

## Expected Impact
- Lines changed: ~150 (extend test file)
- Coverage improvement: ScenarioModal 30% → 50%+
