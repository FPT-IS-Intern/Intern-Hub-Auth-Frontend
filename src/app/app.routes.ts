import { Routes } from '@angular/router';
import { LoginFormComponent } from './features/login/login-form.component';
import { AuthShellLayoutComponent } from './layouts/auth-shell-layout.component';

const buildAuthRoutes = (): Routes => [
  {
    path: 'login',
    component: LoginFormComponent,
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/register-user-info/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'verify-otp',
    loadComponent: () =>
      import('./features/opt/otp-input.component').then((m) => m.OtpInputComponent),
  },
  {
    path: 'change-password',
    loadComponent: () =>
      import('./features/change-password/change-password.component').then(
        (m) => m.ChangePasswordComponent,
      ),
  },
];

export const routes: Routes = [
  {
    path: '',
    component: AuthShellLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      },
      ...buildAuthRoutes(),
      {
        path: '**',
        redirectTo: 'login',
      },
    ],
  },
];
