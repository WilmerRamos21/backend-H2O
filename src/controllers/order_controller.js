import Order from '../models/Order.js';
import User from '../models/User.js'

// 1. Historial de pedidos personal (con paginación opcional)
export const obtenerOrdenesUsuarios = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { search } = req.query;

        const query = { user: req.user._id };

        // Si hay texto de búsqueda, agregamos condiciones con $or
        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { "shippingAddress.city": { $regex: search, $options: 'i' } }
            ];
        }

        const totalOrders = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .populate('user', 'name lastname email')
            .populate('products.product')
            .populate('shipment.history.responsible', 'name lastname')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            orders,
            totalPages: Math.ceil(totalOrders / limit) || 1,
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ msg: `❌ Error en el servidor: - ${error}` });
    }
}

export const obtenerOrdenPorId = async (req, res) => {
    try{
        const {id} = req.params;

        const order = await Order.findById(id)
        .populate('user', 'name lastname email')
        .populate('products.product')
        .populate('shipment.history.responsible', 'name lastname')

        if (!order){
            return res.status(404).json({msg:'Orden no encontrada'});
        }

        // validación para que el usuarios solo vea sus ordenes
        if (order.user._id.toString() !== req.user._id.toString()){
            return res.status(403).json({msg:'No autorizado'})
        }

        res.json(order);

    }catch(error){
        res.status(500).json({ msg: `❌ Error en el servidor: - ${error}` });
    }
}

// 2. Todas las órdenes para el Admin (con paginación real)
export const verTodasLasOrdenes = async(req, res)=>{
    try{
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { search } = req.query;

        // Filtro base: solo las órdenes del usuario autenticado
        const query = {};

        // Si hay texto de búsqueda, agregamos condiciones con $or
        if (search) {
            // Buscamos coincidencia en número de pedido o ciudad
            const conditions = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { "shippingAddress.city": { $regex: search, $options: 'i' } }
            ];

            // Si el texto de búsqueda puede ser un nombre de usuario, 
            // primero buscamos los usuarios que coincidan con ese nombre/apellido
            const matchedUsers = await User.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { lastname: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');

            if (matchedUsers.length > 0) {
                conditions.push({ user: { $in: matchedUsers.map(u => u._id) } });
            }
            query.$or = conditions;
        }

        const totalOrders = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .populate('user', 'name lastname email')
            .populate('products.product')
            .populate('shipment.history.responsible', 'name lastname')
            .sort({createdAt: -1})
            .skip(skip)
            .limit(limit);

        // Devolvemos el objeto estructurado que esperaba tu frontend
        res.json({
            orders,
            totalPages: Math.ceil(totalOrders / limit) || 1,
            currentPage: page
        });
    }catch(error){
        res.status(500).json({ msg: `❌ Error en el servidor: - ${error}` });
    }
}