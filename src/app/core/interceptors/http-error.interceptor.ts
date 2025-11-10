import { Injectable } from '@angular/core';
import { HttpEvent, HttpErrorResponse, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor que maneja errores HTTP globalmente
 * Muestra mensajes de error al usuario mediante snackbar
 * Maneja automáticamente errores 401 (no autorizado) haciendo logout
 */
@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(
    private snackbarService: SnackbarService,
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Ha ocurrido un error';

        // Error de conexión (servidor no disponible)
        if (error.status === 0 || error.error instanceof ProgressEvent) {
          errorMessage = 'No se puede conectar con el servidor. Verifique que el backend esté corriendo en el puerto 3000.';
        } else if (error.error instanceof ErrorEvent) {
          // Error del lado del cliente
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // Error del lado del servidor
          switch (error.status) {
            case 400:
              errorMessage = error.error?.message || 'Solicitud incorrecta';
              break;
            case 401:
              // Token expirado o inválido - hacer logout automático
              errorMessage = error.error?.error || 'Sesión expirada. Por favor, inicia sesión nuevamente';
              this.authService.logout();
              // Solo redirigir si no estamos ya en la página de login
              if (!this.router.url.includes('/login')) {
                this.router.navigate(['/login']);
              }
              break;
            case 403:
              errorMessage = 'Acceso denegado';
              break;
            case 404:
              errorMessage = error.error?.message || 'Recurso no encontrado';
              break;
            case 500:
              errorMessage = 'Error interno del servidor';
              break;
            default:
              errorMessage = error.error?.message || `Error ${error.status}: ${error.statusText}`;
          }
        }

        // Mostrar mensaje de error
        this.snackbarService.showError(errorMessage);

        return throwError(() => error);
      })
    );
  }
}

