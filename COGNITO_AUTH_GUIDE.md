# AWS Cognito Authentication Guide

This guide explains how authentication works in the ThriveCalc application using AWS Cognito User Pools.

## Overview

The ThriveCalc application uses **AWS Cognito User Pools** for user authentication. Cognito provides:

- ✅ Secure user sign-up and sign-in
- ✅ Email verification
- ✅ Password reset functionality
- ✅ Managed user directory
- ✅ Built-in security features (password policies, account recovery)
- ✅ No external OAuth providers needed
- ✅ Fully integrated with AWS infrastructure

## Architecture

```
User Browser
    ↓
NextAuth.js (app/api/auth/[...nextauth]/route.ts)
    ↓
AWS Cognito User Pool
    ↓
User verified & JWT token issued
    ↓
NextAuth.js session created
    ↓
User can access protected pages
```

## Cognito User Pool Configuration

The CDK stack creates a Cognito User Pool with the following settings:

### User Pool Settings (cdk/lib/thrivecalc-stack.ts:78-112)

```typescript
const userPool = new cognito.UserPool(this, 'ThriveCalcUserPool', {
  userPoolName: 'thrivecalc-users',
  selfSignUpEnabled: true,        // Users can create accounts
  signInAliases: {
    email: true,                  // Sign in with email
    username: false,              // No username required
  },
  autoVerify: {
    email: true,                  // Email verification required
  },
  standardAttributes: {
    email: { required: true, mutable: false },
    givenName: { required: false, mutable: true },
    familyName: { required: false, mutable: true },
  },
  passwordPolicy: {
    minLength: 8,
    requireLowercase: true,
    requireUppercase: true,
    requireDigits: true,
    requireSymbols: false,        // No special characters required
  },
  accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
  removalPolicy: cdk.RemovalPolicy.RETAIN,  // Keep users on stack deletion
});
```

### User Pool Client Settings (cdk/lib/thrivecalc-stack.ts:114-140)

```typescript
const userPoolClient = new cognito.UserPoolClient(this, 'ThriveCalcUserPoolClient', {
  userPool,
  userPoolClientName: 'thrivecalc-web-client',
  authFlows: {
    userPassword: true,           // Username/password auth
    userSrp: true,                // Secure Remote Password
  },
  oAuth: {
    flows: {
      authorizationCodeGrant: true,  // OAuth 2.0 authorization code flow
    },
    scopes: [
      cognito.OAuthScope.EMAIL,
      cognito.OAuthScope.OPENID,
      cognito.OAuthScope.PROFILE,
    ],
    callbackUrls: [
      'http://localhost:3000/api/auth/callback/cognito',
      'http://<your-alb-dns>/api/auth/callback/cognito',
    ],
  },
  preventUserExistenceErrors: true,  // Security best practice
});
```

### User Pool Domain (cdk/lib/thrivecalc-stack.ts:142-147)

```typescript
const userPoolDomain = userPool.addDomain('ThriveCalcUserPoolDomain', {
  cognitoDomain: {
    domainPrefix: `thrivecalc-${this.account}`,  // Unique per AWS account
  },
});
```

## NextAuth.js Configuration

### NextAuth.js Route (app/api/auth/[...nextauth]/route.ts)

```typescript
import NextAuth, { NextAuthOptions } from 'next-auth';
import CognitoProvider from 'next-auth/providers/cognito';

export const authOptions: NextAuthOptions = {
  providers: [
    CognitoProvider({
      clientId: process.env.COGNITO_CLIENT_ID || '',
      clientSecret: process.env.COGNITO_CLIENT_SECRET || '',
      issuer: process.env.COGNITO_ISSUER || '',
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || '';  // Add user ID to session
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

## Environment Variables

### Required Environment Variables

Add these to `.env.local` for local development:

```env
# NextAuth.js Configuration
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# AWS Cognito Configuration
COGNITO_CLIENT_ID=your-cognito-client-id
COGNITO_CLIENT_SECRET=your-cognito-client-secret
COGNITO_ISSUER=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX

# AWS Configuration
AWS_REGION=us-east-1
DYNAMODB_TABLE_NAME=thrivecalc-user-data
```

### Getting Cognito Credentials

After deploying with CDK:

```bash
npm run cdk:deploy
```

You'll see output like this:

```
Outputs:
ThriveCalcStack.UserPoolId = us-east-1_AbCdEfGhI
ThriveCalcStack.UserPoolClientId = 1a2b3c4d5e6f7g8h9i0j
ThriveCalcStack.UserPoolDomain = thrivecalc-123456789012
ThriveCalcStack.CognitoIssuer = https://cognito-idp.us-east-1.amazonaws.com/us-east-1_AbCdEfGhI
```

**Note**: The `COGNITO_CLIENT_SECRET` must be retrieved manually:

```bash
aws cognito-idp describe-user-pool-client \
  --user-pool-id us-east-1_AbCdEfGhI \
  --client-id 1a2b3c4d5e6f7g8h9i0j \
  --query 'UserPoolClient.ClientSecret' \
  --output text
```

## User Sign-Up Flow

### 1. User Creates Account

User navigates to the sign-in page and clicks "Sign up":

```
User → NextAuth.js → Cognito Hosted UI → Sign Up Form
```

The Cognito Hosted UI provides:
- Email address field
- Password field (must meet password policy)
- Given name / family name (optional)

### 2. Email Verification

After sign-up, Cognito sends a verification email:

```
Subject: Your verification code
Body: Your verification code is: 123456
```

User enters the code to verify their email address.

### 3. First Sign-In

After verification, user can sign in:

```
User → NextAuth.js → Cognito → JWT Token → NextAuth Session → Authenticated
```

## User Sign-In Flow

### Standard Sign-In

```typescript
// User clicks "Sign In" button
import { signIn } from 'next-auth/react';

await signIn('cognito', { callbackUrl: '/dashboard' });
```

This redirects to the Cognito Hosted UI where the user enters:
- Email address
- Password

After successful authentication:
1. Cognito issues JWT token
2. NextAuth.js creates session
3. User redirected to dashboard

### Sign-Out

```typescript
import { signOut } from 'next-auth/react';

await signOut({ callbackUrl: '/' });
```

## Password Reset Flow

### 1. User Clicks "Forgot Password"

On the Cognito Hosted UI, user clicks "Forgot your password?"

### 2. Verification Code Sent

Cognito sends a verification code to the user's email:

```
Subject: Your password reset code
Body: Your password reset code is: 654321
```

### 3. User Resets Password

User enters:
- Email address
- Verification code
- New password (must meet password policy)

### 4. Password Updated

User can now sign in with the new password.

## Session Management

### Server-Side Session Check

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/api/auth/signin');
  }

  // User is authenticated
  const userId = session.user.id;
  const email = session.user.email;

  return <div>Welcome, {email}!</div>;
}
```

### Client-Side Session Check

```typescript
'use client';

import { useSession } from 'next-auth/react';

export default function ClientComponent() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Not signed in</div>;
  }

  return <div>Welcome, {session.user.email}!</div>;
}
```

## User Attributes

### Standard Attributes

Cognito stores these attributes for each user:

| Attribute | Type | Required | Mutable |
|-----------|------|----------|---------|
| `email` | String | Yes | No |
| `given_name` | String | No | Yes |
| `family_name` | String | No | Yes |
| `sub` | UUID | Yes | No |

### Accessing User Attributes in NextAuth Session

```typescript
const session = await getServerSession(authOptions);

if (session) {
  const userId = session.user.id;           // Cognito sub (UUID)
  const email = session.user.email;         // User's email
  const name = session.user.name;           // Given name + family name
  const image = session.user.image;         // Not used with Cognito
}
```

## Security Features

### Password Policy

Passwords must meet these requirements:
- Minimum 8 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one digit
- Special characters NOT required (for better UX)

### Account Security

- **Email verification required** - Users must verify email before signing in
- **Account recovery** - Users can reset password via email
- **Prevent user enumeration** - Error messages don't reveal if email exists
- **Encryption at rest** - User data encrypted in Cognito

### Token Security

- **JWT tokens** - Signed by Cognito
- **Token expiration** - Configurable (default: 1 hour)
- **Refresh tokens** - Automatic token refresh
- **HTTPS only** - Tokens transmitted over HTTPS

## Cost

### Cognito User Pool Pricing

**Free Tier:**
- First 50,000 monthly active users (MAUs): Free
- Email verification: Included

**After Free Tier:**
- $0.0055 per MAU for next 50,000 users
- $0.0046 per MAU for next 100,000 users
- $0.00325 per MAU for next 900,000 users

**For 1,000 users**: Free
**For 10,000 users**: Free
**For 100,000 users**: ~$275/month

### Cost Comparison

| Provider | Cost for 1,000 users | Cost for 10,000 users |
|----------|---------------------|----------------------|
| Cognito | Free | Free |
| Auth0 | $23/month | $228/month |
| Firebase Auth | Free | Free |
| Google OAuth | Free | Free |

Cognito is **free for most use cases** and fully integrated with AWS!

## Monitoring

### CloudWatch Metrics

Monitor these metrics in CloudWatch:

- **UserAuthentication** - Sign-in attempts
- **TokenRefreshSuccesses** - Token refresh count
- **SignUpSuccesses** - New user registrations
- **SignInSuccesses** - Successful sign-ins
- **AccountTakeOverRisk** - Suspicious sign-in attempts

### Alarms

Set up CloudWatch alarms for:
- Failed sign-in attempts > 100/hour
- Account takeover risk events

## Customization

### Custom Email Templates

You can customize the verification and password reset emails:

```typescript
userPool.addTrigger(cognito.UserPoolOperation.CUSTOM_MESSAGE, lambdaFunction);
```

### Custom UI

Instead of Cognito Hosted UI, you can build a custom sign-in page:

1. Create custom sign-in form
2. Use AWS Amplify or AWS SDK to authenticate
3. Exchange Cognito tokens for NextAuth session

### Multi-Factor Authentication (MFA)

Enable MFA for additional security:

```typescript
const userPool = new cognito.UserPool(this, 'ThriveCalcUserPool', {
  // ... other settings
  mfa: cognito.Mfa.OPTIONAL,  // or REQUIRED
  mfaSecondFactor: {
    sms: true,
    otp: true,  // Time-based one-time password (TOTP)
  },
});
```

## Troubleshooting

### Error: "Invalid redirect_uri"

**Cause**: Callback URL not configured in User Pool Client

**Solution**: Add callback URL to CDK stack:

```typescript
callbackUrls: [
  'http://localhost:3000/api/auth/callback/cognito',
  'https://your-domain.com/api/auth/callback/cognito',
],
```

### Error: "User is not confirmed"

**Cause**: Email not verified

**Solution**: User must check email and enter verification code

### Error: "Incorrect username or password"

**Cause**: Invalid credentials or user doesn't exist

**Solution**:
- Check email address is correct
- Ensure password meets policy requirements
- Try password reset if forgotten

### Error: "AccessDeniedException"

**Cause**: Missing environment variables

**Solution**:
- Check `COGNITO_CLIENT_ID` is set
- Check `COGNITO_CLIENT_SECRET` is set
- Check `COGNITO_ISSUER` is set

## Local Development

### Testing Cognito Locally

1. Deploy the CDK stack to create Cognito resources:
```bash
npm run cdk:deploy
```

2. Get Cognito credentials from CDK output

3. Update `.env.local` with credentials

4. Run the development server:
```bash
npm run dev
```

5. Navigate to http://localhost:3000 and click "Sign In"

### Creating Test Users

You can create test users via AWS Console:

1. Go to AWS Console → Cognito → User Pools
2. Select "thrivecalc-users" pool
3. Click "Users" → "Create user"
4. Enter email and temporary password
5. User will be prompted to change password on first sign-in

Or via AWS CLI:

```bash
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_XXXXXXXXX \
  --username test@example.com \
  --user-attributes Name=email,Value=test@example.com \
  --temporary-password TempPass123! \
  --message-action SUPPRESS
```

## Migration from Google OAuth

### What Changed

**Before (Google OAuth):**
- Required Google Cloud Console setup
- External OAuth provider
- Users sign in with Google account

**After (Cognito):**
- No external dependencies
- Fully AWS-managed
- Users create accounts with email/password
- No Google API calls required

### Benefits of Cognito

✅ **No external dependencies** - Everything in AWS
✅ **Better control** - Custom password policies, user attributes
✅ **Lower latency** - No external API calls
✅ **Cost effective** - Free for up to 50,000 MAUs
✅ **Security** - Built-in account recovery, email verification
✅ **Simpler infrastructure** - No NAT Gateway needed for auth

## Summary

AWS Cognito provides:
- ✅ Secure user authentication (email/password)
- ✅ Email verification and password reset
- ✅ Free for up to 50,000 monthly active users
- ✅ Fully managed user directory
- ✅ Integrated with NextAuth.js
- ✅ Built-in security features
- ✅ No external dependencies

The authentication system is production-ready and scales automatically with your application!
