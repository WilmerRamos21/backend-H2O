import {sendMail} from "../config/nodeMailer.js";

export const sendMailToRegister = (userMail, token) =>{
    return sendMail(
        userMail,
        "Bienvenido a Ferretería H2O ⚒️",
        `
        <h1>Confirma tu cuenta</h1>
        <p>Hola, haz clic en el siguiente enlace para confirmar tu cuenta:</p>
        <a href="${process.env.URL_FRONTEND}/confirmar/${token}">
        Confirmar cuenta
        </a>
        <hr>
        <footer>
            <p>Gracias por registrarte en nuestra plataforma.</p>
        </footer>
        `
)
}
export const sendMailToRecoveryPassword = (userEmail, token) =>{
    return sendMail(
        userEmail,
        "Recupera tu contraseña",
        `
        <h1>Ferretería H2O ⚒️</h1>
        <p>Has solicitado restablecer tu contraseña</p>
        <a href="${process.env.URL_FRONTEND}/recuperarpassword/${token}">
        Clic para restablecer tu contraseña
        </a>
        <hr>
        <footer>
        Ferreteria H2O te da la bienvenida
        </footer>
        `
    )
}

export const sendMailToRegisterEmployed = (userEmail, token, name, password) => {
    return sendMail(
        userEmail,
        "Bienvenido al equipo de Ferretería H2O ⚒️",
        `
        <h1>Registro de Nuevo Empleado</h1>
        <p>Hola,</p>
        <p>Has sido registrado como empleado en el sistema de Ferretería H2O. Estas son tus credenciales de acceso:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; border: 1px solid #d1d5db;">
            <p><strong>Usuario/Email:</strong> ${userEmail}</p>
            <p><strong>Contraseña Temporal:</strong> ${password}</p>
        </div>
        <p>Para poder ingresar, primero debes confirmar tu cuenta haciendo clic en el siguiente enlace:</p>
        <a href="${process.env.URL_FRONTEND}/confirmar/${token}">
            Confirmar y Activar Cuenta
        </a>
        <p style="margin-top: 20px;"><em>Por seguridad, te recomendamos cambiar tu contraseña una vez que hayas ingresado a tu perfil.</em></p>
        <hr>
        <footer>
            <p>Ferretería H2O - Panel de Administración</p>
        </footer>
        `
    );
};

