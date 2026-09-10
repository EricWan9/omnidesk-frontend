export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  tenantId: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
}