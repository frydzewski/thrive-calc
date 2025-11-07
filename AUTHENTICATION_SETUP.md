# Google Authentication & User Data Storage Setup

This guide explains how to set up Google authentication and user data storage using S3, Parquet, and Iceberg for the FinPlan application.

## What Was Added

### 1. Authentication System
- **NextAuth.js** with Google OAuth provider
- Session management across the application
- User profile display in navigation
- Sign in/out functionality

### 2. Data Storage Infrastructure (CDK)
- **S3 Bucket** for storing user data in Parquet format
  - Versioning enabled
  - Encrypted at rest
  - Lifecycle policies (Glacier after 90 days)
- **AWS Glue Database** for Iceberg table catalog
- **Glue Table** schema for user financial data
- **IAM Permissions** for ECS tasks to access S3 and Glue

### 3. Data Access Layer
- Functions to save, retrieve, update, and delete user data
- S3-based storage with JSON format (Parquet integration ready)
- Type-safe TypeScript interfaces

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌───────────┐
│   User      │────────▶│  Google      │────────▶│  NextAuth │
│   Browser   │◀────────│  OAuth       │◀────────│  Session  │
└─────────────┘         └──────────────┘         └───────────┘
       │                                                │
       │                                                ▼
       │                                         ┌───────────┐
       │                                         │    ECS    │
       │                                         │   Tasks   │
       │                                         └───────────┘
       │                                                │
       ▼                                                ▼
┌─────────────────────────────────────────────────────────┐
│                      Application                        │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │
│  │  Dashboard  │  │   Savings   │  │  Portfolio   │  │
│  │             │  │   Goals     │  │              │  │
│  └─────────────┘  └─────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  Data Store API │
                  │  (data-store.ts)│
                  └─────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  S3 Bucket   │
                    │  (Parquet/   │
                    │   Iceberg)   │
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  AWS Glue    │
                    │  (Catalog)   │
                    └──────────────┘
```

## Prerequisites

### 1. Google Cloud Console Setup

You need to create OAuth credentials for Google Sign-In:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)

2. Create a new project or select existing:
   - Click "Select a project" → "New Project"
   - Name it "FinPlan" or similar
   - Click "Create"

3. Enable Google+ API:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Configure OAuth Consent Screen:
   - Go to "APIs & Services" → "OAuth consent screen"
   - Select "External" user type
   - Click "Create"
   - Fill in required fields:
     - App name: "FinPlan"
     - User support email: your email
     - Developer contact: your email
   - Click "Save and Continue"
   - Add scopes (if prompted): `email`, `profile`, `openid`
   - Click "Save and Continue"
   - Add test users (your email) for testing
   - Click "Save and Continue"

5. Create OAuth Credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "FinPlan Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for local development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://yourdomain.com/api/auth/callback/google`
   - Click "Create"
   - **Copy the Client ID and Client Secret** - you'll need these!

### 2. Environment Variables Setup

#### For Local Development

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` with your values:
   ```env
   # Generate a secret
   NEXTAUTH_SECRET=$(openssl rand -base64 32)
   NEXTAUTH_URL=http://localhost:3000

   # Add your Google credentials
   GOOGLE_CLIENT_ID=1234567890-xxxxxxxxxxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx

   # AWS (optional for local dev, use mock data)
   AWS_REGION=us-east-1
   DATA_BUCKET_NAME=finplan-data-local
   ```

3. **Important**: Never commit `.env.local` to git!

#### For Production (AWS)

The CDK stack automatically configures environment variables for production:
- `AWS_REGION` - Set by CDK
- `DATA_BUCKET_NAME` - Set by CDK
- `GLUE_DATABASE_NAME` - Set by CDK
- `GLUE_TABLE_NAME` - Set by CDK

You need to add Google OAuth secrets to the CDK stack:

**Option A: AWS Secrets Manager (Recommended)**

1. Create secrets:
   ```bash
   aws secretsmanager create-secret \
     --name finplan/google-client-id \
     --secret-string "your-google-client-id"

   aws secretsmanager create-secret \
     --name finplan/google-client-secret \
     --secret-string "your-google-client-secret"

   aws secretsmanager create-secret \
     --name finplan/nextauth-secret \
     --secret-string "$(openssl rand -base64 32)"
   ```

2. Update `cdk/lib/finplan-stack.ts`:
   ```typescript
   import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

   // Get secrets
   const googleClientId = secretsmanager.Secret.fromSecretNameV2(
     this,
     'GoogleClientId',
     'finplan/google-client-id'
   );

   const googleClientSecret = secretsmanager.Secret.fromSecretNameV2(
     this,
     'GoogleClientSecret',
     'finplan/google-client-secret'
   );

   const nextAuthSecret = secretsmanager.Secret.fromSecretNameV2(
     this,
     'NextAuthSecret',
     'finplan/nextauth-secret'
   );

   // In taskImageOptions, replace environment with:
   environment: {
     NODE_ENV: 'production',
     PORT: '3000',
     DATA_BUCKET_NAME: dataBucket.bucketName,
     GLUE_DATABASE_NAME: 'finplan_db',
     GLUE_TABLE_NAME: 'user_financial_data',
     AWS_REGION: this.region,
     NEXTAUTH_URL: `http://${fargateService.loadBalancer.loadBalancerDnsName}`,
   },
   secrets: {
     GOOGLE_CLIENT_ID: ecs.Secret.fromSecretsManager(googleClientId),
     GOOGLE_CLIENT_SECRET: ecs.Secret.fromSecretsManager(googleClientSecret),
     NEXTAUTH_SECRET: ecs.Secret.fromSecretsManager(nextAuthSecret),
   },

   // Grant permission to read secrets
   googleClientId.grantRead(fargateService.taskDefinition.taskRole);
   googleClientSecret.grantRead(fargateService.taskDefinition.taskRole);
   nextAuthSecret.grantRead(fargateService.taskDefinition.taskRole);
   ```

3. Redeploy:
   ```bash
   npm run cdk:deploy
   ```

**Option B: Environment Variables (Not Recommended for Production)**

Only use this for testing. Edit `cdk/lib/finplan-stack.ts`:

```typescript
environment: {
  // ... existing vars ...
  GOOGLE_CLIENT_ID: 'your-client-id',
  GOOGLE_CLIENT_SECRET: 'your-client-secret',
  NEXTAUTH_SECRET: 'your-nextauth-secret',
  NEXTAUTH_URL: `http://${fargateService.loadBalancer.loadBalancerDnsName}`,
},
```

## Testing Locally

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   ```
   http://localhost:3000
   ```

3. **Click "Sign In with Google"** in the navigation bar

4. **Authorize the app:**
   - Select your Google account
   - Grant permissions
   - You should be redirected back to the app

5. **Verify authentication:**
   - Your profile picture and name should appear in the navigation
   - Click "Sign Out" to test logout

## Using the Data Store

### Save User Data

```typescript
import { saveUserData } from '@/app/lib/data-store';

// Save a savings goal
const goalId = await saveUserData(
  session.user.id,
  'savings-goal',
  {
    name: 'Emergency Fund',
    targetAmount: 20000,
    currentAmount: 15000,
    targetDate: '2025-12-31',
  }
);
```

### Retrieve User Data

```typescript
import { getUserData, listUserData } from '@/app/lib/data-store';

// Get a specific record
const goal = await getUserData(session.user.id, 'savings-goal', goalId);

// List all savings goals for a user
const goals = await listUserData(session.user.id, 'savings-goal');
```

### Update User Data

```typescript
import { updateUserData } from '@/app/lib/data-store';

await updateUserData(
  session.user.id,
  'savings-goal',
  goalId,
  {
    ...existingData,
    currentAmount: 16000,
  }
);
```

### Delete User Data

```typescript
import { deleteUserData } from '@/app/lib/data-store';

await deleteUserData(session.user.id, 'savings-goal', goalId);
```

## Data Types

The system supports different data types for user data:

- `savings-goal` - Savings goals
- `portfolio-holding` - Investment holdings
- `retirement-plan` - Retirement plans
- `transaction` - Financial transactions
- `profile` - User profile data

Data is stored in S3 with this structure:
```
s3://finplan-data-{account}-{region}/
  users/
    {userId}/
      savings-goal/
        {recordId}.json
      portfolio-holding/
        {recordId}.json
      retirement-plan/
        {recordId}.json
```

## S3 and Iceberg Table Structure

### S3 Bucket Features

- **Encryption**: S3-managed encryption at rest
- **Versioning**: Enabled for data protection
- **Lifecycle**:
  - Old versions → Glacier after 90 days
  - Delete old versions after 1 year
- **Access Control**: Private, ECS tasks only

### Glue/Iceberg Table Schema

```
Table: user_financial_data
Database: finplan_db
Format: Iceberg (Parquet)

Columns:
- user_id (string) - Google user ID
- data_type (string) - Type of data (goal, holding, etc.)
- record_id (string) - Unique record identifier
- data (string) - JSON data payload
- created_at (timestamp) - Creation time
- updated_at (timestamp) - Last update time
```

### Future: Parquet Integration

Currently, data is stored as JSON for simplicity. To enable Parquet/Iceberg:

1. Install Apache Arrow and Parquet libraries (already installed)
2. Update `data-store.ts` to write Parquet format
3. Use AWS Glue for ETL jobs
4. Query with Amazon Athena

Example Parquet write (for future implementation):

```typescript
import * as parquet from 'parquetjs';

const schema = new parquet.ParquetSchema({
  user_id: { type: 'UTF8' },
  data_type: { type: 'UTF8' },
  record_id: { type: 'UTF8' },
  data: { type: 'UTF8' },
  created_at: { type: 'TIMESTAMP_MILLIS' },
  updated_at: { type: 'TIMESTAMP_MILLIS' },
});

const writer = await parquet.ParquetWriter.openStream(schema, outputStream);
await writer.appendRow(record);
await writer.close();
```

## Security Considerations

### Authentication

- ✅ OAuth 2.0 with Google (industry standard)
- ✅ Secure session management (NextAuth.js)
- ✅ HTTPS in production (configure SSL certificate)
- ✅ Session cookies are HTTP-only and secure

### Data Storage

- ✅ S3 bucket encryption at rest
- ✅ Private bucket (no public access)
- ✅ IAM role-based access (no credentials in code)
- ✅ Versioning enabled for recovery
- ✅ User data isolated by userId

### Best Practices

1. **Never log sensitive data**
2. **Use Secrets Manager for credentials** (not environment variables)
3. **Enable MFA for AWS console access**
4. **Review IAM policies regularly**
5. **Enable CloudTrail for auditing**
6. **Set up billing alerts**

## Troubleshooting

### Issue: "Sign in with Google" button doesn't work

**Solution**:
1. Check `.env.local` has correct `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
2. Verify `NEXTAUTH_URL=http://localhost:3000`
3. Check Google OAuth consent screen is configured
4. Verify redirect URI `http://localhost:3000/api/auth/callback/google` is added in Google Console

### Issue: "Invalid credentials" error

**Solution**:
1. Regenerate `NEXTAUTH_SECRET`: `openssl rand -base64 32`
2. Verify Google OAuth credentials are correct
3. Check environment variables are loaded (restart dev server)

### Issue: "Access Denied" when writing to S3

**Solution**:
1. Verify ECS task role has S3 write permissions
2. Check bucket name in environment variables
3. Verify bucket exists: `aws s3 ls s3://finplan-data-{account}-{region}`
4. Check IAM policy in CDK stack

### Issue: Session not persisting

**Solution**:
1. Clear browser cookies
2. Verify `NEXTAUTH_SECRET` is set
3. Check `NEXTAUTH_URL` matches your domain
4. Ensure SessionProvider wraps the app in layout.tsx

## Next Steps

1. **Deploy to AWS:**
   ```bash
   npm run cdk:deploy
   ```

2. **Update Google OAuth redirect URIs:**
   - Add production URL: `https://your-domain.com/api/auth/callback/google`

3. **Integrate data storage into pages:**
   - Update savings-goals page to use `saveUserData()`
   - Update portfolio page to use `listUserData()`
   - Update dashboard to load user-specific data

4. **Add authorization checks:**
   - Protect API routes with session checks
   - Ensure users can only access their own data

5. **Enable Parquet/Iceberg:**
   - Implement Parquet writer in data-store.ts
   - Set up AWS Glue ETL jobs
   - Use Amazon Athena for analytics

## Cost Impact

Adding authentication and data storage adds these costs:

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| S3 Storage | First 50GB | $1.15 |
| S3 Requests | 100,000 PUT/GET | $0.05 |
| AWS Glue Catalog | Database + Table | $1.00 |
| Secrets Manager | 3 secrets | $1.20 |
| **Total Additional** | | **~$3.40/month** |

Very minimal cost for user data storage!

## Summary

You now have:

✅ Google OAuth authentication
✅ User sessions across the app
✅ Sign in/out in navigation
✅ S3 bucket for user data
✅ AWS Glue/Iceberg table catalog
✅ Data access layer with CRUD operations
✅ Type-safe TypeScript interfaces
✅ Secure credential management
✅ Ready for Parquet/Iceberg integration

**Next**: Integrate the data store into your pages to save and load user-specific financial data!
