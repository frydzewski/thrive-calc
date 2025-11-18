import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { getUserData, saveUserData, deleteUserData, queryUserData } from '@/app/lib/data-store';
import {
  Account,
  AccountResponse,
  AccountsListResponse,
  AccountType,
  AccountStatus,
} from '@/app/types/accounts';
import { v4 as uuidv4 } from 'uuid';

const DATA_TYPE = 'account';

/**
 * Validate account data
 */
function validateAccountData(data: unknown, isUpdate = false): string | null {
  if (!data || typeof data !== 'object' || data === null) {
    return 'Account data must be an object';
  }

  const dataObj = data as Record<string, unknown>;
  if (!isUpdate) {
    if (!dataObj.accountType || typeof dataObj.accountType !== 'string') {
      return 'accountType is required';
    }

    const validTypes: AccountType[] = [
      '401k',
      'traditional-ira',
      'roth-ira',
      'brokerage',
      'savings',
      'checking',
    ];
    if (!validTypes.includes(dataObj.accountType as AccountType)) {
      return 'Invalid accountType';
    }

    if (!dataObj.accountName || typeof dataObj.accountName !== 'string' || dataObj.accountName.trim() === '') {
      return 'accountName is required';
    }

    if (typeof dataObj.balance !== 'number') {
      return 'balance is required and must be a number';
    }

    if (!dataObj.asOfDate || typeof dataObj.asOfDate !== 'string') {
      return 'asOfDate is required';
    }
  } else {
    // Update validations
    if (dataObj.accountName !== undefined) {
      if (typeof dataObj.accountName !== 'string' || dataObj.accountName.trim() === '') {
        return 'accountName must be a non-empty string';
      }
    }

    if (dataObj.balance !== undefined && typeof dataObj.balance !== 'number') {
      return 'balance must be a number';
    }

    if (dataObj.asOfDate !== undefined && typeof dataObj.asOfDate !== 'string') {
      return 'asOfDate must be a string';
    }

    if (dataObj.status !== undefined) {
      if (dataObj.status !== 'active' && dataObj.status !== 'closed') {
        return 'status must be active or closed';
      }
    }
  }

  // Common validations
  if (dataObj.balance !== undefined && dataObj.balance < 0) {
    return 'balance cannot be negative';
  }

  if (dataObj.institution !== undefined && dataObj.institution !== null && typeof dataObj.institution !== 'string') {
    return 'institution must be a string';
  }

  if (dataObj.notes !== undefined && dataObj.notes !== null && typeof dataObj.notes !== 'string') {
    return 'notes must be a string';
  }

  return null;
}

/**
 * GET /api/accounts - Get all accounts for the user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json<AccountsListResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Query all accounts for this user
    const accountRecords = await queryUserData(userId, DATA_TYPE);

    const accounts: Account[] = accountRecords.map((record) => ({
      id: record.recordId,
      userId,
      accountType: record.data.accountType,
      accountName: record.data.accountName,
      institution: record.data.institution,
      balance: record.data.balance,
      asOfDate: record.data.asOfDate,
      status: record.data.status || 'active',
      notes: record.data.notes,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));

    // Sort by creation date, newest first
    accounts.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json<AccountsListResponse>(
      { success: true, accounts },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting accounts:', error);
    return NextResponse.json<AccountsListResponse>(
      { success: false, error: 'Failed to get accounts' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/accounts - Create a new account
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json<AccountResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();

    // Validate
    const validationError = validateAccountData(body, false);
    if (validationError) {
      return NextResponse.json<AccountResponse>(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    // Create account
    const accountId = uuidv4();

    const accountData = {
      accountType: body.accountType as AccountType,
      accountName: body.accountName.trim(),
      institution: body.institution?.trim() || undefined,
      balance: body.balance,
      asOfDate: body.asOfDate,
      status: 'active' as AccountStatus,
      notes: body.notes?.trim() || undefined,
    };

    await saveUserData(userId, DATA_TYPE, accountData, accountId);

    const account: Account = {
      id: accountId,
      userId,
      ...accountData,
    };

    return NextResponse.json<AccountResponse>(
      { success: true, account },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json<AccountResponse>(
      { success: false, error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
