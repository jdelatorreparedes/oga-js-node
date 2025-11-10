import { Component, OnInit, HostListener, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ActivosService } from '../../services/activos.service';
import { CsvService } from '../../services/csv.service';
import { TipoActivo } from '../../models/tipo-activo.model';
import { compararStrings } from '../../utils/string.utils';

@Component({
  selector: 'app-tipos',
  templateUrl: './tipos.component.html',
  styleUrls: ['./tipos.component.css']
})
export class TiposComponent implements OnInit, AfterViewChecked {
  tipos: TipoActivo[] = [];
  tiposFiltrados: TipoActivo[] = [];
  mostrarModal = false;
  tipoEditando: TipoActivo | null = null;
  nombreTipo = '';
  filtroBusqueda = '';
  guardando = false;
  private debeEnfocar = false;

  @ViewChild('inputNombre') inputNombre!: ElementRef;

  constructor(
    private activosService: ActivosService,
    private csvService: CsvService
  ) {}

  ngOnInit(): void {
    this.cargarTipos();
  }

  ngAfterViewChecked(): void {
    if (this.debeEnfocar && this.inputNombre) {
      setTimeout(() => {
        this.inputNombre.nativeElement.focus();
        this.debeEnfocar = false;
      }, 0);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    // Hotkey Shift+A para añadir (solo si no hay modal abierto)
    if (event.shiftKey && event.key === 'A' && !this.mostrarModal) {
      // Permitir si no está en un input/textarea/select
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
      if (!isInput) {
        event.preventDefault();
        this.abrirModalAnadir();
      }
    }
    if (event.key === 'Enter' && this.mostrarModal && !this.guardando) {
      event.preventDefault();
      this.guardar();
    }
    if (event.key === 'Escape' && this.mostrarModal) {
      this.cancelar();
    }
  }

  cargarTipos(): void {
    this.activosService.getTipos().subscribe({
      next: (tipos) => {
        this.tipos = tipos;
        this.aplicarFiltro();
      },
      error: (error) => {
        console.error('Error al cargar tipos:', error);
      }
    });
  }

  aplicarFiltro(): void {
    if (!this.filtroBusqueda.trim()) {
      this.tiposFiltrados = this.tipos;
    } else {
      const filtro = this.filtroBusqueda.toLowerCase().trim();
      this.tiposFiltrados = this.tipos.filter(tipo => 
        tipo.nombre.toLowerCase().includes(filtro)
      );
    }
  }

  abrirModalAnadir(): void {
    this.tipoEditando = null;
    this.nombreTipo = '';
    this.mostrarModal = true;
    this.debeEnfocar = true;
  }

  abrirModalEditar(tipo: TipoActivo): void {
    this.tipoEditando = { ...tipo };
    this.nombreTipo = tipo.nombre;
    this.mostrarModal = true;
    this.debeEnfocar = true;
  }

  guardar(): void {
    if (this.guardando) {
      return; // Prevenir doble ejecución
    }

    if (!this.nombreTipo.trim()) {
      return;
    }

    const nombreTrimmed = this.nombreTipo.trim();

    // Validar nombre único (sin distinguir mayúsculas, minúsculas o acentos)
    const nombreExiste = this.tipos.some(t => 
      compararStrings(t.nombre, nombreTrimmed) && 
      (!this.tipoEditando || t.id !== this.tipoEditando.id)
    );

    if (nombreExiste) {
      alert('Ya existe un tipo con un nombre similar. No se pueden tener nombres duplicados (sin distinguir mayúsculas, minúsculas o acentos).');
      return;
    }

    this.guardando = true;

    if (this.tipoEditando) {
      this.tipoEditando.nombre = nombreTrimmed;
      this.activosService.updateTipo(this.tipoEditando).subscribe({
        next: () => {
          this.guardando = false;
          this.cargarTipos();
          this.cancelar();
        },
        error: (error) => {
          console.error('Error al actualizar tipo:', error);
          const errorMsg = error.error?.error || 'Error al actualizar el tipo.';
          alert(errorMsg);
          this.guardando = false;
        }
      });
    } else {
      const nuevoTipo: TipoActivo = {
        nombre: nombreTrimmed
      };
      this.activosService.addTipo(nuevoTipo).subscribe({
        next: () => {
          this.guardando = false;
          this.cargarTipos();
          this.cancelar();
        },
        error: (error) => {
          console.error('Error al añadir tipo:', error);
          const errorMsg = error.error?.error || 'Error al añadir el tipo.';
          alert(errorMsg);
          this.guardando = false;
        }
      });
    }
  }

  cancelar(): void {
    this.mostrarModal = false;
    this.tipoEditando = null;
    this.nombreTipo = '';
    this.guardando = false;
    this.debeEnfocar = false;
    // Quitar el foco de cualquier elemento después de un breve delay
    setTimeout(() => {
      if (document.activeElement && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 100);
  }

  eliminar(tipo: TipoActivo): void {
    if (confirm(`¿Está seguro de eliminar el tipo "${tipo.nombre}"?`)) {
      if (tipo.id) {
        this.activosService.deleteTipo(tipo.id).subscribe({
          next: () => {
            this.cargarTipos();
          },
          error: (error) => {
            console.error('Error al eliminar tipo:', error);
            const errorMsg = error.error?.error || 'No se puede eliminar el tipo porque está siendo utilizado por algún activo.';
            alert(errorMsg);
          }
        });
      }
    }
  }

  exportarCsv(): void {
    const headers = ['Nombre'];
    const data = this.tiposFiltrados.map(t => ({
      'Nombre': t.nombre
    }));
    this.csvService.exportToCsv(data, 'tipos-activos.csv', headers);
  }

  importarCsv(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.csvService.importFromCsv(file).then((data) => {
          const tiposAAñadir: TipoActivo[] = [];
          let omitidos = 0;
          
          // Primero, identificar qué tipos son nuevos
          data.forEach((item: any) => {
            const nombreTipo = (item['Nombre'] || item['nombre'] || '').trim();
            
            if (!nombreTipo) {
              return;
            }

            // Verificar si ya existe un tipo con nombre similar (sin distinguir mayúsculas, minúsculas o acentos)
            const tipoExiste = this.tipos.some(t => compararStrings(t.nombre, nombreTipo));

            if (tipoExiste) {
              omitidos++;
            } else {
              tiposAAñadir.push({ nombre: nombreTipo });
            }
          });

          // Añadir todos los tipos nuevos
          if (tiposAAñadir.length === 0) {
            if (omitidos > 0) {
              alert(`Importación completada:\n- Tipos añadidos: 0\n- Tipos omitidos (ya existían): ${omitidos}`);
            } else {
              alert('No se encontraron tipos válidos en el archivo CSV.');
            }
            return;
          }

          let añadidos = 0;
          let errores = 0;
          const total = tiposAAñadir.length;

          tiposAAñadir.forEach((tipo, index) => {
            this.activosService.addTipo(tipo).subscribe({
              next: () => {
                añadidos++;
                if (añadidos + errores === total) {
                  this.cargarTipos();
                  alert(`Importación completada:\n- Tipos añadidos: ${añadidos}\n- Tipos omitidos (ya existían): ${omitidos}${errores > 0 ? `\n- Errores: ${errores}` : ''}`);
                }
              },
              error: (error) => {
                console.error('Error al importar tipo:', error);
                errores++;
                if (añadidos + errores === total) {
                  this.cargarTipos();
                  alert(`Importación completada:\n- Tipos añadidos: ${añadidos}\n- Tipos omitidos (ya existían): ${omitidos}${errores > 0 ? `\n- Errores: ${errores}` : ''}`);
                }
              }
            });
          });
        }).catch((error) => {
          console.error('Error al importar CSV:', error);
          alert('Error al importar el archivo CSV');
        });
      }
    };
    input.click();
  }
}

