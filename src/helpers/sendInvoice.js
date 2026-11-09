import nodemailer from 'nodemailer';

export const enviarFacturaCorreo = async (user, pdfBuffer) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const info = await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: user.email,
            subject: 'Factura de compra',
            text: 'Adjunto la facturación de su compra',
            attachments: [
                {
                    filename: 'factura.pdf',
                    content: pdfBuffer
                }
            ]
        })
        console.log('Mensaje enviado');

        console.log("Correo enviado:", info.response);

    } catch (error) {
        console.error("Error real de nodemailer:", error);
    }
};