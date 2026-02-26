import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ErrorMessageComponent } from '../components/error-message/error-message.component';
import { PopUpConfirmComponent } from '@goat-bravos/intern-hub-layout';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-otp-input',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ErrorMessageComponent, PopUpConfirmComponent],
    templateUrl: './otp-input.component.html',
    styleUrls: ['./otp-input.component.scss']
})
export class OtpInputComponent implements OnInit, OnDestroy {

    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    otpForm = new FormArray(Array(6).fill(0).map(() => new FormControl('', [Validators.required])));
    countdown = signal(3);
    isLoading = signal(false);
    error = signal<string | null>(null);
    showConfirm = false;
    private timer: any;
    popup = signal({
        show: false,
        title: '',
        content: ''
    });
    isCanResend = computed(() => this.countdown() === 0);

    async handleSubmit() {
        if (!this.otpForm.valid || this.isCanResend()) {
            this.error.set('Mã kích hoạt không chính xác hoặc đã hết hạn');
            return;
        }

        this.error.set(null);

        try {
            this.isLoading.set(true);
            // Giả lập gọi API (thay bằng service thực tế của bạn)
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Giả lập logic khi server báo sai quá nhiều lần
            const isTooManyAttempts = false;
            if (isTooManyAttempts) {
                this.popup.set({
                    show: true,
                    title: 'Xác thực thất bại',
                    content: 'Bạn đã yêu cầu gửi mã xác thực quá nhiều lần, vui lòng liên hệ bộ phận IT hoặc thử lại sau 24h'
                });
            }

            // Nếu thành công, chuyển hướng đến chức năng đặt lại mật khẩu
            this.router.navigate(['../change-password'], { relativeTo: this.route });
        } catch (err) {
            this.error.set('Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            this.isLoading.set(false);
        }
    }

    resendOtp() {
        if (!this.isCanResend()) return;

        this.isLoading.set(true);

        // Giả lập gọi API gửi lại OTP
        setTimeout(() => {
            this.otpForm.reset();
            this.startCountdown();
            this.isLoading.set(false);
            this.error.set(null);
        }, 1000);
    }

    closePopup() {
        this.popup.update(state => ({ ...state, show: false }));
    }

    onConfirm() {
        this.closePopup();
        // this.resendOtp();
    }


    ngOnInit() {
        this.startCountdown();
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

    startCountdown() {
        this.countdown.set(59);
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
    }
}
