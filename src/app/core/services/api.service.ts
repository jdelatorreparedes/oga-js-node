import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Servicio base para todas las peticiones HTTP a la API
 * 
 * Centraliza la configuración de la URL base y proporciona métodos
 * genéricos para realizar peticiones HTTP (GET, POST, PUT, DELETE).
 * Todas las peticiones se realizan a través de este servicio para
 * mantener consistencia en la configuración.
 * 
 * @example
 * ```typescript
 * constructor(private api: ApiService) {}
 * 
 * // GET request
 * this.api.get<Activo[]>('activos').subscribe(activos => {
 *   console.log(activos);
 * });
 * 
 * // POST request
 * this.api.post<Activo>('activos', nuevoActivo).subscribe(activo => {
 *   console.log('Activo creado:', activo);
 * });
 * ```
 * 
 * @since 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  /** URL base de la API obtenida del environment */
  private readonly baseUrl = environment.apiUrl;

  /**
   * Constructor del servicio
   * @param http - Cliente HTTP de Angular para realizar peticiones
   */
  constructor(private http: HttpClient) {}

  /**
   * Realiza una petición HTTP GET
   * 
   * @template T - Tipo de datos esperados en la respuesta
   * @param endpoint - Endpoint de la API (sin la URL base)
   * @param params - Parámetros de consulta opcionales
   * @returns Observable que emite los datos de tipo T
   * 
   * @example
   * ```typescript
   * // Sin parámetros
   * this.api.get<Activo[]>('activos').subscribe(...);
   * 
   * // Con parámetros
   * this.api.get<Activo[]>('activos', { mostrarBajas: true }).subscribe(...);
   * ```
   */
  get<T>(endpoint: string, params?: any): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return this.http.get<T>(`${this.baseUrl}/${endpoint}`, { params: httpParams });
  }

  /**
   * Realiza una petición HTTP POST
   * 
   * @template T - Tipo de datos esperados en la respuesta
   * @param endpoint - Endpoint de la API (sin la URL base)
   * @param body - Cuerpo de la petición (datos a enviar)
   * @returns Observable que emite los datos de tipo T
   * 
   * @example
   * ```typescript
   * const nuevoActivo: Activo = { codigo: 'ACT-001', ... };
   * this.api.post<Activo>('activos', nuevoActivo).subscribe(activo => {
   *   console.log('Activo creado:', activo);
   * });
   * ```
   */
  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/${endpoint}`, body);
  }

  /**
   * Realiza una petición HTTP PUT
   * 
   * @template T - Tipo de datos esperados en la respuesta
   * @param endpoint - Endpoint de la API (sin la URL base)
   * @param body - Cuerpo de la petición (datos a actualizar)
   * @returns Observable que emite los datos de tipo T
   * 
   * @example
   * ```typescript
   * const activoActualizado: Activo = { id: 1, codigo: 'ACT-001-UPD', ... };
   * this.api.put<Activo>('activos/1', activoActualizado).subscribe(...);
   * ```
   */
  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}/${endpoint}`, body);
  }

  /**
   * Realiza una petición HTTP DELETE
   * 
   * @template T - Tipo de datos esperados en la respuesta
   * @param endpoint - Endpoint de la API (sin la URL base)
   * @returns Observable que emite los datos de tipo T
   * 
   * @example
   * ```typescript
   * this.api.delete<any>('activos/1').subscribe(() => {
   *   console.log('Activo eliminado');
   * });
   * ```
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}/${endpoint}`);
  }
}

