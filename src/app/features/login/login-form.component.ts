import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';
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

    // State quản lý bằng signals
    username = signal('');
    password = signal('');
    error = signal<string | null>(null);
    isLoading = signal(false);

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
                this.error.set(res.status?.message || 'Sai mật khẩu hoặc tên đăng nhập');
            }
        } catch (err: any) {
            // Lỗi HTTP từ backend (401, 400, 500...)
            const message = err?.error?.status?.message || err?.message || 'Lỗi kết nối server';
            this.error.set(message);
        } finally {
            this.isLoading.set(false);
        }
    }

    togglePassword() {
        // Toggle password visibility
    }
}