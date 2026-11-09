import Cart from '../models/Cart.js'
import Product from '../models/Products.js'
import User from '../models/User.js';

export const agregarAlCarrito = async (req, res) => {
    try {
        const { productId, quantity = 1} = req.body;
        const qty = Number(quantity);

        if(isNaN(qty) || qty < 0){
            return res.status(400).json({msg:"Cantidad invalida"})
        }

        // 1️⃣ validar producto
        const product = await Product.findById(productId);
        if (!product || !product.status) {
            return res.status(404).json({ msg: "Producto no disponible" });
        }

        // 2️⃣ buscar carrito
        let cart = await Cart.findOne({ user: req.user._id });

        // 3️⃣ si no existe, crearlo
        if (!cart) {
            cart = new Cart({
                user: req.user._id,
                products: []
            });
        }

        // 4️⃣ verificar si ya existe el producto
        const productoExistente = cart.products.find(
            p => p.product.toString() === productId
        );

        if (productoExistente) {
            productoExistente.quantity += qty;
        } else {
            cart.products.push({
                product: productId,
                quantity:qty
            });
        }

        await cart.save();

        res.json({ msg: "Producto agregado al carrito", cart });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: `❌ Error en el servidor: ${error}` });
    }
};


export const verCarrito= async (req, res) => {
    try{
        const cart = await Cart.findOne({user: req.user._id}).populate("products.product");

        if (!cart) {
            return res.json({products: [], total: 0});
        }
        let total = 0;

        const productos = cart.products.map(item =>{
            const product = item.product;

            const precioFinal = product.price - (product.price * product.discount /100);
            const subTotal = precioFinal * item.quantity;

            total += subTotal;

            return {
                product,
                quantity: item.quantity,
                precioFinal,
                subTotal
            }
        })

        res.json({
            productos,
            total
        })

    }catch(error){
        res.status(500).json({ msg: `❌ Error en el servidor: ${error}` });
    }
}

export const eliminarProductoCarrito = async (req, res) => {
    try{
        const {productId} = req.params;
        const cart = await Cart.findOne({user: req.user._id});
        if (!cart){
            return res.status(404).json({msg:"Carrito no encontrado"});
        }
        cart.products =cart.products.filter(
            p => p.product.toString() !== productId
        );
        await cart.save();

        res.json({msg: "Producto eliminado del carrito"});
    }catch(error){
        res.status(500).json({ msg: `❌ Error en el servidor: ${error}` });
    }
}

export const actualizarCantidadCarrito = async(req, res) => {
    try{  
        const {productId} = req.params;
        const {quantity} = req.body;

        const qty = Number(quantity);

        if (isNaN(qty) || qty <= 0){
            return res.status(400).json({msg:"Cantidad inválida"});
        }
        const cart = await Cart.findOne({user: req.user._id});

        const producto = cart.products.find( p => p.product.toString() === productId);

        if (!producto){
            res.status(400).json({msg:"El producto no esta en el carrito"});
        }

        producto.quantity = qty;
        await cart.save();

        res.json({msg:"Cantidad actualizada"});

    }catch(error){
        res.status(500).json({ msg: `❌ Error en el servidor: ${error}` });
    }
}

export const vaciarCarrito = async (req, res) => {
    try{
        const cart = await Cart.findOne({user: req.user._id});
        if (!cart){
            return res.status(400).json({msg:"Carrito no encontrado"});
        }
        cart.products = [],
        await cart.save();
        res.json({msg:"Carrito vaciado"});
    }catch(error){
        res.status(500).json({ msg: `❌ Error en el servidor: ${error}` });
    }
}