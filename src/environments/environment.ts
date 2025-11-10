// Detectar si se accede por IP o localhost
function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Si se accede por IP (no es localhost ni 127.0.0.1), usar esa IP para el backend
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:3000/api`;
    }
  }
  // Por defecto usar localhost
  return 'http://localhost:3000/api';
}

export const environment = {
  production: false,
  apiUrl: getApiUrl()
};

