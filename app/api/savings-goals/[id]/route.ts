import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getUserData, updateUserData, deleteUserData } from '@/app/lib/data-store';

// GET /api/savings-goals/[id] - Get a specific savings goal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const goal = await getUserData(session.user.id, 'savings-goal', id);

    if (!goal) {
      return NextResponse.json(
        { error: 'Savings goal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ goal });
  } catch (error) {
    console.error('Error fetching savings goal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch savings goal' },
      { status: 500 }
    );
  }
}

// PUT /api/savings-goals/[id] - Update a savings goal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Validate data types if provided
    if (body.targetAmount !== undefined &&
        (typeof body.targetAmount !== 'number' || body.targetAmount <= 0)) {
      return NextResponse.json(
        { error: 'Target amount must be a positive number' },
        { status: 400 }
      );
    }

    if (body.currentAmount !== undefined &&
        (typeof body.currentAmount !== 'number' || body.currentAmount < 0)) {
      return NextResponse.json(
        { error: 'Current amount must be a non-negative number' },
        { status: 400 }
      );
    }

    if (body.monthlyContribution !== undefined &&
        (typeof body.monthlyContribution !== 'number' || body.monthlyContribution < 0)) {
      return NextResponse.json(
        { error: 'Monthly contribution must be a non-negative number' },
        { status: 400 }
      );
    }

    // Only update fields that are provided
    const updateData: Record<string, any> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.targetAmount !== undefined) updateData.targetAmount = body.targetAmount;
    if (body.currentAmount !== undefined) updateData.currentAmount = body.currentAmount;
    if (body.targetDate !== undefined) updateData.targetDate = body.targetDate;
    if (body.monthlyContribution !== undefined) updateData.monthlyContribution = body.monthlyContribution;

    await updateUserData(
      session.user.id,
      'savings-goal',
      id,
      updateData
    );

    // Fetch the updated goal to return
    const updatedGoal = await getUserData(session.user.id, 'savings-goal', id);

    if (!updatedGoal) {
      return NextResponse.json(
        { error: 'Savings goal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ goal: updatedGoal });
  } catch (error) {
    console.error('Error updating savings goal:', error);
    return NextResponse.json(
      { error: 'Failed to update savings goal' },
      { status: 500 }
    );
  }
}

// DELETE /api/savings-goals/[id] - Delete a savings goal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if the goal exists before deleting
    const existingGoal = await getUserData(session.user.id, 'savings-goal', id);

    if (!existingGoal) {
      return NextResponse.json(
        { error: 'Savings goal not found' },
        { status: 404 }
      );
    }

    await deleteUserData(
      session.user.id,
      'savings-goal',
      id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting savings goal:', error);
    return NextResponse.json(
      { error: 'Failed to delete savings goal' },
      { status: 500 }
    );
  }
}
