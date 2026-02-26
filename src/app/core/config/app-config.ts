import { environment } from '../../../environments/environment';

export function getBaseUrl(): string {
  // Lấy môi trường từ window do Shell App truyền xuống
  const shellEnv = (window as any).__env;

  // Nếu chạy trong Shell App và có apiUrl -> dùng url của Shell
  // Nếu chạy độc lập (ng serve auth-app) -> dùng url trong environment.ts
  return shellEnv && shellEnv.apiUrl ? shellEnv.apiUrl : environment.apiUrl;
}
