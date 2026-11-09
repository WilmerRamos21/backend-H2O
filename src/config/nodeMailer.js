import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    },
});

const sendMail = async (to, subject, html) =>{
    try {
        const info = await transporter.sendMail({
            from:`"Ferretería H2O"<${process.env.SMTP_USER}>`,
            to,
            subject,
            html
        });
        console.log("✅ Email enviado: ", info.messageId);
    } catch (error) {
        console.error('❌ Error al enviar el email: ', error); 
        
    }
}


export {
    sendMail
}