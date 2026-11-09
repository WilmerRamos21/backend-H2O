import Product from "../models/Products.js";
import { subirImagenCloudinary } from "../helpers/uploadCloudinary.js";

// SPRINT 3 - Inventario y gestión de productos

export const crearProducto = async (req, res) => {
    try {
        let { name, price, category, stock, discount } = req.body;

        // 1. Validar campos obligatorios básicos
        if (!name || price === undefined || price === "" || !category) {
            return res.status(400).json({ msg: "❌ Nombre, precio y categoría son obligatorios" });
        }

        // 2. Convertir los campos numéricos (vienen como string desde el FormData del frontend)
        price = Number(price);
        stock = stock !== undefined && stock !== "" ? Number(stock) : 0;
        discount = discount !== undefined && discount !== "" ? Number(discount) : 0;

        // 3. Validar longitud del nombre (entre 3 y 100 caracteres)
        const nombreTrim = name.trim();
        if (nombreTrim.length < 3 || nombreTrim.length > 100) {
            return res.status(400).json({
                msg: "El nombre del producto debe tener entre 3 y 100 caracteres."
            });
        }
        
        // 4. Validar que el precio sea mayor a 0
        if (isNaN(price) || price <= 0) {
            return res.status(400).json({
                msg: "El precio debe ser un número mayor a 0."
            });
        }

        // 5. Validar que el stock no sea negativo
        if (isNaN(stock) || stock < 0) {
            return res.status(400).json({
                msg: "El stock no puede ser negativo."
            });
        }

        // 6. Validar que el descuento esté en un rango lógico (0% a 100%)
        if (isNaN(discount) || discount < 0 || discount > 100) {
            return res.status(400).json({
                msg: "El descuento debe ser un porcentaje entre 0 y 100."
            });
        }

        // 7. Validar categoría contra un menú desplegable permitido (Ajusta las opciones según tu app)
        const categoriasValidas = ["Herramientas Manuales", "Herrajes", "Herramientas Eléctricas", "Accesorios para herramientas eléctricas", "Plomería", "Jardinería", "Automotriz", "Seguridad Industrial y Personal", "Pintura", "Ferretería General", "Señalética"]; // Ejemplo
        if (!categoriasValidas.includes(category)) {
            return res.status(400).json({
                msg: "La categoría seleccionada no es válida."
            });
        }

        // 8. Manejo de la imagen (Cloudinary)
        let imageUrl = null;
        if (req.files?.image) {
            const resultadoCloudinary = await subirImagenCloudinary(req.files.image.tempFilePath, "Productos")
            imageUrl = resultadoCloudinary.secure_url // O la propiedad que retorne tu función de Cloudinary
        }

        // 9. Crear y guardar el nuevo producto en la Base de Datos
        const nuevoProducto = new Product({
            name: nombreTrim,
            price,
            category,
            stock,
            discount,
            image: imageUrl
        });

        await nuevoProducto.save();

        res.status(201).json({
            msg: "Producto creado correctamente",
            producto: nuevoProducto
        });

    } catch (error) {
        console.error("Error en crearProducto:", error);
        res.status(500).json({ msg: `❌ Error en el servidor: - ${error.message}` });
    }
};

export const listarProductos = async(req, res) => {
    try{

        const {name, category, maxPrice, minPrice, page, limit} = req.query;

        const pageNumber = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 16;
        const skip = (pageNumber - 1) * limitNum;

        let filtro = { status: true };

        if (name && name.trim() !== "") {
            filtro.name = {
                $regex: name.trim(),
                $options: "i"
            };
        }

        if (category) {
            filtro.category = category;
        }

        if (maxPrice || minPrice) {
            filtro.price = {};

            if (maxPrice) filtro.price.$lte = Number(maxPrice);
            if (minPrice) filtro.price.$gte = Number(minPrice);
        }

        const productos = await Product.find(filtro)
            .skip(skip)
            .limit(limitNum)
            .sort({ createdAt: -1 });

        const total = await Product.countDocuments(filtro);

        // Calculo de precio final con descuento
        const productosConDescuento = productos.map(prod => {
            const precioFinal = prod.price - (prod.price * (prod.discount / 100));
            return { 
                ...prod.toObject(), 
                precioFinal 
            };
        });

        res.status(200).json({
            total,
            page: pageNumber,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            products: productosConDescuento
        });
        
    }catch(error){
        res.status(500).json({ msg: `❌ Error en el servidor: - ${error}` });
    }
}

export const actualizarProducto = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Verificar si el producto existe
        const producto = await Product.findById(id);
        if (!producto) {
            return res.status(404).json({ msg: "❌ Producto no encontrado" });
        }

        // 2. Extraer campos del cuerpo de la petición
        let { name, price, category, stock, discount } = req.body;

        // 3. Validar y actualizar campos si se proporcionan
        if (name !== undefined) {
            const nombreTrim = name.trim();
            if (nombreTrim.length < 3 || nombreTrim.length > 100) {
                return res.status(400).json({
                    msg: "El nombre del producto debe tener entre 3 y 100 caracteres."
                });
            }
            producto.name = nombreTrim;
        }

        if (price !== undefined && price !== "") {
            const precioNum = Number(price);
            if (isNaN(precioNum) || precioNum <= 0) {
                return res.status(400).json({ msg: "El precio debe ser un número mayor a 0." });
            }
            producto.price = precioNum;
        }

        if (category !== undefined) {
            // Ajusta estas categorías según tu menú desplegable real
            const categoriasValidas = ["Herramientas Manuales", "Herrajes", "Herramientas Eléctricas", "Accesorios para herramientas eléctricas", "Plomería", "Jardinería", "Automotriz", "Seguridad Industrial y Personal", "Pintura", "Ferretería General", "Señalética"]; 
            if (!categoriasValidas.includes(category)) {
                return res.status(400).json({ msg: "La categoría seleccionada no es válida." });
            }
            producto.category = category;
        }

        if (stock !== undefined && stock !== "") {
            const stockNum = Number(stock);
            if (isNaN(stockNum) || stockNum < 0) {
                return res.status(400).json({ msg: "El stock no puede ser negativo." });
            }
            producto.stock = stockNum;
        }

        if (discount !== undefined && discount !== "") {
            const discountNum = Number(discount);
            if (isNaN(discountNum) || discountNum < 0 || discountNum > 100) {
                return res.status(400).json({ msg: "El descuento debe ser un porcentaje entre 0 y 100." });
            }
            producto.discount = discountNum;
        }

        // 4. Actualizar imagen si se proporciona una nueva
        if (req.files?.image) {
            // Eliminar imagen anterior de Cloudinary si existe y tiene public_id registrado
            if (producto.image?.public_id) {
                await cloudinary.uploader.destroy(producto.image.public_id);
            }
            // Subir nueva imagen utilizando tu helper exacto
            const imageData = await subirImagenCloudinary(req.files.image.tempFilePath, "Productos");
            
            // Guardar tanto la url como el public_id (asegúrate de que tu modelo guarde un objeto o string según prefieras)
            producto.image = {
                url: imageData.secure_url,
                public_id: imageData.public_id
            };
        }

        // 5. Guardar los cambios validados en la base de datos
        await producto.save();

        res.json({ 
            msg: "✅ Producto actualizado exitosamente", 
            producto 
        });

    } catch (error) {
        console.error("Error en actualizarProducto:", error);
        res.status(500).json({ msg: `❌ Error en el servidor: - ${error.message}` });
    }
};

export const eliminarProducto = async(req, res) => {
    try{
        const {id} = req.params;
        const producto = await Product.findById(id);

        if(!producto){
            return res.status(404).json({ msg: "❌ Producto no encontrado" });
        }

        producto.status = false;
        await producto.save();

        res.json({ msg: "✅ Producto eliminado exitosamente" });
    }catch(error){
        res.status(500).json({ msg: `❌ Error en el servidor: - ${error}` });
    }
}


export const obtenerProductoPorId = async(req, res) => {
    const {id} = req.params
    try{
        const product = await Product.findById(id)
        if(!product) return res.status(404).json({msg:"Producto no encontrado"})

        // Calculo del precio final
        const precioFinal = product.price - (product.price * (product.discount / 100))

        res.json({...product.toObject(), precioFinal})
    }catch(error){
        res.status(500).json({ msg: `❌ Error en el servidor: - ${error}` });
    }
}