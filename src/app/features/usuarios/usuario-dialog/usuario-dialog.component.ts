import { Component, Inject, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiService } from '../../../core/services/api.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { Usuario, Rol } from '../../../models/usuario.model';

export interface UsuarioDialogData {
  usuario: Usuario | null;
}

/**
 * Diálogo para crear/editar usuarios
 */
@Component({
  selector: 'app-usuario-dialog',
  templateUrl: './usuario-dialog.component.html',
  styleUrls: ['./usuario-dialog.component.scss']
})
export class UsuarioDialogComponent implements OnInit, AfterViewChecked {
  form: FormGroup;
  guardando = false;
  roles = Object.values(Rol);
  esEdicion = false;
  private debeEnfocar = true;

  @ViewChild('usernameInput') usernameInput!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UsuarioDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UsuarioDialogData,
    private api: ApiService,
    private snackbarService: SnackbarService
  ) {
    this.esEdicion = !!data.usuario;
    
    // Asegurar que cuando es nuevo usuario, todos los campos estén vacíos
    const isNewUser = !data.usuario || !data.usuario.id;
    
    this.form = this.fb.group({
      id: [data.usuario?.id],
      username: [isNewUser ? '' : (data.usuario?.username || ''), [Validators.required, Validators.minLength(3)]],
      password: ['', isNewUser ? [Validators.required, Validators.minLength(6)] : []],
      rol: [data.usuario?.rol || Rol.Usuario, Validators.required],
      activo: [isNewUser ? true : (data.usuario?.activo !== undefined ? data.usuario.activo : true)]
    });
  }

  ngOnInit(): void {}

  ngAfterViewChecked(): void {
    if (this.debeEnfocar && this.usernameInput) {
      setTimeout(() => {
        this.usernameInput.nativeElement.focus();
        this.debeEnfocar = false;
      }, 0);
    }
  }

  get titulo(): string {
    return this.esEdicion ? 'Editar Usuario' : 'Añadir Usuario';
  }

  guardar(): void {
    if (this.guardando) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const usuarioData: Usuario = {
      ...this.form.value
    };

    // Si es edición y no se cambió la contraseña, no enviarla
    if (this.esEdicion && !usuarioData.password) {
      delete usuarioData.password;
    }

    this.guardando = true;

    if (this.esEdicion && usuarioData.id) {
      this.api.put(`usuarios/${usuarioData.id}`, usuarioData).subscribe({
        next: () => {
          this.snackbarService.showSuccess('Usuario actualizado correctamente');
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error al actualizar usuario:', error);
          this.snackbarService.showError(error.error?.error || 'Error al actualizar el usuario');
          this.guardando = false;
        }
      });
    } else {
      this.api.post('usuarios', usuarioData).subscribe({
        next: () => {
          this.snackbarService.showSuccess('Usuario creado correctamente');
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error al crear usuario:', error);
          this.snackbarService.showError(error.error?.error || 'Error al crear el usuario');
          this.guardando = false;
        }
      });
    }
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}

