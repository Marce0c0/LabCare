import { Router } from 'express';
import { SolicitudesController } from '../controllers/solicitudesController.js';

const router = Router();

// CRUD y operaciones de soporte según especificación Fase 3
router.get('/', SolicitudesController.listar);
router.get('/:id', SolicitudesController.obtenerPorId);
router.post('/', SolicitudesController.crear);
router.put('/:id', SolicitudesController.actualizar);
router.patch('/:id/estado', SolicitudesController.cambiarEstado);
router.delete('/:id', SolicitudesController.eliminarLogico);

export default router;
