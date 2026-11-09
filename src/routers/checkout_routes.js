import {Router} from 'express';
import { verificarTokenJWT } from '../middlewares/JWT.js';
import { pagarCarrito } from '../controllers/checkout_controller.js';

const router = Router();

router.post('/checkout', verificarTokenJWT, pagarCarrito)

export default router;