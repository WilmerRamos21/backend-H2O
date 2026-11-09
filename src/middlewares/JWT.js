import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const crearTokenJWT = (id, rol) =>{
    return jwt.sign({id, rol}, process.env.JWT_SECRET, {
        expiresIn: '1d'
    });
}

export const verificarTokenJWT = async (req, res, next) =>{
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).json({ msg: 'No se ha proporcionado un token de autenticación' });
    }

    try {
        const token = authorization.split(' ')[1];
        const { id, rol } = jwt.verify(token, process.env.JWT_SECRET);

        const userBDD = await User.findById(id).select("-password");

        if (!userBDD) {
            return res.status(401).json({ msg: "Usuario no encontrado" });
        }

        req.user = userBDD;
        next();

    } catch (error) {
        console.log(error);
        res.status(401).json({ msg: `❌ Token inválido o expirado` });
    }
};