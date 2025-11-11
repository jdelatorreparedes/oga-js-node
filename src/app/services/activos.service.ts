import { Injectable } from '@angular/core';
import { DbService } from './db.service';
import { TipoActivo } from '../models/tipo-activo.model';
import { Activo, EstadoActivo } from '../models/activo.model';
import { HistoricoAsignacion } from '../models/historico.model';
import { Area } from '../models/area.model';
import { Observable } from 'rxjs';

/**
 * Servicio para la gestión de activos, tipos e histórico
 * 
 * Proporciona métodos de alto nivel para operaciones CRUD sobre activos,
 * tipos de activos e histórico de asignaciones. Actúa como capa de abstracción
 * sobre el servicio de base de datos.
 * 
 * @example
 * ```typescript
 * constructor(private activosService: ActivosService) {}
 * 
 * // Obtener todos los activos
 * this.activosService.getActivos().subscribe(activos => {
 *   console.log('Activos:', activos);
 * });
 * 
 * // Crear un nuevo activo
 * this.activosService.addActivo(nuevoActivo).subscribe(activo => {
 *   console.log('Activo creado:', activo);
 * });
 * ```
 * 
 * @since 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class ActivosService {
  /**
   * Constructor del servicio
   * @param dbService - Servicio de base de datos para realizar operaciones
   */
  constructor(private dbService: DbService) {}

  // ========== TIPOS DE ACTIVOS ==========

  /**
   * Obtiene todos los tipos de activos
   * 
   * @returns Observable que emite un array de tipos de activos
   */
  getTipos(): Observable<TipoActivo[]> {
    return this.dbService.getTipos();
  }

  /**
   * Crea un nuevo tipo de activo
   * 
   * @param tipo - Datos del tipo de activo a crear
   * @returns Observable que emite el tipo de activo creado
   */
  addTipo(tipo: TipoActivo): Observable<TipoActivo> {
    return this.dbService.addTipo(tipo);
  }

  /**
   * Actualiza un tipo de activo existente
   * 
   * @param tipo - Tipo de activo con los datos actualizados (debe incluir el id)
   * @returns Observable que emite el tipo de activo actualizado
   */
  updateTipo(tipo: TipoActivo): Observable<TipoActivo> {
    return this.dbService.updateTipo(tipo);
  }

  /**
   * Elimina un tipo de activo
   * 
   * @param id - ID del tipo de activo a eliminar
   * @returns Observable que emite la respuesta de la eliminación
   * @throws Error si el tipo está siendo usado por algún activo
   */
  deleteTipo(id: number): Observable<any> {
    return this.dbService.deleteTipo(id);
  }

  // ========== ACTIVOS ==========

  /**
   * Obtiene todos los activos
   * 
   * @param mostrarBajas - Si es true, incluye activos dados de baja (default: false)
   * @returns Observable que emite un array de activos
   */
  getActivos(mostrarBajas: boolean = false): Observable<Activo[]> {
    return this.dbService.getActivos(mostrarBajas);
  }

  /**
   * Obtiene el siguiente código sugerido para un tipo de activo
   * 
   * @param tipoId - ID del tipo de activo
   * @returns Observable que emite el código sugerido
   */
  getSiguienteCodigo(tipoId: number): Observable<{ codigo: string }> {
    return this.dbService.getSiguienteCodigo(tipoId);
  }

  /**
   * Crea un nuevo activo
   * 
   * El activo se crea automáticamente con estado "Disponible".
   * 
   * @param activo - Datos del activo a crear
   * @returns Observable que emite el activo creado
   */
  addActivo(activo: Activo): Observable<Activo> {
    activo.estado = EstadoActivo.Disponible;
    return this.dbService.addActivo(activo);
  }

  /**
   * Actualiza un activo existente
   * 
   * @param activo - Activo con los datos actualizados (debe incluir el id)
   * @returns Observable que emite el activo actualizado
   */
  updateActivo(activo: Activo): Observable<Activo> {
    return this.dbService.updateActivo(activo);
  }

  /**
   * Elimina un activo
   * 
   * @param id - ID del activo a eliminar
   * @returns Observable que emite la respuesta de la eliminación
   */
  deleteActivo(id: number): Observable<any> {
    return this.dbService.deleteActivo(id);
  }

  /**
   * Asigna un activo a una persona
   * 
   * Cambia el estado del activo a "Asignado" y crea un registro en el histórico.
   * 
   * @param activoId - ID del activo a asignar
   * @param persona - Nombre de la persona a la que se asigna
   * @param fechaDevolucionPrevista - Fecha prevista de devolución (formato: YYYY-MM-DD)
   * @returns Observable que emite la respuesta de la asignación
   * @throws Error si el activo no está disponible
   */
  asignarActivo(activoId: number, persona: string, fechaDevolucionPrevista: string): Observable<any> {
    return this.dbService.asignarActivo(activoId, persona, fechaDevolucionPrevista);
  }

  /**
   * Devuelve un activo asignado
   * 
   * Cambia el estado del activo a "Disponible" y actualiza el registro del histórico.
   * 
   * @param activoId - ID del activo a devolver
   * @returns Observable que emite la respuesta de la devolución
   * @throws Error si el activo no está asignado
   */
  devolverActivo(activoId: number): Observable<any> {
    return this.dbService.devolverActivo(activoId);
  }

  /**
   * Da de baja un activo
   * 
   * Cambia el estado del activo a "Baja" y registra el motivo.
   * 
   * @param activoId - ID del activo a dar de baja
   * @param motivo - Motivo de la baja
   * @returns Observable que emite la respuesta de la baja
   * @throws Error si el activo está asignado
   */
  darBajaActivo(activoId: number, motivo: string): Observable<any> {
    return this.dbService.darBajaActivo(activoId, motivo);
  }

  // ========== HISTÓRICO ==========

  /**
   * Obtiene el histórico completo de asignaciones
   * 
   * @returns Observable que emite un array con todo el histórico
   */
  getHistoricoCompleto(): Observable<any[]> {
    return this.dbService.getHistorico();
  }

  /**
   * Obtiene el histórico de asignaciones de un activo específico
   * 
   * @param activoId - ID del activo
   * @returns Observable que emite un array con el histórico del activo
   */
  getHistoricoPorActivo(activoId: number): Observable<HistoricoAsignacion[]> {
    return this.dbService.getHistoricoPorActivo(activoId);
  }

  // ========== ÁREAS ==========

  /**
   * Obtiene todas las áreas disponibles
   * 
   * @returns Observable que emite un array de áreas
   */
  getAreas(): Observable<Area[]> {
    return this.dbService.getAreas();
  }
}

