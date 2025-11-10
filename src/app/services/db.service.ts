import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { TipoActivo } from '../models/tipo-activo.model';
import { Activo } from '../models/activo.model';
import { HistoricoAsignacion } from '../models/historico.model';
import { Area } from '../models/area.model';

@Injectable({
  providedIn: 'root'
})
export class DbService {
  private apiUrl = API_CONFIG.baseUrl;

  constructor(private http: HttpClient) {}

  // Tipos de Activos
  getTipos(): Observable<TipoActivo[]> {
    return this.http.get<TipoActivo[]>(`${this.apiUrl}/tipos`);
  }

  addTipo(tipo: TipoActivo): Observable<TipoActivo> {
    return this.http.post<TipoActivo>(`${this.apiUrl}/tipos`, tipo);
  }

  updateTipo(tipo: TipoActivo): Observable<TipoActivo> {
    return this.http.put<TipoActivo>(`${this.apiUrl}/tipos/${tipo.id}`, tipo);
  }

  deleteTipo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tipos/${id}`);
  }

  // Activos
  getActivos(mostrarBajas: boolean = false): Observable<Activo[]> {
    return this.http.get<Activo[]>(`${this.apiUrl}/activos?mostrarBajas=${mostrarBajas}`);
  }

  getActivo(id: number): Observable<Activo> {
    return this.http.get<Activo>(`${this.apiUrl}/activos/${id}`);
  }

  addActivo(activo: Activo): Observable<Activo> {
    return this.http.post<Activo>(`${this.apiUrl}/activos`, activo);
  }

  updateActivo(activo: Activo): Observable<Activo> {
    return this.http.put<Activo>(`${this.apiUrl}/activos/${activo.id}`, activo);
  }

  deleteActivo(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/activos/${id}`);
  }

  asignarActivo(activoId: number, persona: string, fechaDevolucionPrevista: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/activos/${activoId}/asignar`, {
      persona,
      fechaDevolucionPrevista
    });
  }

  devolverActivo(activoId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/activos/${activoId}/devolver`, {});
  }

  darBajaActivo(activoId: number, motivo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/activos/${activoId}/baja`, { motivo });
  }

  // Histórico
  getHistorico(): Observable<HistoricoAsignacion[]> {
    return this.http.get<HistoricoAsignacion[]>(`${this.apiUrl}/historico`);
  }

  getHistoricoPorActivo(activoId: number): Observable<HistoricoAsignacion[]> {
    return this.http.get<HistoricoAsignacion[]>(`${this.apiUrl}/historico/activo/${activoId}`);
  }

  // Áreas
  getAreas(): Observable<Area[]> {
    return this.http.get<Area[]>(`${this.apiUrl}/areas`);
  }
}
