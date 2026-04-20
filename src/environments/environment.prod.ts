export const environment = {
  production: true,
  apiUrl: (window as any).__env?.apiUrl || getApiUrlFallback(),
};

function getApiUrlFallback(): string {
  const hostname = window.location?.hostname;
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8765/api';
  }
  console.warn('Runtime env not found, using relative path');
  return '/api';
}
