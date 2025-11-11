import { Component, Inject, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ActivosService } from '../../../services/activos.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { TipoActivo } from '../../../models/tipo-activo.model';
import { compararStrings } from '../../../utils/string.utils';

/**
 * Diálogo para crear/editar tipos de activos
 */
@Component({
  selector: 'app-tipo-dialog',
  templateUrl: './tipo-dialog.component.html',
  styleUrls: ['./tipo-dialog.component.scss']
})
export class TipoDialogComponent implements OnInit, AfterViewChecked {
  form: FormGroup;
  guardando = false;
  private debeEnfocar = true;

  @ViewChild('nombreInput') nombreInput!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TipoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { tipo: TipoActivo | null },
    private activosService: ActivosService,
    private snackbarService: SnackbarService
  ) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(1)]],
      codificacion: ['']
    });
  }

  ngOnInit(): void {
    if (this.data.tipo) {
      this.form.patchValue({ 
        nombre: this.data.tipo.nombre,
        codificacion: this.data.tipo.codificacion || ''
      });
    }
  }

  ngAfterViewChecked(): void {
    if (this.debeEnfocar && this.nombreInput) {
      setTimeout(() => {
        this.nombreInput.nativeElement.focus();
        this.debeEnfocar = false;
      }, 0);
    }
  }

  get titulo(): string {
    return this.data.tipo ? 'Editar Tipo' : 'Añadir Tipo';
  }

  guardar(): void {
    // Prevenir múltiples llamadas
    if (this.guardando) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const nombreTrimmed = this.form.value.nombre.trim();
    const codificacionTrimmed = (this.form.value.codificacion || '').trim();
    
    if (!nombreTrimmed) {
      this.snackbarService.showWarning('El nombre no puede estar vacío');
      return;
    }

    // Validar nombre único y codificacion única
    this.activosService.getTipos().subscribe({
      next: (tipos) => {
        const nombreExiste = tipos.some(t => 
          compararStrings(t.nombre, nombreTrimmed) && 
          (!this.data.tipo || t.id !== this.data.tipo.id)
        );

        if (nombreExiste) {
          this.snackbarService.showError('Ya existe un tipo con un nombre similar. No se pueden tener nombres duplicados.');
          return;
        }

        // Validar codificacion única (si se proporciona)
        if (codificacionTrimmed) {
          const codificacionExiste = tipos.some(t => 
            t.codificacion && 
            t.codificacion.trim().toUpperCase() === codificacionTrimmed.toUpperCase() &&
            (!this.data.tipo || t.id !== this.data.tipo.id)
          );

          if (codificacionExiste) {
            this.snackbarService.showError('Ya existe un tipo con esta codificación. La codificación debe ser única.');
            this.form.get('codificacion')?.setErrors({ duplicado: true });
            return;
          }
        }

        this.guardando = true;

        if (this.data.tipo) {
          // Actualizar
          const tipoActualizado = { 
            ...this.data.tipo, 
            nombre: nombreTrimmed,
            codificacion: codificacionTrimmed || null
          };
          this.activosService.updateTipo(tipoActualizado).subscribe({
            next: () => {
              this.snackbarService.showSuccess('Tipo actualizado correctamente');
              this.dialogRef.close(true);
            },
            error: (error) => {
              console.error('Error al actualizar tipo:', error);
              this.snackbarService.showError(error.error?.error || 'Error al actualizar el tipo');
              this.guardando = false;
            }
          });
        } else {
          // Crear
          const nuevoTipo: TipoActivo = { 
            nombre: nombreTrimmed,
            codificacion: codificacionTrimmed || undefined
          };
          this.activosService.addTipo(nuevoTipo).subscribe({
            next: () => {
              this.snackbarService.showSuccess('Tipo creado correctamente');
              this.dialogRef.close(true);
            },
            error: (error) => {
              console.error('Error al añadir tipo:', error);
              this.snackbarService.showError(error.error?.error || 'Error al añadir el tipo');
              this.guardando = false;
            }
          });
        }
      },
      error: (error) => {
        console.error('Error al validar tipo:', error);
        this.snackbarService.showError('Error al validar el tipo');
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}

