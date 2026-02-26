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

export interface ForgotPassResponse {
  success: boolean;
  message?: string;
  // ....
}

