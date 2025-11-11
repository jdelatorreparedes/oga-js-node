import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard para proteger rutas que requieren autenticación
 * 
 * Implementa CanActivate para verificar si el usuario está autenticado
 * antes de permitir el acceso a una ruta. Si el usuario no está autenticado,
 * redirige automáticamente a la página de login.
 * 
 * @example
 * ```typescript
 * // En app-routing.module.ts
 * {
 *   path: 'dashboard',
 *   component: DashboardComponent,
 *   canActivate: [AuthGuard]
 * }
 * ```
 * 
 * @since 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  /**
   * Constructor del guard
   * @param authService - Servicio de autenticación para verificar el estado del usuario
   * @param router - Router de Angular para redirigir al login si es necesario
   */
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Verifica si el usuario puede activar la ruta
   * 
   * @param route - Snapshot de la ruta activada
   * @param state - Estado del router
   * @returns true si el usuario está autenticado, false en caso contrario
   *          (y redirige al login)
   */
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }

    // Redirigir al login si no está autenticado
    this.router.navigate(['/login']);
    return false;
  }
}

