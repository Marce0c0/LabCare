import { db } from '../database.js';

export const EquipoModel = {
  findAll() {
    const stmt = db.prepare('SELECT id, codigo, nombre, ubicacion, estado FROM Equipo ORDER BY codigo ASC');
    return stmt.all();
  },

  findById(id) {
    const stmt = db.prepare('SELECT id, codigo, nombre, ubicacion, estado FROM Equipo WHERE id = ?');
    return stmt.get(id);
  }
};
