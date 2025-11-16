import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getUserData, saveUserData, deleteUserData } from '@/app/lib/data-store';
import { Account, AccountResponse, AccountStatus } from '@/app/types/accounts';

const DATA_TYPE = 'account';

/**
 * Validate account update data
 */
function validateAccountUpdate(data: any): string | null {
  if (data.accountName !== undefined) {
    if (typeof data.accountName !== 'string' || data.accountName.trim() === '') {
      return 'accountName must be a non-empty string';
    }
  }

  if (data.balance !== undefined) {
    if (typeof data.balance !== 'number' || data.balance < 0) {
      return 'balance must be a non-negative number';
    }
  }

  if (data.asOfDate !== undefined && typeof data.asOfDate !== 'string') {
    return 'asOfDate must be a string';
  }

  if (data.status !== undefined && data.status !== 'active' && data.status !== 'closed') {
    return 'status must be active or closed';
  }

  if (data.institution !== undefined && data.institution !== null && typeof data.institution !== 'string') {
    return 'institution must be a string';
  }

  if (data.notes !== undefined && data.notes !== null && typeof data.notes !== 'string') {
    return 'notes must be a string';
  }

  return null;
}

/**
 * GET /api/accounts/[id] - Get a specific account
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json<AccountResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const username = session.user.email;
    const { id } = await params;

    const accountRecord = await getUserData(username, DATA_TYPE, id);

    if (!accountRecord) {
      return NextResponse.json<AccountResponse>(
        { success: false, error: 'Account not found' },
        { status: 404 }
      );
    }

    const account: Account = {
      id,
      username,
      accountType: accountRecord.data.accountType,
      accountName: accountRecord.data.accountName,
      institution: accountRecord.data.institution,
      balance: accountRecord.data.balance,
      asOfDate: accountRecord.data.asOfDate,
      status: accountRecord.data.status || 'active',
      notes: accountRecord.data.notes,
      createdAt: accountRecord.createdAt,
      updatedAt: accountRecord.updatedAt,
    };

    return NextResponse.json<AccountResponse>(
      { success: true, account },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting account:', error);
    return NextResponse.json<AccountResponse>(
      { success: false, error: 'Failed to get account' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/accounts/[id] - Update an account
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json<AccountResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const username = session.user.email;
    const { id } = await params;
    const body = await request.json();

    // Get existing account
    const existingRecord = await getUserData(username, DATA_TYPE, id);

    if (!existingRecord) {
      return NextResponse.json<AccountResponse>(
        { success: false, error: 'Account not found' },
        { status: 404 }
      );
    }

    // Validate updates
    const validationError = validateAccountUpdate(body);
    if (validationError) {
      return NextResponse.json<AccountResponse>(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    // Merge updates
    const updates: any = {};

    if (body.accountName !== undefined) {
      updates.accountName = body.accountName.trim();
    }

    if (body.institution !== undefined) {
      updates.institution = body.institution?.trim() || undefined;
    }

    if (body.balance !== undefined) {
      updates.balance = body.balance;
    }

    if (body.asOfDate !== undefined) {
      updates.asOfDate = body.asOfDate;
    }

    if (body.status !== undefined) {
      updates.status = body.status as AccountStatus;
    }

    if (body.notes !== undefined) {
      updates.notes = body.notes?.trim() || undefined;
    }

    const accountData = {
      ...existingRecord.data,
      ...updates,
    };

    await saveUserData(username, DATA_TYPE, accountData, id);

    const account: Account = {
      id,
      username,
      accountType: accountData.accountType,
      accountName: accountData.accountName,
      institution: accountData.institution,
      balance: accountData.balance,
      asOfDate: accountData.asOfDate,
      status: accountData.status,
      notes: accountData.notes,
    };

    return NextResponse.json<AccountResponse>(
      { success: true, account },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json<AccountResponse>(
      { success: false, error: 'Failed to update account' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/accounts/[id] - Delete an account
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json<AccountResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const username = session.user.email;
    const { id } = await params;

    // Verify account exists
    const existingRecord = await getUserData(username, DATA_TYPE, id);

    if (!existingRecord) {
      return NextResponse.json<AccountResponse>(
        { success: false, error: 'Account not found' },
        { status: 404 }
      );
    }

    await deleteUserData(username, DATA_TYPE, id);

    return NextResponse.json<AccountResponse>(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json<AccountResponse>(
      { success: false, error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
