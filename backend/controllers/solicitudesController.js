import { SolicitudModel } from '../models/solicitudModel.js';
import { EquipoModel } from '../models/equipoModel.js';

const PRIORIDADES_VALIDAS = ['BAJA', 'MEDIA', 'ALTA'];
const ESTADOS_VALIDOS = ['PENDIENTE', 'EN_PROCESO', 'RESUELTA', 'CANCELADA'];

// Reglas de transición de estados según la sección 5 del examen
const TRANSICIONES_PERMITIDAS = {
  PENDIENTE: ['EN_PROCESO', 'CANCELADA'],
  EN_PROCESO: ['RESUELTA', 'CANCELADA'],
  RESUELTA: [],
  CANCELADA: []
};

// Generador de código único con formato SOL-AAAAMMDD-XXX
const generarCodigoSolicitud = () => {
  const ahora = new Date();
  const yyyy = ahora.getFullYear();
  const mm = String(ahora.getMonth() + 1).padStart(2, '0');
  const dd = String(ahora.getDate()).padStart(2, '0');
  const fechaPrefijo = `SOL-${yyyy}${mm}${dd}-`;

  const totalHoy = SolicitudModel.countByDatePrefix(fechaPrefijo);
  const correlativo = String(totalHoy + 1).padStart(3, '0');
  return `${fechaPrefijo}${correlativo}`;
};

export const SolicitudesController = {
  // RF-01, RF-07, RF-08: Listar solicitudes activas
  listar(req, res) {
    try {
      const { search, prioridad, estado } = req.query;
      const solicitudes = SolicitudModel.findAll({ search, prioridad, estado });
      res.status(200).json({ success: true, data: solicitudes });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al recuperar las solicitudes.' });
    }
  },

  // RF-03: Consultar solicitud por identificador
  obtenerPorId(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'El identificador debe ser numérico.' });
      }

      const solicitud = SolicitudModel.findById(id);
      if (!solicitud || solicitud.activo === 0) {
        return res.status(404).json({ success: false, message: `La solicitud con identificador ${id} no fue encontrada.` });
      }

      res.status(200).json({ success: true, data: solicitud });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al consultar el detalle de la solicitud.' });
    }
  },

  // RF-02: Registrar una solicitud nueva con validaciones de servidor obligatorias
  crear(req, res) {
    try {
      let { equipo_id, solicitante, descripcion, prioridad } = req.body;

      // 1. Validación de solicitante
      if (!solicitante || typeof solicitante !== 'string' || solicitante.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: 'El nombre del solicitante es obligatorio y debe tener al menos 3 caracteres útiles.'
        });
      }
      solicitante = solicitante.trim();

      // 2. Validación de descripción
      if (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'La descripción del problema es obligatoria y debe tener al menos 10 caracteres.'
        });
      }
      descripcion = descripcion.trim();

      // 3. Validación de prioridad
      if (!prioridad || !PRIORIDADES_VALIDAS.includes(prioridad.trim())) {
        return res.status(400).json({
          success: false,
          message: `La prioridad es inválida. Solo se acepta: ${PRIORIDADES_VALIDAS.join(', ')}.`
        });
      }
      prioridad = prioridad.trim();

      // 4. Validación de existencia del equipo
      const equipoNum = parseInt(equipo_id, 10);
      if (isNaN(equipoNum)) {
        return res.status(400).json({ success: false, message: 'Debe seleccionar un equipo válido.' });
      }

      const equipoExistente = EquipoModel.findById(equipoNum);
      if (!equipoExistente) {
        return res.status(400).json({
          success: false,
          message: 'El equipo seleccionado no existe en el catálogo.'
        });
      }

      // 5. Generación de código y fechas
      const codigo_solicitud = generarCodigoSolicitud();
      const ahoraIso = new Date().toISOString();

      const nuevaSolicitud = SolicitudModel.create({
        codigo_solicitud,
        equipo_id: equipoNum,
        solicitante,
        descripcion,
        prioridad,
        fecha_registro: ahoraIso,
        fecha_actualizacion: ahoraIso
      });

      res.status(201).json({
        success: true,
        message: 'Solicitud de mantenimiento registrada correctamente.',
        data: nuevaSolicitud
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al registrar la solicitud de mantenimiento.' });
    }
  },

  // RF-04: Editar datos descriptivos de una solicitud existente
  actualizar(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Identificador no válido.' });
      }

      const solicitudActual = SolicitudModel.findById(id);
      if (!solicitudActual || solicitudActual.activo === 0) {
        return res.status(404).json({ success: false, message: `La solicitud ${id} no existe.` });
      }

      let { solicitante, descripcion, prioridad } = req.body;

      if (!solicitante || typeof solicitante !== 'string' || solicitante.trim().length < 3) {
        return res.status(400).json({ success: false, message: 'El solicitante debe tener al menos 3 caracteres.' });
      }
      if (!descripcion || typeof descripcion !== 'string' || descripcion.trim().length < 10) {
        return res.status(400).json({ success: false, message: 'La descripción debe tener al menos 10 caracteres.' });
      }
      if (!prioridad || !PRIORIDADES_VALIDAS.includes(prioridad.trim())) {
        return res.status(400).json({ success: false, message: 'Prioridad no permitida.' });
      }

      const ahoraIso = new Date().toISOString();
      const actualizada = SolicitudModel.update(id, {
        solicitante: solicitante.trim(),
        descripcion: descripcion.trim(),
        prioridad: prioridad.trim(),
        fecha_actualizacion: ahoraIso
      });

      res.status(200).json({
        success: true,
        message: 'Solicitud actualizada correctamente.',
        data: actualizada
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al actualizar la solicitud.' });
    }
  },

  // RF-05: Cambiar estado respetando el flujo permitido
  cambiarEstado(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Identificador inválido.' });
      }

      const solicitudActual = SolicitudModel.findById(id);
      if (!solicitudActual || solicitudActual.activo === 0) {
        return res.status(404).json({ success: false, message: `La solicitud ${id} no existe.` });
      }

      const { nuevoEstado } = req.body;
      if (!nuevoEstado || !ESTADOS_VALIDOS.includes(nuevoEstado.trim())) {
        return res.status(400).json({
          success: false,
          message: `Estado no reconocido. Opciones válidas: ${ESTADOS_VALIDOS.join(', ')}.`
        });
      }

      const estadoDestino = nuevoEstado.trim();
      const estadoOrigen = solicitudActual.estado;

      // Si el estado es el mismo, no hay cambio
      if (estadoOrigen === estadoDestino) {
        return res.status(200).json({
          success: true,
          message: 'La solicitud ya se encuentra en el estado indicado.',
          data: solicitudActual
        });
      }

      // Validar según matriz de transiciones
      const permitidas = TRANSICIONES_PERMITIDAS[estadoOrigen] || [];
      if (!permitidas.includes(estadoDestino)) {
        return res.status(409).json({
          success: false,
          message: `Transición no permitida: Una solicitud en estado '${estadoOrigen}' no puede pasar a '${estadoDestino}'. Transiciones válidas: [${permitidas.join(', ') || 'Ninguna (estado final)'}].`
        });
      }

      const ahoraIso = new Date().toISOString();
      const actualizada = SolicitudModel.updateEstado(id, estadoDestino, ahoraIso);

      res.status(200).json({
        success: true,
        message: `Estado de la solicitud cambiado exitosamente a '${estadoDestino}'.`,
        data: actualizada
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al cambiar el estado de la solicitud.' });
    }
  },

  // RF-06: Eliminación lógica (soft delete)
  eliminarLogico(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Identificador no válido.' });
      }

      const solicitud = SolicitudModel.findById(id);
      if (!solicitud || solicitud.activo === 0) {
        return res.status(404).json({ success: false, message: `La solicitud ${id} no existe o ya fue eliminada.` });
      }

      const ahoraIso = new Date().toISOString();
      SolicitudModel.softDelete(id, ahoraIso);

      res.status(200).json({
        success: true,
        message: `La solicitud ${solicitud.codigo_solicitud} fue eliminada lógicamente del sistema.`
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al procesar la eliminación lógica.' });
    }
  }
};
