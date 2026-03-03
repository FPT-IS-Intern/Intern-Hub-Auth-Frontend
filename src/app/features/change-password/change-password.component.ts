import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { InputTextComponent } from '@goat-bravos/intern-hub-layout';
import { ErrorMessageComponent } from '../components/error-message/error-message.component';
import { AuthService } from '../../services/auth.service';
import { PasswordResetStateService } from '../../services/password-reset-state.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextComponent, ErrorMessageComponent],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent implements OnInit, OnDestroy {
  private readonly SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 phút
  private sessionTimer: any;
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly passwordResetState = inject(PasswordResetStateService);

  newPassword = signal<string>('');
  confirmPassword = signal<string>('');
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  isSubmitDisabled = computed(() => {
    return !this.newPassword() || !this.confirmPassword() || this.isLoading();
  });

  title = computed(() => {
    switch (this.passwordResetState.reason()) {
      case 'first-login': return 'Đăng nhập lần đầu';
      case 'password-expired': return 'Làm mới mật khẩu';
      default: return 'Đổi mật khẩu';
    }
  });

  ngOnInit() {
    // Kiểm tra requestId, nếu không có thì redirect về trang xác thực
    if (!this.passwordResetState.requestId()) {
      this.router.navigate(['/auth/forgot-password']);
      return;
    }

    // Tự động chuyển về trang đăng nhập sau 10 phút
    this.sessionTimer = setTimeout(() => {
      this.passwordResetState.clear();
      this.router.navigate(['/auth/login']);
    }, this.SESSION_TIMEOUT_MS);
  }

  ngOnDestroy() {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }
  }

  checkInputRequired(): boolean {
    return this.isSubmitDisabled();
  }

  async handleSubmit() {
    const pass = this.newPassword();
    const confirm = this.confirmPassword();

    this.error.set(null);
    if (pass !== confirm) {
      this.error.set('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    if (pass.length < 6) {
      this.error.set('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    const requestId = this.passwordResetState.requestId();
    if (!requestId) {
      this.error.set('Phiên làm việc đã hết hạn. Vui lòng thử lại.');
      this.router.navigate(['/auth/forgot-password']);
      return;
    }

    this.isLoading.set(true);

    try {
      const res = await firstValueFrom(this.authService.resetPassword({
        requestId,
        newPassword: pass,
      }));

      if (res.status?.code === 'success') {
        // Đổi mật khẩu thành công - xóa timer và state, chuyển về trang đăng nhập
        if (this.sessionTimer) clearTimeout(this.sessionTimer);
        this.passwordResetState.clear();
        this.successMessage.set('Đổi mật khẩu thành công! Đang chuyển hướng...');
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      } else {
        this.handleError(res.status?.code, res.status?.message);
      }
    } catch (err: any) {
      const code = err?.error?.status?.code;
      const message = err?.error?.status?.message;
      this.handleError(code, message);
    } finally {
      this.isLoading.set(false);
    }
  }

  private handleError(code?: string, message?: string) {
    switch (code) {
      case 'auth.exception.otp_not_verified':
        this.error.set('OTP chưa được xác thực. Vui lòng quay lại xác thực OTP.');
        break;
      case 'auth.exception.request_not_found':
        this.error.set('Yêu cầu không tồn tại. Vui lòng thử lại từ đầu.');
        break;
      default:
        this.error.set(message || 'Đã có lỗi xảy ra, vui lòng thử lại sau.');
        break;
    }
  }
}