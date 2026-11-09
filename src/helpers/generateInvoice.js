import PDFDocument from 'pdfkit';

export const generarFacturaPDF = (order, user) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // --- EQUIVALENTE AL ENCABEZADO DEL FRONT ---
        doc.fillColor('#005596') // Azul H2O
           .fontSize(20)
           .text("H2O - FACTURA DE VENTA", { align: "center" });
        
        doc.moveDown(1);
        
        // --- INFORMACIÓN DE ORDEN (Igual al doc.text del front) ---
        doc.fillColor('#646464').fontSize(10); // Color 100 en jspdf es aprox este gris
        doc.text(`ID Orden: ${order._id}`);
        doc.text(`Fecha: ${new Date(order.createdAt).toLocaleString()}`);
        
        // Usamos el objeto 'user' que pasas por parámetro para asegurar el nombre
        const nombreCliente = `${user?.name || 'Cliente'} ${user?.lastname || ''}`;
        doc.text(`Cliente: ${nombreCliente}`);
        doc.moveDown(2);

        // --- TABLA (Equivalente a autoTable con theme: 'grid') ---
        const tableTop = 180;
        const itemCodeX = 50;
        const descriptionX = 60;
        const quantityX = 300;
        const priceX = 380;
        const amountX = 480;

        // Cabecera Azul (fillColor: [0, 85, 150])
        doc.rect(50, tableTop, 500, 20).fill('#005596');
        
        doc.fillColor('#FFFFFF').font('Helvetica-Bold')
           .text("Producto", descriptionX, tableTop + 6)
           .text("Cant.", quantityX, tableTop + 6)
           .text("Precio Unit.", priceX, tableTop + 6)
           .text("Subtotal", amountX, tableTop + 6);

        // Filas de productos
        let currentY = tableTop + 20;
        doc.font('Helvetica').fillColor('#000000');

        (order.products || []).forEach(item => {
            const nombreProd = item.product?.name || "Producto sin nombre";
            const subtotal = (item.quantity * item.price).toFixed(2);

            // Dibujar bordes de la celda (Para el look 'grid')
            doc.rect(50, currentY, 500, 20).strokeColor('#EEEEEE').stroke();

            doc.text(nombreProd, descriptionX, currentY + 6, { width: 230, ellipsis: true })
               .text(item.quantity.toString(), quantityX, currentY + 6)
               .text(`$${item.price.toFixed(2)}`, priceX, currentY + 6)
               .text(`$${subtotal}`, amountX, currentY + 6);

            currentY += 20;
        });

        // --- TOTALES (Igual al finalY del front) ---
        doc.moveDown(2);
        doc.fillColor('#000000').fontSize(14).font('Helvetica-Bold');
        doc.text(`TOTAL PAGADO: $${order.total.toFixed(2)}`, 50, currentY + 20, { align: 'left' });

        doc.end();
    });
};