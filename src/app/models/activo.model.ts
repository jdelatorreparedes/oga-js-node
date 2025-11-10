export enum EstadoActivo {
  Disponible = 'Disponible',
  Asignado = 'Asignado',
  Baja = 'Baja'
}

export interface Activo {
  id?: number;
  tipoId: number;
  tipoNombre?: string;
  codigo: string;
  referencia: string;
  descripcion: string;
  marca?: string;
  detalles?: string;
  area: string;
  responsable: string;
  fechaRevision: string;
  estado: EstadoActivo;
  motivoBaja?: string;
}

