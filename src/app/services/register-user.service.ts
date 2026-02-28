import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ResponseApi } from '@goat-bravos/shared-lib-client';
import { getBaseUrl } from '../core/config/app-config';
import { RegisteredUserResponse, RegisterUserRequest } from '../models/register.model';

export interface PositionResponse {
  name: string;
  positionId: number;
}

@Injectable({
  providedIn: 'root',
})
export class RegisterUserService {
  private readonly baseUrl = `${getBaseUrl()}/hrm/users`;

  constructor(private readonly httpClient: HttpClient) {}

  

  registerUser(
    userInfo: RegisterUserRequest,
    avatarFile: File,
    cvFile: File,
  ): Observable<ResponseApi<RegisteredUserResponse>> {
    const formData = new FormData();
    const userInfoBlob = new Blob([JSON.stringify(userInfo)], {
      type: 'application/json',
    });

    formData.append('userInfo', userInfoBlob);
    formData.append('avatarFile', avatarFile, avatarFile.name);
    formData.append('cvFile', cvFile, cvFile.name);

    return this.httpClient
      .post<ResponseApi<RegisteredUserResponse>>(`${this.baseUrl}/register`, formData)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Đã xảy ra lỗi không xác định';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Lỗi: ${error.error.message}`;
    } else if (error.error?.status?.message) {
      errorMessage = error.error.status.message;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
    } else if (error.status === 400) {
      errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
    } else if (error.status === 409) {
      errorMessage = 'Dữ liệu đã tồn tại hoặc có xung đột.';
    } else if (error.status === 500) {
      errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
    }

    return throwError(() => new Error(errorMessage));
  }

  getPositions(): Observable<ResponseApi<PositionResponse[]>> {
    return this.httpClient.get<ResponseApi<PositionResponse[]>>(`${this.baseUrl}/positions`).pipe(
      catchError((error) => {
        console.warn('Retrying positions with fallback URL...');
        return this.httpClient.get<ResponseApi<PositionResponse[]>>(`${this.baseUrl}/positions`).pipe(
          catchError(() => this.handleError(error))
        );
      })
    );
  }
}
