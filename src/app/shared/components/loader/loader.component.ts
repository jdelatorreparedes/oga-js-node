import { Component } from '@angular/core';
import { LoadingService } from '../../../core/services/loading.service';

/**
 * Componente de carga global
 * Muestra un spinner mientras hay peticiones HTTP en curso
 */
@Component({
  selector: 'app-loader',
  template: `
    <div *ngIf="loading$ | async" class="loader-overlay">
      <mat-spinner diameter="50"></mat-spinner>
    </div>
  `,
  styles: [`
    .loader-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
  `]
})
export class LoaderComponent {
  loading$: any;

  constructor(private loadingService: LoadingService) {
    this.loading$ = this.loadingService.loading$;
  }
}

