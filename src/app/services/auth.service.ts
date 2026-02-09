import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { ForgotPassResponse, LoginRequest, LoginResponse } from '../models/login.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Giả lập database nhỏ
  private readonly MOCK_USER = {
    username: 'admin@gmail.com',
    password: '123'
  };

  login(data: LoginRequest): Observable<LoginResponse> {
    console.log('Đang kết nối tới API giả lập...', data);

    let response: LoginResponse;

    // Logic kiểm tra giả lập
    if (data.username === this.MOCK_USER.username && data.password === this.MOCK_USER.password) {
      response = {
        success: true,
        message: 'Đăng nhập thành công!',
        // Thêm token giả nếu cần
      };
    } else {
      response = {
        success: false,
        message: 'Sai tên đăng nhập hoặc mật khẩu',
      };
    }

    // Trả về Observable kèm delay 1.5 giây cho giống thật
    return of(response).pipe(delay(500));
  }

   forgotPassword(data: LoginRequest): Observable<ForgotPassResponse> {
    console.log('Đang kết nối tới API giả lập...', data);

    let response: ForgotPassResponse;

    // Logic kiểm tra giả lập
    if (data.username === this.MOCK_USER.username && data.password === this.MOCK_USER.password) {
      response = {
        success: true,
        message: 'Yêu cầu đặt lại mật khẩu đã được gửi!',
        // Thêm token giả nếu cần
      };
    } else {
      response = {
        success: false,
        message: 'Sai Email tài khoản hoặc CCCD/CMND',
      };
    }

    // Trả về Observable kèm delay 1.5 giây cho giống thật
    return of(response).pipe(delay(500));
  }
}