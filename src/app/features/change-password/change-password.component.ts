import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { InputTextComponent } from '@goat-bravos/intern-hub-layout';
import { ErrorMessageComponent } from '../components/error-message/error-message.component';
import { AuthService } from '../../services/auth.service';
import { PasswordResetStateService } from '../../services/password-reset-state.service';
import { IdleTimeoutService } from '../../services/idle-timeout.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextComponent, ErrorMessageComponent],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly passwordResetState = inject(PasswordResetStateService);
  private readonly idleTimeout = inject(IdleTimeoutService);

  newPassword = signal<string>('');
  confirmPassword = signal<string>('');
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  // Password validation rules
  hasMinLength = computed(() => this.newPassword().length >= 8);
  hasMaxLength = computed(() => this.newPassword().length > 0 && this.newPassword().length <= 15);
  hasRequiredChars = computed(() => {
    const pass = this.newPassword();
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasDigit = /[0-9]/.test(pass);
    const hasSpecial = /[!@#$%^&*()]/.test(pass);
    return hasUpper && hasLower && hasDigit && hasSpecial;
  });
  hasNoAccentsOrSpaces = computed(() => {
    const pass = this.newPassword();
    if (pass.length === 0) return false;
    // No spaces and no Vietnamese diacritics/accented characters
    const hasSpace = /\s/.test(pass);
    const hasAccent = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/.test(pass);
    return !hasSpace && !hasAccent;
  });

  allRulesValid = computed(() =>
    this.hasMinLength() && this.hasMaxLength() && this.hasRequiredChars() && this.hasNoAccentsOrSpaces()
  );

  isSubmitDisabled = computed(() => {
    return !this.newPassword() || !this.confirmPassword() || this.isLoading() || !this.allRulesValid();
  });

  title = computed(() => {
    switch (this.passwordResetState.reason()) {
      case 'first-login': return 'Đổi mật khẩu';
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
    this.idleTimeout.start();
  }

  ngOnDestroy() {
    this.idleTimeout.stop();
  }

  checkInputRequired(): boolean {
    return this.isSubmitDisabled();
  }

  toggleNewPassword() {
    this.showNewPassword.update(v => !v);
  }

  toggleConfirmPassword() {
    this.showConfirmPassword.update(v => !v);
  }

  async handleSubmit() {
    const pass = this.newPassword();
    const confirm = this.confirmPassword();

    this.error.set(null);
    if (!this.allRulesValid()) {
      this.error.set('Mật khẩu không đáp ứng yêu cầu.');
      return;
    }

    if (pass !== confirm) {
      this.error.set('Mật khẩu xác nhận không trùng khớp.');
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
        this.idleTimeout.stop();
        this.passwordResetState.clear();
        this.router.navigate(['../change-password-success'], { relativeTo: this.route });
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
