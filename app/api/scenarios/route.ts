import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { listUserData, saveUserData } from '@/app/lib/data-store';
import {
  Scenario,
  AssumptionBucket,
  LumpSumEvent,
  ScenariosListResponse,
  ScenarioResponse,
  validateCreateScenario,
  validateBuckets,
} from '@/app/types/scenarios';
import { v4 as uuidv4 } from 'uuid';

const DATA_TYPE = 'scenario';

/**
 * GET /api/scenarios - List all scenarios for authenticated user
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json<ScenariosListResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const username = session.user.email;

    const scenarioRecords = await listUserData(username, DATA_TYPE);

    const scenarios: Scenario[] = scenarioRecords.map((record) => ({
      id: record.recordId,
      username,
      name: record.data.name,
      isDefault: record.data.isDefault || false,
      description: record.data.description,
      assumptionBuckets: record.data.assumptionBuckets || [],
      lumpSumEvents: record.data.lumpSumEvents || [],
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));

    // Sort by default first, then by createdAt desc
    scenarios.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return NextResponse.json<ScenariosListResponse>(
      { success: true, scenarios },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error listing scenarios:', error);
    return NextResponse.json<ScenariosListResponse>(
      { success: false, error: 'Failed to list scenarios' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scenarios - Create a new scenario
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json<ScenarioResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const username = session.user.email;

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

    // Validate create data
    const validationError = validateCreateScenario(body);
    if (validationError) {
      return NextResponse.json<ScenarioResponse>(
        { success: false, error: validationError },
        { status: 400 }
      );
    }

    // Generate IDs for assumption buckets
    const assumptionBuckets = body.assumptionBuckets.map((bucket: Omit<AssumptionBucket, 'id'>) => ({
      ...bucket,
      id: uuidv4(),
    }));

    // Validate buckets (no gaps/overlaps)
    const bucketsError = validateBuckets(assumptionBuckets);
    if (bucketsError) {
      return NextResponse.json<ScenarioResponse>(
        { success: false, error: bucketsError },
        { status: 400 }
      );
    }

    // Generate IDs for lump sum events
    const lumpSumEvents = (body.lumpSumEvents || []).map((event: Omit<LumpSumEvent, 'id'>) => ({
      ...event,
      id: uuidv4(),
    }));

    // Check if this is the first scenario for this user
    const existingScenarios = await listUserData(username, DATA_TYPE);
    const isFirstScenario = existingScenarios.length === 0;

    // Check if a scenario with this name already exists
    const nameExists = existingScenarios.some(
      (record) => record.data.name === body.name.trim()
    );

    if (nameExists) {
      return NextResponse.json<ScenarioResponse>(
        { success: false, error: 'A scenario with this name already exists' },
        { status: 400 }
      );
    }

    const scenarioData = {
      name: body.name.trim(),
      isDefault: isFirstScenario, // Auto-set first scenario as default
      description: body.description?.trim() || undefined,
      assumptionBuckets,
      lumpSumEvents,
    };

    const scenarioId = await saveUserData(username, DATA_TYPE, scenarioData);

    const scenario: Scenario = {
      id: scenarioId,
      username,
      ...scenarioData,
    };

    return NextResponse.json<ScenarioResponse>(
      { success: true, scenario },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating scenario:', error);
    return NextResponse.json<ScenarioResponse>(
      { success: false, error: 'Failed to create scenario' },
      { status: 500 }
    );
  }
}
