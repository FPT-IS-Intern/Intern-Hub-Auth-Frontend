import { environment } from '../../../environments/environment';

export function getBaseUrl(): string {
  const shellEnv = (window as any).__env;
  return shellEnv && shellEnv.apiUrl ? shellEnv.apiUrl : environment.apiUrl;
}
