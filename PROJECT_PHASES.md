# FinPlan Development Phases

**Last Updated:** 2025-11-14
**Status:** Phase 1, Session 1.1 - In Progress (Logged in User Experience)

---

## Overview

This document tracks the phased development of FinPlan, a web-based financial and retirement planning tool deployable to AWS. The project is broken into small, focused sessions (1-2 hours each) that each deliver a complete, testable feature.

**Key Priorities:**
- Data Integration (connect UI to DynamoDB)
- Savings Goals Tracking
- Retirement Planning
- Manual portfolio management (real-time stock prices deferred)

---

## Phase 1: Core Data Integration

**Goal:** Connect existing UI pages to DynamoDB and establish authentication guards

### Session 1: Savings Goals API & Data Integration
**Status:** ✅ Complete
**Estimated Time:** 1-2 hours

**Tasks:**
- [x] Create API routes: POST, GET, PUT, DELETE /api/savings-goals
- [x] Connect savings goals page to DynamoDB via API routes
- [x] Replace mock data with real data fetching (useState → API calls)
- [x] Add loading states and error handling
- [x] Test full CRUD operations (create, read, update, delete)

**Files to Modify:**
- `app/api/savings-goals/route.ts` (new)
- `app/api/savings-goals/[id]/route.ts` (new)
- `app/savings-goals/page.tsx` (modify)

**Acceptance Criteria:**
- Users can create new savings goals that persist to DynamoDB
- Goals are fetched from DynamoDB on page load
- Users can update existing goals
- Users can delete goals
- Loading states display during operations
- Errors are handled gracefully

---

### Session 1.1: Logged in User Experience
**Status:** 🔄 In Progress
**Estimated Time:** 3-4 hours
**Priority:** Critical - Fix authentication and establish user profile system

**Tasks:**
- [ ] **Fix OAuth Callback Error**
  - [ ] Add COGNITO_CLIENT_SECRET to ECS task definition in CDK (from Secrets Manager)
  - [ ] Update NextAuth config with error handling and debug mode
  - [ ] Verify all auth environment variables (NEXTAUTH_URL, COGNITO_ISSUER, etc.)
  - [ ] Deploy CDK changes and verify login works

- [ ] **Create User Profile API**
  - [ ] Create POST/GET /api/profile endpoint
  - [ ] Implement profile storage in DynamoDB with dataType: "user-profile"
  - [ ] Profile schema: { username, firstname, onboardingComplete }
  - [ ] Use existing data-store.ts functions for DynamoDB operations

- [ ] **Build First Login Onboarding**
  - [ ] Create OnboardingModal.tsx component
  - [ ] Detect first login (check if user profile exists)
  - [ ] Show modal form to collect firstname
  - [ ] Save profile to DynamoDB on form submission
  - [ ] Mark onboardingComplete: true after successful save

- [ ] **Update Navigation with Welcome Message**
  - [ ] Fetch user profile in Navigation component
  - [ ] Display "Welcome, {firstname}" when logged in
  - [ ] Fallback to email if profile not yet loaded
  - [ ] Add loading state while profile is fetching

- [ ] **Add Authentication Guards to Dashboard**
  - [ ] Add useSession check to dashboard page
  - [ ] Redirect unauthenticated users to sign-in
  - [ ] Show personalized welcome message on dashboard

- [ ] **Optional: Configure Custom Cognito Domain**
  - [ ] Request ACM certificate for auth.thrivecalc.com in us-east-1
  - [ ] Add custom domain configuration to Cognito User Pool in CDK
  - [ ] Create Route53 A record pointing to Cognito CloudFront distribution
  - [ ] Update callback URLs to use custom domain
  - [ ] Deploy and test branded login experience

**Files to Modify:**
- `cdk/lib/finplan-stack.ts` - Add COGNITO_CLIENT_SECRET to ECS task
- `app/api/auth/[...nextauth]/route.ts` - Improve NextAuth configuration
- `app/api/profile/route.ts` - New user profile API endpoint
- `app/components/OnboardingModal.tsx` - New component for firstname collection
- `app/components/Navigation.tsx` - Add welcome message display
- `app/dashboard/page.tsx` - Add auth guard and personalized greeting
- `app/types/profile.ts` - New TypeScript types for user profile
- `PROJECT_PHASES.md` - This document

**Acceptance Criteria:**
- ✅ Users can successfully log in via Cognito OAuth without callback errors
- ✅ NEXTAUTH_URL and all auth environment variables are correctly configured
- ✅ On first login, user sees onboarding modal requesting firstname
- ✅ User profile (username + firstname) is stored in DynamoDB
- ✅ Navigation displays "Welcome, {firstname}" for logged-in users
- ✅ Dashboard shows personalized greeting with user's firstname
- ✅ Unauthenticated users are redirected to sign-in when accessing dashboard
- ✅ Profile data persists across sessions
- ✅ Onboarding modal only shows once (first login only)
- 🎯 Optional: Login page is hosted at auth.thrivecalc.com (custom domain)

**Technical Notes:**
- OAuth callback error likely caused by missing COGNITO_CLIENT_SECRET environment variable
- Using existing DynamoDB single-table design with new dataType: "user-profile"
- Profile recordKey format: "user-profile#profile" (one profile per user)
- Custom Cognito domain requires ACM certificate in us-east-1 (must be separate from main cert)
- NextAuth session already includes user.id from token.sub (Cognito user ID)

**Testing Checklist:**
- [ ] Test login flow from start to finish
- [ ] Verify callback redirects to correct page after authentication
- [ ] Test first login onboarding flow (new user)
- [ ] Test returning user (should not see onboarding)
- [ ] Verify profile data is saved to DynamoDB correctly
- [ ] Test welcome message displays correct firstname
- [ ] Test authentication guard on dashboard
- [ ] Verify unauthenticated users are redirected properly
- [ ] Optional: Test custom domain login experience

---

### Session 2: Retirement Plans API & Storage
**Status:** ⏳ Not Started
**Estimated Time:** 1-2 hours

**Tasks:**
- [ ] Create API routes for retirement plans (POST, GET, PUT, DELETE)
- [ ] Add "Save Plan" button to retirement calculator
- [ ] Load and display saved retirement scenarios
- [ ] Add plan comparison functionality (view multiple scenarios)
- [ ] Store retirement plans in DynamoDB with recordType: "retirement-plan"

**Files to Modify:**
- `app/api/retirement-plans/route.ts` (new)
- `app/api/retirement-plans/[id]/route.ts` (new)
- `app/retirement-calculator/page.tsx` (modify)

**Acceptance Criteria:**
- Users can save retirement calculator results
- Saved plans persist to DynamoDB
- Users can load previous retirement scenarios
- Users can compare multiple scenarios side-by-side
- Plans can be updated and deleted

---

### Session 3: Dashboard Data Integration
**Status:** ⏳ Not Started
**Estimated Time:** 1-2 hours

**Tasks:**
- [ ] Create API route for aggregated dashboard data (GET /api/dashboard)
- [ ] Connect dashboard to real savings goals from DynamoDB
- [ ] Connect dashboard to real retirement plans from DynamoDB
- [ ] Calculate actual metrics from user data (total savings, retirement fund, etc.)
- [ ] Remove all mock data from dashboard
- [ ] Add portfolio summary (if holdings exist)

**Files to Modify:**
- `app/api/dashboard/route.ts` (new)
- `app/dashboard/page.tsx` (modify)

**Acceptance Criteria:**
- Dashboard displays real data from user's DynamoDB records
- Metrics are calculated from actual savings goals and plans
- Recent goals are fetched and displayed
- Dashboard shows "No data yet" states appropriately
- Loading states during data fetch

---

### Session 4: Authentication Guards & Route Protection
**Status:** ⏳ Not Started
**Estimated Time:** 1-2 hours

**Tasks:**
- [ ] Add middleware for protected routes (/dashboard, /savings-goals, /portfolio, /reports)
- [ ] Redirect unauthenticated users to sign-in page
- [ ] Add server-side session checks to all API routes
- [ ] Fix "Sign In with Google" button text → "Sign In"
- [ ] Create unauthorized (401) and forbidden (403) error pages
- [ ] Add session validation helper function

**Files to Modify:**
- `middleware.ts` (new)
- `app/components/Navigation.tsx` (modify)
- `app/api/*/route.ts` (add auth checks to all routes)
- `app/unauthorized/page.tsx` (new)

**Acceptance Criteria:**
- Unauthenticated users cannot access protected pages
- API routes return 401 for missing auth
- Users are redirected to sign-in with return URL
- Navigation button shows correct text
- Proper error pages for auth failures

---

## Phase 2: Portfolio Management

**Goal:** Enable users to track investment portfolios with manual price entry

### Session 5: Portfolio Holdings API
**Status:** ⏳ Not Started
**Estimated Time:** 1-2 hours

**Tasks:**
- [ ] Create API routes for portfolio holdings (POST, GET, PUT, DELETE)
- [ ] Add manual price entry fields for holdings
- [ ] Connect portfolio page to DynamoDB
- [ ] Implement add/edit/delete holdings functionality
- [ ] Add form validation for holdings

**Files to Modify:**
- `app/api/portfolio/holdings/route.ts` (new)
- `app/api/portfolio/holdings/[id]/route.ts` (new)
- `app/portfolio/page.tsx` (modify)

**Acceptance Criteria:**
- Users can add holdings with symbol, shares, cost basis, current price
- Holdings persist to DynamoDB
- Users can edit existing holdings
- Users can delete holdings
- Form validation ensures valid inputs

---

### Session 6: Portfolio Analytics & Calculations
**Status:** ⏳ Not Started
**Estimated Time:** 1-2 hours

**Tasks:**
- [ ] Calculate portfolio metrics (total value, gain/loss, returns %)
- [ ] Implement asset allocation visualization
- [ ] Add cost basis tracking and reporting
- [ ] Create portfolio performance summary
- [ ] Add percentage of portfolio calculations

**Files to Modify:**
- `app/portfolio/page.tsx` (modify)
- `app/lib/portfolio-calculations.ts` (new)

**Acceptance Criteria:**
- Accurate calculation of total portfolio value
- Gain/loss shown in dollars and percentage
- Asset allocation pie chart or breakdown
- Individual holding performance metrics
- Portfolio-level summary statistics

---

### Session 7: Transaction Tracking
**Status:** ⏳ Not Started
**Estimated Time:** 1-2 hours

**Tasks:**
- [ ] Create transaction API routes (POST, GET, DELETE)
- [ ] Add transaction history page/section
- [ ] Link transactions to portfolio holdings
- [ ] Implement transaction categories (buy, sell, dividend)
- [ ] Add transaction filtering and search

**Files to Modify:**
- `app/api/portfolio/transactions/route.ts` (new)
- `app/portfolio/transactions/page.tsx` (new)
- `app/portfolio/page.tsx` (add link to transactions)

**Acceptance Criteria:**
- Users can record buy/sell transactions
- Transactions update portfolio holdings automatically
- Transaction history displays chronologically
- Users can filter by symbol, type, date
- Transactions persist to DynamoDB

---

## Phase 3: User Experience Enhancements

**Goal:** Improve usability, error handling, and polish

### Session 8: User Profile Management
**Status:** ⏳ Not Started
**Estimated Time:** 1-2 hours

**Tasks:**
- [ ] Create profile API routes (GET, PUT)
- [ ] Build profile view/edit page
- [ ] Add change password functionality (Cognito integration)
- [ ] Implement account preferences (currency, date format)
- [ ] Add delete account option

**Files to Modify:**
- `app/api/profile/route.ts` (new)
- `app/profile/page.tsx` (new)
- `app/components/Navigation.tsx` (add profile link)

**Acceptance Criteria:**
- Users can view their profile information
- Users can edit name, email preferences
- Password change works through Cognito
- Preferences are saved to DynamoDB
- Delete account removes all user data

---

### Session 9: Error Handling & Validation
**Status:** ⏳ Not Started
**Estimated Time:** 1-2 hours

**Tasks:**
- [ ] Add form validation library (Zod or similar)
- [ ] Implement toast notifications for user feedback
- [ ] Create better error messages for API failures
- [ ] Add field-level validation with error messages
- [ ] Implement optimistic UI updates with rollback

**Files to Modify:**
- `app/components/Toast.tsx` (new)
- All form pages (add validation)
- All API routes (return structured errors)

**Acceptance Criteria:**
- All forms validate inputs before submission
- Users see clear error messages
- Toast notifications for success/error
- API errors are user-friendly
- Failed operations don't lose user data

---

### Session 10: Loading States & Polish
**Status:** ⏳ Not Started
**Estimated Time:** 1-2 hours

**Tasks:**
- [ ] Add Suspense boundaries for data fetching
- [ ] Create skeleton screens for loading states
- [ ] Improve responsive design for mobile devices
- [ ] Make controls touch-friendly (larger tap targets)
- [ ] Add empty states with helpful CTAs

**Files to Modify:**
- All data-fetching pages
- `app/components/Skeleton.tsx` (new)
- `app/components/EmptyState.tsx` (new)
- Global styles for mobile

**Acceptance Criteria:**
- No flickering during page loads
- Skeleton screens match actual content layout
- Mobile navigation works smoothly
- Buttons and inputs are touch-friendly
- Empty states guide users to create data

---

## Phase 4: Advanced Retirement Features

**Goal:** Enhance retirement planning with scenarios and tracking

### Session 11: Retirement Scenario Planning
**Status:** ⏳ Not Started
**Estimated Time:** 1-2 hours

**Tasks:**
- [ ] Add multiple scenario comparison view
- [ ] Implement what-if analysis tools
- [ ] Add inflation adjustment options
- [ ] Create retirement income strategy selector
- [ ] Add scenario naming and organization

**Files to Modify:**
- `app/retirement-calculator/page.tsx` (enhance)
- `app/retirement-calculator/scenarios/page.tsx` (new)

**Acceptance Criteria:**
- Users can create multiple scenarios
- Side-by-side scenario comparison
- Inflation rates adjustable per scenario
- Different withdrawal strategies available
- Scenarios are saved and retrievable

---

### Session 12: Retirement Progress Tracking
**Status:** ⏳ Not Started
**Estimated Time:** 1-2 hours

**Tasks:**
- [ ] Track actual savings vs projected savings
- [ ] Create retirement goal milestones
- [ ] Add visual progress indicators
- [ ] Generate recommendations for staying on track
- [ ] Add retirement readiness score

**Files to Modify:**
- `app/retirement-calculator/progress/page.tsx` (new)
- `app/api/retirement-plans/progress/route.ts` (new)

**Acceptance Criteria:**
- Visual representation of progress to retirement
- Milestones tracked and celebrated
- Recommendations based on actual progress
- Readiness score calculated from plan vs reality
- Historical progress data stored

---

## Phase 5: Reports & Export

**Goal:** Enable users to generate reports and export data

### Session 13: Financial Reports & Export
**Status:** ⏳ Not Started
**Estimated Time:** 1-2 hours

**Tasks:**
- [ ] Implement PDF report generation
- [ ] Add data export functionality (CSV/JSON)
- [ ] Create custom date range selectors
- [ ] Add email report scheduling (optional)
- [ ] Generate comprehensive financial summary reports

**Files to Modify:**
- `app/api/reports/route.ts` (new)
- `app/api/export/route.ts` (new)
- `app/reports/page.tsx` (enhance)

**Acceptance Criteria:**
- Users can generate PDF reports
- Data exportable in CSV and JSON formats
- Custom date ranges work correctly
- Reports include all financial data
- Email scheduling works (if implemented)

---

## Future Phases (Deferred)

### Phase 6: Advanced Features
- Real-time stock price integration (API)
- Data visualization charts (Chart.js/Recharts)
- Budget & expense tracking
- Tax planning tools
- Multi-currency support

### Phase 7: Production Readiness
- Unit and integration testing
- Performance optimization
- SEO and metadata
- Error tracking (Sentry)
- Cost monitoring alerts

### Phase 8: Nice-to-Have
- Financial advisor recommendations
- Social features (goal sharing)
- Mobile app (React Native)
- AI-powered insights

---

## Progress Tracking

### Completed Sessions: 1 / 14
- [x] Planning complete
- [x] Session 1 (Savings Goals API)
- [ ] Session 1.1 (Logged in User Experience) 🔄 IN PROGRESS
- [ ] Session 2 (Retirement Plans API)
- [ ] Session 3 (Dashboard Integration)
- [ ] Session 4 (Authentication Guards)
- [ ] Session 5 (Portfolio Holdings API)
- [ ] Session 6 (Portfolio Analytics)
- [ ] Session 7 (Transaction Tracking)
- [ ] Session 8 (User Profile)
- [ ] Session 9 (Error Handling)
- [ ] Session 10 (Loading States)
- [ ] Session 11 (Retirement Scenarios)
- [ ] Session 12 (Retirement Progress)
- [ ] Session 13 (Reports & Export)

---

## Notes & Decisions

**Architecture Decisions:**
- Using DynamoDB with single-table design
- NextAuth.js with AWS Cognito for authentication
- Next.js App Router with server components
- API routes for all data operations
- No real-time stock prices initially (manual entry)

**Tech Stack:**
- Next.js 16
- TypeScript
- Tailwind CSS 4
- AWS (ECS, DynamoDB, Cognito, ALB)
- NextAuth.js

**Development Approach:**
- Small, focused sessions (1-2 hours)
- Each session delivers complete, testable feature
- Prioritize core functionality over polish initially
- Test after each session before moving to next

---

## How to Use This Document

1. **Before Starting a Session:**
   - Review the session tasks and acceptance criteria
   - Ensure previous sessions are complete
   - Update status to "🔄 In Progress"

2. **During a Session:**
   - Check off tasks as completed
   - Note any blockers or changes in this document
   - Add technical notes if needed

3. **After Completing a Session:**
   - Update status to "✅ Complete"
   - Update "Completed Sessions" counter
   - Update "Last Updated" date
   - Test all acceptance criteria
   - Update "Status" at top of document

4. **Tracking Progress:**
   - Use the progress checklist to see overall completion
   - Reference session notes for context in future sessions
   - Update this document if requirements change

---

**Current Session:** Phase 1, Session 1.1 - Logged in User Experience (In Progress)
**Next Session:** Phase 1, Session 2 - Retirement Plans API & Storage
