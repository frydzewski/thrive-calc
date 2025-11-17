# DynamoDB Data Storage Guide

This guide explains how user data is stored in DynamoDB for the ThriveCalc application.

## Overview

The ThriveCalc application uses **Amazon DynamoDB** to store all user profile and financial data. DynamoDB is a fully managed NoSQL database that provides:

- ✅ Fast and predictable performance
- ✅ Seamless scalability
- ✅ Automatic encryption at rest
- ✅ Point-in-time recovery
- ✅ Pay-per-request billing (no idle costs)

## Table Structure

### Table Name
`thrivecalc-user-data`

### Primary Key

- **Partition Key**: `userId` (String) - Google user ID
- **Sort Key**: `recordKey` (String) - Format: `{dataType}#{recordId}`

### Global Secondary Index

**DataTypeIndex**:
- **Partition Key**: `userId` (String)
- **Sort Key**: `dataType` (String)

This index allows efficient querying of all records of a specific type for a user.

### Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `userId` | String | Google user ID (partition key) |
| `recordKey` | String | Composite key: `dataType#recordId` (sort key) |
| `dataType` | String | Type of data (e.g., `savings-goal`, `portfolio-holding`) |
| `recordId` | String | Unique identifier for this record (UUID) |
| `data` | Object | The actual financial data (JSON) |
| `createdAt` | String | ISO 8601 timestamp of creation |
| `updatedAt` | String | ISO 8601 timestamp of last update |
| `ttl` | Number | Optional time-to-live (Unix timestamp) |

## Data Types

The system supports different data types for user data:

- `savings-goal` - User's savings goals
- `portfolio-holding` - Investment holdings
- `retirement-plan` - Retirement planning data
- `profile` - User profile information
- `transaction` - Financial transactions
- `budget` - Budget data

## Example Data

### Savings Goal Record

```json
{
  "userId": "google-oauth2|123456789",
  "recordKey": "savings-goal#550e8400-e29b-41d4-a716-446655440000",
  "dataType": "savings-goal",
  "recordId": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "name": "Emergency Fund",
    "targetAmount": 20000,
    "currentAmount": 15000,
    "targetDate": "2025-12-31",
    "monthlyContribution": 500
  },
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-07T12:30:00.000Z"
}
```

### Portfolio Holding Record

```json
{
  "userId": "google-oauth2|123456789",
  "recordKey": "portfolio-holding#abc123",
  "dataType": "portfolio-holding",
  "recordId": "abc123",
  "data": {
    "symbol": "VTI",
    "name": "Vanguard Total Stock Market ETF",
    "shares": 100,
    "purchasePrice": 200,
    "currentPrice": 235
  },
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-07T12:30:00.000Z"
}
```

## Using the Data Store API

The application provides a simple API for working with DynamoDB data.

### Save Data

```typescript
import { saveUserData } from '@/app/lib/data-store';

// Save a new savings goal
const goalId = await saveUserData(
  session.user.id,     // userId
  'savings-goal',      // dataType
  {                    // data
    name: 'Emergency Fund',
    targetAmount: 20000,
    currentAmount: 15000,
    targetDate: '2025-12-31',
    monthlyContribution: 500
  }
);

console.log('Created goal ID:', goalId);
```

### Get Data

```typescript
import { getUserData } from '@/app/lib/data-store';

// Get a specific savings goal
const goal = await getUserData(
  session.user.id,
  'savings-goal',
  goalId
);

console.log('Goal data:', goal?.data);
```

### List Data by Type

```typescript
import { listUserData } from '@/app/lib/data-store';

// Get all savings goals for a user
const goals = await listUserData(
  session.user.id,
  'savings-goal'
);

console.log(`Found ${goals.length} goals`);
goals.forEach(goal => {
  console.log(goal.data.name, goal.data.currentAmount);
});
```

### List All User Data

```typescript
import { listAllUserData } from '@/app/lib/data-store';

// Get ALL data for a user (all types)
const allData = await listAllUserData(session.user.id);

console.log(`Total records: ${allData.length}`);
```

### Update Data

```typescript
import { updateUserData } from '@/app/lib/data-store';

// Update a savings goal
await updateUserData(
  session.user.id,
  'savings-goal',
  goalId,
  {
    ...goal.data,
    currentAmount: 16000,  // Updated amount
  }
);
```

### Delete Data

```typescript
import { deleteUserData } from '@/app/lib/data-store';

// Delete a savings goal
await deleteUserData(
  session.user.id,
  'savings-goal',
  goalId
);
```

## Query Patterns

### Pattern 1: Get a Specific Record

**Use Case**: Load a specific savings goal by ID

**Query**:
```typescript
getUserData(userId, 'savings-goal', goalId)
```

**DynamoDB Operation**: `GetItem`
- Partition Key: `userId`
- Sort Key: `savings-goal#{goalId}`

**Cost**: 1 read unit (strongly consistent) or 0.5 read units (eventually consistent)

### Pattern 2: List All Records of a Type

**Use Case**: Load all savings goals for a user

**Query**:
```typescript
listUserData(userId, 'savings-goal')
```

**DynamoDB Operation**: `Query` on `DataTypeIndex`
- Partition Key: `userId`
- Sort Key: `dataType = 'savings-goal'`

**Cost**: Depends on number of items (1 read unit per 4 KB)

### Pattern 3: List All User Data

**Use Case**: Load everything for a user

**Query**:
```typescript
listAllUserData(userId)
```

**DynamoDB Operation**: `Query` on main table
- Partition Key: `userId`

**Cost**: Depends on total data size

## Access Patterns Summary

| Pattern | Operation | Use Case | Index |
|---------|-----------|----------|-------|
| Get specific record | GetItem | Load one record by ID | Main table |
| List by type | Query | Load all goals, all holdings, etc. | DataTypeIndex |
| List all user data | Query | Load everything for user | Main table |
| Update record | UpdateItem | Modify existing record | Main table |
| Delete record | DeleteItem | Remove record | Main table |
| Create record | PutItem | Add new record | Main table |

## Performance Characteristics

### Read Performance

- **GetItem**: < 10ms typically
- **Query** (by type): < 20ms for typical user data
- **Query** (all data): Depends on data volume

### Write Performance

- **PutItem**: < 10ms typically
- **UpdateItem**: < 10ms typically
- **DeleteItem**: < 10ms typically

### Scalability

DynamoDB automatically scales to handle:
- Millions of requests per second
- Unlimited storage
- Automatic partitioning

## Cost Estimation

DynamoDB uses **pay-per-request pricing**:

| Operation | Cost per Million Requests |
|-----------|--------------------------|
| Read (GetItem/Query) | $0.25 |
| Write (PutItem/UpdateItem) | $1.25 |
| Storage (per GB/month) | $0.25 |

### Example Monthly Cost

**Typical User**:
- 100 read requests/day = 3,000/month
- 10 write requests/day = 300/month
- 10 KB total data

**Cost**:
- Reads: (3,000 / 1,000,000) × $0.25 = $0.00075
- Writes: (300 / 1,000,000) × $1.25 = $0.000375
- Storage: (0.00001 GB) × $0.25 = $0.0000025

**Total per user**: < $0.002/month (essentially free)

**1,000 Users**: ~$2/month
**10,000 Users**: ~$20/month

Much cheaper than S3 + Glue for this use case!

## Features

### Point-in-Time Recovery

Enabled on the table for data protection. You can restore to any point in the last 35 days.

### Encryption at Rest

All data is encrypted using AWS-managed keys.

### Backup

- Continuous backups (PITR) enabled
- Can create on-demand backups
- Cross-region replication available (if needed)

### Time-to-Live (TTL)

Optional `ttl` attribute allows automatic deletion of expired records.

Example use case: Delete old transactions after 7 years for compliance.

## Migration from S3/Parquet/Iceberg

### Why the Change?

1. **Simpler**: No need for Glue catalog, Athena queries
2. **Faster**: Single-digit millisecond latency vs. seconds for S3
3. **Cheaper**: For operational data (< 100 GB per user)
4. **Better DX**: Native AWS SDK, type-safe
5. **ACID**: Strong consistency guarantees

### When to Use S3/Parquet/Iceberg?

Consider S3 + Glue + Iceberg + Athena when:
- Storing > 100 GB per user
- Running complex analytics (SQL queries)
- Need to store historical data indefinitely
- Want to use data warehousing tools (Redshift, etc.)

For our use case (user financial data, < 1 MB per user), DynamoDB is the better choice.

## Best Practices

### 1. Use Composite Sort Keys

✅ `savings-goal#{uuid}` allows querying all goals efficiently
❌ Separate `dataType` attribute with scan operations

### 2. Store JSON in `data` Attribute

✅ Flexible schema, easy to evolve
✅ TypeScript types for compile-time safety
❌ Don't flatten all attributes to top level

### 3. Always Set `createdAt` and `updatedAt`

✅ Track record lifecycle
✅ Sort by creation/update time
✅ Audit trail

### 4. Use GSI for Query Patterns

✅ `DataTypeIndex` for querying by type
❌ Don't scan the entire table

### 5. Batch Operations for Multiple Records

For future optimization:
```typescript
// Use BatchGetItem for multiple records
// Use BatchWriteItem for multiple writes
```

### 6. Handle Errors Gracefully

```typescript
try {
  const data = await getUserData(userId, dataType, recordId);
} catch (error) {
  console.error('DynamoDB error:', error);
  // Show user-friendly error message
}
```

## Local Development

### Using DynamoDB Local

For testing without AWS:

1. Install DynamoDB Local:
```bash
docker run -p 8000:8000 amazon/dynamodb-local
```

2. Update environment:
```env
DYNAMODB_TABLE_NAME=thrivecalc-user-data
AWS_REGION=us-east-1
AWS_ENDPOINT=http://localhost:8000
```

3. Create table:
```bash
aws dynamodb create-table \
  --table-name thrivecalc-user-data \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=recordKey,AttributeType=S \
    AttributeName=dataType,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=recordKey,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000

aws dynamodb update-table \
  --table-name thrivecalc-user-data \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=dataType,AttributeType=S \
  --global-secondary-index-updates \
    "[{\"Create\":{\"IndexName\":\"DataTypeIndex\",\"KeySchema\":[{\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"dataType\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}}]" \
  --endpoint-url http://localhost:8000
```

## Monitoring

### CloudWatch Metrics

Monitor these metrics:
- `ConsumedReadCapacityUnits`
- `ConsumedWriteCapacityUnits`
- `UserErrors`
- `SystemErrors`
- `ThrottledRequests`

### Alarms

Set up alarms for:
- Error rate > 1%
- Throttling > 0

## Security

### IAM Permissions

ECS tasks have these permissions:
```json
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:GetItem",
    "dynamodb:PutItem",
    "dynamodb:UpdateItem",
    "dynamodb:DeleteItem",
    "dynamodb:Query"
  ],
  "Resource": [
    "arn:aws:dynamodb:region:account:table/thrivecalc-user-data",
    "arn:aws:dynamodb:region:account:table/thrivecalc-user-data/index/*"
  ]
}
```

### Data Isolation

- Each user's data is isolated by `userId`
- Application enforces that users can only access their own data
- Use IAM policies to restrict access to production table

## Troubleshooting

### Error: "Cannot read properties of null"

**Cause**: Record doesn't exist

**Solution**:
```typescript
const goal = await getUserData(userId, 'savings-goal', goalId);
if (!goal) {
  console.log('Goal not found');
  return;
}
```

### Error: "ResourceNotFoundException"

**Cause**: Table doesn't exist or wrong region

**Solution**:
- Check `DYNAMODB_TABLE_NAME` environment variable
- Check `AWS_REGION` matches deployment region
- Verify table exists: `aws dynamodb describe-table --table-name thrivecalc-user-data`

### Error: "AccessDeniedException"

**Cause**: Missing IAM permissions

**Solution**:
- Check ECS task role has DynamoDB permissions
- CDK grants permissions automatically in production
- For local dev, configure AWS credentials

## Summary

DynamoDB provides:
- ✅ Fast performance (< 10ms reads/writes)
- ✅ Simple API (Get, Put, Query, Update, Delete)
- ✅ Low cost ($2-20/month for 1,000-10,000 users)
- ✅ Automatic scaling
- ✅ Strong consistency
- ✅ Built-in encryption and backups
- ✅ Perfect for user profile and financial data

The data store API (`data-store.ts`) provides a clean abstraction that's easy to use throughout the application!
