import { v2 as cloudinary } from 'cloudinary'
import fs from "fs-extra"


// Subir archivos a Cloudinary
export const subirImagenCloudinary = async (filePath, folder = "Productos") => {

    const { secure_url, public_id } = await cloudinary.uploader.upload(filePath, { folder })
    await fs.unlink(filePath)
    return { secure_url, public_id }

}



// Subir Base64 a Cloudinary
export const subirBase64Cloudinary = async (base64, folder = "Productos") => {

    // data:image/png;base64,iVBORw0KGgjbjgfyvh
    // iVBORw0KGgjbjgfyvh
    const buffer = Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64')
    // iVBORw0KGgjbjgfyvh  -  010101010101010101
    const { secure_url } = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'auto' }, (err, res) => {
        if (err) reject(err);
        else resolve(res);
    })

        stream.end(buffer)
    })
    return secure_url
}



