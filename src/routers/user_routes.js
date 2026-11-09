import { Router } from 'express';
import {
    actualizarPassword,
    actualizarPerfil,
    perfil,
    login,
    registro,
    confirmarEmail,
    recuperarPassword,
    comprobarTokenPassword,
    nuevoPassword,
    listarUsuarios,
    obtenerUsuarioPorId,
    crearEmpleado, 
    cambiarRol,
    cambiarEstado,
    agregarDireccion,
    borrarDireccion,
    actualizarEmail
} from '../controllers/user_controller.js';

import { verificarTokenJWT } from '../middlewares/JWT.js';
import {authorizeRoles} from '../middlewares/roles.js';

const router = Router();

// 🔓 Públicas
router.post('/registro', registro);
router.get('/confirmar/:token', confirmarEmail);
router.post('/login', login);

router.post('/recuperarpassword', recuperarPassword);
router.get('/recuperarpassword/:token', comprobarTokenPassword);
router.post('/nuevopassword/:token', nuevoPassword);

// 🔐 Privadas (cualquier usuario autenticado)
router.get('/perfil', verificarTokenJWT, perfil);
router.put('/actualizarperfil', verificarTokenJWT, actualizarPerfil);
router.put('/actualizarpassword', verificarTokenJWT, actualizarPassword);
router.put('/actualizarcorreo', verificarTokenJWT, actualizarEmail)

// Rutas para direcciones
router.post('/direcciones', verificarTokenJWT, agregarDireccion)
router.put('/direcciones/:id', verificarTokenJWT, borrarDireccion)


// 🔐 Privadas (solo admin)
router.get('/listarusuarios', verificarTokenJWT, authorizeRoles("ADMIN"), listarUsuarios);
router.get('/obtenerusuario/:id', verificarTokenJWT, authorizeRoles("ADMIN"), obtenerUsuarioPorId);
router.post('/crearempleado', verificarTokenJWT, authorizeRoles("ADMIN"), crearEmpleado);
router.put('/:id/role', verificarTokenJWT, authorizeRoles("ADMIN"), cambiarRol);
router.put('/:id/estado', verificarTokenJWT, authorizeRoles("ADMIN"), cambiarEstado);




export default router;