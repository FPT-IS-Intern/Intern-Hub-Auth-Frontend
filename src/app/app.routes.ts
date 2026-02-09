import { Routes } from '@angular/router';
import { LoginFormComponent } from './features/login/login-form.component';
import { ForgotPasswordComponent } from './features/forgot-password/forgot-password.component';

export const routes: Routes = [
  {
    path: '',
    component: LoginFormComponent,
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
  },
  {
    path: 'verify-otp',
    loadComponent: () => import('./features/opt/otp-input.component').then(m => m.OtpInputComponent)
  },
  {
    path: 'change-password',
    loadComponent: () => import('./features/change-password/change-password.component').then(m => m.ChangePasswordComponent)
  }
  // {
  //   path: 'register',
  //   loadComponent: () => import('./features/register/register.component').then(m => m.RegisterComponent)
  // }
];