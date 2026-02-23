import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { ErrorMessageComponent } from '../components/error-message/error-message.component';
import { InputTextComponent } from "@goat-bravos/intern-hub-layout";

@Component({
    selector: 'app-login-form',
    standalone: true,
    imports: [CommonModule, RouterLink, ErrorMessageComponent, InputTextComponent],
    templateUrl: './login-form.component.html',
    styleUrls: ['./login-form.component.scss']
})
export class LoginFormComponent {
    private authService = inject(AuthService);

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

            if (!res.success) {
                this.error.set(res.message || 'Sai mật khẩu hoặc tên đăng nhập');
            }
        } catch (err) {
            this.error.set('Lỗi kết nối server');
        } finally {
            this.isLoading.set(false);
        }
    }

    togglePassword() {
        // Toggle password visibility
    }
}