import { Component, Inject, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ActivosService } from '../../../services/activos.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { Activo } from '../../../models/activo.model';

export interface AsignarDialogData {
  activo: Activo;
}

/**
 * Diálogo para asignar un activo a una persona
 */
@Component({
  selector: 'app-asignar-dialog',
  templateUrl: './asignar-dialog.component.html',
  styleUrls: ['./asignar-dialog.component.scss']
})
export class AsignarDialogComponent implements OnInit, AfterViewChecked {
  form: FormGroup;
  guardando = false;
  private debeEnfocar = true;

  @ViewChild('personaInput') personaInput!: ElementRef;

  constructor(
    public dialogRef: MatDialogRef<AsignarDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AsignarDialogData,
    private fb: FormBuilder,
    private activosService: ActivosService,
    private snackbarService: SnackbarService
  ) {
    this.form = this.fb.group({
      persona: ['', Validators.required],
      fechaDevolucionPrevista: [null, [Validators.required, this.fechaFuturaValidator]]
    });
  }

  ngOnInit(): void {}

  ngAfterViewChecked(): void {
    if (this.debeEnfocar && this.personaInput) {
      setTimeout(() => {
        this.personaInput.nativeElement.focus();
        this.debeEnfocar = false;
      }, 100);
    }
  }

  fechaFuturaValidator(control: any): { [key: string]: any } | null {
    if (!control.value) {
      return null;
    }
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    return selectedDate > today ? null : { fechaPasada: true };
  }

  guardar(): void {
    if (this.form.invalid || this.guardando) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;
    const { persona, fechaDevolucionPrevista } = this.form.value;
    const fechaStr = fechaDevolucionPrevista.toISOString().split('T')[0];

    this.activosService.asignarActivo(this.data.activo.id!, persona, fechaStr).subscribe({
      next: () => {
        this.snackbarService.showSuccess(`Activo '${this.data.activo.codigo}' asignado correctamente`);
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.snackbarService.showError('Error al asignar el activo');
        console.error('Error al asignar activo:', error);
        this.guardando = false;
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}

