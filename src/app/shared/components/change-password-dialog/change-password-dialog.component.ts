import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiService } from '../../../core/services/api.service';
import { SnackbarService } from '../../services/snackbar.service';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Diálogo para cambiar contraseña del usuario actual
 */
@Component({
  selector: 'app-change-password-dialog',
  templateUrl: './change-password-dialog.component.html',
  styleUrls: ['./change-password-dialog.component.scss']
})
export class ChangePasswordDialogComponent implements OnInit, AfterViewChecked {
  form: FormGroup;
  guardando = false;
  private debeEnfocar = true;

  @ViewChild('currentPasswordInput') currentPasswordInput!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
    private api: ApiService,
    private snackbarService: SnackbarService,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {}

  ngAfterViewChecked(): void {
    if (this.debeEnfocar && this.currentPasswordInput) {
      setTimeout(() => {
        this.currentPasswordInput.nativeElement.focus();
        this.debeEnfocar = false;
      }, 0);
    }
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');
    
    if (!newPassword || !confirmPassword) {
      return null;
    }
    
    return newPassword.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  guardar(): void {
    if (this.guardando) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.id) {
      this.snackbarService.showError('No se pudo identificar al usuario');
      return;
    }

    const passwordData = {
      currentPassword: this.form.value.currentPassword,
      newPassword: this.form.value.newPassword
    };

    this.guardando = true;

    this.api.post(`usuarios/${currentUser.id}/change-password`, passwordData).subscribe({
      next: () => {
        this.snackbarService.showSuccess('Contraseña cambiada correctamente');
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Error al cambiar contraseña:', error);
        let errorMessage = 'Error al cambiar la contraseña';
        
        if (error.error) {
          if (error.error.error) {
            errorMessage = error.error.error;
          } else if (typeof error.error === 'string') {
            errorMessage = error.error;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        // Si es un error de conexión
        if (error.status === 0 || error.name === 'HttpErrorResponse') {
          errorMessage = 'Error de conexión con el servidor. Verifique que el backend esté corriendo.';
        }
        
        this.snackbarService.showError(errorMessage);
        this.guardando = false;
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}

