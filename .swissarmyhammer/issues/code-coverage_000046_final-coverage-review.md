# Final Coverage Review and Optimization

**Refer to ./code-coverage.md**

## Goal
Review final coverage report, identify any remaining gaps, and achieve highest possible coverage.

## Context
After all previous testing steps, do final review and optimization.

## Implementation Steps

1. **Generate detailed coverage report**
   - Run `npm run test:coverage`
   - Review HTML coverage report
   - Identify uncovered lines

2. **Categorize remaining gaps**
   - Unreachable code (dead code) - consider removing
   - Error cases that are hard to trigger - add tests
   - Configuration code - may not need tests
   - Type-only files - expected to have low coverage

3. **Add targeted tests**
   - Focus on high-value uncovered code
   - Business logic priority
   - Error handling priority

4. **Document exclusions**
   - Update jest.config.ts if needed
   - Document why certain code isn't tested
   - Add comments in code for untestable sections

5. **Set coverage thresholds**
   - Update jest.config.ts with coverage thresholds
   - Prevent future coverage regressions

## Success Criteria
- [ ] Coverage report reviewed
- [ ] Remaining gaps addressed or documented
- [ ] Coverage thresholds configured
- [ ] Overall coverage > 80%

## Expected Impact
- Lines changed: ~100 (various test additions + config)
- Coverage improvement: Bring overall to 80%+

## Target Coverage Goals
- Components: 90%+
- Libraries: 85%+
- API Routes: 80%+
- Pages: 75%+
- Types: 60%+ (mostly type definitions)
- Overall: 80%+
