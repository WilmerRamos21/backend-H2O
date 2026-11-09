import User from "../models/User.js";
import mongoose from "mongoose";
import { sendMailToRecoveryPassword, sendMailToRegister, sendMailToRegisterEmployed } from "../helpers/sendMail.js";
import { crearTokenJWT } from "../middlewares/JWT.js";
import validator from 'validator';

// SPRINT 1 - Autenticación y registro de usuarios

export const registro = async (req, res) => {
    try {
        let { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                msg: 'Llenar todos los campos obligatorios'
            });
        }

        // Normalizar el correo electronico a minúsculas
        email = email.toLowerCase().trim();

        // 1. Validar sintaxis básica
        if (!validator.isEmail(email)) {
            return res.status(400).json({ msg: 'El formato del correo no es válido' });
        }

        // 2. Validación lógica extra para evitar correos absurdos (como av@a.com o a@a.a)
        const [username, domain] = email.split('@');
        const domainParts = domain.split('.');
        const domainName = domainParts[0];

        if (username.length < 2 || domainName.length < 2) {
            return res.status(400).json({ msg: 'Por favor, ingresa un correo electrónico real' });
        }

        // Validar la longitud y complejidad de la contraseña
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()-+])[A-Za-z\d!@#$%^&*()-+]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ msg: 'La contraseña debe tener al menos 8 caracteres, incluyendo al menos una letra mayúscula, un carácter especial y un número.' });
        }

        const verifyEmailBDD = await User.findOne({ email });
        if (verifyEmailBDD) return res.status(400).json({ msg: 'El correo ya está registrado' });

        // Crear un nuevo usuario
        const newUser = new User({ email, password });
        
        // Encriptar el password
        newUser.password = await newUser.encryptPassword(password);
        
        // Generar un token
        const token = newUser.createToken();
        
        // Guardar el usuario en la base de datos PRIMERO
        await newUser.save();
        
        // Enviar email con el token (con su respectivo manejo de errores)
        try {
            await sendMailToRegister(email, token);
        } catch (mailError) {
            console.error("Error al enviar el correo de confirmación: ", mailError);
        }

        res.status(201).json({ msg: 'Revisa tu correo electrónico para confirmar tu cuenta' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: `❌ Error en el servidor: - ${error}` });
    }
};

export const confirmarEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const userBDD = await User.findOne({ token });
        
        if (!userBDD) return res.status(400).json({ msg: 'Token no válido o cuenta ya verificada' });
        
        userBDD.confirmEmail = true;
        userBDD.token = null;
        await userBDD.save();
        
        res.status(200).json({ msg: 'Correo electrónico confirmado correctamente, ya puedes iniciar sesión' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: `❌ Error en el servidor: - ${error}` });
    }
};

export const recuperarPassword = async (req, res) => {
    try {
        let { email } = req.body;
        if (!email) return res.status(400).json({ msg: 'El correo es obligatorio' });
        
        // Normalizar el correo electronico a minúsculas
        email = email.toLowerCase().trim();

        // 1. Validar sintaxis básica
        if (!validator.isEmail(email)) {
            return res.status(400).json({ msg: 'El formato del correo no es válido' });
        }

        // 2. Validación lógica extra para evitar correos absurdos (como av@a.com o a@a.a)
        const [username, domain] = email.split('@');
        const domainParts = domain.split('.');
        const domainName = domainParts[0];

        if (username.length < 2 || domainName.length < 2) {
            return res.status(400).json({ msg: 'Por favor, ingresa un correo electrónico real' });
        }
        
        const userBDD = await User.findOne({ email });
        if (!userBDD) return res.status(400).json({ msg: 'No existe una cuenta con ese correo' });
        
        const token = userBDD.createToken();
        userBDD.token = token;
        await sendMailToRecoveryPassword(email, token);
        await userBDD.save();
        
        res.status(200).json({ msg: 'Revisa tu correo electrónico para restablecer tu contraseña' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: `❌ Error en el servidor: - ${error}` });
    }
};

export const comprobarTokenPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const userBDD = await User.findOne({ token });
        
        if (!userBDD || userBDD.token !== token) return res.status(400).json({ msg: 'Token no válido, no se puede validar tu cuenta' });
        
        res.status(200).json({ msg: 'Token válido, puedes restablecer tu contraseña' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: `❌ Error en el servidor: - ${error}` });
    }
}

export const nuevoPassword = async (req, res) => {
    try {
        let { password, confirmPassword } = req.body;
        const { token } = req.params;
        
        if (!password || !confirmPassword) return res.status(400).json({ msg: 'Llenar todos los campos obligatorios' });

        if (password !== confirmPassword) return res.status(400).json({ msg: "Los passwords no coinciden" });

        // Validar la longitud y complejidad de la contraseña
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()-+])[A-Za-z\d!@#$%^&*()-+]{8,}$/;
        if (!passwordRegex.test(password) || !passwordRegex.text(confirmPassword)) {
            return res.status(400).json({ msg: 'La contraseña debe tener al menos 8 caracteres, incluyendo al menos una letra mayúscula, un carácter especial y un número.' });
        }
        
        const userBDD = await User.findOne({ token });
        if (!userBDD) return res.status(400).json({ msg: "No se puede validar la cuenta." });
        
        userBDD.token = null;
        userBDD.password = await userBDD.encryptPassword(password);
        await userBDD.save();
        
        res.status(200).json({ msg: 'Contraseña restablecida correctamente, ya puedes iniciar sesión' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: `❌ Error en el servidor: - ${error}` });
    }
}

export const login = async (req, res) => {
    try {
        let { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ msg: 'Llenar todos los campos obligatorios' });
        
        email = email.toLowerCase().trim();

        const userBDD = await User.findOne({ email });
        if (!userBDD) return res.status(400).json({ msg: 'Credenciales incorrectas' });

        if (!userBDD.confirmEmail) return res.status(400).json({ msg: 'Tu correo electrónico no ha sido confirmado' });
        
        const verificarPassword = await userBDD.matchPassword(password);
        if (!verificarPassword) return res.status(401).json({ msg: 'Credenciales incorrectas' });
        
        const token = crearTokenJWT(userBDD._id, userBDD.role);
        
        res.status(200).json({
            token,
            name: userBDD.name,
            role: userBDD.role,
            email: userBDD.email,
            _id: userBDD._id,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: `❌ Error en el servidor: - ${error}` });
    }
}

export const perfil = (req, res) => {
    const { name, lastname, email, phone, addresses, role, _id } = req.user;

    res.status(200).json({
        name,
        lastname,
        email,
        phone,
        addresses,
        role,
        _id
    });
};

export const actualizarPerfil = async (req, res) => {
    try {
        let { name, lastname, phone } = req.body;

        if (!name || !lastname || !phone) {
            return res.status(400).json({ msg: 'Llenar todos los campos obligatorios' });
        }
        // Limpiar espacios en blanco
        const trimmedName = name.trim();
        const trimmedLastname = lastname.trim();
        const trimmedPhone = phone.toString().trim();

        // 1. Validar longitud del Nombre (ej: entre 2 y 50 caracteres)
        if (trimmedName.length < 3 || trimmedName.length > 50) {
            return res.status(400).json({ 
                msg: 'El nombre debe tener entre 2 y 50 caracteres' 
            });
        }
        // 2. Validar longitud del Apellido (ej: entre 2 y 50 caracteres)
        if (trimmedLastname.length < 3 || trimmedLastname.length > 50) {
            return res.status(400).json({ 
                msg: 'El apellido debe tener entre 2 y 50 caracteres' 
            });
        }
        // 3. Validar longitud del Teléfono (ej: entre 7 y 15 dígitos)
        if (trimmedPhone.length < 7 || trimmedPhone.length > 15) {
            return res.status(400).json({ 
                msg: 'El número de contacto debe tener entre 7 y 15 dígitos' 
            });
        }
        // Opcional: Asegurar que el teléfono contenga únicamente números
        const phoneRegex = /^[0-9]+$/;
        if (!phoneRegex.test(trimmedPhone)) {
            return res.status(400).json({ msg: 'El número de contacto solo debe contener dígitos numéricos'})
        }

        const userBDD = await User.findById(req.user._id);
        if (!userBDD) return res.status(404).json({ msg: 'Usuario no encontrado' });

        userBDD.name = trimmedName;
        userBDD.lastname = trimmedLastname;
        userBDD.phone = trimmedPhone;

        await userBDD.save();

        const { _id, role, email } = userBDD;

        res.status(200).json({
            msg: 'Perfil actualizado correctamente',
            user: {
                _id,
                name: userBDD.name,
                lastname: userBDD.lastname,
                email, // Se devuelve el actual para la UI
                phone: userBDD.phone,
                role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: '❌ Error en el servidor' });
    }
};

export const actualizarEmail = async (req, res) => {
    try{
        // 1. obtener los datos del body
        let {passwordActual, nuevoEmail} = req.body

        if (!passwordActual || !nuevoEmail){
            return res.send(400).json({msg: "Llenar todos los campos obligatorios"})
        }


        const userBDD = await User.findById(req.user._id);
        if (!userBDD) return res.status(404).json({ msg: 'Usuario no encontrado' });

        // Validar la contraseña actual por seguridad
        const verificarPassword = await userBDD.matchPassword(passwordActual)
        if (!verificarPassword){
            return res.send(400).json({msg: "Contraseña actual incorrecta"})
        }

        // Normalizar el correo electronico a minúsculas
        nuevoEmail = nuevoEmail.toLowerCase().trim();

        // 1. Validar sintaxis básica
        if (!validator.isEmail(nuevoEmail)) {
            return res.status(400).json({ msg: 'El formato del correo no es válido' });
        }

        // 2. Validación lógica extra para evitar correos absurdos (como av@a.com o a@a.a)
        const [username, domain] = email.split('@');
        const domainParts = domain.split('.');
        const domainName = domainParts[0];

        if (username.length < 2 || domainName.length < 2) {
            return res.status(400).json({ msg: 'Por favor, ingresa un correo electrónico real' });
        }

        // Validacion de que el correo no este siendo utilizado por otro usuario
        const emailExistente = await User.findOne({email: nuevoEmail})
        if (emailExistente){
            return res.send(400).json({msg:"El correo ingresado ya esta en uso."})
        }

        // Actualizar el correo
        userBDD.email = nuevoEmail

        await userBDD.save();

        res.status(200).json({
            msg: 'Correo electrónico actualizado correctamente',
            email: userBDD.email
        });

    }catch(error){
        console.error(error);
        res.status(500).json({ msg: `❌ Error en el servidor: - ${error}` });
    }
}

export const actualizarPassword = async (req, res) => {
    try {

        let { passwordactual, passwordnuevo, confirmPassword } = req.body;

        // 1. Validar que los campos obligatorios existan
        if (!passwordactual || !passwordnuevo) {
            return res.status(400).json({ msg: 'Llenar todos los campos obligatorios' });
        }

        // Opcional pero recomendado: Doble validación en backend de que coincidan las nuevas
        if (confirmPassword && passwordnuevo !== confirmPassword) {
            return res.status(400).json({ msg: "Las nuevas contraseñas no coinciden" });
        }

        // Buscar al usuario en base de datos
        const userBDD = await User.findById(req.user._id);
        if (!userBDD) return res.status(404).json({ msg: `No existe Usuario con ID: ${req.user._id}` });

        
        const verificarPassword = await userBDD.matchPassword(req.body.passwordactual);
        if (!verificarPassword) return res.status(401).json({ msg: 'Contraseña actual incorrecta' });

        // Validar la longitud y complejidad de la contraseña
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()-+])[A-Za-z\d!@#$%^&*()-+]{8,}$/;
        if (!passwordRegex.test(passwordnuevo)) {
            return res.status(400).json({ msg: 'La contraseña debe tener al menos 8 caracteres, incluyendo al menos una letra mayúscula, un carácter especial y un número.' });
        }
        
        userBDD.password = await userBDD.encryptPassword(req.body.passwordnuevo);
        await userBDD.save();
        
        res.status(200).json({ msg: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: `❌ Error en el servidor: - ${error}` });
    }
}

export const agregarDireccion = async (req, res) => {
    try {
        const { detail, city, alias } = req.body;
        const user = await User.findById(req.user._id);

        user.addresses.push({ detail, city, alias });
        await user.save();

        res.status(200).json({ addresses: user.addresses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: `❌ Error en el servidor: - ${error}` });
    }
}

export const borrarDireccion = async (req, res) => {
    try {
        const { id } = req.params;

        const usuario = await User.findOneAndUpdate(
            { 
                _id: req.user._id, 
                "addresses._id": id 
            },
            { 
                $set: { "addresses.$.status": false } 
            },
            { returnDocument: 'after' } 
        );

        if (!usuario) {
            return res.status(404).json({ msg: "❌ Dirección no encontrada" });
        }

        res.json({ 
            msg: "Dirección eliminada", 
            addresses: usuario.addresses 
        });

    } catch (error) {
        console.error("Error en eliminarDireccion:", error);
        res.status(500).json({ msg: "Error interno del servidor", error: error.message });
    }
};

// SPRINT 2 Gestión de roles de usuarios y administración

export const listarUsuarios = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search?.trim() || "";

        const skip = (page - 1) * limit;

        // Filtro global de búsqueda
        const filtro = {};

        if (search) {
            filtro.$or = [
                { name: { $regex: search, $options: "i" } },
                { lastname: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        // Contar únicamente los usuarios que coinciden con la búsqueda
        const totalUsuarios = await User.countDocuments(filtro);

        // Obtener los usuarios filtrados y aplicar paginación
        const usuarios = await User.find(filtro)
            .select("-password -token -__v")
            .skip(skip)
            .limit(limit);

        const totalPaginas = Math.ceil(totalUsuarios / limit);

        res.status(200).json({
            usuarios,
            paginacion: {
                totalUsuarios,
                totalPaginas,
                paginaActual: page,
                limite: limit,
                tienePaginaAnterior: page > 1,
                tienePaginaSiguiente: page < totalPaginas
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
        msg: `Error en el servidor: ${error}`
        });
    }
};

export const obtenerUsuarioPorId = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ msg: 'ID no válido' });
        
        const usuario = await User.findById(id).select("-password -token -__v");
        if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });
        
        res.status(200).json(usuario);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: `❌ Error en el servidor: - ${error}` });
    }
}

export const crearEmpleado = async (req, res) => {
    try {
        let { email, password, nombre, apellido, phone } = req.body;

        // 1. Validación de campos obligatorios básicos
        if (!email || !password || !nombre || !apellido || !phone) {
            return res.status(400).json({ msg: "Llenar todos los campos obligatorios (nombre, apellido, email, contraseña y celular)" });
        }

        // 2. Normalizar el correo electrónico y limpiar espacios
        email = email.toLowerCase().trim();
        nombre = nombre.trim();
        apellido = apellido.trim();
        phone = phone.trim();

        // 3. Validar sintaxis básica del correo con validator
        if (!validator.isEmail(email)) {
            return res.status(400).json({ msg: 'El formato del correo no es válido' });
        }

        // 4. Validación lógica para evitar correos absurdos (como av@a.com o a@a.a)
        const [username, domain] = email.split('@');
        const domainParts = domain.split('.');
        const domainName = domainParts[0];

        if (username.length < 2 || domainName.length < 2) {
            return res.status(400).json({ msg: 'Por favor, ingresa un correo electrónico real' });
        }

        // 5. Validar formato del celular (ejemplo: solo números y entre 7 y 15 dígitos)
        const phoneRegex = /^[0-9]{7,15}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ msg: 'El número de celular no es válido (debe contener solo números)' });
        }

        // 6. Validar la longitud y complejidad de la contraseña
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()-+])[A-Za-z\d!@#$%^&*()-+]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ 
                msg: 'La contraseña debe tener al menos 8 caracteres, incluyendo al menos una letra mayúscula, un carácter especial y un número.' 
            });
        }

        // 7. Verificar si el correo ya existe en la BDD
        const verificarEmailBDD = await User.findOne({ email });
        if (verificarEmailBDD) {
            return res.status(400).json({ msg: "El correo ya está registrado" });
        }

        // 8. Crear el nuevo empleado controlando explícitamente los campos (Evita Mass Assignment)
        const nuevoEmpleado = new User({
            email,
            password, // Se encriptará más adelante
            name: nombre,     // Asegúrate de que coincida con el nombre del campo en tu modelo (name o nombre)
            lastname: apellido, // Asegúrate de que coincida con el modelo (lastname o apellido)
            phone,
            role: "EMPLEADO",
            confirmEmail: false,
        });

        nuevoEmpleado.token = nuevoEmpleado.createToken();
        nuevoEmpleado.password = await nuevoEmpleado.encryptPassword(password);

        // 9. Guardar en la base de datos PRIMERO
        await nuevoEmpleado.save();

        // 10. Enviar el correo con manejo de errores independiente
        try {
            await sendMailToRegisterEmployed(email, nuevoEmpleado.token, nombre, password);
        } catch (mailError) {
            console.error("Error al enviar el correo al empleado: ", mailError);
        }

        res.status(201).json({ msg: "Empleado creado y correo de confirmación enviado" });

    } catch (error) {
        console.error("Error en crearEmpleado:", error);
        res.status(500).json({ msg: `❌ Error en el servidor: - ${error.message}` });
    }
}

export const cambiarRol = async (req, res) => { 
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (req.user._id.toString() === id) {
            return res.status(400).json({ msg: "No puedes cambiar tu propio rol" });
        }
        
        const rolesValidos = ["ADMIN", "EMPLEADO", "CLIENTE"];
        if (!rolesValidos.includes(role)) return res.status(400).json({ msg: "Rol no válido" });

        const usuario = await User.findById(id);
        if (!usuario) {
            return res.status(404).json({ msg: "Usuario no encontrado" });
        }
        if (!usuario.status) {
            return res.status(400).json({ msg: "No se puede cambiar el rol de un usuario inactivo" });
        }

        usuario.role = role;
        await usuario.save();

        res.status(200).json({ msg: "Rol actualizado correctamente" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: `❌ Error en el servidor: - ${error}` });
    }
}

export const cambiarEstado = async (req, res) => { 
    try {
        const { id } = req.params;

        if (req.user._id.toString() === id) {
            return res.status(400).json({ msg: "No puedes desactivar tu propia cuenta" });
        }

        const usuario = await User.findById(id);
        if (!usuario) {
            return res.status(404).json({ msg: "Usuario no encontrado" });
        }
        
        usuario.status = !usuario.status;
        await usuario.save();

        res.status(200).json({ msg: `Usuario ${usuario.status ? "activado" : "desactivado"} correctamente` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: `❌ Error en el servidor: - ${error}` });
    }
}