import User from '../models/User.js'
import Cart from '../models/Cart.js';
import Product from '../models/Products.js';
import Order from '../models/Order.js';
import {generarNumeroPedido} from '../helpers/generateOrderNumber.js';
import Stripe from 'stripe';
import { generarFacturaPDF } from '../helpers/generateInvoice.js';
import { enviarFacturaCorreo } from '../helpers/sendInvoice.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const pagarCarrito = async(req, res) => {
    try{
        const {paymentMethodId, shippingAddress} = req.body;

        if(!shippingAddress){
            return res.status(400).json({msg:"La dirección de envío es obligatoria"})
        }

        if(!paymentMethodId){
            return res.status(400).json({msg:"paymentMethodId no proporcionado"});
        }

        const cart = await Cart.findOne({user: req.user._id}).populate("products.product");

        if (!cart || cart.products.length === 0){
            return res.status(400).json({msg:"Carrito Vacio"});
        }

        const user = await User.findById(req.user._id);

        let total=0;
        let orderProducts = [];

        // Validar stock y Calculo de valor total
        for (const item of cart.products){
            const product = item.product;

            if (product.stock < item.quantity){
                return res.status(400).json({msg:`Stock insuficiente para ${product.name}`});
            }
            const precioFinal = product.price - (product.price * product.discount /100);
            total += precioFinal * item.quantity;

            orderProducts.push({
                product: product._id,
                quantity: item.quantity,
                price : precioFinal
            })
        }

        // Crear cliente Stripe
        const clienteStripe = await stripe.customers.create({
            name: user.name,
            email: user.email
        })

        // Crear pago
        const payment = await stripe.paymentIntents.create({
            amount: Math.round(total * 100),
            currency: "usd",
            description: "Compra en Ferreteria",
            payment_method: paymentMethodId,
            confirm: true,
            customer: clienteStripe.id,
            receipt_email: user.email,
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: "never"
            }
        })

        // Si el pago se realizo con exito
        if (payment.status === "succeeded"){
            // Crear orden
            const order = new Order({
                orderNumber: await generarNumeroPedido(),
                user: req.user._id,
                products: orderProducts,
                total,
                status: "Pagado",
                paymentId: payment.id,
                shipment:{
                    status: "Preparando envío",
                    history: [
                        {
                            status: "Preparando envío",
                            date: new Date(),
                            responsible: null,
                        }
                    ]
                },
                shippingAddress: {
                    address: shippingAddress.detail, // Mapeas 'detail' de User a 'address' de Order
                    city: shippingAddress.city,
                    phone: req.body.phone || req.user.phone // Usas el del form o el del perfil
                }
            })
            await order.save();

            // Descontar Stock
            for (const item of cart.products) {
                await Product.findByIdAndUpdate(item.product._id, {
                    $inc: { stock: -item.quantity }
                });
            }
            // Vaciar Carrito
            cart.products = [];
            await cart.save();

              // 👇 NO bloquea la respuesta
                try {
                    await order.populate('products.product');
                    const pdfBuffer = await generarFacturaPDF(order, user);
                    console.log('enviando correo...')
                    await enviarFacturaCorreo(user, pdfBuffer);
                    console.log('Intento de envio finalizado')
                } catch (err) {
                    console.error("Error enviando factura:", err);
                }
            
            // Respuesta Final
            return res.status(200).json({
                msg:"Pago realizado con éxito",
                order
            })

        }else{
            return res.status(400).json({
                msg:`Pago no completado: ${payment.status} `
            })
        }


    }catch(error){
        res.status(500).json({ msg: `❌ Error en el servidor: - ${error}` });
    }
}