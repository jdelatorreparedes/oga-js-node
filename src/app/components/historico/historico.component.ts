import { Component, OnInit } from '@angular/core';
import { ActivosService } from '../../services/activos.service';
import { CsvService } from '../../services/csv.service';
import { Activo } from '../../models/activo.model';
import { HistoricoAsignacion } from '../../models/historico.model';

@Component({
  selector: 'app-historico',
  templateUrl: './historico.component.html',
  styleUrls: ['./historico.component.css']
})
export class HistoricoComponent implements OnInit {
  activosConHistorial: any[] = [];
  activosConHistorialFiltrados: any[] = [];
  historicoSeleccionado: HistoricoAsignacion[] = [];
  activoSeleccionado: Activo | null = null;
  filtroBusqueda = '';

  constructor(
    private activosService: ActivosService,
    private csvService: CsvService
  ) {}

  ngOnInit(): void {
    this.cargarActivosConHistorial();
  }

  cargarActivosConHistorial(): void {
    this.activosService.getHistoricoCompleto().subscribe({
      next: (historico: any[]) => {
        // Agrupar por activo
        const activosMap = new Map<number, any>();
        
        historico.forEach((item: any) => {
          const activoId = item.activoId;
          if (!activosMap.has(activoId)) {
            // Construir objeto activo desde los datos del histórico
            activosMap.set(activoId, {
              activo: {
                id: activoId,
                codigo: item.activoCodigo || item.codigo,
                referencia: item.activoReferencia || item.referencia,
                tipoNombre: item.tipoNombre
              },
              historico: []
            });
          }
          activosMap.get(activoId)!.historico.push(item);
        });

        // Ordenar histórico por fecha de asignación descendente
        this.activosConHistorial = Array.from(activosMap.values()).map(item => ({
          activo: item.activo,
          historico: item.historico.sort((a: any, b: any) => 
            new Date(b.fechaAsignacion).getTime() - new Date(a.fechaAsignacion).getTime()
          )
        }));

        // Ordenar activos por código
        this.activosConHistorial.sort((a, b) => 
          (a.activo?.codigo || '').localeCompare(b.activo?.codigo || '')
        );
        this.aplicarFiltro();
      },
      error: (error) => {
        console.error('Error al cargar histórico:', error);
      }
    });
  }

  aplicarFiltro(): void {
    if (!this.filtroBusqueda.trim()) {
      this.activosConHistorialFiltrados = this.activosConHistorial;
    } else {
      const filtro = this.filtroBusqueda.toLowerCase().trim();
      this.activosConHistorialFiltrados = this.activosConHistorial.filter(item => {
        const codigo = item.activo?.codigo?.toLowerCase() || '';
        const referencia = item.activo?.referencia?.toLowerCase() || '';
        const tipoNombre = item.activo?.tipoNombre?.toLowerCase() || '';
        const persona = item.historico.some((h: any) => h.persona?.toLowerCase().includes(filtro));
        return codigo.includes(filtro) || referencia.includes(filtro) || tipoNombre.includes(filtro) || persona;
      });
    }
  }

  seleccionarActivo(item: any): void {
    if (this.activoSeleccionado?.id === item.activo?.id) {
      // Si ya está seleccionado, deseleccionar
      this.activoSeleccionado = null;
      this.historicoSeleccionado = [];
    } else {
      this.activoSeleccionado = item.activo;
      this.historicoSeleccionado = item.historico;
    }
  }

  exportarCsv(): void {
    const headers = ['Activo ID', 'Código', 'Referencia', 'Persona', 'Fecha Asignación', 'Fecha Devolución Prevista', 'Fecha Devolución'];
    const data: any[] = [];

    this.activosConHistorialFiltrados.forEach(item => {
      item.historico.forEach((hist: any) => {
        data.push({
          'Activo ID': item.activo?.id || '',
          'Código': item.activo?.codigo || hist.activoCodigo || '',
          'Referencia': item.activo?.referencia || hist.activoReferencia || '',
          'Persona': hist.persona,
          'Fecha Asignación': hist.fechaAsignacion,
          'Fecha Devolución Prevista': hist.fechaDevolucionPrevista,
          'Fecha Devolución': hist.fechaDevolucion || 'Pendiente'
        });
      });
    });

    this.csvService.exportToCsv(data, 'historico-asignaciones.csv', headers);
  }

  estaDevolvido(historico: HistoricoAsignacion): boolean {
    return !!historico.fechaDevolucion;
  }
}

