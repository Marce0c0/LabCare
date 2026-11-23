import { Router } from 'express';
import { EquiposController } from '../controllers/equiposController.js';

const router = Router();

router.get('/', EquiposController.getEquipos);

export default router;
