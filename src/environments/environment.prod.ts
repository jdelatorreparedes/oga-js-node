// Detectar automáticamente la IP del servidor desde la URL actual
// En producción, el frontend y backend están en el mismo servidor
function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = window.location.port || '3000';
    
    // Si se accede por IP (no es localhost ni 127.0.0.1), usar esa IP para el backend
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:${port}/api`;
    }
  }
  
  // Por defecto usar localhost (para desarrollo local)
  return 'http://localhost:3000/api';
}

export const environment = {
  production: true,
  // La URL de la API se detecta automáticamente desde la URL actual
  // Esto permite que funcione tanto en localhost como en cualquier IP de red
  apiUrl: getApiUrl()
};
