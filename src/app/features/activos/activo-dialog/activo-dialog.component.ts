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

    this.form = this.fb.group({
      id: [activo?.id],
      tipoId: [activo?.tipoId || '', Validators.required],
      codigo: [activo?.codigo || '', [Validators.required, Validators.minLength(1)]],
      referencia: [activo?.referencia || ''],
      descripcion: [activo?.descripcion || ''],
      marca: [activo?.marca || ''],
      detalles: [activo?.detalles || ''],
      area: [activo?.area || ''],
      responsable: [activo?.responsable || ''],
      fechaRevision: [activo?.fechaRevision ? new Date(activo.fechaRevision) : null]
    });
  }

  ngOnInit(): void {
    this.cargarAreas();
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

  guardar(): void {
    // Prevenir múltiples llamadas
    if (this.guardando) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const codigoTrimmed = this.form.value.codigo.trim();
    
    // Validar código único (sin distinguir mayúsculas, minúsculas o acentos)
    const codigoExiste = this.data.activosExistentes.some(activo => 
      compararStrings(activo.codigo, codigoTrimmed) && 
      (!this.data.activo || activo.id !== this.data.activo.id)
    );

    if (codigoExiste) {
      this.snackbarService.showError('Ya existe un activo con este código. No se pueden tener códigos duplicados.');
      return;
    }

    this.guardando = true;
    const activoData: Activo = {
      ...this.form.value,
      codigo: codigoTrimmed
    };

    if (activoData.id) {
      this.activosService.updateActivo(activoData).subscribe({
        next: () => {
          this.snackbarService.showSuccess('Activo actualizado correctamente');
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.snackbarService.showError('Error al actualizar el activo');
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
          this.snackbarService.showError('Error al añadir el activo');
          console.error('Error al añadir activo:', error);
          this.guardando = false;
        }
      });
    }
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}

