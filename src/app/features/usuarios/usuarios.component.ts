import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../core/services/api.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { Usuario, Rol } from '../../models/usuario.model';
import { UsuarioDialogComponent, UsuarioDialogData } from './usuario-dialog/usuario-dialog.component';

/**
 * Componente de gestión de usuarios
 * Solo visible para administradores
 */
@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss']
})
export class UsuariosComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['username', 'rol', 'activo', 'acciones'];
  dataSource = new MatTableDataSource<Usuario>([]);
  filtroBusqueda = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private snackbarService: SnackbarService
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (data: Usuario, filter: string) => {
      return data.username.toLowerCase().includes(filter.toLowerCase()) ||
             data.rol.toLowerCase().includes(filter.toLowerCase());
    };
  }

  cargarUsuarios(): void {
    this.api.get<Usuario[]>('usuarios').subscribe({
      next: (usuarios) => {
        // No mostrar la contraseña en el frontend
        const usuariosSinPassword = usuarios.map(u => ({ ...u, password: undefined }));
        this.dataSource.data = usuariosSinPassword;
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        let errorMessage = 'Error al cargar los usuarios';
        
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
        } else if (error.status === 401) {
          errorMessage = 'No tiene permisos para acceder a esta información';
        } else if (error.status === 403) {
          errorMessage = 'Acceso denegado. Solo los administradores pueden ver los usuarios';
        } else if (error.status === 404) {
          errorMessage = 'El endpoint de usuarios no fue encontrado';
        } else if (error.status >= 500) {
          errorMessage = 'Error del servidor al cargar los usuarios';
        }
        
        this.snackbarService.showError(errorMessage);
      }
    });
  }

  aplicarFiltro(): void {
    this.dataSource.filter = this.filtroBusqueda.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  abrirModalAnadir(): void {
    const dialogRef = this.dialog.open(UsuarioDialogComponent, {
      width: '500px',
      data: { usuario: null } as UsuarioDialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarUsuarios();
      }
    });
  }

  abrirModalEditar(usuario: Usuario): void {
    const dialogRef = this.dialog.open(UsuarioDialogComponent, {
      width: '500px',
      data: { usuario: { ...usuario } }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarUsuarios();
      }
    });
  }

  eliminar(usuario: Usuario): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Usuario',
        message: `¿Está seguro de eliminar el usuario "${usuario.username}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado && usuario.id) {
        this.api.delete(`usuarios/${usuario.id}`).subscribe({
          next: () => {
            this.snackbarService.showSuccess('Usuario eliminado correctamente');
            this.cargarUsuarios();
          },
          error: (error) => {
            console.error('Error al eliminar usuario:', error);
            this.snackbarService.showError(error.error?.error || 'Error al eliminar el usuario');
          }
        });
      }
    });
  }
}

