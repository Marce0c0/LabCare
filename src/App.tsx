import React, { useState, useEffect, useMemo } from 'react';
import { Equipo, Solicitud, Prioridad, EstadoSolicitud } from './types/labcare';
import { LabCareApi } from './services/api';
import {
  ComputerIcon,
  ProjectorIcon,
  RouterIcon,
  PrinterIcon,
  SearchIcon,
  FilterIcon,
  PlusIcon,
  EyeIcon,
  EditIcon,
  TransitionIcon,
  TrashIcon,
  CheckIcon,
  AlertCircleIcon,
  XIcon,
  ClockIcon,
  ShieldCheckIcon,
  getEquipmentIcon
} from './components/Icons';
import './styles/labcare.css';

interface ToastItem {
  id: number;
  tipo: 'success' | 'error' | 'warning';
  texto: string;
}

export function App() {
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPrioridad, setFilterPrioridad] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // Formulario nuevo
  const [nuevoEquipoId, setNuevoEquipoId] = useState<number>(1);
  const [nuevoSolicitante, setNuevoSolicitante] = useState('');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [nuevaPrioridad, setNuevaPrioridad] = useState<Prioridad>('MEDIA');
  const [guardando, setGuardando] = useState(false);

  // Modales
  const [detalleModal, setDetalleModal] = useState<Solicitud | null>(null);
  const [editarModal, setEditarModal] = useState<Solicitud | null>(null);
  const [estadoModal, setEstadoModal] = useState<Solicitud | null>(null);
  const [deleteModal, setDeleteModal] = useState<Solicitud | null>(null);

  // Estados de edición
  const [editSolicitante, setEditSolicitante] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editPrioridad, setEditPrioridad] = useState<Prioridad>('MEDIA');

  // Estado destino
  const [targetEstado, setTargetEstado] = useState<EstadoSolicitud>('EN_PROCESO');

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const notificar = (texto: string, tipo: 'success' | 'error' | 'warning' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, tipo, texto }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const cargarEquipos = async () => {
    try {
      const data = await LabCareApi.getEquipos();
      setEquipos(data);
      if (data.length > 0) setNuevoEquipoId(data[0].id);
    } catch (e: any) {
      notificar(e.message || 'Error cargando equipos', 'error');
    }
  };

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      const data = await LabCareApi.getSolicitudes(searchTerm, filterPrioridad, filterEstado);
      setSolicitudes(data);
    } catch (e: any) {
      notificar(e.message || 'Error cargando solicitudes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEquipos();
  }, []);

  useEffect(() => {
    cargarSolicitudes();
  }, [searchTerm, filterPrioridad, filterEstado]);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    const sol = nuevoSolicitante.trim();
    const desc = nuevaDescripcion.trim();

    if (sol.length < 3) {
      notificar('El nombre del solicitante debe tener al menos 3 caracteres.', 'warning');
      return;
    }
    if (desc.length < 10) {
      notificar('La descripción debe tener al menos 10 caracteres explicativos.', 'warning');
      return;
    }

    try {
      setGuardando(true);
      const resp = await LabCareApi.crearSolicitud({
        equipo_id: Number(nuevoEquipoId),
        solicitante: sol,
        descripcion: desc,
        prioridad: nuevaPrioridad
      });
      notificar(resp.message || 'Solicitud registrada correctamente', 'success');
      setNuevoSolicitante('');
      setNuevaDescripcion('');
      setNuevaPrioridad('MEDIA');
      cargarSolicitudes();
    } catch (err: any) {
      notificar(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const abrirEditar = (s: Solicitud) => {
    setEditarModal(s);
    setEditSolicitante(s.solicitante);
    setEditDescripcion(s.descripcion);
    setEditPrioridad(s.prioridad);
  };

  const handleGuardarEdicion = async () => {
    if (!editarModal) return;
    if (editSolicitante.trim().length < 3) {
      notificar('El solicitante debe tener al menos 3 caracteres.', 'warning');
      return;
    }
    if (editDescripcion.trim().length < 10) {
      notificar('La descripción debe tener al menos 10 caracteres.', 'warning');
      return;
    }

    try {
      const resp = await LabCareApi.actualizarSolicitud(editarModal.id, {
        solicitante: editSolicitante.trim(),
        descripcion: editDescripcion.trim(),
        prioridad: editPrioridad
      });
      notificar(resp.message || 'Solicitud actualizada', 'success');
      setEditarModal(null);
      cargarSolicitudes();
    } catch (err: any) {
      notificar(err.message, 'error');
    }
  };

  const abrirCambioEstado = (s: Solicitud) => {
    setEstadoModal(s);
    if (s.estado === 'PENDIENTE') setTargetEstado('EN_PROCESO');
    else if (s.estado === 'EN_PROCESO') setTargetEstado('RESUELTA');
    else setTargetEstado(s.estado);
  };

  const handleGuardarEstado = async () => {
    if (!estadoModal) return;
    try {
      const resp = await LabCareApi.cambiarEstado(estadoModal.id, targetEstado);
      notificar(resp.message || 'Estado actualizado', 'success');
      setEstadoModal(null);
      cargarSolicitudes();
    } catch (err: any) {
      notificar(err.message, 'error');
    }
  };

  const handleConfirmarBaja = async () => {
    if (!deleteModal) return;
    try {
      const msg = await LabCareApi.eliminarLogico(deleteModal.id);
      notificar(msg, 'success');
      setDeleteModal(null);
      cargarSolicitudes();
    } catch (err: any) {
      notificar(err.message, 'error');
    }
  };

  const stats = useMemo(() => {
    return {
      total: solicitudes.length,
      pendientes: solicitudes.filter(s => s.estado === 'PENDIENTE').length,
      enProceso: solicitudes.filter(s => s.estado === 'EN_PROCESO').length,
      resueltas: solicitudes.filter(s => s.estado === 'RESUELTA').length
    };
  }, [solicitudes]);

  const getTransicionesValidas = (actual: EstadoSolicitud): EstadoSolicitud[] => {
    switch (actual) {
      case 'PENDIENTE': return ['EN_PROCESO', 'CANCELADA'];
      case 'EN_PROCESO': return ['RESUELTA', 'CANCELADA'];
      default: return [];
    }
  };

  const formatearFecha = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('es-BO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="labcare-shell">
      {/* Toasts */}
      <div className="toast-anchor">
        {toasts.map(t => (
          <div key={t.id} className={`toast-box toast-${t.tipo}`}>
            {t.tipo === 'success' && <CheckIcon size={16} />}
            {t.tipo === 'error' && <AlertCircleIcon size={16} />}
            {t.tipo === 'warning' && <AlertCircleIcon size={16} />}
            <span>{t.texto}</span>
          </div>
        ))}
      </div>

      {/* Navbar Superior */}
      <header className="labcare-navbar">
        <div className="nav-brand">
          <div className="nav-logo-badge">LC</div>
          <div className="nav-titles">
            <h1>LabCare · Gestión de Mantenimiento</h1>
            <p>Módulo de Control y Seguimiento de Equipos de Laboratorio</p>
          </div>
        </div>
        <div className="nav-meta">
          <span className="meta-pill">
            <ShieldCheckIcon size={14} /> UPDS · DSII
          </span>
          <span className="meta-pill">
            <ClockIcon size={14} /> SQLite ANSI
          </span>
        </div>
      </header>

      {/* Tira de Métricas Integrada */}
      <section className="metric-strip">
        <div className="metric-cell">
          <div className="metric-header">
            <span>Total Activas</span>
            <ComputerIcon size={14} />
          </div>
          <div className="metric-value">{stats.total}</div>
        </div>
        <div className="metric-cell">
          <div className="metric-header">
            <span>Pendientes</span>
            <ClockIcon size={14} />
          </div>
          <div className="metric-value" style={{ color: '#1d4ed8' }}>{stats.pendientes}</div>
        </div>
        <div className="metric-cell">
          <div className="metric-header">
            <span>En Proceso</span>
            <TransitionIcon size={14} />
          </div>
          <div className="metric-value" style={{ color: '#d97706' }}>{stats.enProceso}</div>
        </div>
        <div className="metric-cell">
          <div className="metric-header">
            <span>Resueltas</span>
            <CheckIcon size={14} />
          </div>
          <div className="metric-value" style={{ color: '#059669' }}>{stats.resueltas}</div>
        </div>
      </section>

      {/* Workspace Principal */}
      <main className="workspace-grid">
        {/* Formulario de Registro */}
        <section className="surface-panel">
          <div className="panel-heading">
            <h2>Nueva Solicitud de Falla</h2>
            <PlusIcon size={15} />
          </div>
          <div className="panel-content">
            <form onSubmit={handleCrear}>
              <div className="field-group">
                <label className="field-label" htmlFor="equipo-select">
                  <span>Equipo Afectado</span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Catálogo BD</span>
                </label>
                <select
                  id="equipo-select"
                  className="field-select"
                  value={nuevoEquipoId}
                  onChange={e => setNuevoEquipoId(Number(e.target.value))}
                  required
                >
                  {equipos.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.codigo} · {eq.nombre} ({eq.ubicacion})
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="solicitante-input">
                  <span>Solicitante</span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Mín. 3 caracteres</span>
                </label>
                <input
                  id="solicitante-input"
                  type="text"
                  className="field-input"
                  placeholder="Nombre y apellido del responsable"
                  value={nuevoSolicitante}
                  onChange={e => setNuevoSolicitante(e.target.value)}
                  required
                />
                <div className="field-footer">
                  <span>Longitud actual</span>
                  <span>{nuevoSolicitante.trim().length} chars</span>
                </div>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="descripcion-input">
                  <span>Descripción del Problema</span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Mín. 10 caracteres</span>
                </label>
                <textarea
                  id="descripcion-input"
                  className="field-textarea"
                  placeholder="Detalle la falla observada en el equipo..."
                  value={nuevaDescripcion}
                  onChange={e => setNuevaDescripcion(e.target.value)}
                  required
                />
                <div className="field-footer">
                  <span>Longitud actual</span>
                  <span>{nuevaDescripcion.trim().length} chars</span>
                </div>
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="prioridad-select">
                  <span>Nivel de Prioridad</span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Catálogo</span>
                </label>
                <select
                  id="prioridad-select"
                  className="field-select"
                  value={nuevaPrioridad}
                  onChange={e => setNuevaPrioridad(e.target.value as Prioridad)}
                >
                  <option value="BAJA">BAJA</option>
                  <option value="MEDIA">MEDIA</option>
                  <option value="ALTA">ALTA</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn-ui btn-solid-primary btn-fullwidth"
                disabled={guardando}
              >
                <PlusIcon size={14} />
                <span>{guardando ? 'Guardando...' : 'Registrar Solicitud'}</span>
              </button>
            </form>
          </div>
        </section>

        {/* Tabla y Filtros */}
        <section className="surface-panel">
          <div className="panel-heading">
            <h2>Bandeja de Control de Mantenimiento</h2>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {solicitudes.length} registros
            </span>
          </div>
          <div className="panel-content">
            {/* Toolbar de Filtros */}
            <div className="filter-toolbar">
              <div className="input-with-icon">
                <SearchIcon size={15} />
                <input
                  type="text"
                  className="field-input"
                  placeholder="Filtrar por código, solicitante o equipo..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="field-select"
                value={filterPrioridad}
                onChange={e => setFilterPrioridad(e.target.value)}
              >
                <option value="">Todas las Prioridades</option>
                <option value="BAJA">BAJA</option>
                <option value="MEDIA">MEDIA</option>
                <option value="ALTA">ALTA</option>
              </select>
              <select
                className="field-select"
                value={filterEstado}
                onChange={e => setFilterEstado(e.target.value)}
              >
                <option value="">Todos los Estados</option>
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="EN_PROCESO">EN_PROCESO</option>
                <option value="RESUELTA">RESUELTA</option>
                <option value="CANCELADA">CANCELADA</option>
              </select>
            </div>

            {/* Tabla */}
            <div className="table-viewport">
              <table className="op-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Equipo Asignado</th>
                    <th>Solicitante</th>
                    <th>Prioridad</th>
                    <th>Estado</th>
                    <th>Fecha Registro</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '28px', color: '#64748b' }}>
                        Consultando registros relacionales...
                      </td>
                    </tr>
                  ) : solicitudes.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                        No existen solicitudes activas con los filtros especificados.
                      </td>
                    </tr>
                  ) : (
                    solicitudes.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>
                          {s.codigo_solicitud}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#64748b' }}>
                              {getEquipmentIcon(s.equipo_codigo, 15)}
                            </span>
                            <div>
                              <div style={{ fontWeight: 500 }}>{s.equipo_nombre}</div>
                              <div style={{ fontSize: '0.7188rem', color: '#64748b' }}>
                                {s.equipo_codigo} · {s.equipo_ubicacion}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{s.solicitante}</td>
                        <td>
                          <span className={`prio-pill prio-${s.prioridad.toLowerCase()}`}>
                            {s.prioridad}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill status-${s.estado.toLowerCase()}`}>
                            <span className="status-dot"></span>
                            {s.estado.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {formatearFecha(s.fecha_registro)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="icon-action-btn"
                              title="Ver Ficha Técnica"
                              onClick={() => setDetalleModal(s)}
                            >
                              <EyeIcon size={14} />
                            </button>
                            <button
                              type="button"
                              className="icon-action-btn"
                              title="Editar Datos"
                              onClick={() => abrirEditar(s)}
                            >
                              <EditIcon size={14} />
                            </button>
                            <button
                              type="button"
                              className="icon-action-btn"
                              title="Cambiar Estado"
                              onClick={() => abrirCambioEstado(s)}
                            >
                              <TransitionIcon size={14} />
                            </button>
                            <button
                              type="button"
                              className="icon-action-btn btn-trash"
                              title="Baja Lógica"
                              onClick={() => setDeleteModal(s)}
                            >
                              <TrashIcon size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* Modal: Detalle Completo */}
      {detalleModal && (
        <div className="modal-backdrop" onClick={() => setDetalleModal(null)}>
          <div className="modal-window" onClick={e => e.stopPropagation()}>
            <div className="modal-title-bar">
              <h3>
                <EyeIcon size={16} /> Ficha Técnica · {detalleModal.codigo_solicitud}
              </h3>
              <button
                type="button"
                className="icon-action-btn"
                onClick={() => setDetalleModal(null)}
              >
                <XIcon size={14} />
              </button>
            </div>
            <div className="modal-content-area">
              <div className="kv-row">
                <span className="kv-key">Identificador ID:</span>
                <span className="kv-val">{detalleModal.id}</span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Código Único:</span>
                <span className="kv-val">{detalleModal.codigo_solicitud}</span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Equipo Vinculado:</span>
                <span className="kv-val">
                  {detalleModal.equipo_codigo} - {detalleModal.equipo_nombre}
                </span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Ubicación Física:</span>
                <span className="kv-val">{detalleModal.equipo_ubicacion}</span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Solicitante:</span>
                <span className="kv-val">{detalleModal.solicitante}</span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Prioridad:</span>
                <span className="kv-val">
                  <span className={`prio-pill prio-${detalleModal.prioridad.toLowerCase()}`}>
                    {detalleModal.prioridad}
                  </span>
                </span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Estado Operativo:</span>
                <span className="kv-val">
                  <span className={`status-pill status-${detalleModal.estado.toLowerCase()}`}>
                    <span className="status-dot"></span>
                    {detalleModal.estado.replace('_', ' ')}
                  </span>
                </span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Fecha de Creación:</span>
                <span className="kv-val">{formatearFecha(detalleModal.fecha_registro)}</span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Última Actualización:</span>
                <span className="kv-val">{formatearFecha(detalleModal.fecha_actualizacion)}</span>
              </div>
              <div style={{ marginTop: '12px', fontSize: '0.8125rem' }}>
                <span style={{ fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                  Descripción de la Falla:
                </span>
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  color: '#0f172a',
                  lineHeight: 1.45
                }}>
                  {detalleModal.descripcion}
                </div>
              </div>
            </div>
            <div className="modal-action-bar">
              <button
                type="button"
                className="btn-ui btn-outline"
                onClick={() => setDetalleModal(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edición Descriptiva */}
      {editarModal && (
        <div className="modal-backdrop" onClick={() => setEditarModal(null)}>
          <div className="modal-window" onClick={e => e.stopPropagation()}>
            <div className="modal-title-bar">
              <h3>
                <EditIcon size={16} /> Editar Solicitud · {editarModal.codigo_solicitud}
              </h3>
              <button
                type="button"
                className="icon-action-btn"
                onClick={() => setEditarModal(null)}
              >
                <XIcon size={14} />
              </button>
            </div>
            <div className="modal-content-area">
              <div className="field-group">
                <label className="field-label">Equipo Asociado (Inmutable)</label>
                <input
                  type="text"
                  className="field-input"
                  value={`${editarModal.equipo_codigo} · ${editarModal.equipo_nombre}`}
                  disabled
                  style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                />
              </div>

              <div className="field-group">
                <label className="field-label">Nombre del Solicitante</label>
                <input
                  type="text"
                  className="field-input"
                  value={editSolicitante}
                  onChange={e => setEditSolicitante(e.target.value)}
                  required
                />
                <div className="field-footer">
                  <span>Mínimo 3 caracteres</span>
                  <span>{editSolicitante.trim().length} chars</span>
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Descripción del Problema</label>
                <textarea
                  className="field-textarea"
                  value={editDescripcion}
                  onChange={e => setEditDescripcion(e.target.value)}
                  required
                />
                <div className="field-footer">
                  <span>Mínimo 10 caracteres</span>
                  <span>{editDescripcion.trim().length} chars</span>
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Prioridad</label>
                <select
                  className="field-select"
                  value={editPrioridad}
                  onChange={e => setEditPrioridad(e.target.value as Prioridad)}
                >
                  <option value="BAJA">BAJA</option>
                  <option value="MEDIA">MEDIA</option>
                  <option value="ALTA">ALTA</option>
                </select>
              </div>
            </div>
            <div className="modal-action-bar">
              <button
                type="button"
                className="btn-ui btn-outline"
                onClick={() => setEditarModal(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-ui btn-solid-primary"
                onClick={handleGuardarEdicion}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cambio de Estado con Máquina de Estados */}
      {estadoModal && (
        <div className="modal-backdrop" onClick={() => setEstadoModal(null)}>
          <div className="modal-window" onClick={e => e.stopPropagation()}>
            <div className="modal-title-bar">
              <h3>
                <TransitionIcon size={16} /> Cambio de Estado · {estadoModal.codigo_solicitud}
              </h3>
              <button
                type="button"
                className="icon-action-btn"
                onClick={() => setEstadoModal(null)}
              >
                <XIcon size={14} />
              </button>
            </div>
            <div className="modal-content-area">
              <div className="kv-row">
                <span className="kv-key">Estado Actual:</span>
                <span className="kv-val">
                  <span className={`status-pill status-${estadoModal.estado.toLowerCase()}`}>
                    <span className="status-dot"></span>
                    {estadoModal.estado}
                  </span>
                </span>
              </div>

              {getTransicionesValidas(estadoModal.estado).length === 0 ? (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  padding: '12px',
                  borderRadius: '6px',
                  color: '#991b1b',
                  fontSize: '0.8125rem',
                  marginTop: '14px'
                }}>
                  Este registro se encuentra en un estado terminal ({estadoModal.estado}). Por regla de integridad, una solicitud finalizada no puede reabrirse.
                </div>
              ) : (
                <div className="field-group" style={{ marginTop: '14px' }}>
                  <label className="field-label">Seleccionar Nuevo Estado:</label>
                  <select
                    className="field-select"
                    value={targetEstado}
                    onChange={e => setTargetEstado(e.target.value as EstadoSolicitud)}
                  >
                    {getTransicionesValidas(estadoModal.estado).map(op => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                  <div className="field-footer">
                    <span>Transiciones permitidas: {getTransicionesValidas(estadoModal.estado).join(', ')}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-action-bar">
              <button
                type="button"
                className="btn-ui btn-outline"
                onClick={() => setEstadoModal(null)}
              >
                Cerrar
              </button>
              {getTransicionesValidas(estadoModal.estado).length > 0 && (
                <button
                  type="button"
                  className="btn-ui btn-solid-primary"
                  onClick={handleGuardarEstado}
                >
                  Aplicar Transición
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmación de Baja Lógica */}
      {deleteModal && (
        <div className="modal-backdrop" onClick={() => setDeleteModal(null)}>
          <div className="modal-window" onClick={e => e.stopPropagation()}>
            <div className="modal-title-bar">
              <h3 style={{ color: '#dc2626' }}>
                <AlertCircleIcon size={16} /> Confirmar Baja Lógica
              </h3>
              <button
                type="button"
                className="icon-action-btn"
                onClick={() => setDeleteModal(null)}
              >
                <XIcon size={14} />
              </button>
            </div>
            <div className="modal-content-area">
              <p style={{ fontSize: '0.875rem', marginBottom: '12px', color: '#0f172a' }}>
                ¿Desea dar de baja la solicitud <strong>{deleteModal.codigo_solicitud}</strong>?
              </p>
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                padding: '12px',
                borderRadius: '6px',
                color: '#92400e',
                fontSize: '0.8125rem'
              }}>
                <strong>Regla de negocio RF-06:</strong> No se ejecuta borrado físico. El registro se desactiva (<code>activo = 0</code>) y deja de aparecer en el listado activo, conservando su trazabilidad en base de datos.
              </div>
            </div>
            <div className="modal-action-bar">
              <button
                type="button"
                className="btn-ui btn-outline"
                onClick={() => setDeleteModal(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-ui btn-solid-danger"
                onClick={handleConfirmarBaja}
              >
                Confirmar Baja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
