import { Component, OnInit, HostListener, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ActivosService } from '../../services/activos.service';
import { CsvService } from '../../services/csv.service';
import { TipoActivo } from '../../models/tipo-activo.model';
import { Activo, EstadoActivo } from '../../models/activo.model';
import { normalizarString, compararStrings } from '../../utils/string.utils';

interface ActivoConPersona extends Activo {
  personaAsignada?: string;
}

@Component({
  selector: 'app-activos',
  templateUrl: './activos.component.html',
  styleUrls: ['./activos.component.css']
})
export class ActivosComponent implements OnInit, AfterViewChecked {
  activos: Activo[] = [];
  activosEnriquecidos: ActivoConPersona[] = [];
  activosFiltrados: ActivoConPersona[] = [];
  tipos: TipoActivo[] = [];
  mostrarModal = false;
  mostrarModalAsignar = false;
  mostrarModalBaja = false;
  activoEditando: Activo | null = null;
  activoAsignando: Activo | null = null;
  activoBaja: Activo | null = null;
  mostrarBajas = false;
  filtroBusqueda = '';
  private debeEnfocar = '';
  private campoEnfocar: string | null = null;

  @ViewChild('inputTipo') inputTipo!: ElementRef;
  @ViewChild('inputPersona') inputPersona!: ElementRef;
  @ViewChild('inputMotivo') inputMotivo!: ElementRef;

  // Formulario
  tipoId: number | null = null;
  codigo = '';
  referencia = '';
  descripcion = '';
  area = '';
  responsable = '';
  fechaRevision = '';

  // Asignación
  personaAsignacion = '';
  fechaDevolucionPrevista = '';

  // Baja
  motivoBaja = '';

  constructor(
    private activosService: ActivosService,
    private csvService: CsvService
  ) {}

  ngOnInit(): void {
    this.cargarTipos();
    this.cargarActivos();
  }

  ngAfterViewChecked(): void {
    if (this.campoEnfocar) {
      setTimeout(() => {
        if (this.campoEnfocar === 'tipo' && this.inputTipo) {
          this.inputTipo.nativeElement.focus();
        } else if (this.campoEnfocar === 'persona' && this.inputPersona) {
          this.inputPersona.nativeElement.focus();
        } else if (this.campoEnfocar === 'motivo' && this.inputMotivo) {
          this.inputMotivo.nativeElement.focus();
        }
        this.campoEnfocar = null;
      }, 0);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    // Hotkey Shift+A para añadir (solo si no hay modal abierto)
    if (event.shiftKey && event.key === 'A' && !this.mostrarModal && !this.mostrarModalAsignar && !this.mostrarModalBaja) {
      // Permitir si no está en un input/textarea/select
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
      if (!isInput) {
        event.preventDefault();
        this.abrirModalAnadir();
      }
    }
    if (event.key === 'Enter' && this.mostrarModal && !this.mostrarModalAsignar && !this.mostrarModalBaja) {
      event.preventDefault();
      this.guardar();
    }
    if (event.key === 'Enter' && this.mostrarModalAsignar) {
      event.preventDefault();
      this.guardarAsignacion();
    }
    if (event.key === 'Escape') {
      if (this.mostrarModal) this.cancelar();
      if (this.mostrarModalAsignar) this.cancelarAsignacion();
      if (this.mostrarModalBaja) this.cancelarBaja();
    }
  }

  cargarTipos(): void {
    this.activosService.getTipos().subscribe({
      next: (tipos) => {
        this.tipos = tipos;
      },
      error: (error) => {
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
        console.error('Error al cargar activos:', error);
      }
    });
  }

  enriquecerConPersonas(): void {
    this.activosService.getHistoricoCompleto().subscribe({
      next: (historico) => {
        const activosMap = new Map<number, ActivoConPersona>();
        
        this.activos.forEach(activo => {
          activosMap.set(activo.id!, { ...activo } as ActivoConPersona);
        });

        // Obtener la persona asignada más reciente para cada activo
        historico.forEach((h: any) => {
          if (h.activoId && !h.fechaDevolucion) {
            const activo = activosMap.get(h.activoId);
            if (activo) {
              activo.personaAsignada = h.persona;
            }
          }
        });

        // Guardar activos enriquecidos
        this.activosEnriquecidos = Array.from(activosMap.values());
        this.aplicarFiltro();
      },
      error: (error) => {
        console.error('Error al cargar histórico:', error);
        this.activosEnriquecidos = this.activos.map(a => ({ ...a } as ActivoConPersona));
        this.aplicarFiltro();
      }
    });
  }

  aplicarFiltro(): void {
    if (!this.filtroBusqueda.trim()) {
      // Si no hay filtro, mostrar todos los activos enriquecidos
      this.activosFiltrados = [...this.activosEnriquecidos];
    } else {
      const filtro = this.filtroBusqueda.toLowerCase().trim();
      // Filtrar sobre los activos enriquecidos
      this.activosFiltrados = this.activosEnriquecidos.filter(activo => 
        (activo.codigo?.toLowerCase().includes(filtro)) ||
        (activo.referencia?.toLowerCase().includes(filtro)) ||
        (activo.descripcion?.toLowerCase().includes(filtro)) ||
        (activo.tipoNombre?.toLowerCase().includes(filtro)) ||
        (activo.personaAsignada?.toLowerCase().includes(filtro))
      );
    }
  }

  toggleMostrarBajas(): void {
    this.mostrarBajas = !this.mostrarBajas;
    this.cargarActivos();
  }

  abrirModalAnadir(): void {
    if (this.tipos.length === 0) {
      alert('Debe crear al menos un tipo de activo antes de añadir activos.');
      return;
    }
    this.activoEditando = null;
    this.resetFormulario();
    this.mostrarModal = true;
    this.campoEnfocar = 'tipo';
  }

  abrirModalEditar(activo: Activo): void {
    if (activo.estado === EstadoActivo.Asignado) {
      alert('No se puede editar un activo que está asignado.');
      return;
    }
    this.activoEditando = { ...activo };
    this.tipoId = activo.tipoId;
    this.codigo = activo.codigo;
    this.referencia = activo.referencia;
    this.descripcion = activo.descripcion;
    this.area = activo.area;
    this.responsable = activo.responsable;
    this.fechaRevision = activo.fechaRevision;
    this.mostrarModal = true;
    this.campoEnfocar = 'tipo';
  }

  resetFormulario(): void {
    this.tipoId = null;
    this.codigo = '';
    this.referencia = '';
    this.descripcion = '';
    this.area = '';
    this.responsable = '';
    this.fechaRevision = '';
  }

  guardar(): void {
    if (!this.tipoId || !this.codigo.trim() || !this.referencia.trim()) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
    }

    const codigoTrimmed = this.codigo.trim();

    // Validar que no exista un código similar (sin distinguir mayúsculas, minúsculas o acentos)
    const codigoExiste = this.activos.some(a => 
      compararStrings(a.codigo, codigoTrimmed) && 
      (!this.activoEditando || a.id !== this.activoEditando.id)
    );

    if (codigoExiste) {
      alert('Ya existe un activo con un código similar. No se pueden tener códigos duplicados (sin distinguir mayúsculas, minúsculas o acentos).');
      return;
    }

    const activo: Activo = {
      tipoId: this.tipoId,
      codigo: codigoTrimmed,
      referencia: this.referencia.trim(),
      descripcion: this.descripcion.trim(),
      area: this.area.trim(),
      responsable: this.responsable.trim(),
      fechaRevision: this.fechaRevision,
      estado: EstadoActivo.Disponible
    };

    if (this.activoEditando && this.activoEditando.id) {
      activo.id = this.activoEditando.id;
      activo.estado = this.activoEditando.estado;
      this.activosService.updateActivo(activo).subscribe({
        next: () => {
          this.cancelar();
          this.cargarActivos();
        },
        error: (error) => {
          console.error('Error al actualizar activo:', error);
          const errorMsg = error.error?.error || 'Error al actualizar el activo. Verifique que el código no esté duplicado.';
          alert(errorMsg);
        }
      });
    } else {
      this.activosService.addActivo(activo).subscribe({
        next: () => {
          this.cancelar();
          this.cargarActivos();
        },
        error: (error) => {
          console.error('Error al añadir activo:', error);
          const errorMsg = error.error?.error || 'Error al añadir el activo. Verifique que el código no esté duplicado.';
          alert(errorMsg);
        }
      });
    }
  }

  cancelar(): void {
    this.mostrarModal = false;
    this.activoEditando = null;
    this.resetFormulario();
    this.campoEnfocar = null;
    // Quitar el foco de cualquier elemento después de un breve delay
    setTimeout(() => {
      if (document.activeElement && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 100);
  }

  eliminar(activo: Activo): void {
    if (activo.estado === EstadoActivo.Asignado) {
      alert('No se puede eliminar un activo que está asignado.');
      return;
    }
    if (confirm(`¿Está seguro de eliminar el activo "${activo.codigo}"?`)) {
      if (activo.id) {
        this.activosService.deleteActivo(activo.id).subscribe({
          next: () => {
            this.cargarActivos();
          },
          error: (error) => {
            console.error('Error al eliminar activo:', error);
            alert('Error al eliminar el activo.');
          }
        });
      }
    }
  }

  abrirModalAsignar(activo: Activo): void {
    if (activo.estado !== EstadoActivo.Disponible) {
      alert('Solo se pueden asignar activos disponibles.');
      return;
    }
    this.activoAsignando = activo;
    this.personaAsignacion = '';
    this.fechaDevolucionPrevista = '';
    this.mostrarModalAsignar = true;
    this.campoEnfocar = 'persona';
  }

  guardarAsignacion(): void {
    if (!this.personaAsignacion.trim() || !this.fechaDevolucionPrevista) {
      alert('Por favor complete todos los campos.');
      return;
    }

    // Validar que la fecha de devolución prevista sea superior a la fecha actual
    const fechaActual = new Date();
    fechaActual.setHours(0, 0, 0, 0);
    const fechaDevolucion = new Date(this.fechaDevolucionPrevista);
    fechaDevolucion.setHours(0, 0, 0, 0);

    if (fechaDevolucion <= fechaActual) {
      alert('La fecha de devolución prevista debe ser superior a la fecha actual.');
      return;
    }

    if (this.activoAsignando && this.activoAsignando.id) {
      this.activosService.asignarActivo(
        this.activoAsignando.id,
        this.personaAsignacion.trim(),
        this.fechaDevolucionPrevista
      ).subscribe({
        next: () => {
          this.cargarActivos();
          this.cancelarAsignacion();
        },
        error: (error) => {
          console.error('Error al asignar activo:', error);
          const errorMsg = error.error?.error || 'Error al asignar el activo.';
          alert(errorMsg);
        }
      });
    }
  }

  cancelarAsignacion(): void {
    this.mostrarModalAsignar = false;
    this.activoAsignando = null;
    this.personaAsignacion = '';
    this.fechaDevolucionPrevista = '';
    this.campoEnfocar = null;
    // Quitar el foco de cualquier elemento después de un breve delay
    setTimeout(() => {
      if (document.activeElement && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 100);
  }

  abrirModalBaja(activo: Activo): void {
    if (activo.estado === EstadoActivo.Asignado) {
      alert('No se puede dar de baja un activo que está asignado.');
      return;
    }
    if (activo.estado === EstadoActivo.Baja) {
      alert('Este activo ya está dado de baja.');
      return;
    }
    this.activoBaja = activo;
    this.motivoBaja = '';
    this.mostrarModalBaja = true;
    this.campoEnfocar = 'motivo';
  }

  guardarBaja(): void {
    if (!this.motivoBaja.trim()) {
      alert('Por favor indique el motivo de la baja.');
      return;
    }

    if (this.activoBaja && this.activoBaja.id) {
      this.activosService.darBajaActivo(this.activoBaja.id, this.motivoBaja.trim()).subscribe({
        next: () => {
          this.cargarActivos();
          this.cancelarBaja();
        },
        error: (error) => {
          console.error('Error al dar de baja activo:', error);
          const errorMsg = error.error?.error || 'Error al dar de baja el activo.';
          alert(errorMsg);
        }
      });
    }
  }

  cancelarBaja(): void {
    this.mostrarModalBaja = false;
    this.activoBaja = null;
    this.motivoBaja = '';
    this.campoEnfocar = null;
    // Quitar el foco de cualquier elemento después de un breve delay
    setTimeout(() => {
      if (document.activeElement && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 100);
  }

  devolver(activo: Activo): void {
    if (activo.estado !== EstadoActivo.Asignado) {
      alert('Solo se pueden devolver activos asignados.');
      return;
    }

    if (activo.id) {
      this.activosService.devolverActivo(activo.id).subscribe({
        next: () => {
          this.cargarActivos();
        },
        error: (error) => {
          console.error('Error al devolver activo:', error);
          const errorMsg = error.error?.error || 'Error al devolver el activo.';
          alert(errorMsg);
        }
      });
    }
  }

  exportarCsv(): void {
    const headers = ['ID', 'Tipo', 'Código', 'Referencia', 'Descripción', 'Área', 'Responsable', 'Fecha Revisión', 'Estado'];
    const data = this.activos.map(a => ({
      'ID': a.id || '',
      'Tipo': a.tipoNombre || '',
      'Código': a.codigo,
      'Referencia': a.referencia,
      'Descripción': a.descripcion,
      'Área': a.area,
      'Responsable': a.responsable,
      'Fecha Revisión': a.fechaRevision,
      'Estado': a.estado
    }));
    this.csvService.exportToCsv(data, 'activos.csv', headers);
  }

  importarCsv(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.csvService.importFromCsv(file).then((data) => {
          data.forEach((item: any) => {
            const tipoNombre = item['Tipo'] || item['tipo'] || '';
            const tipo = this.tipos.find(t => t.nombre === tipoNombre);
            
            if (tipo && tipo.id) {
              const activo: Activo = {
                tipoId: tipo.id,
                codigo: item['Código'] || item['codigo'] || '',
                referencia: item['Referencia'] || item['referencia'] || '',
                descripcion: item['Descripción'] || item['descripcion'] || '',
                area: item['Área'] || item['area'] || '',
                responsable: item['Responsable'] || item['responsable'] || '',
                fechaRevision: item['Fecha Revisión'] || item['fechaRevision'] || '',
                estado: EstadoActivo.Disponible
              };
              
              if (activo.codigo) {
                this.activosService.addActivo(activo).subscribe({
                  next: () => {
                    this.cargarActivos();
                  },
                  error: (error) => {
                    console.error('Error al importar activo:', error);
                  }
                });
              }
            }
          });
        }).catch((error) => {
          console.error('Error al importar CSV:', error);
          alert('Error al importar el archivo CSV');
        });
      }
    };
    input.click();
  }

  getEstadoClass(estado: EstadoActivo): string {
    switch (estado) {
      case EstadoActivo.Disponible:
        return 'badge-disponible';
      case EstadoActivo.Asignado:
        return 'badge-asignado';
      case EstadoActivo.Baja:
        return 'badge-baja';
      default:
        return '';
    }
  }
}

