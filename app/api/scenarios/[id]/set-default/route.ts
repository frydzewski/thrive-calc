import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { getUserData, saveUserData, listUserData } from '@/app/lib/data-store';
import { isValidUuid } from '@/app/lib/validation';
import { ScenarioResponse } from '@/app/types/scenarios';

const DATA_TYPE = 'scenario';

/**
 * POST /api/scenarios/[id]/set-default - Set a scenario as the default
 */
export async function POST(
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
    const scenarioRecord = await getUserData(userId, DATA_TYPE, id);

    if (!scenarioRecord) {
      return NextResponse.json<ScenarioResponse>(
        { success: false, error: 'Scenario not found' },
        { status: 404 }
      );
    }

    // If already default, nothing to do
    if (scenarioRecord.data.isDefault) {
      return NextResponse.json<ScenarioResponse>(
        {
          success: true,
          scenario: {
            id,
            userId,
            ...scenarioRecord.data,
            createdAt: scenarioRecord.createdAt,
            updatedAt: scenarioRecord.updatedAt,
          },
        },
        { status: 200 }
      );
    }

    // Unset any other default scenarios
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

    // Set this scenario as default
    const updatedData = {
      ...scenarioRecord.data,
      isDefault: true,
    };

    await saveUserData(userId, DATA_TYPE, updatedData, id);

    return NextResponse.json<ScenarioResponse>(
      {
        success: true,
        scenario: {
          id,
          userId,
          ...updatedData,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error setting default scenario:', error);
    return NextResponse.json<ScenarioResponse>(
      { success: false, error: 'Failed to set default scenario' },
      { status: 500 }
    );
  }
}
