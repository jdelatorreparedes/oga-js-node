import { Component, Inject, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ActivosService } from '../../../services/activos.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { TipoActivo } from '../../../models/tipo-activo.model';
import { Activo } from '../../../models/activo.model';
import { Area } from '../../../models/area.model';
import { compararStrings } from '../../../utils/string.utils';

export interface ActivoDialogData {
  activo?: Activo;
  tipos: TipoActivo[];
  activosExistentes: Activo[];
}

/**
 * Diálogo para crear/editar activos
 */
@Component({
  selector: 'app-activo-dialog',
  templateUrl: './activo-dialog.component.html',
  styleUrls: ['./activo-dialog.component.scss']
})
export class ActivoDialogComponent implements OnInit, AfterViewChecked {
  form: FormGroup;
  titulo: string;
  guardando = false;
  tipos: TipoActivo[];
  areas: Area[] = [];
  private debeEnfocar = true;

  @ViewChild('tipoSelect') tipoSelect!: ElementRef;

  constructor(
    public dialogRef: MatDialogRef<ActivoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ActivoDialogData,
    private fb: FormBuilder,
    private activosService: ActivosService,
    private snackbarService: SnackbarService
  ) {
    this.tipos = data.tipos;
    const activo = data.activo;
    this.titulo = activo ? 'Editar Activo' : 'Añadir Activo';

    // Solo tipo y código son obligatorios
    // El código es obligatorio solo al editar; al crear puede estar vacío (el backend lo generará)
    const codigoValidators = activo 
      ? [Validators.required, Validators.minLength(1)] // Obligatorio al editar
      : []; // Opcional al crear (el backend lo generará automáticamente)

    this.form = this.fb.group({
      id: [activo?.id],
      tipoId: [activo?.tipoId || '', Validators.required], // Obligatorio siempre
      codigo: [activo?.codigo || '', codigoValidators], // Obligatorio solo al editar
      referencia: [activo?.referencia || ''], // Opcional
      descripcion: [activo?.descripcion || ''], // Opcional
      marca: [activo?.marca || ''], // Opcional
      detalles: [activo?.detalles || ''], // Opcional
      area: [activo?.area || ''], // Opcional
      responsable: [activo?.responsable || ''], // Opcional
      fechaRevision: [activo?.fechaRevision ? new Date(activo.fechaRevision) : null] // Opcional
    });

    // Suscribirse a cambios en tipoId para autocompletar código y validar código existente
    this.form.get('tipoId')?.valueChanges.subscribe(tipoId => {
      if (tipoId) {
        if (!activo) {
          this.generarCodigoAutomatico(tipoId);
        }
        // Validar código si ya existe uno escrito
        const codigoActual = this.form.get('codigo')?.value;
        if (codigoActual && codigoActual.trim()) {
          this.validarCodigoEnTiempoReal();
        }
      }
    });

    // Suscribirse a cambios en código para validar en tiempo real
    this.form.get('codigo')?.valueChanges.subscribe(() => {
      this.validarCodigoEnTiempoReal();
    });
  }

  ngOnInit(): void {
    this.cargarAreas();
  }

  generarCodigoAutomatico(tipoId: number): void {
    // Solo generar si el campo código está vacío o no ha sido modificado manualmente
    const codigoActual = this.form.get('codigo')?.value;
    if (!codigoActual || codigoActual.trim() === '') {
      this.activosService.getSiguienteCodigo(tipoId).subscribe({
        next: (response) => {
          this.form.patchValue({ codigo: response.codigo }, { emitEvent: false });
        },
        error: (error) => {
          // Si el tipo no tiene codificación, no mostrar error, solo no autocompletar
          if (error.error?.error && !error.error.error.includes('codificación')) {
            console.warn('No se pudo generar código automático:', error);
          }
        }
      });
    }
  }

  cargarAreas(): void {
    this.activosService.getAreas().subscribe({
      next: (areas) => {
        this.areas = areas;
      },
      error: (error) => {
        console.error('Error al cargar áreas:', error);
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.debeEnfocar && this.tipoSelect) {
      setTimeout(() => {
        this.tipoSelect.nativeElement.focus();
        this.debeEnfocar = false;
      }, 100);
    }
  }

  validarCodigoEnTiempoReal(): void {
    const codigo = this.form.get('codigo')?.value;
    const tipoId = this.form.get('tipoId')?.value;
    
    if (!codigo || !codigo.trim() || !tipoId) {
      // No limpiar errores de validadores estándar (required, minlength)
      const erroresActuales = this.form.get('codigo')?.errors;
      if (erroresActuales) {
        delete erroresActuales['formatoInvalido'];
        if (Object.keys(erroresActuales).length === 0) {
          this.form.get('codigo')?.setErrors(null);
        } else {
          this.form.get('codigo')?.setErrors(erroresActuales);
        }
      }
      return;
    }

    const validacion = this.validarFormatoCodigo(codigo, tipoId);
    const erroresActuales = this.form.get('codigo')?.errors || {};
    
    if (!validacion.valido) {
      this.form.get('codigo')?.setErrors({ ...erroresActuales, formatoInvalido: true });
    } else {
      // Limpiar solo el error de formato, mantener otros errores
      delete erroresActuales['formatoInvalido'];
      if (Object.keys(erroresActuales).length === 0) {
        this.form.get('codigo')?.setErrors(null);
      } else {
        this.form.get('codigo')?.setErrors(erroresActuales);
      }
    }
  }

  validarFormatoCodigo(codigo: string, tipoId: number): { valido: boolean; mensaje?: string } {
    if (!codigo || codigo.trim() === '') {
      return { valido: true }; // Si está vacío, el backend lo generará
    }

    const codigoTrimmed = codigo.trim();
    const tipo = this.tipos.find(t => t.id === tipoId);

    if (!tipo) {
      return { valido: false, mensaje: 'Tipo de activo no encontrado' };
    }

    // Si el tipo no tiene codificación, no validar formato
    if (!tipo.codificacion || tipo.codificacion.trim() === '') {
      return { valido: true };
    }

    const codificacion = tipo.codificacion.trim();
    
    // Validar que el código empiece con la codificación
    if (!codigoTrimmed.startsWith(codificacion)) {
      return { 
        valido: false, 
        mensaje: `El código debe empezar con "${codificacion}" (codificación del tipo seleccionado)` 
      };
    }

    // Validar que después de la codificación haya exactamente 4 dígitos
    const parteNumerica = codigoTrimmed.substring(codificacion.length);
    const regexCuatroDigitos = /^\d{4}$/;
    
    if (!regexCuatroDigitos.test(parteNumerica)) {
      return { 
        valido: false, 
        mensaje: `El código debe tener exactamente 4 dígitos después de "${codificacion}". Formato esperado: ${codificacion}0001` 
      };
    }

    return { valido: true };
  }

  guardar(): void {
    // Prevenir múltiples llamadas
    if (this.guardando) {
      return;
    }

    // Validar que el tipo de activo esté seleccionado (único campo realmente obligatorio)
    if (!this.form.value.tipoId) {
      this.snackbarService.showError('El tipo de activo es obligatorio');
      this.form.get('tipoId')?.markAsTouched();
      return;
    }

    // Validar código solo si se está editando o si se proporciona un código
    const tipoId = this.form.value.tipoId;
    let codigoFinal = this.form.value.codigo?.trim() || '';
    const esEdicion = !!this.data.activo;
    
    // Si es edición, el código es obligatorio
    if (esEdicion && !codigoFinal) {
      this.snackbarService.showError('El código es obligatorio al editar un activo');
      this.form.get('codigo')?.markAsTouched();
      this.form.get('codigo')?.setErrors({ required: true });
      return;
    }
    
    // Validar formato del código solo si se proporciona
    if (codigoFinal && tipoId) {
      const validacionFormato = this.validarFormatoCodigo(codigoFinal, tipoId);
      if (!validacionFormato.valido) {
        this.snackbarService.showError(validacionFormato.mensaje || 'El formato del código no es válido');
        this.form.get('codigo')?.setErrors({ formatoInvalido: true });
        return;
      }
    }
    
    // Validar código único solo si se proporciona (sin distinguir mayúsculas, minúsculas o acentos)
    if (codigoFinal) {
      const codigoExiste = this.data.activosExistentes.some(activo => 
        compararStrings(activo.codigo, codigoFinal) && 
        (!this.data.activo || activo.id !== this.data.activo.id)
      );

      if (codigoExiste) {
        this.snackbarService.showError('Ya existe un activo con este código. No se pueden tener códigos duplicados.');
        this.form.get('codigo')?.setErrors({ duplicado: true });
        return;
      }
    }

    this.guardando = true;
    const activoData: Activo = {
      ...this.form.value,
      codigo: codigoFinal || undefined // Si está vacío, el backend lo generará automáticamente
    };

    // Si es un nuevo activo (sin id), registrar la fecha de alta
    if (!activoData.id) {
      activoData.fechaAlta = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    }

    if (activoData.id) {
      this.activosService.updateActivo(activoData).subscribe({
        next: () => {
          this.snackbarService.showSuccess('Activo actualizado correctamente');
          this.dialogRef.close(true);
        },
        error: (error) => {
          // Extraer mensaje de error descriptivo del servidor
          let mensajeError = 'Error al actualizar el activo';
          
          if (error.error?.error) {
            // El servidor devuelve un mensaje de error específico
            mensajeError = error.error.error;
          } else if (error.error?.message) {
            mensajeError = error.error.message;
          } else if (error.message) {
            mensajeError = error.message;
          } else if (typeof error.error === 'string') {
            mensajeError = error.error;
          }
          
          // Mensajes más descriptivos según el tipo de error
          if (error.status === 400) {
            // Error de validación del servidor
            if (!mensajeError.includes('Error al actualizar')) {
              // Ya tiene un mensaje específico del servidor
            } else {
              mensajeError = 'Error de validación. Verifique que el código no esté duplicado y que todos los campos obligatorios estén completos.';
            }
          } else if (error.status === 404) {
            mensajeError = 'El activo no fue encontrado. Puede que haya sido eliminado.';
          } else if (error.status === 500) {
            mensajeError = 'Error del servidor. Por favor, intente nuevamente más tarde.';
          } else if (error.status === 0 || error.status === undefined) {
            mensajeError = 'Error de conexión. Verifique su conexión a internet y que el servidor esté disponible.';
          }
          
          this.snackbarService.showError(mensajeError);
          console.error('Error al actualizar activo:', error);
          this.guardando = false;
        }
      });
    } else {
      this.activosService.addActivo(activoData).subscribe({
        next: () => {
          this.snackbarService.showSuccess('Activo añadido correctamente');
          this.dialogRef.close(true);
        },
        error: (error) => {
          // Extraer mensaje de error descriptivo del servidor
          let mensajeError = 'Error al añadir el activo';
          
          if (error.error?.error) {
            // El servidor devuelve un mensaje de error específico
            mensajeError = error.error.error;
          } else if (error.error?.message) {
            mensajeError = error.error.message;
          } else if (error.message) {
            mensajeError = error.message;
          } else if (typeof error.error === 'string') {
            mensajeError = error.error;
          }
          
          // Mensajes más descriptivos según el tipo de error
          if (error.status === 400) {
            // Error de validación del servidor
            if (!mensajeError.includes('Error al añadir') && !mensajeError.includes('Error de validación')) {
              // Ya tiene un mensaje específico del servidor (ej: "El código ya existe")
            } else {
              mensajeError = 'Error de validación. Verifique que el tipo de activo y el código estén completos y que el código no esté duplicado.';
            }
          } else if (error.status === 500) {
            mensajeError = 'Error del servidor. Por favor, intente nuevamente más tarde.';
          } else if (error.status === 0 || error.status === undefined) {
            mensajeError = 'Error de conexión. Verifique su conexión a internet y que el servidor esté disponible.';
          }
          
          this.snackbarService.showError(mensajeError);
          console.error('Error al añadir activo:', error);
          this.guardando = false;
        }
      });
    }
  }

  getCodificacionTipo(): string {
    const tipoId = this.form.get('tipoId')?.value;
    if (!tipoId) return '';
    const tipo = this.tipos.find(t => t.id === tipoId);
    return tipo?.codificacion || '';
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}

