import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  LoginRequest,
  LoginResponse,
  VerifyIdentityRequest,
  VerifyIdentityResponse,
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  ResetPasswordRequest,
} from '../models/login.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { getBaseUrl } from '../core/config/app-config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private readonly httpClient: HttpClient) {}

  login(data: LoginRequest): Observable<ResponseApi<LoginResponse>> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: '*/*',
      'X-Device-ID': this.getDeviceId(),
    });

    return this.httpClient.post<ResponseApi<LoginResponse>>(`${getBaseUrl()}/auth/login`, data, {
      headers,
    });
  }

  verifyIdentity(data: VerifyIdentityRequest): Observable<ResponseApi<VerifyIdentityResponse>> {
    return this.httpClient.post<ResponseApi<VerifyIdentityResponse>>(
      `${getBaseUrl()}/auth/password-reset/verify-identity`,
      data,
    );
  }

  sendOtp(data: SendOtpRequest): Observable<ResponseApi<SendOtpResponse>> {
    return this.httpClient.post<ResponseApi<SendOtpResponse>>(
      `${getBaseUrl()}/auth/password-reset/send-otp`,
      data,
    );
  }

  verifyOtp(data: VerifyOtpRequest): Observable<ResponseApi<boolean>> {
    return this.httpClient.post<ResponseApi<boolean>>(
      `${getBaseUrl()}/auth/password-reset/verify-otp`,
      data,
    );
  }

  resetPassword(data: ResetPasswordRequest): Observable<ResponseApi<void>> {
    return this.httpClient.post<ResponseApi<void>>(
      `${getBaseUrl()}/auth/password-reset/reset-password`,
      data,
    );
  }

  private getDeviceId(): string {
    let deviceId = localStorage.getItem('X-Device-ID');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('X-Device-ID', deviceId);
    }
    return deviceId;
  }
}
