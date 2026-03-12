import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { PasswordResetStateService } from '../../services/password-reset-state.service';
import { ErrorMessageComponent } from '../components/error-message/error-message.component';
import { InputTextComponent, PopUpInfoComponent } from "@goat-bravos/intern-hub-layout";
import { IdleTimeoutService } from '../../services/idle-timeout.service';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, RouterLink, ErrorMessageComponent, InputTextComponent, PopUpInfoComponent],
    templateUrl: './forgot-password.component.html',
    styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    readonly passwordResetState = inject(PasswordResetStateService);
    private readonly idleTimeout = inject(IdleTimeoutService);

    // State quản lý bằng signals
    personalId = signal('');
    email = signal('');
    error = signal<string | null>(null);
    isLoading = signal(false);
    popup = signal({
        show: false,
        title: '',
        content: ''
    });

    checkInputRequired = computed(() => this.personalId().trim() === '' || this.email().trim() === '');
    isIdInvalid = computed(() => {
        const id = this.personalId().trim();
        return id !== '' && id.length !== 12;
    });

    title = computed(() => {
        switch (this.passwordResetState.reason()) {
            case 'first-login': return 'Đăng nhập lần đầu';
            case 'password-expired': return 'Làm mới mật khẩu';
            default: return 'Quên mật khẩu';
        }
    });

    subtitle = computed(() => {
        switch (this.passwordResetState.reason()) {
            case 'first-login': return 'Nhập thông tin để thiết lập mật khẩu mới';
            case 'password-expired': return 'Mật khẩu của bạn đã hết hạn, vui lòng đặt lại';
            default: return 'Nhập thông tin để khôi phục mật khẩu của bạn';
        }
    });

    ngOnInit() {
        this.idleTimeout.start();
        // Pre-fill email nếu được chuyển từ trang login
        const prefilledEmail = this.passwordResetState.email();
        if (prefilledEmail) {
            this.email.set(prefilledEmail);
        }
    }

    ngOnDestroy() {
        this.idleTimeout.stop();
    }

    async handleSubmit() {
        if (this.checkInputRequired() || this.isIdInvalid()) {
            this.error.set('Sai Email tài khoản hoặc CCCD/CMND');
            return;
        }

        this.error.set(null);
        this.isLoading.set(true);

        try {
            // Bước 1: Xác thực danh tính
            const verifyRes = await firstValueFrom(this.authService.verifyIdentity({
                username: this.email().trim(),
                email: this.email().trim(),
                nationalId: this.personalId().trim(),
            }));

            if (verifyRes.status?.code !== 'success' || !verifyRes.data?.requestId) {
                this.handleError(verifyRes.status?.code, verifyRes.status?.message);
                return;
            }

            const requestId = verifyRes.data.requestId;
            this.passwordResetState.setRequestId(requestId);
            this.passwordResetState.setEmail(this.email().trim());

            // Bước 2: Gửi OTP
            const otpRes = await firstValueFrom(this.authService.sendOtp({ requestId }));

            if (otpRes.status?.code !== 'success') {
                this.handleError(otpRes.status?.code, otpRes.status?.message);
                return;
            }

            if (otpRes.data) {
                this.passwordResetState.setRemainingResendAttempts(otpRes.data.remainingResendAttempts);
                this.passwordResetState.setNextResendInSeconds(otpRes.data.nextResendInSeconds);
            }

            // Chuyển đến trang OTP
            this.router.navigate(['../verify-otp'], { relativeTo: this.route });

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
            case 'auth.exception.identity_mismatch':
                this.error.set('Sai thông tin Email tài khoản hoặc CCCD/CMND');
                break;
            case 'auth.exception.request_not_found':
                this.error.set('Yêu cầu không tồn tại. Hãy kiểm tra lại.');
                break;
            case 'auth.exception.otp_max_resend':
                this.popup.set({
                    show: true,
                    title: 'Vui lòng liên hệ phòng IT',
                    content: 'Bạn đã yêu cầu gửi mã xác thực quá nhiều lần, vui lòng liên hệ bộ phận IT hoặc thử lại sau 24h'
                });
                break;
            default:
                this.error.set(message || 'Có lỗi xảy ra, hãy thử lại.');
                break;
        }
    }

    closePopup() {
        this.popup.update(state => ({ ...state, show: false }));
        this.router.navigate(['/auth/login']);
    }

    onConfirm() {
        this.closePopup();
    }
}
