import { verificarTokenJWT } from "../middlewares/JWT.js";
import { authorizeRoles } from "../middlewares/roles.js";
import { Router } from "express";
import { crearProducto,
    listarProductos,
    actualizarProducto,
    eliminarProducto,
    obtenerProductoPorId

} from "../controllers/product_controller.js";


const router = Router();

// Ruta Publica
router.get("/productos", listarProductos);
router.get('/producto/:id', obtenerProductoPorId)


// 🔐 Privadas (solo admin)
router.post("/producto", verificarTokenJWT, authorizeRoles("ADMIN"), crearProducto);
router.delete("/producto/:id/status", verificarTokenJWT, authorizeRoles("ADMIN"), eliminarProducto);

// 🔐 Privada (ADMIN y EMPLEADO)
router.put("/producto/:id", verificarTokenJWT, authorizeRoles("ADMIN", "EMPLEADO"), actualizarProducto);


export default router;