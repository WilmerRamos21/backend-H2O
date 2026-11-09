import {Schema, model} from 'mongoose';

const shipmentHistorySchema = new Schema({
    status: {
        type: String, 
        enum: [
            "Preparando envío",
            "Envío en curso",
            "Envío completado"
        ],
        required: true
    },
    date: {
        type: Date,
        default: Date.now(),
    },
    responsible: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    }
}, { _id: false})


const orderSchema = new Schema({

    // Identificador de numero de pedido

    orderNumber: {
        type: String,
        unique: true,
        required: true,
    },

    // Cliente que realizo la compra
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    // Productos adquiridos
    products: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product'
        },
        quantity:Number,
        price: Number
    }
    ],
    total: Number,
    status:{
        type: String,
        enum: ["Pendiente", "Pagado"],
        default: 'Pendiente'
    },

    paymentId: String,
    shipment:{
        status: {
            type: String,
            enum: [
                "Preparando envío",
                "Envío en curso",
                "Envío completado"
            ]
        },
        // Historial de cambios de estado de envío
        history: [shipmentHistorySchema]
    },

    shippingAddress: {
        address: {type: String, required: true},
        city: {type: String, required: true},
        phone: {type: String, required:true}
    }
},{
    timestamps:true
});

export default model('Order', orderSchema);