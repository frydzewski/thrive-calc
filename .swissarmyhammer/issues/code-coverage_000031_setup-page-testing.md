# Setup Page Testing Infrastructure

**Refer to ./code-coverage.md**

## Goal
Create testing utilities for Next.js App Router pages.

## Context
Pages in app router have special patterns - async components, params, searchParams, etc.

## Implementation Steps

1. **Create page test utilities**
   - Location: `app/__tests__/page-test-utils.tsx`
   - Helpers for mocking useRouter
   - Helpers for mocking useSearchParams
   - Helpers for mocking useParams
   - Helpers for mocking server components
   - Mock fetch responses

2. **Document patterns**
   - How to test async server components
   - How to test client components
   - How to test data fetching
   - How to test error boundaries

3. **Create example**
   - Simple example test showing pattern

## Success Criteria
- [ ] Page test utilities created
- [ ] Patterns documented
- [ ] Example test created

## Expected Impact
- Lines changed: ~80 (new utility file)
- Coverage improvement: Enables page testing

## Note
Infrastructure step - no direct coverage yet.
