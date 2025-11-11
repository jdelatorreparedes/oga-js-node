import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ActivosService } from '../../services/activos.service';
import { ExcelService } from '../../services/excel.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { HistoricoAsignacion } from '../../models/historico.model';
import { Activo } from '../../models/activo.model';
import { TipoActivo } from '../../models/tipo-activo.model';

interface HistoricoEnriquecido extends HistoricoAsignacion {
  activoCodigo?: string;
  activoReferencia?: string;
  activoTipo?: string;
}

/**
 * Componente de histórico de asignaciones
 * Refactorizado con Material Design
 */
@Component({
  selector: 'app-historico',
  templateUrl: './historico.component.html',
  styleUrls: ['./historico.component.scss']
})
export class HistoricoComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'activoTipo',
    'activoCodigo',
    'activoReferencia',
    'persona',
    'fechaAsignacion',
    'fechaDevolucionPrevista',
    'fechaDevolucion'
  ];
  dataSource = new MatTableDataSource<HistoricoEnriquecido>([]);
  historicoCompleto: HistoricoEnriquecido[] = [];
  activos: Activo[] = [];
  tipos: TipoActivo[] = [];
  filtroBusqueda = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private activosService: ActivosService,
    private excelService: ExcelService,
    private snackbarService: SnackbarService
  ) {}

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = this.getFilterPredicate();
  }

  cargarDatosIniciales(): void {
    this.activosService.getTipos().subscribe({
      next: (tipos) => {
        this.tipos = tipos;
        this.cargarActivosYHistorico();
      },
      error: (error) => {
        this.snackbarService.showError('Error al cargar los tipos de activo');
        console.error('Error al cargar tipos:', error);
      }
    });
  }

  cargarActivosYHistorico(): void {
    this.activosService.getActivos(true).subscribe({
      next: (activos) => {
        this.activos = activos;
        this.activosService.getHistoricoCompleto().subscribe({
          next: (historico: any[]) => {
            this.historicoCompleto = historico.map(h => {
              const activo = this.activos.find(a => a.id === h.activoId);
              const tipo = activo ? this.tipos.find(t => t.id === activo.tipoId) : undefined;
              return {
                ...h,
                activoCodigo: activo?.codigo || 'N/A',
                activoReferencia: activo?.referencia || 'N/A',
                activoTipo: tipo?.nombre || 'N/A'
              };
            });
            this.aplicarFiltro();
            // Aplicar ordenación por defecto por código del activo después de cargar datos
            setTimeout(() => {
              if (this.sort && !this.sort.active) {
                this.sort.active = 'activoCodigo';
                this.sort.direction = 'asc';
                this.dataSource.sort = this.sort;
              }
            }, 0);
          },
          error: (error) => {
            this.snackbarService.showError('Error al cargar el historial de asignaciones');
            console.error('Error al cargar histórico:', error);
          }
        });
      },
      error: (error) => {
        this.snackbarService.showError('Error al cargar los activos');
        console.error('Error al cargar activos:', error);
      }
    });
  }

  aplicarFiltro(): void {
    this.dataSource.data = this.historicoCompleto;
    this.dataSource.filter = this.filtroBusqueda.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    
    // Aplicar ordenación por defecto por código del activo
    if (this.sort && !this.sort.active) {
      this.sort.active = 'activoCodigo';
      this.sort.direction = 'asc';
      this.dataSource.sort = this.sort;
    }
  }

  getFilterPredicate(): (data: HistoricoEnriquecido, filter: string) => boolean {
    return (data: HistoricoEnriquecido, filter: string) => {
      if (!filter) return true;
      
      // Normalizar y buscar si contiene el texto (similar a tipos y activos)
      const normalizar = (str: string) => {
        if (!str) return '';
        return str
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim();
      };
      
      const searchNormalized = normalizar(filter);
      
      return normalizar(data.activoCodigo || '').includes(searchNormalized) ||
             normalizar(data.activoReferencia || '').includes(searchNormalized) ||
             normalizar(data.activoTipo || '').includes(searchNormalized) ||
             normalizar(data.persona || '').includes(searchNormalized);
    };
  }

  exportarExcel(): void {
    const headers = ['Código Activo', 'Referencia Activo', 'Tipo Activo', 'Persona Asignada', 'Fecha Asignación', 'Fecha Prevista Devolución', 'Fecha Real Devolución'];
    const data = this.dataSource.filteredData.map(h => ({
      'Código Activo': h.activoCodigo || '',
      'Referencia Activo': h.activoReferencia || '',
      'Tipo Activo': h.activoTipo || '',
      'Persona Asignada': h.persona || '',
      'Fecha Asignación': h.fechaAsignacion ? new Date(h.fechaAsignacion).toLocaleDateString() : '',
      'Fecha Prevista Devolución': h.fechaDevolucionPrevista ? new Date(h.fechaDevolucionPrevista).toLocaleDateString() : '',
      'Fecha Real Devolución': h.fechaDevolucion ? new Date(h.fechaDevolucion).toLocaleDateString() : ''
    }));
    this.excelService.exportToExcel(data, 'historico_asignaciones', headers);
    this.snackbarService.showSuccess('Excel exportado correctamente');
  }
}
