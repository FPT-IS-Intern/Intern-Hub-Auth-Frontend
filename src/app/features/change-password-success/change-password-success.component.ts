import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-change-password-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './change-password-success.component.html',
  styleUrls: ['./change-password-success.component.scss']
})
export class ChangePasswordSuccessComponent {
  private readonly router = inject(Router);

  navigateToLogin() {
    this.router.navigate(['/auth/login']);
  }
}

