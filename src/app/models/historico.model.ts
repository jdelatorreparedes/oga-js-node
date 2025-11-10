export interface HistoricoAsignacion {
  id?: number;
  activoId: number;
  activoCodigo?: string;
  activoReferencia?: string;
  persona: string;
  fechaAsignacion: string;
  fechaDevolucionPrevista: string;
  fechaDevolucion?: string;
}

