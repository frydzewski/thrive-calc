# Quick Start: Google Authentication

Get Google authentication working in 5 minutes!

## Step 1: Get Google OAuth Credentials (2 minutes)

1. Go to https://console.cloud.google.com/apis/credentials
2. Create a new project (or select existing)
3. Click "Create Credentials" → "OAuth client ID"
4. Configure consent screen if prompted:
   - App name: "FinPlan"
   - Add your email
   - Save
5. Application type: "Web application"
6. Add authorized redirect URI:
   - `http://localhost:3000/api/auth/callback/google`
7. Click "Create"
8. **Copy the Client ID and Client Secret**

## Step 2: Configure Environment Variables (1 minute)

1. Create `.env.local` file in project root:

```bash
cp .env.example .env.local
```

2. Edit `.env.local`:

```env
# Generate a random secret
NEXTAUTH_SECRET=put-a-random-string-here

NEXTAUTH_URL=http://localhost:3000

# Paste your Google credentials
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret-here
```

To generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## Step 3: Test It! (1 minute)

1. Start the dev server:

```bash
npm run dev
```

2. Open http://localhost:3000

3. Click "Sign In with Google" in the top-right

4. Sign in with your Google account

5. You should see your profile picture and name in the navigation!

## That's It!

You now have:
- ✅ Google authentication working
- ✅ User sessions
- ✅ Protected routes ready
- ✅ User data storage ready

## Next Steps

### Use Authentication in Your Pages

```typescript
'use client';

import { useSession } from 'next-auth/react';

export default function MyPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <h1>Welcome, {session.user?.name}!</h1>
      <p>Your user ID: {session.user?.id}</p>
    </div>
  );
}
```

### Save User Data to S3

```typescript
import { saveUserData } from '@/app/lib/data-store';

// Save a savings goal
const goalId = await saveUserData(
  session.user.id,  // User's Google ID
  'savings-goal',   // Data type
  {                 // Your data
    name: 'Emergency Fund',
    targetAmount: 20000,
    currentAmount: 15000,
  }
);
```

### Load User Data from S3

```typescript
import { listUserData } from '@/app/lib/data-store';

// Get all savings goals for this user
const goals = await listUserData(
  session.user.id,
  'savings-goal'
);
```

## Troubleshooting

### "Sign In" button doesn't work

1. Check `.env.local` exists and has correct values
2. Restart dev server: `Ctrl+C` then `npm run dev`
3. Clear browser cache/cookies
4. Verify redirect URI in Google Console

### "Invalid credentials" error

1. Double-check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
2. Make sure there are no extra spaces
3. Regenerate `NEXTAUTH_SECRET`

### Profile picture not showing

This is normal for Next.js. Google images are already configured in `next.config.ts`.

## For Production Deployment

See [AUTHENTICATION_SETUP.md](./AUTHENTICATION_SETUP.md) for:
- Setting up AWS Secrets Manager
- Configuring production OAuth redirect URIs
- Enabling HTTPS
- S3 and Iceberg table details

## File Structure

```
app/
├── api/
│   └── auth/
│       └── [...nextauth]/
│           └── route.ts          # NextAuth config
├── lib/
│   ├── auth.ts                   # Auth helper functions
│   └── data-store.ts             # S3 data access
├── components/
│   ├── Navigation.tsx            # Updated with auth
│   └── SessionProvider.tsx       # Session context
└── types/
    └── next-auth.d.ts            # TypeScript types

cdk/lib/
└── finplan-stack.ts              # S3 + Glue infrastructure
```

## What's Deployed in AWS (when you run `npm run cdk:deploy`)

1. **S3 Bucket**: `finplan-data-{account}-{region}`
   - Encrypted, versioned, private
   - Stores user data

2. **Glue Database**: `finplan_db`
   - Iceberg table catalog

3. **Glue Table**: `user_financial_data`
   - Schema for user data

4. **IAM Permissions**:
   - ECS tasks can read/write S3
   - ECS tasks can query Glue catalog

## Cost

Authentication adds minimal cost:
- **S3**: ~$1/month for first 50GB
- **Glue**: ~$1/month for catalog
- **Secrets Manager**: ~$1.20/month for 3 secrets

**Total**: ~$3.20/month

## Support

For detailed information, see:
- [AUTHENTICATION_SETUP.md](./AUTHENTICATION_SETUP.md) - Complete guide
- [COMPLETE_CDK_GUIDE.md](./COMPLETE_CDK_GUIDE.md) - AWS deployment guide

For NextAuth.js docs: https://next-auth.js.org/
