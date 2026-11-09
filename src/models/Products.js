import {Schema, model} from 'mongoose';

const productSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    brand: {
        type: String,
        trim: true
    },
    description:{
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true
    },
    discount:{
        type: Number,
        default: 0
    },
    stock: {
        type: Number,
        default: 0
    },
    category: {
        type: String,
        required : true,
        enum: ["Herramientas Manuales", "Herrajes", "Herramientas Eléctricas", "Accesorios para herramientas eléctricas", "Plomería", "Jardinería", "Automotriz", "Seguridad Industrial y Personal", "Pintura", "Ferretería General", "Señalética"]
    },
    image: {
    url: {
        type: String,
        default: null
    },
    public_id: {
        type: String,
        default: null
        }
    },
    status: {
        type: Boolean,
        default: true
    }, 
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',

}
},{
    timestamps: true
});

export default model('Product', productSchema);