import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../core/services/auth.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { ChangePasswordDialogComponent } from '../../shared/components/change-password-dialog/change-password-dialog.component';

/**
 * Componente de login
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackbarService: SnackbarService,
    private dialog: MatDialog
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Si ya está autenticado, redirigir al dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  login(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.authService.login(this.form.value).subscribe({
      next: (response) => {
        this.loading = false;
        // Si requiere cambio de contraseña, mostrar diálogo
        if (response.requiresPasswordChange) {
          this.showChangePasswordDialog();
        } else {
          this.snackbarService.showSuccess('Sesión iniciada correctamente');
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error) => {
        this.loading = false;
        const errorMsg = error.error?.error || 'Usuario o contraseña incorrectos';
        this.snackbarService.showError(errorMsg);
      }
    });
  }

  showChangePasswordDialog(): void {
    const dialogRef = this.dialog.open(ChangePasswordDialogComponent, {
      width: '450px',
      maxWidth: '90vw',
      disableClose: true, // No permitir cerrar sin cambiar la contraseña
      data: {
        userId: this.authService.currentUserValue?.id,
        isFirstLogin: true
      }
    });

    dialogRef.afterClosed().subscribe((passwordChanged) => {
      if (passwordChanged) {
        this.snackbarService.showSuccess('Contraseña cambiada correctamente. Sesión iniciada.');
        this.router.navigate(['/dashboard']);
      } else {
        // Si canceló, hacer logout
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    });
  }
}

