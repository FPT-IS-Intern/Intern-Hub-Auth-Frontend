import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import localeVi from '@angular/common/locales/vi';
import { NZ_I18N, vi_VN } from 'ng-zorro-antd/i18n';
import { SYSTEM_DESIGN_CONFIG } from 'dynamic-ds';
import { routes } from './app.routes';

registerLocaleData(localeVi);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    { provide: NZ_I18N, useValue: vi_VN },
    { provide: LOCALE_ID, useValue: 'vi' },
    {
      provide: SYSTEM_DESIGN_CONFIG,
      useValue: {
        brand: '#E18308',
        primary: '#006BDF',
        secondary: '#9F5100',
        functional: '#006BDF',
        utility: '#CF0026',
      },
    },
  ],
};
