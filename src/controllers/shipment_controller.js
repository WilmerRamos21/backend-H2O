import Order from '../models/Order.js'

export const actualizarEstadoEnvio = async(req, res) => {
    try{

        const {id} = req.params
        const {status} = req.body

        // Buscar pedido
        const order = await Order.findById(id)

        if (!order){
            return res.status(404).json({
                msg: "Pedido no encontrado."
            })
        }

        // Verificar que el pago este completado
        if (order.status !== "Pagado"){
            return res.status(400).json({
                msg: "No se puede actualizar el estado de envío de un pedido que no ha sido pagado."
            })
        }

        // Definir transacciones permitidas
        const estadosPermitidos = {
            "Preparando envío": "Envío en curso",
            "Envío en curso": "Envío completado"
        }

        const siguienteEstado = estadosPermitidos[order.shipment?.status]

        // Validar transacciones permitidas

        if (status !== siguienteEstado){
            return res.status(400).json({
                msg: "Transición de estado no permitida."
            })
        }

        // Actualizar estado actual
        order.shipment.status = status;

        // Registrar actualización en el historial 
        order.shipment.history.push({
            status,

            date: new Date(),

            responsible: req.user._id
        })

        await order.save()

        return res.status(200).json({
            msg: "Estado del envío actualizado correctamente.",
            order
        })


    }catch(error){
        res.status(500).json({
            msg: `Error en el servidor ${error.messsage}`
        })
    }
}

export const buscarOrdenes = async(req, res) => {
    try{
        const {orderNumber, customer, status} = req.query;

        const filters = {
            
            // Buscar por numero de pedido
            if (orderNumber){
                filters.orderNumber = {
                    $regex: orderNumber,
                    $options: 'i'
                }
            }
        }

        // Buscar por estado de envío
        if (status){
            filters['shipment.status'] = status;
        }

        // Buscar por cliente

        if (customer){

            const users = await users.find({
                $or: [
                    {name: {$regex: customer, $options: 'i'}},
                    {lastname: {$regex: customer, $options: 'i'}},
                    {email: {$regex: customer, $options: 'i'}}
                ]
            }).select('_id')
            
            filters.user = {
            $in: users.map(user => user._id)
            }
        }

        // Consultar pedidos
        const orders = await Order.find(filters)

            .populate('user', 'name lastname email')
            .populate('products.product')
            .populate('shipment.history.responsible', 'name lastname')
            .sort( {createdAt: -1})

        res.status(200).json(orders)


    }catch(error){
        res.status(500).json({
            msg: `Error en el servidor ${error.message}`
        })
    }
}