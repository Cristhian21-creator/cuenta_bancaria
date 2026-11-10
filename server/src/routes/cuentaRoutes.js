import { Router } from 'express';
import {
  obtenerCuenta,
  depositar,
  retirar,
  transferir,
  obtenerHistorial,
} from '../controllers/cuentaController.js';

const router = Router();

// Las rutas POST fijas van antes de las rutas con parámetro (:id)
router.post('/deposito', depositar);
router.post('/retiro', retirar);
router.post('/transferencia', transferir);

router.get('/:id/historial', obtenerHistorial);
router.get('/:id', obtenerCuenta);

export default router;
