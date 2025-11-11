import { Component, OnInit } from '@angular/core';
import { ActivosService } from '../../services/activos.service';
import { EstadoActivo } from '../../models/activo.model';
import { SnackbarService } from '../../shared/services/snackbar.service';

/**
 * Componente Dashboard
 * Página principal con resumen de la aplicación
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  version = '10.0.0';
  
  stats = [
    { label: 'Total Activos', value: '0', icon: 'inventory', color: 'primary' },
    { label: 'Disponibles', value: '0', icon: 'check_circle', color: 'accent' },
    { label: 'Asignados', value: '0', icon: 'person', color: 'primary' },
    { label: 'Tipos', value: '0', icon: 'category', color: 'accent' }
  ];

  constructor(
    private activosService: ActivosService,
    private snackbarService: SnackbarService
  ) {}

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  loadDashboardStats(): void {
    this.activosService.getActivos(true).subscribe({
      next: (activos) => {
        const totalActivos = activos.length;
        const disponibles = activos.filter(a => a.estado === EstadoActivo.Disponible).length;
        const asignados = activos.filter(a => a.estado === EstadoActivo.Asignado).length;

        this.stats[0].value = totalActivos.toString();
        this.stats[1].value = disponibles.toString();
        this.stats[2].value = asignados.toString();
      },
      error: (error) => {
        this.snackbarService.showError('Error al cargar estadísticas de activos');
        console.error('Error al cargar activos para dashboard:', error);
      }
    });

    this.activosService.getTipos().subscribe({
      next: (tipos) => {
        this.stats[3].value = tipos.length.toString();
      },
      error: (error) => {
        this.snackbarService.showError('Error al cargar estadísticas de tipos');
        console.error('Error al cargar tipos para dashboard:', error);
      }
    });
  }
}

