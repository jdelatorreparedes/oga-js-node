import { Component, OnInit, AfterViewInit, HostListener, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { ActivosService } from '../../services/activos.service';
import { ExcelService } from '../../services/excel.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { TipoActivo } from '../../models/tipo-activo.model';
import { TipoDialogComponent } from './tipo-dialog/tipo-dialog.component';
import { compararStrings } from '../../utils/string.utils';
import { AuthService } from '../../core/services/auth.service';

/**
 * Componente de gestión de tipos de activos
 * Permite CRUD completo con Material Design
 */
@Component({
  selector: 'app-tipos',
  templateUrl: './tipos.component.html',
  styleUrls: ['./tipos.component.scss']
})
export class TiposComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['nombre', 'codificacion', 'acciones'];
  dataSource = new MatTableDataSource<TipoActivo>([]);
  filtroBusqueda = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private activosService: ActivosService,
    private excelService: ExcelService,
    private dialog: MatDialog,
    private snackbarService: SnackbarService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarTipos();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (data: TipoActivo, filter: string) => {
      const searchText = filter.toLowerCase();
      const nombreMatch = data.nombre.toLowerCase().includes(searchText);
      const codificacionMatch = data.codificacion ? data.codificacion.toLowerCase().includes(searchText) : false;
      return nombreMatch || codificacionMatch;
    };
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (event.shiftKey && event.key === 'A' && !this.dialog.openDialogs.length) {
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
      if (!isInput) {
        event.preventDefault();
        this.abrirModalAnadir();
      }
    }
  }

  cargarTipos(): void {
    this.activosService.getTipos().subscribe({
      next: (tipos) => {
        this.dataSource.data = tipos;
      },
      error: (error) => {
        console.error('Error al cargar tipos:', error);
        this.snackbarService.showError('Error al cargar los tipos de activos');
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
    const dialogRef = this.dialog.open(TipoDialogComponent, {
      width: '550px',
      maxWidth: '90vw',
      data: { tipo: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarTipos();
      }
    });
  }

  abrirModalEditar(tipo: TipoActivo): void {
    const dialogRef = this.dialog.open(TipoDialogComponent, {
      width: '550px',
      maxWidth: '90vw',
      data: { tipo: { ...tipo } }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarTipos();
      }
    });
  }

  eliminar(tipo: TipoActivo): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      maxWidth: '90vw',
      data: {
        title: 'Eliminar Tipo',
        message: `¿Está seguro de eliminar el tipo "${tipo.nombre}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado && tipo.id) {
        this.activosService.deleteTipo(tipo.id).subscribe({
          next: () => {
            this.snackbarService.showSuccess('Tipo eliminado correctamente');
            this.cargarTipos();
          },
          error: (error) => {
            console.error('Error al eliminar tipo:', error);
            const errorMsg = error.error?.error || 'No se puede eliminar el tipo porque está siendo utilizado por algún activo.';
            this.snackbarService.showError(errorMsg);
          }
        });
      }
    });
  }

  exportarExcel(): void {
    const headers = ['Nombre', 'Codificación'];
    const data = this.dataSource.filteredData.map(t => ({
      'Nombre': t.nombre,
      'Codificación': t.codificacion || ''
    }));
    this.excelService.exportToExcel(data, 'tipos-activos', headers);
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
          // Obtener tipos existentes para comparar
          this.activosService.getTipos().subscribe({
            next: (tiposExistentes) => {
              const promesas: Promise<any>[] = [];
              let tiposDuplicados = 0;
              
              // Procesar cada fila del Excel
              data.forEach((row: any) => {
                const nombre = (row['Nombre'] || row['nombre'] || '').trim();
                const codificacion = (row['Codificación'] || row['Codificacion'] || row['codificacion'] || '').trim();
                if (!nombre) return; // Saltar filas vacías
                
                // Verificar si el tipo ya existe (sin distinguir mayúsculas, minúsculas o acentos)
                const existe = tiposExistentes.some(t => 
                  compararStrings(t.nombre, nombre)
                );
                
                if (!existe) {
                  // Crear nuevo tipo y agregar la promesa al array
                  const nuevoTipo: TipoActivo = { 
                    nombre,
                    codificacion: codificacion || undefined
                  };
                  const promesa = firstValueFrom(this.activosService.addTipo(nuevoTipo));
                  promesas.push(promesa);
                } else {
                  tiposDuplicados++;
                }
              });
              
              // Esperar a que todas las peticiones se completen
              Promise.all(promesas).then(() => {
                const tiposNuevos = promesas.length;
                if (tiposNuevos > 0) {
                  this.snackbarService.showSuccess(`${tiposNuevos} tipo(s) importado(s) correctamente`);
                } else if (tiposDuplicados > 0) {
                  this.snackbarService.showInfo('No se encontraron tipos nuevos para importar');
                } else {
                  this.snackbarService.showInfo('El archivo Excel está vacío o no contiene datos válidos');
                }
                this.cargarTipos();
              }).catch((error) => {
                console.error('Error al importar tipos:', error);
                this.snackbarService.showError('Error al importar algunos tipos');
                this.cargarTipos();
              });
            },
            error: (error) => {
              console.error('Error al cargar tipos existentes:', error);
              this.snackbarService.showError('Error al cargar los tipos existentes');
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

