import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LoginRequest, LoginResponse, ForgotPassResponse } from '../models/login.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { environment } from '../../environments/environment';

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

    return this.httpClient.post<ResponseApi<LoginResponse>>(
      `${environment.apiUrl}/auth/login`,
      data,
      { headers },
    );
  }

  forgotPassword(data: LoginRequest): Observable<ResponseApi<ForgotPassResponse>> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: '*/*',
      'X-Device-ID': this.getDeviceId(),
    });

    return this.httpClient.post<ResponseApi<ForgotPassResponse>>(
      `${environment.apiUrl}/auth/forgot-password`,
      data,
      { headers },
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
