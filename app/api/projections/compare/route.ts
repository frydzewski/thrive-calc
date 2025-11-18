import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getUserData } from '@/app/lib/data-store';
import { isValidUuid } from '@/app/lib/validation';
import {
  StoredProjection,
  ProjectionComparisonResponse,
} from '@/app/types/projections';

const DATA_TYPE = 'projection';

/**
 * POST /api/projections/compare - Compare multiple stored projections
 * Body: { projectionIds: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json<ProjectionComparisonResponse>(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse JSON body with error handling
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json<ProjectionComparisonResponse>(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    if (!body.projectionIds || !Array.isArray(body.projectionIds)) {
      return NextResponse.json<ProjectionComparisonResponse>(
        { success: false, error: 'projectionIds must be an array' },
        { status: 400 }
      );
    }

    if (body.projectionIds.length === 0) {
      return NextResponse.json<ProjectionComparisonResponse>(
        { success: false, error: 'At least one projection ID is required' },
        { status: 400 }
      );
    }

    if (body.projectionIds.length > 10) {
      return NextResponse.json<ProjectionComparisonResponse>(
        { success: false, error: 'Maximum of 10 projections can be compared at once' },
        { status: 400 }
      );
    }

    // Validate all projection IDs are valid UUIDs
    for (const projectionId of body.projectionIds) {
      if (typeof projectionId !== 'string' || !isValidUuid(projectionId)) {
        return NextResponse.json<ProjectionComparisonResponse>(
          { success: false, error: `Invalid projection ID format: ${projectionId}` },
          { status: 400 }
        );
      }
    }

    // Fetch all requested projections
    const storedProjections: StoredProjection[] = [];

    for (const projectionId of body.projectionIds) {
      const projectionRecord = await getUserData(userId, DATA_TYPE, projectionId);

      if (!projectionRecord) {
        return NextResponse.json<ProjectionComparisonResponse>(
          { success: false, error: `Projection ${projectionId} not found` },
          { status: 404 }
        );
      }

      storedProjections.push({
        id: projectionId,
        userId,
        scenarioId: projectionRecord.data.scenarioId,
        scenarioName: projectionRecord.data.scenarioName,
        calculatedAt: projectionRecord.data.calculatedAt,
        startYear: projectionRecord.data.startYear,
        endYear: projectionRecord.data.endYear,
        projection: projectionRecord.data.projection,
        createdAt: projectionRecord.createdAt,
        updatedAt: projectionRecord.updatedAt,
      });
    }

    // Sort by calculatedAt desc (most recent first)
    storedProjections.sort(
      (a, b) =>
        new Date(b.calculatedAt).getTime() -
        new Date(a.calculatedAt).getTime()
    );

    return NextResponse.json<ProjectionComparisonResponse>(
      { success: true, storedProjections },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error comparing projections:', error);
    return NextResponse.json<ProjectionComparisonResponse>(
      { success: false, error: 'Failed to compare projections' },
      { status: 500 }
    );
  }
}
