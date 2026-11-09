import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import userRoutes from './routers/user_routes.js';
import productRoutes from './routers/product_routes.js';
import cartRoutes from './routers/cart_routes.js';
import checkoutRoutes from './routers/checkout_routes.js';
import ordersRoutes from './routers/order_routes.js'

import cloudinary from 'cloudinary';
import fileUpload from 'express-fileupload';
import path from 'path';

// Configuracion de Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

// Inicializaciones
const app = express(); 
dotenv.config();

// Middlewares
app.use(express.json());
app.use(cors());

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: path.join(process.cwd(), 'uploads')
}));

// Variables globales
app.set('port', process.env.PORT || 3000);

// Ruta principal
app.get('/', (req, res) => {
    res.send('SERVER ON');
});

// Rutas para TODOS los usuarios
app.use('/api', userRoutes);

// Rutas para productos
app.use('/api', productRoutes);

// Rutas para el carrito de compras
app.use('/api', cartRoutes);

// Ruta para el pago de carrito
app.use('/api', checkoutRoutes)

// Ruta para las ordenes
app.use('/api', ordersRoutes);

// 404
app.use((req, res) => {
    res.status(404).send('Ruta no encontrada - 404');
});

export default app;