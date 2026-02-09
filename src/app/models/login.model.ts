export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    username: string;
    email?: string;
  };
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

