import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { PasswordResetStateService } from '../../services/password-reset-state.service';
import { ErrorMessageComponent } from '../components/error-message/error-message.component';
import { InputTextComponent } from "@goat-bravos/intern-hub-layout";
import { MobileWarningComponent } from '../components/mobile-warning/mobile-warning.component';

@Component({
    selector: 'app-login-form',
    standalone: true,
    imports: [CommonModule, RouterLink, ErrorMessageComponent, InputTextComponent, MobileWarningComponent],
    templateUrl: './login-form.component.html',
    styleUrls: ['./login-form.component.scss']
})
export class LoginFormComponent {
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly passwordResetState = inject(PasswordResetStateService);

    // State quản lý bằng signals
    username = signal('');
    password = signal('');
    error = signal<string | null>(null);
    isLoading = signal(false);
    showPassword = signal(false);

    // Logic kiểm tra nút bấm
    checkInputRequired = computed(() => this.username().trim() === '' || this.password().trim() === '');

    async handleSubmit() {
        if (this.checkInputRequired()) return;

        this.error.set(null);
        this.isLoading.set(true);

        try {
            const res = await firstValueFrom(this.authService.login({
                username: this.username(),
                password: this.password()
            }));

            if (res.status?.code === 'success' && res.data) {
                // Login thành công - lưu token và redirect
                localStorage.setItem('accessToken', res.data.accessToken);
                localStorage.setItem('refreshToken', res.data.refreshToken);
                localStorage.setItem('userId', res.data.userId);
                this.router.navigate(['/homePage']);
            } else {
                this.handleLoginError(res.status?.code, res.status?.message);
            }
        } catch (err: any) {
            const code = err?.error?.status?.code;
            const message = err?.error?.status?.message || err?.message || 'Lỗi kết nối server';
            this.handleLoginError(code, message);
        } finally {
            this.isLoading.set(false);
        }
    }

    private handleLoginError(code?: string, message?: string) {
        if (code === 'auth.exception.first_login_required') {
            this.passwordResetState.setReason('first-login');
            this.passwordResetState.setEmail(this.username());
            this.router.navigate(['/auth/forgot-password']);
            return;
        }

        if (code === 'auth.exception.password_expired') {
            this.passwordResetState.setReason('password-expired');
            this.passwordResetState.setEmail(this.username());
            this.router.navigate(['/auth/forgot-password']);
            return;
        }

        this.error.set(message || 'Sai mật khẩu hoặc tên đăng nhập');
    }

    togglePassword() {
        this.showPassword.update(v => !v);
    }
}