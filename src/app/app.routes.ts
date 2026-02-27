import { Routes } from '@angular/router';
import { LoginFormComponent } from './features/login/login-form.component';

const buildAuthRoutes = (): Routes => [
  {
    path: '',
    component: LoginFormComponent,
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'verify-otp',
    loadComponent: () => import('./features/opt/otp-input.component').then((m) => m.OtpInputComponent),
  },
  {
    path: 'change-password',
    loadComponent: () =>
      import('./features/change-password/change-password.component').then((m) => m.ChangePasswordComponent),
  },
];

export const routes: Routes = [
  {
    path: '',
    children: [
      ...buildAuthRoutes(),
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
];
