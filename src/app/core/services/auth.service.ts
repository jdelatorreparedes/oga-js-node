import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Usuario, Rol, LoginRequest, LoginResponse } from '../../models/usuario.model';

/**
 * Servicio de autenticación y autorización
 * 
 * Gestiona el estado de autenticación del usuario, almacenamiento de tokens JWT,
 * y verificación de permisos basados en roles. Utiliza sessionStorage para
 * almacenar de forma segura el token y los datos del usuario.
 * 
 * @example
 * ```typescript
 * constructor(private authService: AuthService) {}
 * 
 * login() {
 *   this.authService.login({ username: 'user', password: 'pass' })
 *     .subscribe(response => {
 *       console.log('Login exitoso');
 *     });
 * }
 * ```
 * 
 * @since 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'currentUser';

  constructor(private api: ApiService) {
    // Cargar usuario y token desde sessionStorage al iniciar
    const savedUser = sessionStorage.getItem(this.USER_KEY);
    const savedToken = sessionStorage.getItem(this.TOKEN_KEY);
    
    if (savedUser && savedToken) {
      try {
        this.currentUserSubject.next(JSON.parse(savedUser));
      } catch (e) {
        this.clearAuthData();
      }
    }
  }

  /**
   * Obtiene el usuario actual autenticado
   * 
   * @returns El usuario actual o null si no hay sesión activa
   * @example
   * ```typescript
   * const user = this.authService.currentUserValue;
   * if (user) {
   *   console.log(`Usuario: ${user.username}`);
   * }
   * ```
   */
  get currentUserValue(): Usuario | null {
    return this.currentUserSubject.value;
  }

  /**
   * Inicia sesión en el sistema
   * 
   * Realiza la autenticación con las credenciales proporcionadas y almacena
   * el token JWT y los datos del usuario en sessionStorage.
   * 
   * @param credentials - Credenciales de acceso (username y password)
   * @returns Observable que emite la respuesta del login con token y usuario
   * @throws Error si las credenciales son inválidas
   * 
   * @example
   * ```typescript
   * this.authService.login({ username: 'admin', password: 'pass123' })
   *   .subscribe({
   *     next: (response) => {
   *       console.log('Token:', response.token);
   *       console.log('Usuario:', response.usuario);
   *     },
   *     error: (error) => console.error('Error de login:', error)
   *   });
   * ```
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return new Observable(observer => {
      this.api.post<LoginResponse>('auth/login', credentials).subscribe({
        next: (response) => {
          // Guardar token y usuario en sessionStorage
          if (response.token) {
            sessionStorage.setItem(this.TOKEN_KEY, response.token);
          }
          sessionStorage.setItem(this.USER_KEY, JSON.stringify(response.usuario));
          this.currentUserSubject.next(response.usuario);
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  /**
   * Cierra la sesión del usuario actual
   * 
   * Elimina el token JWT y los datos del usuario de sessionStorage,
   * y actualiza el estado de autenticación.
   * 
   * @example
   * ```typescript
   * this.authService.logout();
   * this.router.navigate(['/login']);
   * ```
   */
  logout(): void {
    this.clearAuthData();
    this.currentUserSubject.next(null);
  }

  /**
   * Obtiene el token JWT almacenado
   * 
   * @returns El token JWT o null si no existe
   * @example
   * ```typescript
   * const token = this.authService.getToken();
   * if (token) {
   *   // Usar el token para peticiones autenticadas
   * }
   * ```
   */
  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Limpia todos los datos de autenticación almacenados
   * 
   * @private
   */
  private clearAuthData(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
  }

  /**
   * Verifica si el usuario está autenticado
   * 
   * Comprueba que exista tanto el token JWT como los datos del usuario.
   * 
   * @returns true si el usuario está autenticado, false en caso contrario
   * @example
   * ```typescript
   * if (this.authService.isAuthenticated()) {
   *   // Usuario autenticado
   * }
   * ```
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.currentUserSubject.value;
    // Verificar que tanto el token como el usuario existan
    return token !== null && user !== null;
  }

  /**
   * Verifica si el usuario tiene rol de Administrador
   * 
   * @returns true si el usuario es Administrador, false en caso contrario
   */
  isAdmin(): boolean {
    return this.currentUserSubject.value?.rol === Rol.Administrador;
  }

  /**
   * Verifica si el usuario tiene rol de Usuario
   * 
   * @returns true si el usuario tiene rol Usuario, false en caso contrario
   */
  isUsuario(): boolean {
    return this.currentUserSubject.value?.rol === Rol.Usuario;
  }

  /**
   * Verifica si el usuario tiene rol de Visor
   * 
   * @returns true si el usuario tiene rol Visor, false en caso contrario
   */
  isVisor(): boolean {
    return this.currentUserSubject.value?.rol === Rol.Visor;
  }

  /**
   * Verifica si el usuario puede gestionar usuarios
   * 
   * Solo los administradores pueden gestionar usuarios.
   * 
   * @returns true si el usuario puede gestionar usuarios, false en caso contrario
   */
  canManageUsers(): boolean {
    return this.isAdmin();
  }

  /**
   * Verifica si el usuario puede realizar acciones de escritura
   * 
   * Los usuarios con rol Administrador o Usuario pueden añadir, editar y eliminar.
   * Los usuarios con rol Visor solo pueden leer.
   * 
   * @returns true si el usuario puede realizar acciones, false en caso contrario
   */
  canPerformActions(): boolean {
    const user = this.currentUserSubject.value;
    return user?.rol === Rol.Administrador || user?.rol === Rol.Usuario;
  }
}

