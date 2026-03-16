import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ErrorMessageComponent } from '../components/error-message/error-message.component';
import { PopUpInfoComponent } from '@goat-bravos/intern-hub-layout';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PasswordResetStateService } from '../../services/password-reset-state.service';
import { IdleTimeoutService } from '../../services/idle-timeout.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-otp-input',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ErrorMessageComponent,
        PopUpInfoComponent
    ],
    templateUrl: './otp-input.component.html',
    styleUrls: ['./otp-input.component.scss']
})
export class OtpInputComponent implements OnInit, OnDestroy {

    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    readonly passwordResetState = inject(PasswordResetStateService);
    private readonly idleTimeout = inject(IdleTimeoutService);

    otpForm = new FormArray(Array(6).fill(0).map(() => new FormControl('', [Validators.required])));
    countdown = signal(59);
    isLoading = signal(false);
    error = signal<string | null>(null);
    private timer: any;
    popup = signal({
        show: false,
        title: '',
        content: '',
        type: '' as 'max_attempts' | 'max_resend' | ''
    });
    isCanResend = computed(() => this.countdown() === 0);

    async handleSubmit() {
        // if (!this.otpForm.valid || this.isCanResend()) {
        //     this.error.set('Mã kích hoạt không chính xác hoặc đã hết hạn');
        //     return;
        // }

        const requestId = this.passwordResetState.requestId();
        if (!requestId) {
            this.error.set('Phiên làm việc đã hết hạn. Vui lòng thử lại.');
            this.router.navigate(['/auth/forgot-password']);
            return;
        }

        this.error.set(null);
        const otp = this.otpForm.controls.map(c => c.value).join('');

        try {
            this.isLoading.set(true);

            const res = await firstValueFrom(this.authService.verifyOtp({
                requestId,
                otp,
            }));

            if (res.status?.code === 'success') {
                this.router.navigate(['../otp-success'], { relativeTo: this.route });
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

    async resendOtp() {
        if (!this.isCanResend()) return;

        const requestId = this.passwordResetState.requestId();
        if (!requestId) {
            this.error.set('Phiên làm việc đã hết hạn. Vui lòng thử lại.');
            this.router.navigate(['/auth/forgot-password']);
            return;
        }

        this.isLoading.set(true);
        this.error.set(null);

        try {
            const res = await firstValueFrom(this.authService.sendOtp({ requestId }));

            if (res.status?.code === 'success') {
                this.otpForm.reset();
                if (res.data) {
                    this.passwordResetState.setRemainingResendAttempts(res.data.remainingResendAttempts);
                    this.passwordResetState.setNextResendInSeconds(res.data.nextResendInSeconds);
                    this.startCountdown(res.data.nextResendInSeconds);
                } else {
                    this.startCountdown();
                }
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
            case 'auth.exception.otp_expired':
                this.error.set('Mã kích hoạt không chính xác hoặc đã hết hạn');
                break;
            case 'auth.exception.otp_invalid':
                this.error.set('Mã kích hoạt không chính xác hoặc đã hết hạn');
                break;
            case 'auth.exception.otp_resend_too_soon':
                this.error.set('Vui lòng đợi trước khi gửi lại mã kích hoạt.');
                break;
            case 'auth.exception.otp_max_attempts':
                this.popup.set({
                    show: true,
                    title: 'Xác thực thất bại',
                    content: 'Bạn đã nhập sai mã xác thực quá nhiều lần, hãy quay lại và bấm Gửi lại mã kích hoạt để lấy mã mới.',
                    type: 'max_attempts'
                });
                break;
            case 'auth.exception.otp_max_resend':
                this.popup.set({
                    show: true,
                    title: 'Xác thực thất bại',
                    content: 'Bạn đã yêu cầu gửi mã xác thực quá nhiều lần, vui lòng liên hệ bộ phận IT hoặc thử lại sau 24h',
                    type: 'max_resend'
                });
                break;
            default:
                this.error.set(message || 'Có lỗi xảy ra, vui lòng thử lại');
                break;
        }
    }

    closePopup() {
        const type = this.popup().type;
        this.popup.update(state => ({ ...state, show: false, type: '' }));
        if (type === 'max_resend') {
            this.router.navigate(['/auth/login']);
            return;
        }
        // max_attempts: just close the popup, allow user to resend OTP
    }

    ngOnInit() {
        // Kiểm tra requestId, nếu không có thì redirect về trang xác thực
        if (!this.passwordResetState.requestId()) {
            this.router.navigate(['/auth/forgot-password']);
            return;
        }
        this.idleTimeout.start();
        const initialSeconds = this.passwordResetState.nextResendInSeconds();
        this.startCountdown(initialSeconds > 0 ? initialSeconds : 59);
    }

    onInput(event: any, index: number) {
        const val = event.target.value;
        if (val && !/^\d+$/.test(val)) {
            this.otpForm.at(index).setValue('');
            return;
        }
        if (val && index < 5) {
            setTimeout(() => document.getElementById(`otp-${index + 1}`)?.focus(), 10);
        }
    }

    onKeyDown(event: KeyboardEvent, index: number) {
        if (event.key === 'Backspace' && !this.otpForm.at(index).value && index > 0) {
            setTimeout(() => document.getElementById(`otp-${index - 1}`)?.focus(), 10);
        }
    }

    onPaste(event: ClipboardEvent, index: number) {
        event.preventDefault();

        const pastedText = event.clipboardData?.getData('text') ?? '';
        const digits = pastedText.replace(/\D/g, '');
        if (!digits) return;

        const maxLength = this.otpForm.length;
        const startIndex = digits.length >= maxLength ? 0 : index;
        const values = digits.slice(0, maxLength - startIndex).split('');

        values.forEach((digit, offset) => {
            this.otpForm.at(startIndex + offset).setValue(digit);
        });

        const nextFocusIndex = Math.min(startIndex + values.length, maxLength - 1);
        setTimeout(() => document.getElementById(`otp-${nextFocusIndex}`)?.focus(), 10);
    }

    startCountdown(seconds: number = 59) {
        this.countdown.set(seconds);
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            if (this.countdown() > 0) this.countdown.update(v => v - 1);
            else clearInterval(this.timer);
        }, 1000);
    }

    onFocus(event: any) {
        event.target.select();
    }

    ngOnDestroy() {
        if (this.timer) clearInterval(this.timer);
        this.idleTimeout.stop();
    }
}
