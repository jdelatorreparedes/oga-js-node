import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../core/services/api.service';
import { ExcelService } from '../../services/excel.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { Usuario, Rol } from '../../models/usuario.model';
import { UsuarioDialogComponent, UsuarioDialogData } from './usuario-dialog/usuario-dialog.component';
import { firstValueFrom } from 'rxjs';

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
    private excelService: ExcelService,
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
      maxWidth: '90vw',
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
      maxWidth: '90vw',
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
      maxWidth: '90vw',
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

  exportarExcel(): void {
    const headers = ['Usuario', 'Rol', 'Estado'];
    const data = this.dataSource.filteredData.map(usuario => ({
      'Usuario': usuario.username,
      'Rol': usuario.rol,
      'Estado': usuario.activo ? 'Activo' : 'Deshabilitado'
    }));
    this.excelService.exportToExcel(data, 'usuarios', headers);
    this.snackbarService.showSuccess('Excel exportado correctamente');
  }

  importarExcel(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.excelService.importFromExcel(file).then((data) => {
          if (data.length === 0) {
            this.snackbarService.showInfo('El archivo Excel está vacío o no contiene datos válidos');
            return;
          }

          // Obtener usuarios existentes para comparar
          this.api.get<Usuario[]>('usuarios').subscribe({
            next: (usuariosExistentes) => {
              const promesas: Promise<any>[] = [];
              let usuariosNuevos = 0;
              let usuariosDuplicados = 0;
              let errores = 0;

              // Procesar cada fila del Excel
              data.forEach((row: any) => {
                // Mapear los nombres de columnas (pueden variar)
                const username = (row['Usuario'] || row['usuario'] || row['username'] || row['Column1'] || '').trim();
                if (!username) return; // Saltar filas sin usuario

                // Verificar si el usuario ya existe
                const existe = usuariosExistentes.some(u => 
                  u.username.toLowerCase() === username.toLowerCase()
                );

                if (!existe) {
                  // Mapear el rol (con valores por defecto)
                  const rolStr = (row['Rol'] || row['rol'] || row['Column2'] || 'Usuario').trim();
                  let rol: Rol = Rol.Usuario;
                  
                  // Validar y mapear el rol
                  if (rolStr === 'Administrador' || rolStr === 'administrador') {
                    rol = Rol.Administrador;
                  } else if (rolStr === 'Visor' || rolStr === 'visor') {
                    rol = Rol.Visor;
                  } else {
                    rol = Rol.Usuario;
                  }

                  // Mapear el estado (por defecto Activo)
                  const estadoStr = (row['Estado'] || row['estado'] || row['Column3'] || 'Activo').trim();
                  const activo = estadoStr.toLowerCase() === 'activo' || estadoStr.toLowerCase() === 'true' || estadoStr === '1';

                  // Crear nuevo usuario con contraseña por defecto "orbita"
                  const nuevoUsuario: Usuario = {
                    username: username,
                    password: 'orbita', // Contraseña por defecto
                    rol: rol,
                    activo: activo
                  };

                  const promesa = firstValueFrom(this.api.post('usuarios', nuevoUsuario))
                    .then(() => {
                      usuariosNuevos++;
                    })
                    .catch((error) => {
                      console.error('Error al añadir usuario:', error);
                      errores++;
                    });
                  
                  promesas.push(promesa);
                } else {
                  usuariosDuplicados++;
                }
              });

              // Esperar a que todas las peticiones se completen
              Promise.all(promesas).then(() => {
                if (usuariosNuevos > 0) {
                  this.snackbarService.showSuccess(`${usuariosNuevos} usuario(s) importado(s) correctamente. La contraseña por defecto es "orbita".`);
                } else if (usuariosDuplicados > 0) {
                  this.snackbarService.showInfo('No se encontraron usuarios nuevos para importar');
                } else if (errores > 0) {
                  this.snackbarService.showError(`Error al importar ${errores} usuario(s)`);
                } else {
                  this.snackbarService.showInfo('El archivo Excel está vacío o no contiene datos válidos');
                }
                this.cargarUsuarios();
              }).catch((error) => {
                console.error('Error al importar usuarios:', error);
                this.snackbarService.showError('Error al importar algunos usuarios');
                this.cargarUsuarios();
              });
            },
            error: (error) => {
              console.error('Error al cargar usuarios existentes:', error);
              this.snackbarService.showError('Error al cargar los usuarios existentes');
            }
          });
        }).catch((error) => {
          console.error('Error al importar Excel:', error);
          this.snackbarService.showError('Error al importar el archivo Excel');
        });
      }
    };
    input.click();
  }
}

