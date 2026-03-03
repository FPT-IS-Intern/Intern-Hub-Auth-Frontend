export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  accessToken: string;
  refreshToken: string;
}

export interface LoginError {
  message: string;
  code?: string;
}

// Password Reset Flow Types
export type PasswordResetReason = 'forgot-password' | 'first-login' | 'password-expired';

export interface VerifyIdentityRequest {
  username: string;
  email: string;
  nationalId: string;
}

export interface VerifyIdentityResponse {
  requestId: string;
}

export interface SendOtpRequest {
  requestId: string;
}

export interface SendOtpResponse {
  remainingResendAttempts: number;
  nextResendInSeconds: number;
}

export interface VerifyOtpRequest {
  requestId: string;
  otp: string;
}

export interface ResetPasswordRequest {
  requestId: string;
  newPassword: string;
}
