import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

/**
 * Servicio para mostrar notificaciones (snackbar)
 * Proporciona métodos para mostrar mensajes de éxito, error, información y advertencia
 */
@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  private readonly defaultDuration = 3000; // 3 segundos
  private readonly defaultConfig: MatSnackBarConfig = {
    duration: this.defaultDuration,
    horizontalPosition: 'end',
    verticalPosition: 'top'
  };

  constructor(private snackBar: MatSnackBar) {}

  /**
   * Muestra un mensaje de éxito
   */
  showSuccess(message: string, duration?: number): void {
    this.snackBar.open(message, 'Cerrar', {
      ...this.defaultConfig,
      duration: duration || this.defaultDuration,
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Muestra un mensaje de error
   */
  showError(message: string, duration?: number): void {
    this.snackBar.open(message, 'Cerrar', {
      ...this.defaultConfig,
      duration: duration || this.defaultDuration * 2, // Errores se muestran más tiempo
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Muestra un mensaje de información
   */
  showInfo(message: string, duration?: number): void {
    this.snackBar.open(message, 'Cerrar', {
      ...this.defaultConfig,
      duration: duration || this.defaultDuration,
      panelClass: ['info-snackbar']
    });
  }

  /**
   * Muestra un mensaje de advertencia
   */
  showWarning(message: string, duration?: number): void {
    this.snackBar.open(message, 'Cerrar', {
      ...this.defaultConfig,
      duration: duration || this.defaultDuration,
      panelClass: ['warning-snackbar']
    });
  }
}

