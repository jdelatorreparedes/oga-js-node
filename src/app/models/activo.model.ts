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
  fechaAlta?: string; // Fecha en que se dio de alta el activo
  estado: EstadoActivo;
  motivoBaja?: string;
}

