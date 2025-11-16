import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { getUserData, saveUserData } from '@/app/lib/data-store';
import { UserProfile, ProfileResponse, MaritalStatus } from '@/app/types/profile';

const PROFILE_RECORD_ID = 'profile';

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * GET /api/profile - Get user profile
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const username = session.user.email;
    const profileRecord = await getUserData(username, 'user-profile', PROFILE_RECORD_ID);

    if (!profileRecord) {
      return NextResponse.json<ProfileResponse>(
        { success: true, profile: undefined },
        { status: 200 }
      );
    }

    const profile: UserProfile = {
      username,
      firstname: profileRecord.data.firstname,
      dateOfBirth: profileRecord.data.dateOfBirth,
      maritalStatus: profileRecord.data.maritalStatus,
      numberOfDependents: profileRecord.data.numberOfDependents,
      currentAge: profileRecord.data.dateOfBirth ? calculateAge(profileRecord.data.dateOfBirth) : undefined,
      onboardingComplete: profileRecord.data.onboardingComplete || false,
      createdAt: profileRecord.createdAt,
      updatedAt: profileRecord.updatedAt,
    };

    return NextResponse.json<ProfileResponse>(
      { success: true, profile },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting profile:', error);
    return NextResponse.json<ProfileResponse>(
      { success: false, error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile - Create or update user profile
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const username = session.user.email;
    const body = await request.json();
    const { firstname, dateOfBirth, maritalStatus, numberOfDependents } = body;

    // Validation
    if (!firstname || typeof firstname !== 'string' || firstname.trim() === '') {
      return NextResponse.json<ProfileResponse>(
        { success: false, error: 'firstname is required' },
        { status: 400 }
      );
    }

    if (!dateOfBirth || typeof dateOfBirth !== 'string') {
      return NextResponse.json<ProfileResponse>(
        { success: false, error: 'dateOfBirth is required' },
        { status: 400 }
      );
    }

    if (!maritalStatus || !['single', 'married', 'divorced', 'widowed'].includes(maritalStatus)) {
      return NextResponse.json<ProfileResponse>(
        { success: false, error: 'Valid maritalStatus is required' },
        { status: 400 }
      );
    }

    if (typeof numberOfDependents !== 'number' || numberOfDependents < 0 || numberOfDependents > 20) {
      return NextResponse.json<ProfileResponse>(
        { success: false, error: 'numberOfDependents must be between 0 and 20' },
        { status: 400 }
      );
    }

    // Validate age
    const age = calculateAge(dateOfBirth);
    if (age < 13 || age > 120) {
      return NextResponse.json<ProfileResponse>(
        { success: false, error: 'Invalid date of birth' },
        { status: 400 }
      );
    }

    const profileData = {
      firstname: firstname.trim(),
      dateOfBirth,
      maritalStatus: maritalStatus as MaritalStatus,
      numberOfDependents,
      onboardingComplete: true,
    };

    await saveUserData(username, 'user-profile', profileData, PROFILE_RECORD_ID);

    const profile: UserProfile = {
      username,
      firstname: profileData.firstname,
      dateOfBirth: profileData.dateOfBirth,
      maritalStatus: profileData.maritalStatus,
      numberOfDependents: profileData.numberOfDependents,
      currentAge: calculateAge(profileData.dateOfBirth),
      onboardingComplete: profileData.onboardingComplete,
    };

    return NextResponse.json<ProfileResponse>(
      { success: true, profile },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving profile:', error);
    return NextResponse.json<ProfileResponse>(
      { success: false, error: 'Failed to save profile' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile - Update existing user profile
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const username = session.user.email;
    const body = await request.json();

    // Get existing profile
    const existingRecord = await getUserData(username, 'user-profile', PROFILE_RECORD_ID);

    if (!existingRecord) {
      return NextResponse.json<ProfileResponse>(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Merge updates with existing data
    const updates: any = {};

    if (body.firstname !== undefined) {
      if (typeof body.firstname !== 'string' || body.firstname.trim() === '') {
        return NextResponse.json<ProfileResponse>(
          { success: false, error: 'Invalid firstname' },
          { status: 400 }
        );
      }
      updates.firstname = body.firstname.trim();
    }

    if (body.dateOfBirth !== undefined) {
      if (typeof body.dateOfBirth !== 'string') {
        return NextResponse.json<ProfileResponse>(
          { success: false, error: 'Invalid dateOfBirth' },
          { status: 400 }
        );
      }
      const age = calculateAge(body.dateOfBirth);
      if (age < 13 || age > 120) {
        return NextResponse.json<ProfileResponse>(
          { success: false, error: 'Invalid date of birth' },
          { status: 400 }
        );
      }
      updates.dateOfBirth = body.dateOfBirth;
    }

    if (body.maritalStatus !== undefined) {
      if (!['single', 'married', 'divorced', 'widowed'].includes(body.maritalStatus)) {
        return NextResponse.json<ProfileResponse>(
          { success: false, error: 'Invalid maritalStatus' },
          { status: 400 }
        );
      }
      updates.maritalStatus = body.maritalStatus;
    }

    if (body.numberOfDependents !== undefined) {
      if (typeof body.numberOfDependents !== 'number' || body.numberOfDependents < 0 || body.numberOfDependents > 20) {
        return NextResponse.json<ProfileResponse>(
          { success: false, error: 'Invalid numberOfDependents' },
          { status: 400 }
        );
      }
      updates.numberOfDependents = body.numberOfDependents;
    }

    // Merge with existing data
    const profileData = {
      ...existingRecord.data,
      ...updates,
    };

    await saveUserData(username, 'user-profile', profileData, PROFILE_RECORD_ID);

    const profile: UserProfile = {
      username,
      firstname: profileData.firstname,
      dateOfBirth: profileData.dateOfBirth,
      maritalStatus: profileData.maritalStatus,
      numberOfDependents: profileData.numberOfDependents,
      currentAge: calculateAge(profileData.dateOfBirth),
      onboardingComplete: profileData.onboardingComplete,
    };

    return NextResponse.json<ProfileResponse>(
      { success: true, profile },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json<ProfileResponse>(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
