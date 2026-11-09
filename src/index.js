import app from './server.js';
import dotenv from 'dotenv';
import connection from './database.js';
import http from 'http';
import { Server } from 'socket.io';

dotenv.config();

// Conexión a DB (Vital: se mantiene intacto)
connection();

// Crear servidor HTTP
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173"
    }
})



io.on('connection', (socket) => {
    console.log('Usuario conectado',socket.id)
    socket.on('enviar-mensaje-front-back',(payload)=>{
        socket.broadcast.emit('enviar-mensaje-front-back',payload)
    })
})

// Inicio del servidor (Vital: se mantiene intacto)
server.listen(app.get('port'), () => {
    console.log(`Server OK on http://localhost:${app.get('port')}`);
});