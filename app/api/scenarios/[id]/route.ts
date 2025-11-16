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
import { v4 as uuidv4 } from 'uuid';

const DATA_TYPE = 'scenario';

/**
 * GET /api/scenarios/[id] - Get a specific scenario
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json<ScenarioResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const username = session.user.email;
    const { id } = await params;

    // Validate UUID format for ID
    if (!isValidUuid(id)) {
      return NextResponse.json<ScenarioResponse>(
        { success: false, error: 'Invalid scenario ID format' },
        { status: 400 }
      );
    }

    const scenarioRecord = await getUserData(username, DATA_TYPE, id);

    if (!scenarioRecord) {
      return NextResponse.json<ScenarioResponse>(
        { success: false, error: 'Scenario not found' },
        { status: 404 }
      );
    }

    const scenario: Scenario = {
      id,
      username,
      name: scenarioRecord.data.name,
      isDefault: scenarioRecord.data.isDefault || false,
      description: scenarioRecord.data.description,
      assumptionBuckets: scenarioRecord.data.assumptionBuckets || [],
      lumpSumEvents: scenarioRecord.data.lumpSumEvents || [],
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

    if (!session?.user?.email) {
      return NextResponse.json<ScenarioResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const username = session.user.email;
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
    const existingRecord = await getUserData(username, DATA_TYPE, id);

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
        const existingScenarios = await listUserData(username, DATA_TYPE);
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

    if (body.isDefault !== undefined) {
      // If setting this scenario as default, unset any other default
      if (body.isDefault === true && !existingRecord.data.isDefault) {
        const allScenarios = await listUserData(username, DATA_TYPE);
        for (const scenario of allScenarios) {
          if (scenario.data.isDefault && scenario.recordId !== id) {
            await saveUserData(
              username,
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

    await saveUserData(username, DATA_TYPE, scenarioData, id);

    const scenario: Scenario = {
      id,
      username,
      name: scenarioData.name,
      isDefault: scenarioData.isDefault || false,
      description: scenarioData.description,
      assumptionBuckets: scenarioData.assumptionBuckets || [],
      lumpSumEvents: scenarioData.lumpSumEvents || [],
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

    if (!session?.user?.email) {
      return NextResponse.json<ScenarioResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const username = session.user.email;
    const { id } = await params;

    // Validate UUID format for ID
    if (!isValidUuid(id)) {
      return NextResponse.json<ScenarioResponse>(
        { success: false, error: 'Invalid scenario ID format' },
        { status: 400 }
      );
    }

    // Verify scenario exists
    const existingRecord = await getUserData(username, DATA_TYPE, id);

    if (!existingRecord) {
      return NextResponse.json<ScenarioResponse>(
        { success: false, error: 'Scenario not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if it's the only scenario
    const allScenarios = await listUserData(username, DATA_TYPE);
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
          username,
          DATA_TYPE,
          {
            ...newDefault.data,
            isDefault: true,
          },
          newDefault.recordId
        );
      }
    }

    await deleteUserData(username, DATA_TYPE, id);

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
