import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { listUserData } from '@/app/lib/data-store';
import { isValidUuid } from '@/app/lib/validation';
import {
  StoredProjection,
  StoredProjectionsListResponse,
} from '@/app/types/projections';

const DATA_TYPE = 'projection';

/**
 * GET /api/projections - List stored projections for authenticated user
 * Optional query param: scenarioId (filter by scenario)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json<StoredProjectionsListResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const username = session.user.email;

    // Get optional scenarioId filter from query params
    const { searchParams } = new URL(request.url);
    const scenarioIdFilter = searchParams.get('scenarioId');

    // Validate scenarioId if provided
    if (scenarioIdFilter && !isValidUuid(scenarioIdFilter)) {
      return NextResponse.json<StoredProjectionsListResponse>(
        { success: false, error: 'Invalid scenario ID format' },
        { status: 400 }
      );
    }

    const projectionRecords = await listUserData(username, DATA_TYPE);

    let storedProjections: StoredProjection[] = projectionRecords.map(
      (record) => ({
        id: record.recordId,
        username,
        scenarioId: record.data.scenarioId,
        scenarioName: record.data.scenarioName,
        calculatedAt: record.data.calculatedAt,
        startYear: record.data.startYear,
        endYear: record.data.endYear,
        projection: record.data.projection,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      })
    );

    // Filter by scenarioId if provided
    if (scenarioIdFilter) {
      storedProjections = storedProjections.filter(
        (p) => p.scenarioId === scenarioIdFilter
      );
    }

    // Sort by calculatedAt desc (most recent first)
    storedProjections.sort(
      (a, b) =>
        new Date(b.calculatedAt).getTime() -
        new Date(a.calculatedAt).getTime()
    );

    return NextResponse.json<StoredProjectionsListResponse>(
      { success: true, storedProjections },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error listing projections:', error);
    return NextResponse.json<StoredProjectionsListResponse>(
      { success: false, error: 'Failed to list projections' },
      { status: 500 }
    );
  }
}
