import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getUserData, deleteUserData } from '@/app/lib/data-store';
import { isValidUuid } from '@/app/lib/validation';
import {
  StoredProjection,
  StoredProjectionResponse,
} from '@/app/types/projections';

const DATA_TYPE = 'projection';

/**
 * GET /api/projections/[id] - Get a specific stored projection
 */
export async function GET(
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
    const { id } = await params;

    // Validate UUID format for ID
    if (!isValidUuid(id)) {
      return NextResponse.json<StoredProjectionResponse>(
        { success: false, error: 'Invalid projection ID format' },
        { status: 400 }
      );
    }

    const projectionRecord = await getUserData(username, DATA_TYPE, id);

    if (!projectionRecord) {
      return NextResponse.json<StoredProjectionResponse>(
        { success: false, error: 'Projection not found' },
        { status: 404 }
      );
    }

    const storedProjection: StoredProjection = {
      id,
      username,
      scenarioId: projectionRecord.data.scenarioId,
      scenarioName: projectionRecord.data.scenarioName,
      calculatedAt: projectionRecord.data.calculatedAt,
      startYear: projectionRecord.data.startYear,
      endYear: projectionRecord.data.endYear,
      projection: projectionRecord.data.projection,
      createdAt: projectionRecord.createdAt,
      updatedAt: projectionRecord.updatedAt,
    };

    return NextResponse.json<StoredProjectionResponse>(
      { success: true, storedProjection },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting projection:', error);
    return NextResponse.json<StoredProjectionResponse>(
      { success: false, error: 'Failed to get projection' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projections/[id] - Delete a stored projection
 */
export async function DELETE(
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
    const { id } = await params;

    // Validate UUID format for ID
    if (!isValidUuid(id)) {
      return NextResponse.json<StoredProjectionResponse>(
        { success: false, error: 'Invalid projection ID format' },
        { status: 400 }
      );
    }

    // Verify projection exists
    const existingRecord = await getUserData(username, DATA_TYPE, id);

    if (!existingRecord) {
      return NextResponse.json<StoredProjectionResponse>(
        { success: false, error: 'Projection not found' },
        { status: 404 }
      );
    }

    await deleteUserData(username, DATA_TYPE, id);

    return NextResponse.json<StoredProjectionResponse>(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting projection:', error);
    return NextResponse.json<StoredProjectionResponse>(
      { success: false, error: 'Failed to delete projection' },
      { status: 500 }
    );
  }
}
