import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { saveUserData, listUserData } from '@/app/lib/data-store';

// GET /api/savings-goals - Get all savings goals for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const goals = await listUserData(session.user.id, 'savings-goal');

    return NextResponse.json({ goals });
  } catch (error) {
    console.error('Error fetching savings goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch savings goals' },
      { status: 500 }
    );
  }
}

// POST /api/savings-goals - Create a new savings goal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.targetAmount) {
      return NextResponse.json(
        { error: 'Name and target amount are required' },
        { status: 400 }
      );
    }

    // Validate data types
    if (typeof body.targetAmount !== 'number' || body.targetAmount <= 0) {
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

    // Create savings goal data object
    const goalData = {
      name: body.name,
      targetAmount: body.targetAmount,
      currentAmount: body.currentAmount || 0,
      targetDate: body.targetDate || null,
      monthlyContribution: body.monthlyContribution || 0,
    };

    const result = await saveUserData(
      session.user.id,
      'savings-goal',
      goalData
    );

    return NextResponse.json({ goal: result }, { status: 201 });
  } catch (error) {
    console.error('Error creating savings goal:', error);
    return NextResponse.json(
      { error: 'Failed to create savings goal' },
      { status: 500 }
    );
  }
}
