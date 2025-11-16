import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { getUserData, saveUserData, listUserData } from '@/app/lib/data-store';
import { isValidUuid } from '@/app/lib/validation';
import { Scenario } from '@/app/types/scenarios';
import { UserProfile } from '@/app/types/profile';
import { Account } from '@/app/types/accounts';
import {
  StoredProjectionResponse,
  calculateScenarioProjection,
} from '@/app/types/projections';
import { v4 as uuidv4 } from 'uuid';

const SCENARIO_DATA_TYPE = 'scenario';
const PROFILE_DATA_TYPE = 'user-profile';
const ACCOUNT_DATA_TYPE = 'account';
const PROJECTION_DATA_TYPE = 'projection';

/**
 * POST /api/scenarios/[id]/calculate - Calculate a scenario projection and store it
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json<StoredProjectionResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const username = session.user.email;
    const { id: scenarioId } = await params;

    // Validate UUID format for ID
    if (!isValidUuid(scenarioId)) {
      return NextResponse.json<StoredProjectionResponse>(
        { success: false, error: 'Invalid scenario ID format' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));

    // Get the scenario
    const scenarioRecord = await getUserData(username, SCENARIO_DATA_TYPE, scenarioId);

    if (!scenarioRecord) {
      return NextResponse.json<StoredProjectionResponse>(
        { success: false, error: 'Scenario not found' },
        { status: 404 }
      );
    }

    const scenario: Scenario = {
      id: scenarioId,
      username,
      name: scenarioRecord.data.name,
      isDefault: scenarioRecord.data.isDefault || false,
      description: scenarioRecord.data.description,
      assumptionBuckets: scenarioRecord.data.assumptionBuckets || [],
      lumpSumEvents: scenarioRecord.data.lumpSumEvents || [],
      createdAt: scenarioRecord.createdAt,
      updatedAt: scenarioRecord.updatedAt,
    };

    // Get the user profile
    const profileRecord = await getUserData(username, PROFILE_DATA_TYPE, 'profile');

    if (!profileRecord) {
      return NextResponse.json<StoredProjectionResponse>(
        { success: false, error: 'User profile not found. Please complete your profile first.' },
        { status: 404 }
      );
    }

    const userProfile: UserProfile = {
      username,
      firstname: profileRecord.data.firstname,
      dateOfBirth: profileRecord.data.dateOfBirth,
      maritalStatus: profileRecord.data.maritalStatus,
      numberOfDependents: profileRecord.data.numberOfDependents,
      onboardingComplete: profileRecord.data.onboardingComplete,
      createdAt: profileRecord.createdAt,
      updatedAt: profileRecord.updatedAt,
    };

    // Get user's accounts
    const accountRecords = await listUserData(username, ACCOUNT_DATA_TYPE);

    const accounts: Account[] = accountRecords.map((record) => ({
      id: record.recordId,
      username,
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

    // Determine start and end years
    const currentYear = new Date().getFullYear();
    const startYear = body.startYear || currentYear;
    const endYear = body.endYear || currentYear + 60; // Default to 60 years ahead

    // Validate year range
    if (startYear > endYear) {
      return NextResponse.json<StoredProjectionResponse>(
        { success: false, error: 'Start year must be less than or equal to end year' },
        { status: 400 }
      );
    }

    if (endYear - startYear > 100) {
      return NextResponse.json<StoredProjectionResponse>(
        { success: false, error: 'Year range must be 100 years or less' },
        { status: 400 }
      );
    }

    // Calculate the projection with error handling
    let projection;
    try {
      projection = calculateScenarioProjection(
        scenario,
        userProfile,
        accounts,
        startYear,
        endYear
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during calculation';
      return NextResponse.json<StoredProjectionResponse>(
        { success: false, error: `Failed to calculate projection: ${errorMessage}` },
        { status: 400 }
      );
    }

    // Store the projection
    const now = new Date().toISOString();
    const projectionData = {
      scenarioId,
      scenarioName: scenario.name,
      calculatedAt: now,
      startYear,
      endYear,
      projection,
    };

    const projectionId = uuidv4();
    await saveUserData(username, PROJECTION_DATA_TYPE, projectionData, projectionId);

    const storedProjection = {
      id: projectionId,
      username,
      ...projectionData,
      createdAt: now,
      updatedAt: now,
    };

    return NextResponse.json<StoredProjectionResponse>(
      { success: true, storedProjection },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error calculating scenario projection:', error);
    return NextResponse.json<StoredProjectionResponse>(
      { success: false, error: 'Failed to calculate projection' },
      { status: 500 }
    );
  }
}
