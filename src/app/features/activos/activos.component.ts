import { Component, OnInit, AfterViewInit, HostListener, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { ActivosService } from '../../services/activos.service';
import { CsvService } from '../../services/csv.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { TipoActivo } from '../../models/tipo-activo.model';
import { Activo, EstadoActivo } from '../../models/activo.model';
import { ActivoDialogComponent } from './activo-dialog/activo-dialog.component';
import { AsignarDialogComponent } from './asignar-dialog/asignar-dialog.component';
import { BajaDialogComponent } from './baja-dialog/baja-dialog.component';
import { compararStrings } from '../../utils/string.utils';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

interface ActivoConPersona extends Activo {
  personaAsignada?: string;
}

/**
 * Componente de gestión de activos
 * Permite CRUD completo con Material Design
 */
@Component({
  selector: 'app-activos',
  templateUrl: './activos.component.html',
  styleUrls: ['./activos.component.scss']
})
export class ActivosComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['tipo', 'codigo', 'referencia', 'descripcion', 'personaAsignada', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<ActivoConPersona>([]);
  activos: Activo[] = [];
  activosEnriquecidos: ActivoConPersona[] = [];
  tipos: TipoActivo[] = [];
  filtroBusqueda = '';
  mostrarBajas = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private activosService: ActivosService,
    private csvService: CsvService,
    private dialog: MatDialog,
    private snackbarService: SnackbarService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarTipos();
    this.cargarActivos();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = this.getFilterPredicate();
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
        this.tipos = tipos;
      },
      error: (error) => {
        this.snackbarService.showError('Error al cargar los tipos de activo');
        console.error('Error al cargar tipos:', error);
      }
    });
  }

  cargarActivos(): void {
    this.activosService.getActivos(this.mostrarBajas).subscribe({
      next: (activos) => {
        this.activos = activos;
        this.enriquecerConPersonas();
      },
      error: (error) => {
        this.snackbarService.showError('Error al cargar los activos');
        console.error('Error al cargar activos:', error);
      }
    });
  }

  enriquecerConPersonas(): void {
    this.activosService.getHistoricoCompleto().subscribe({
      next: (historico: any[]) => {
        const activosMap = new Map<number, ActivoConPersona>();
        
        this.activos.forEach(activo => {
          activosMap.set(activo.id!, { ...activo } as ActivoConPersona);
        });

        historico.forEach((h: any) => {
          if (h.activoId && !h.fechaDevolucion) {
            const activo = activosMap.get(h.activoId);
            if (activo) {
              activo.personaAsignada = h.persona;
            }
          }
        });

        this.activosEnriquecidos = Array.from(activosMap.values());
        this.aplicarFiltro();
        // Aplicar ordenación por defecto por código del activo después de cargar datos
        setTimeout(() => {
          if (this.sort && !this.sort.active) {
            this.sort.active = 'codigo';
            this.sort.direction = 'asc';
            this.dataSource.sort = this.sort;
          }
        }, 0);
      },
      error: (error) => {
        console.error('Error al cargar histórico:', error);
        this.activosEnriquecidos = this.activos.map(a => ({ ...a } as ActivoConPersona));
        this.aplicarFiltro();
        // Aplicar ordenación por defecto por código del activo después de cargar datos
        setTimeout(() => {
          if (this.sort && !this.sort.active) {
            this.sort.active = 'codigo';
            this.sort.direction = 'asc';
            this.dataSource.sort = this.sort;
          }
        }, 0);
      }
    });
  }

  aplicarFiltro(): void {
    let activosFiltrados = this.activosEnriquecidos;

    if (!this.mostrarBajas) {
      activosFiltrados = activosFiltrados.filter(activo => activo.estado !== EstadoActivo.Baja);
    }

    this.dataSource.data = activosFiltrados;
    this.dataSource.filter = this.filtroBusqueda.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    
    // Aplicar ordenación por defecto por código del activo
    if (this.sort && !this.sort.active) {
      this.sort.active = 'codigo';
      this.sort.direction = 'asc';
      this.dataSource.sort = this.sort;
    }
  }

  getFilterPredicate(): (data: ActivoConPersona, filter: string) => boolean {
    return (data: ActivoConPersona, filter: string) => {
      if (!filter) return true;
      
      const searchString = filter.toLowerCase();
      const tipoNombre = this.tipos.find(t => t.id === data.tipoId)?.nombre || '';
      
      // Normalizar y buscar si contiene el texto (similar a tipos)
      const normalizar = (str: string) => {
        if (!str) return '';
        return str
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim();
      };
      
      const searchNormalized = normalizar(searchString);
      
      // Buscar también por estado
      const estadoNormalizado = normalizar(data.estado || '');
      
      return normalizar(data.codigo).includes(searchNormalized) ||
             normalizar(data.referencia || '').includes(searchNormalized) ||
             normalizar(data.descripcion || '').includes(searchNormalized) ||
             normalizar(tipoNombre).includes(searchNormalized) ||
             normalizar(data.personaAsignada || '').includes(searchNormalized) ||
             estadoNormalizado.includes(searchNormalized);
    };
  }

  toggleMostrarBajas(): void {
    this.mostrarBajas = !this.mostrarBajas;
    this.cargarActivos();
  }

  getTipoNombre(tipoId: number): string {
    return this.tipos.find(tipo => tipo.id === tipoId)?.nombre || 'Desconocido';
  }

  getEstadoColor(estado: EstadoActivo): string {
    switch (estado) {
      case EstadoActivo.Disponible:
        return 'primary';
      case EstadoActivo.Asignado:
        return 'accent';
      case EstadoActivo.Baja:
        return 'warn';
      default:
        return '';
    }
  }

  getEstadoClass(estado: EstadoActivo): string {
    switch (estado) {
      case EstadoActivo.Disponible:
        return 'estado-disponible';
      case EstadoActivo.Asignado:
        return 'estado-asignado';
      case EstadoActivo.Baja:
        return 'estado-baja';
      default:
        return '';
    }
  }

  abrirModalAnadir(): void {
    const dialogRef = this.dialog.open(ActivoDialogComponent, {
      width: '600px',
      maxHeight: '90vh',
      data: { tipos: this.tipos, activosExistentes: this.activos }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarActivos();
      }
    });
  }

  abrirModalEditar(activo: Activo): void {
    const dialogRef = this.dialog.open(ActivoDialogComponent, {
      width: '600px',
      maxHeight: '90vh',
      data: { activo: { ...activo }, tipos: this.tipos, activosExistentes: this.activos }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarActivos();
      }
    });
  }

  eliminarActivo(activo: Activo): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Activo',
        message: `¿Está seguro de eliminar el activo "${activo.codigo}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado && activo.id) {
        this.activosService.deleteActivo(activo.id).subscribe({
          next: () => {
            this.snackbarService.showSuccess('Activo eliminado correctamente');
            this.cargarActivos();
          },
          error: (error) => {
            this.snackbarService.showError('Error al eliminar el activo');
            console.error('Error al eliminar activo:', error);
          }
        });
      }
    });
  }

  abrirModalAsignar(activo: Activo): void {
    if (activo.estado === EstadoActivo.Asignado) {
      this.snackbarService.showInfo('Este activo ya está asignado');
      return;
    }
    if (activo.estado === EstadoActivo.Baja) {
      this.snackbarService.showInfo('No se puede asignar un activo dado de baja');
      return;
    }

    const dialogRef = this.dialog.open(AsignarDialogComponent, {
      width: '500px',
      data: { activo: activo }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarActivos();
      }
    });
  }

  devolverActivo(activo: Activo): void {
    if (activo.estado !== EstadoActivo.Asignado) {
      this.snackbarService.showInfo('Este activo no está asignado');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Devolver Activo',
        message: `¿Está seguro de devolver el activo "${activo.codigo}"?`,
        confirmText: 'Devolver',
        cancelText: 'Cancelar',
        confirmColor: 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(confirmado => {
      if (confirmado && activo.id) {
        this.activosService.devolverActivo(activo.id).subscribe({
          next: () => {
            this.snackbarService.showSuccess(`Activo '${activo.codigo}' devuelto correctamente`);
            this.cargarActivos();
          },
          error: (error) => {
            this.snackbarService.showError('Error al devolver el activo');
            console.error('Error al devolver activo:', error);
          }
        });
      }
    });
  }

  abrirModalDarDeBaja(activo: Activo): void {
    if (activo.estado === EstadoActivo.Baja) {
      this.snackbarService.showInfo('Este activo ya está dado de baja');
      return;
    }
    if (activo.estado === EstadoActivo.Asignado) {
      this.snackbarService.showInfo('No se puede dar de baja un activo asignado. Primero debe ser devuelto');
      return;
    }

    const dialogRef = this.dialog.open(BajaDialogComponent, {
      width: '500px',
      data: { activo: activo }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarActivos();
      }
    });
  }

  exportarCsv(): void {
    const headers = ['Código', 'Referencia', 'Descripción', 'Marca', 'Detalles', 'Tipo', 'Área', 'Responsable', 'Estado', 'Persona Asignada'];
    const data = this.dataSource.filteredData.map(activo => ({
      'Código': activo.codigo,
      'Referencia': activo.referencia || '',
      'Descripción': activo.descripcion || '',
      'Marca': activo.marca || '',
      'Detalles': activo.detalles || '',
      'Tipo': this.getTipoNombre(activo.tipoId),
      'Área': activo.area || '',
      'Responsable': activo.responsable || '',
      'Estado': activo.estado,
      'Persona Asignada': activo.personaAsignada || ''
    }));
    this.csvService.exportToCsv(data, 'activos.csv', headers);
    this.snackbarService.showSuccess('CSV exportado correctamente');
  }

  importarCsv(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.csvService.importFromCsv(file).then((data) => {
          if (data.length === 0) {
            this.snackbarService.showInfo('El archivo CSV está vacío o no contiene datos válidos');
            return;
          }

          // Obtener tipos y activos existentes para comparar
          this.activosService.getTipos().subscribe({
            next: (tipos) => {
              this.tipos = tipos;
              this.activosService.getActivos(true).subscribe({
                next: (activosExistentes) => {
                  const promesas: Promise<any>[] = [];
                  let activosNuevos = 0;
                  let activosDuplicados = 0;
                  let errores = 0;

                  // Procesar cada fila del CSV
                  data.forEach((row: any) => {
                    // Mapear los nombres de columnas (pueden variar por codificación)
                    // Intentar diferentes variantes de los nombres de columnas
                    const codigo = (row['Código'] || row['Cdigo'] || row['Cdigo'] || row['codigo'] || row['Column1'] || '').trim();
                    if (!codigo) return; // Saltar filas sin código

                    // Verificar si el activo ya existe (sin distinguir mayúsculas, minúsculas o acentos)
                    const existe = activosExistentes.some(a => 
                      compararStrings(a.codigo, codigo)
                    );

                    if (!existe) {
                      // Buscar el tipo por nombre (intentar diferentes variantes)
                      const tipoNombre = (row['Tipo'] || row['tipo'] || row['Column4'] || '').trim();
                      const tipo = tipos.find(t => compararStrings(t.nombre, tipoNombre));
                      
                      if (!tipo) {
                        errores++;
                        console.error(`Tipo no encontrado: ${tipoNombre}`);
                        return;
                      }

                      // Mapear el estado
                      const estadoStr = (row['Estado'] || row['estado'] || row['Column7'] || 'Disponible').trim();
                      let estado: EstadoActivo = EstadoActivo.Disponible;
                      if (estadoStr === 'Asignado') {
                        estado = EstadoActivo.Asignado;
                      } else if (estadoStr === 'Baja') {
                        estado = EstadoActivo.Baja;
                      }

                      // Crear nuevo activo (mapear todas las columnas posibles)
                      const nuevoActivo: Activo = {
                        tipoId: tipo.id!,
                        codigo: codigo,
                        referencia: (row['Referencia'] || row['referencia'] || row['Column2'] || '').trim(),
                        descripcion: (row['Descripción'] || row['Descripcin'] || row['Descripcin'] || row['descripcion'] || row['Column3'] || '').trim(),
                        marca: (row['Marca'] || row['marca'] || row['Column4'] || '').trim(),
                        detalles: (row['Detalles'] || row['detalles'] || row['Column5'] || '').trim(),
                        area: (row['Área'] || row['rea'] || row['rea'] || row['area'] || row['Column6'] || '').trim(),
                        responsable: (row['Responsable'] || row['responsable'] || row['Column7'] || '').trim(),
                        fechaRevision: '',
                        estado: estado
                      };

                      const promesa = firstValueFrom(this.activosService.addActivo(nuevoActivo))
                        .then(() => {
                          activosNuevos++;
                        })
                        .catch((error) => {
                          console.error('Error al añadir activo:', error);
                          errores++;
                        });
                      
                      promesas.push(promesa);
                    } else {
                      activosDuplicados++;
                    }
                  });

                  // Esperar a que todas las peticiones se completen
                  Promise.all(promesas).then(() => {
                    if (activosNuevos > 0) {
                      this.snackbarService.showSuccess(`${activosNuevos} activo(s) importado(s) correctamente`);
                    } else if (activosDuplicados > 0) {
                      this.snackbarService.showInfo('No se encontraron activos nuevos para importar');
                    } else if (errores > 0) {
                      this.snackbarService.showError(`Error al importar ${errores} activo(s)`);
                    } else {
                      this.snackbarService.showInfo('El archivo CSV está vacío o no contiene datos válidos');
                    }
                    this.cargarActivos();
                  }).catch((error) => {
                    console.error('Error al importar activos:', error);
                    this.snackbarService.showError('Error al importar algunos activos');
                    this.cargarActivos();
                  });
                },
                error: (error) => {
                  console.error('Error al cargar activos existentes:', error);
                  this.snackbarService.showError('Error al cargar los activos existentes');
                }
              });
            },
            error: (error) => {
              console.error('Error al cargar tipos:', error);
              this.snackbarService.showError('Error al cargar los tipos de activo');
            }
          });
        }).catch((error) => {
          console.error('Error al importar CSV:', error);
          this.snackbarService.showError('Error al importar el archivo CSV');
        });
      }
    };
    input.click();
  }
}
