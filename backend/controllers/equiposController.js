import { EquipoModel } from '../models/equipoModel.js';

export const EquiposController = {
  getEquipos(req, res) {
    try {
      const equipos = EquipoModel.findAll();
      res.status(200).json({ success: true, data: equipos });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error interno al consultar el catálogo de equipos.' });
    }
  }
};
