import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
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

  async login(data: LoginRequest): Promise<ResponseApi<LoginResponse>> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: '*/*',
      'X-Device-ID': this.getDeviceId(),
    });

    const encryptedPassword = await this.encryptPassword(data.password);

    return firstValueFrom(
      this.httpClient.post<ResponseApi<LoginResponse>>(`${getBaseUrl()}/auth/login`, {
        username: data.username,
        password: encryptedPassword,
      }, { headers })
    );
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

  private async encryptPassword(plainPassword: string): Promise<string> {
    const publicKeyBase64 = await this.fetchPublicKey();

    const binaryDer = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));

    const cryptoKey = await crypto.subtle.importKey(
      'spki',
      binaryDer.buffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['encrypt'],
    );

    const encoded = new TextEncoder().encode(plainPassword);
    const cipherBuffer = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, cryptoKey, encoded);

    return btoa(String.fromCharCode(...new Uint8Array(cipherBuffer)));
  }

  private async fetchPublicKey(): Promise<string> {
    const res = await firstValueFrom(
      this.httpClient.get<ResponseApi<string>>(`${getBaseUrl()}/auth/public-key`)
    );
    return res.data!;
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
