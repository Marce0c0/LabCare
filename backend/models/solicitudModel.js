import { db } from '../database.js';

export const SolicitudModel = {
  // RF-01, RF-07, RF-08: Listar solo activas con filtros y búsqueda
  findAll({ search = '', prioridad = '', estado = '' } = {}) {
    let sql = `
      SELECT 
        s.id,
        s.codigo_solicitud,
        s.equipo_id,
        e.codigo AS equipo_codigo,
        e.nombre AS equipo_nombre,
        e.ubicacion AS equipo_ubicacion,
        s.solicitante,
        s.descripcion,
        s.prioridad,
        s.estado,
        s.fecha_registro,
        s.fecha_actualizacion,
        s.activo
      FROM Solicitud s
      INNER JOIN Equipo e ON s.equipo_id = e.id
      WHERE s.activo = 1
    `;
    const params = [];

    if (search && search.trim() !== '') {
      sql += ` AND (
        LOWER(s.codigo_solicitud) LIKE LOWER(?) OR
        LOWER(s.solicitante) LIKE LOWER(?) OR
        LOWER(e.nombre) LIKE LOWER(?)
      )`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (prioridad && prioridad.trim() !== '') {
      sql += ` AND s.prioridad = ?`;
      params.push(prioridad.trim());
    }

    if (estado && estado.trim() !== '') {
      sql += ` AND s.estado = ?`;
      params.push(estado.trim());
    }

    sql += ` ORDER BY s.id DESC`;

    const stmt = db.prepare(sql);
    return stmt.all(...params);
  },

  // RF-03: Consultar por identificador con datos completos
  findById(id) {
    const sql = `
      SELECT 
        s.id,
        s.codigo_solicitud,
        s.equipo_id,
        e.codigo AS equipo_codigo,
        e.nombre AS equipo_nombre,
        e.ubicacion AS equipo_ubicacion,
        s.solicitante,
        s.descripcion,
        s.prioridad,
        s.estado,
        s.fecha_registro,
        s.fecha_actualizacion,
        s.activo
      FROM Solicitud s
      INNER JOIN Equipo e ON s.equipo_id = e.id
      WHERE s.id = ?
    `;
    const stmt = db.prepare(sql);
    return stmt.get(id);
  },

  // Contar solicitudes de hoy para generar correlativo SOL-AAAAMMDD-XXX
  countByDatePrefix(prefix) {
    const stmt = db.prepare(`SELECT COUNT(*) as total FROM Solicitud WHERE codigo_solicitud LIKE ?`);
    const res = stmt.get(`${prefix}%`);
    return res ? res.total : 0;
  },

  // RF-02: Registrar solicitud
  create({ codigo_solicitud, equipo_id, solicitante, descripcion, prioridad, fecha_registro, fecha_actualizacion }) {
    const sql = `
      INSERT INTO Solicitud (
        codigo_solicitud, equipo_id, solicitante, descripcion, prioridad, estado, fecha_registro, fecha_actualizacion, activo
      ) VALUES (?, ?, ?, ?, ?, 'PENDIENTE', ?, ?, 1)
    `;
    const stmt = db.prepare(sql);
    const result = stmt.run(
      codigo_solicitud,
      equipo_id,
      solicitante,
      descripcion,
      prioridad,
      fecha_registro,
      fecha_actualizacion
    );
    return this.findById(result.lastInsertRowid);
  },

  // RF-04: Editar datos descriptivos (no altera código, id ni fecha_registro)
  update(id, { solicitante, descripcion, prioridad, fecha_actualizacion }) {
    const sql = `
      UPDATE Solicitud
      SET solicitante = ?, descripcion = ?, prioridad = ?, fecha_actualizacion = ?
      WHERE id = ? AND activo = 1
    `;
    const stmt = db.prepare(sql);
    stmt.run(solicitante, descripcion, prioridad, fecha_actualizacion, id);
    return this.findById(id);
  },

  // RF-05: Cambiar estado
  updateEstado(id, nuevoEstado, fecha_actualizacion) {
    const sql = `
      UPDATE Solicitud
      SET estado = ?, fecha_actualizacion = ?
      WHERE id = ? AND activo = 1
    `;
    const stmt = db.prepare(sql);
    stmt.run(nuevoEstado, fecha_actualizacion, id);
    return this.findById(id);
  },

  // RF-06: Eliminación lógica (soft delete)
  softDelete(id, fecha_actualizacion) {
    const sql = `
      UPDATE Solicitud
      SET activo = 0, fecha_actualizacion = ?
      WHERE id = ? AND activo = 1
    `;
    const stmt = db.prepare(sql);
    const res = stmt.run(fecha_actualizacion, id);
    return res.changes > 0;
  }
};
