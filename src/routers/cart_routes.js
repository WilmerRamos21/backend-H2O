import {Router} from 'express';
import { verificarTokenJWT} from "../middlewares/JWT.js";
import {
    agregarAlCarrito,
    verCarrito,
    eliminarProductoCarrito,
    actualizarCantidadCarrito,
    vaciarCarrito

} from '../controllers/cart_controller.js'

const router = Router();

router.post('/carrito', verificarTokenJWT, agregarAlCarrito)
router.get('/contenidocarrito', verificarTokenJWT, verCarrito)
router.delete('/carrito/:productId', verificarTokenJWT, eliminarProductoCarrito)
router.put('/cantidadcarrito/:productId', verificarTokenJWT, actualizarCantidadCarrito)
router.delete('/carritovacio', verificarTokenJWT, vaciarCarrito)

export default router;