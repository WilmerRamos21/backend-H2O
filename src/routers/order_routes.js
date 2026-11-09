import {Router} from 'express';
import { verificarTokenJWT } from '../middlewares/JWT.js';
import { authorizeRoles } from '../middlewares/roles.js';
import {
    obtenerOrdenesUsuarios,
    obtenerOrdenPorId,
    verTodasLasOrdenes,
} from '../controllers/order_controller.js'

import {
    buscarOrdenes,
    actualizarEstadoEnvio
    } from '../controllers/shipment_controller.js'

const router = Router();

// RUTAS DEL CLIENTE

// ========================================

// Consultar todas las órdenes del usuario
router.get('/ordenes', verificarTokenJWT, obtenerOrdenesUsuarios)

// Consultar una orden específica
router.get('/orden/:id', verificarTokenJWT, obtenerOrdenPorId)

// RUTAS ADMINISTRATIVAS

// ========================================

// Consultar todas las órdenes

router.get('/admin/ordenes', verificarTokenJWT, authorizeRoles('ADMIN', 'EMPLEADO'), verTodasLasOrdenes);

// Buscar órdenes por número, cliente o estado
router.get('/admin/buscar-ordenes', verificarTokenJWT, authorizeRoles('ADMIN', 'EMPLEADO'), buscarOrdenes);

// Actualizar estado del envío
router.patch('/admin/orden/:id/envio', verificarTokenJWT, authorizeRoles('ADMIN', 'EMPLEADO'), actualizarEstadoEnvio);

export default router;