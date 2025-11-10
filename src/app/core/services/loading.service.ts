import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Servicio para gestionar el estado de carga global
 * Utilizado por el LoadingInterceptor para mostrar/ocultar el spinner
 */
@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  /**
   * Muestra el indicador de carga
   */
  show(): void {
    this.loadingSubject.next(true);
  }

  /**
   * Oculta el indicador de carga
   */
  hide(): void {
    this.loadingSubject.next(false);
  }
}

