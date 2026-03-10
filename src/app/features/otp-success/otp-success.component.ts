import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { PasswordResetStateService } from '../../services/password-reset-state.service';

@Component({
  selector: 'app-otp-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './otp-success.component.html',
  styleUrls: ['./otp-success.component.scss']
})
export class OtpSuccessComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly passwordResetState = inject(PasswordResetStateService);

  ngOnInit() {
    if (!this.passwordResetState.requestId()) {
      this.router.navigate(['/auth/forgot-password']);
    }
  }

  navigateToChangePassword() {
    this.router.navigate(['../change-password'], { relativeTo: this.route });
  }
}

