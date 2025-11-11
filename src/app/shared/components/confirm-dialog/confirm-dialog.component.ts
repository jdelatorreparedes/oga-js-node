import { Component, Inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
}

/**
 * Componente de diálogo de confirmación
 * Reutilizable para confirmar acciones críticas (eliminar, etc.)
 * 
 * El botón de confirmar recibe automáticamente el foco al abrir el diálogo,
 * permitiendo confirmar la acción presionando Enter.
 */
@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent implements AfterViewInit {
  @ViewChild('confirmButton') confirmButton!: ElementRef<HTMLButtonElement>;

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {
    // Valores por defecto
    this.data.confirmText = this.data.confirmText || 'Confirmar';
    this.data.cancelText = this.data.cancelText || 'Cancelar';
    this.data.confirmColor = this.data.confirmColor || 'warn';
  }

  ngAfterViewInit(): void {
    // Enfocar el botón de confirmar después de que la vista se inicialice
    // Usar setTimeout para asegurar que el DOM esté completamente renderizado
    setTimeout(() => {
      if (this.confirmButton?.nativeElement) {
        this.confirmButton.nativeElement.focus();
      }
    }, 0);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}

