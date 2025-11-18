import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getUserData, saveUserData, deleteUserData, listUserData } from '@/app/lib/data-store';
import { isValidUuid } from '@/app/lib/validation';
import {
  Scenario,
  AssumptionBucket,
  LumpSumEvent,
  ScenarioResponse,
  validateUpdateScenario,
  validateBuckets,
} from '@/app/types/scenarios';
import { Mortgage } from '@/app/types/mortgages';
import { calculateScenarioProjection, calculateAge } from '@/app/types/projections';
import { UserProfile } from '@/app/types/profile';
import { Account } from '@/app/types/accounts';
import { v4 as uuidv4 } from 'uuid';

const DATA_TYPE = 'scenario';
const PROFILE_DATA_TYPE = 'user-profile';
const ACCOUNT_DATA_TYPE = 'account';

/**
 * Helper to calculate projection end year based on user's age and scenario assumptions
 */
function calculateProjectionEndYear(dateOfBirth: string, endAge: number): number {
  const currentAge = calculateAge(dateOfBirth);
  const currentYear = new Date().getFullYear();
  return currentYear + (endAge - currentAge);
}

/**
 * GET /api/scenarios/[id] - Get a specific scenario
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json<ScenarioResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id } = await params;

    // Validate UUID format for ID
    if (!isValidUuid(id)) {
      return NextResponse.json<ScenarioResponse>(
        { success: false, error: 'Invalid scenario ID format' },
        { status: 400 }
      );
    }

    const scenarioRecord = await getUserData(userId, DATA_TYPE, id);

    if (!scenarioRecord) {
      return NextResponse.json<ScenarioResponse>(
        { success: false, error: 'Scenario not found' },
        { status: 404 }
      );
    }

    const scenario: Scenario = {
      id,
      userId,
      name: scenarioRecord.data.name,
      isDefault: scenarioRecord.data.isDefault || false,
      description: scenarioRecord.data.description,
      retirementAge: scenarioRecord.data.retirementAge,
      socialSecurityAge: scenarioRecord.data.socialSecurityAge,
      socialSecurityIncome: scenarioRecord.data.socialSecurityIncome,
      investmentReturnRate: scenarioRecord.data.investmentReturnRate,
      inflationRate: scenarioRecord.data.inflationRate,
      assumptionBuckets: scenarioRecord.data.assumptionBuckets || [],
      lumpSumEvents: scenarioRecord.data.lumpSumEvents || [],
      mortgages: scenarioRecord.data.mortgages || [],
      projection: scenarioRecord.data.projection, // Include projection if it exists
      createdAt: scenarioRecord.createdAt,
      updatedAt: scenarioRecord.updatedAt,
    };

    return NextResponse.json<ScenarioResponse>(
      { success: true, scenario },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting scenario:', error);
    return NextResponse.json<ScenarioResponse>(
      { success: false, error: 'Failed to get scenario' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/scenarios/[id] - Update a scenario
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json<ScenarioResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id } = await params;

    // Validate UUID format for ID
    if (!isValidUuid(id)) {
      return NextResponse.json<ScenarioResponse>(
        { success: false, error: 'Invalid scenario ID format' },
        { status: 400 }
      );
    }

    // Parse JSON body with error handling
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json<ScenarioResponse>(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // Get existing scenario
    const existingRecord = await getUserData(userId, DATA_TYPE, id);

    if (!existingRecord) {
      return NextResponse.json<ScenarioResponse>(
        { success: false, error: 'Scenario not found' },
        { status: 404 }
      );
    }

    // Validate updates
    const validationError = validateUpdateScenario(body);
    if (validationError) {
      return NextResponse.json<ScenarioResponse>(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    // Merge updates
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) {
      updates.name = body.name.trim();

      // Check if name is being changed to one that already exists
      if (updates.name !== existingRecord.data.name) {
        const existingScenarios = await listUserData(userId, DATA_TYPE);
        const nameExists = existingScenarios.some(
          (record) => record.recordId !== id && record.data.name === updates.name
        );

        if (nameExists) {
          return NextResponse.json<ScenarioResponse>(
            { success: false, error: 'A scenario with this name already exists' },
            { status: 400 }
          );
        }
      }
    }

    if (body.description !== undefined) {
      updates.description = body.description?.trim() || undefined;
    }

    if (body.retirementAge !== undefined) {
      updates.retirementAge = body.retirementAge;
    }

    if (body.socialSecurityAge !== undefined) {
      updates.socialSecurityAge = body.socialSecurityAge;
    }

    if (body.socialSecurityIncome !== undefined) {
      updates.socialSecurityIncome = body.socialSecurityIncome;
    }

    if (body.investmentReturnRate !== undefined) {
      updates.investmentReturnRate = body.investmentReturnRate;
    }

    if (body.inflationRate !== undefined) {
      updates.inflationRate = body.inflationRate;
    }

    if (body.assumptionBuckets !== undefined) {
      // Ensure all buckets have IDs
      const assumptionBuckets = body.assumptionBuckets.map((bucket: AssumptionBucket) => ({
        ...bucket,
        id: bucket.id || uuidv4(),
      }));

      // Validate buckets
      const bucketsError = validateBuckets(assumptionBuckets);
      if (bucketsError) {
        return NextResponse.json<ScenarioResponse>(
          { success: false, error: bucketsError },
          { status: 400 }
        );
      }

      updates.assumptionBuckets = assumptionBuckets;
    }

    if (body.lumpSumEvents !== undefined) {
      // Ensure all events have IDs
      const lumpSumEvents = body.lumpSumEvents.map((event: LumpSumEvent) => ({
        ...event,
        id: event.id || uuidv4(),
      }));

      updates.lumpSumEvents = lumpSumEvents;
    }

    if (body.mortgages !== undefined) {
      // Ensure all mortgages have IDs
      const mortgages = body.mortgages.map((mortgage: Mortgage) => ({
        ...mortgage,
        id: mortgage.id || uuidv4(),
      }));

      updates.mortgages = mortgages;
    }

    if (body.isDefault !== undefined) {
      // If setting this scenario as default, unset any other default
      if (body.isDefault === true && !existingRecord.data.isDefault) {
        const allScenarios = await listUserData(userId, DATA_TYPE);
        for (const scenario of allScenarios) {
          if (scenario.data.isDefault && scenario.recordId !== id) {
            await saveUserData(
              userId,
              DATA_TYPE,
              {
                ...scenario.data,
                isDefault: false,
              },
              scenario.recordId
            );
          }
        }
      }
      updates.isDefault = body.isDefault;
    }

    const scenarioData = {
      ...existingRecord.data,
      ...updates,
    };

    // Recalculate projection only if financial assumptions changed
    // Keeps existing projection for name/description updates to avoid unnecessary computation
    let projection = existingRecord.data.projection;
    if (
      body.assumptionBuckets !== undefined ||
      body.lumpSumEvents !== undefined ||
      body.mortgages !== undefined ||
      body.retirementAge !== undefined ||
      body.socialSecurityAge !== undefined ||
      body.socialSecurityIncome !== undefined ||
      body.investmentReturnRate !== undefined ||
      body.inflationRate !== undefined
    ) {
      try {
        const profileRecord = await getUserData(userId, PROFILE_DATA_TYPE, 'profile');
        const accountRecords = await listUserData(userId, ACCOUNT_DATA_TYPE);

        if (profileRecord?.data) {
          // Build user profile from stored data
          const userProfile: UserProfile = {
            userId,
            firstname: profileRecord.data.firstname,
            dateOfBirth: profileRecord.data.dateOfBirth,
            maritalStatus: profileRecord.data.maritalStatus || 'single',
            numberOfDependents: profileRecord.data.numberOfDependents || 0,
            onboardingComplete: profileRecord.data.onboardingComplete,
          };

          // Aggregate user's accounts by type
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

          // Create temporary scenario with updated assumptions
          const tempScenario: Scenario = {
            id,
            userId,
            name: scenarioData.name,
            isDefault: scenarioData.isDefault || false,
            description: scenarioData.description,
            retirementAge: scenarioData.retirementAge,
            socialSecurityAge: scenarioData.socialSecurityAge,
            socialSecurityIncome: scenarioData.socialSecurityIncome,
            investmentReturnRate: scenarioData.investmentReturnRate,
            inflationRate: scenarioData.inflationRate,
            assumptionBuckets: scenarioData.assumptionBuckets || [],
            lumpSumEvents: scenarioData.lumpSumEvents || [],
            mortgages: scenarioData.mortgages || [],
          };

          // Calculate projection from current year to the end age specified in assumptions
          const currentYear = new Date().getFullYear();
          const endAge = Math.max(...tempScenario.assumptionBuckets.map((b) => b.endAge));
          const endYear = calculateProjectionEndYear(userProfile.dateOfBirth, endAge);

          projection = calculateScenarioProjection(
            tempScenario,
            userProfile,
            accounts,
            currentYear,
            endYear
          );
        }
      } catch (projectionError) {
        // Log but don't fail - we can update scenario without projection
        console.error('Error calculating projection:', projectionError);
      }
    }

    const updatedScenarioData = {
      ...scenarioData,
      projection, // Include recalculated or existing projection
    };

    await saveUserData(userId, DATA_TYPE, updatedScenarioData, id);

    const scenario: Scenario = {
      id,
      userId,
      name: updatedScenarioData.name,
      isDefault: updatedScenarioData.isDefault || false,
      description: updatedScenarioData.description,
      retirementAge: updatedScenarioData.retirementAge,
      socialSecurityAge: updatedScenarioData.socialSecurityAge,
      socialSecurityIncome: updatedScenarioData.socialSecurityIncome,
      investmentReturnRate: updatedScenarioData.investmentReturnRate,
      inflationRate: updatedScenarioData.inflationRate,
      assumptionBuckets: updatedScenarioData.assumptionBuckets || [],
      lumpSumEvents: updatedScenarioData.lumpSumEvents || [],
      mortgages: updatedScenarioData.mortgages || [],
      projection: updatedScenarioData.projection,
    };

    return NextResponse.json<ScenarioResponse>(
      { success: true, scenario },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating scenario:', error);
    return NextResponse.json<ScenarioResponse>(
      { success: false, error: 'Failed to update scenario' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/scenarios/[id] - Delete a scenario
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json<ScenarioResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id } = await params;

    // Validate UUID format for ID
    if (!isValidUuid(id)) {
      return NextResponse.json<ScenarioResponse>(
        { success: false, error: 'Invalid scenario ID format' },
        { status: 400 }
      );
    }

    // Verify scenario exists
    const existingRecord = await getUserData(userId, DATA_TYPE, id);

    if (!existingRecord) {
      return NextResponse.json<ScenarioResponse>(
        { success: false, error: 'Scenario not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if it's the only scenario
    const allScenarios = await listUserData(userId, DATA_TYPE);
    if (allScenarios.length === 1) {
      return NextResponse.json<ScenarioResponse>(
        { success: false, error: 'Cannot delete the only scenario' },
        { status: 400 }
      );
    }

    // If deleting the default scenario, promote another one
    if (existingRecord.data.isDefault) {
      const otherScenarios = allScenarios.filter((s) => s.recordId !== id);
      if (otherScenarios.length > 0) {
        // Promote the most recently created scenario to default
        otherScenarios.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );
        const newDefault = otherScenarios[0];
        await saveUserData(
          userId,
          DATA_TYPE,
          {
            ...newDefault.data,
            isDefault: true,
          },
          newDefault.recordId
        );
      }
    }

    await deleteUserData(userId, DATA_TYPE, id);

    return NextResponse.json<ScenarioResponse>(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting scenario:', error);
    return NextResponse.json<ScenarioResponse>(
      { success: false, error: 'Failed to delete scenario' },
      { status: 500 }
    );
  }
}
