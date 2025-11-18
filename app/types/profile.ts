export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';

export interface UserProfile {
  userId: string; // Cognito sub ID
  firstname: string;
  dateOfBirth: string; // ISO date format (YYYY-MM-DD)
  maritalStatus: MaritalStatus;
  numberOfDependents: number;
  currentAge?: number; // Calculated from dateOfBirth
  onboardingComplete: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProfileRequest {
  firstname: string;
  dateOfBirth: string;
  maritalStatus: MaritalStatus;
  numberOfDependents: number;
}

export interface UpdateProfileRequest {
  firstname?: string;
  dateOfBirth?: string;
  maritalStatus?: MaritalStatus;
  numberOfDependents?: number;
}

export interface ProfileResponse {
  success: boolean;
  profile?: UserProfile;
  error?: string;
}
