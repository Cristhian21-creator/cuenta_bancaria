import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDB } from './config/database.js';
import cuentaRoutes from './routes/cuentaRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();

// CORS: solo se permiten los orígenes configurados en CLIENT_URL
const origenesPermitidos = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origen) => origen.trim());

app.use(cors({ origin: origenesPermitidos, methods: ['GET', 'POST'] }));
app.use(express.json({ limit: '10kb' }));

// Comprobación rápida del estado del servidor y de la base de datos
app.get('/api/health', (req, res) => {
  const estados = ['desconectado', 'conectado', 'conectando', 'desconectando'];
  res.json({ ok: true, servidor: 'activo', mongodb: estados[mongoose.connection.readyState] });
});

app.use('/api/cuenta', cuentaRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const iniciarServidor = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 API bancaria escuchando en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
};

iniciarServidor();

export default app;
