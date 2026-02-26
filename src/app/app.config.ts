import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { REST_CONFIG, RestConfig } from '@goat-bravos/shared-lib-client';
import { environment } from '../environments/environment';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    {
      provide: REST_CONFIG,
      useValue: {
        apiBaseUrl: environment.apiUrl,
        enableLogging: true,
        internalAutoRetry: true,
        retryAttempts: 3,
        retryIntervalMs: 1000,
        loginPath: '/login',
        tokenKey: 'accessToken',
      } as RestConfig,
    },
    provideHttpClient(),
  ],
};
