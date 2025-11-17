# Setup API Route Testing Infrastructure

**Refer to ./code-coverage.md**

## Goal
Create testing utilities and patterns for API routes before writing individual route tests.

## Context
Next.js API routes need special handling. Set up shared mocks and utilities.

## Implementation Steps

1. **Create API test utilities**
   - Location: `app/api/__tests__/api-test-utils.ts`
   - Mock getServerSession
   - Mock DynamoDB client
   - Create helper to build NextRequest
   - Create helper to parse NextResponse

2. **Document testing patterns**
   - How to test authenticated routes
   - How to test unauthenticated routes
   - How to mock session
   - How to mock database responses

3. **Create example test**
   - Small example showing the pattern
   - Can use a simple route or create minimal test

## Success Criteria
- [ ] API test utilities created
- [ ] Mocking helpers available
- [ ] Pattern documented
- [ ] Example test demonstrates usage

## Expected Impact
- Lines changed: ~100 (new utility file)
- Coverage improvement: Enables all API route testing

## Note
This is infrastructure - no direct coverage improvement yet.
