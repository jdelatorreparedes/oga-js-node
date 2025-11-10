import { Component, Inject, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ActivosService } from '../../../services/activos.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { Activo } from '../../../models/activo.model';

export interface BajaDialogData {
  activo: Activo;
}

/**
 * Diálogo para dar de baja un activo
 */
@Component({
  selector: 'app-baja-dialog',
  templateUrl: './baja-dialog.component.html',
  styleUrls: ['./baja-dialog.component.scss']
})
export class BajaDialogComponent implements OnInit, AfterViewChecked {
  form: FormGroup;
  guardando = false;
  private debeEnfocar = true;

  @ViewChild('motivoInput') motivoInput!: ElementRef;

  constructor(
    public dialogRef: MatDialogRef<BajaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BajaDialogData,
    private fb: FormBuilder,
    private activosService: ActivosService,
    private snackbarService: SnackbarService
  ) {
    this.form = this.fb.group({
      motivo: ['', Validators.required]
    });
  }

  ngOnInit(): void {}

  ngAfterViewChecked(): void {
    if (this.debeEnfocar && this.motivoInput) {
      setTimeout(() => {
        this.motivoInput.nativeElement.focus();
        this.debeEnfocar = false;
      }, 100);
    }
  }

  guardar(): void {
    if (this.form.invalid || this.guardando) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const { motivo } = this.form.value;

    this.activosService.darBajaActivo(this.data.activo.id!, motivo).subscribe({
      next: () => {
        this.snackbarService.showSuccess(`Activo '${this.data.activo.codigo}' dado de baja correctamente`);
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.snackbarService.showError('Error al dar de baja el activo');
        console.error('Error al dar de baja activo:', error);
        this.guardando = false;
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}

