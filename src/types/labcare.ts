export type Prioridad = 'BAJA' | 'MEDIA' | 'ALTA';
export type EstadoSolicitud = 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTA' | 'CANCELADA';

export interface Equipo {
  id: number;
  codigo: string;
  nombre: string;
  ubicacion: string;
  estado: string;
}

export interface Solicitud {
  id: number;
  codigo_solicitud: string;
  equipo_id: number;
  equipo_codigo?: string;
  equipo_nombre?: string;
  equipo_ubicacion?: string;
  solicitante: string;
  descripcion: string;
  prioridad: Prioridad;
  estado: EstadoSolicitud;
  fecha_registro: string;
  fecha_actualizacion: string;
  activo: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
