import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { ErrorMessageComponent } from '../components/error-message/error-message.component';
import { InputTextComponent } from "@goat-bravos/intern-hub-layout";

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, RouterLink, ErrorMessageComponent, InputTextComponent],
    templateUrl: './forgot-password.component.html',
    styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    
    // State quản lý bằng signals
    personalId = signal('');
    email = signal('');
    error = signal<string | null>(null);
    isLoading = signal(false);

    checkInputRequired = computed(() => this.personalId().trim() === '' || this.email().trim() === '');
    isIdInvalid = computed(() => {
        const id = this.personalId().trim();
        return id !== '' && id.length !== 12;
    });

    async handleSubmit() {
        if (this.checkInputRequired() || this.isIdInvalid()) {
            this.error.set('Sai Email tài khoản hoặc CCCD/CMND');
            return;
        }

        this.error.set(null);
        this.isLoading.set(true);

        // khi xác thực thành công, chuyển hướng đến trang xác thực OTP
        this.router.navigate(['../verify-otp'], { relativeTo: this.route });

    }

}
