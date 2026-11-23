import { Equipo, Solicitud, ApiResponse, Prioridad, EstadoSolicitud } from '../types/labcare';

const API_BASE = ''; // Usa el proxy de Vite o ruta relativa

export const LabCareApi = {
  async getEquipos(): Promise<Equipo[]> {
    const res = await fetch(`${API_BASE}/equipos`);
    const data: ApiResponse<Equipo[]> = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al obtener equipos');
    return data.data || [];
  },

  async getSolicitudes(search = '', prioridad = '', estado = ''): Promise<Solicitud[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (prioridad) params.append('prioridad', prioridad);
    if (estado) params.append('estado', estado);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/solicitudes${query}`);
    const data: ApiResponse<Solicitud[]> = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al obtener solicitudes');
    return data.data || [];
  },

  async getSolicitudById(id: number): Promise<Solicitud> {
    const res = await fetch(`${API_BASE}/solicitudes/${id}`);
    const data: ApiResponse<Solicitud> = await res.json();
    if (!res.ok) throw new Error(data.message || 'Solicitud no encontrada');
    return data.data!;
  },

  async crearSolicitud(payload: {
    equipo_id: number;
    solicitante: string;
    descripcion: string;
    prioridad: Prioridad;
  }): Promise<{ message: string; data: Solicitud }> {
    const res = await fetch(`${API_BASE}/solicitudes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data: ApiResponse<Solicitud> = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al registrar solicitud');
    return { message: data.message!, data: data.data! };
  },

  async actualizarSolicitud(
    id: number,
    payload: { solicitante: string; descripcion: string; prioridad: Prioridad }
  ): Promise<{ message: string; data: Solicitud }> {
    const res = await fetch(`${API_BASE}/solicitudes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data: ApiResponse<Solicitud> = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al actualizar solicitud');
    return { message: data.message!, data: data.data! };
  },

  async cambiarEstado(
    id: number,
    nuevoEstado: EstadoSolicitud
  ): Promise<{ message: string; data: Solicitud }> {
    const res = await fetch(`${API_BASE}/solicitudes/${id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevoEstado })
    });
    const data: ApiResponse<Solicitud> = await res.json();
    if (!res.ok) throw new Error(data.message || 'Transición de estado rechazada');
    return { message: data.message!, data: data.data! };
  },

  async eliminarLogico(id: number): Promise<string> {
    const res = await fetch(`${API_BASE}/solicitudes/${id}`, {
      method: 'DELETE'
    });
    const data: ApiResponse<null> = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al eliminar la solicitud');
    return data.message || 'Solicitud eliminada lógicamente';
  }
};
