import express from 'express';
import cors from 'cors';
import equiposRouter from './routes/equipos.js';
import solicitudesRouter from './routes/solicitudes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares estándar
app.use(cors());
app.use(express.json());

// Registro de rutas API MVC
app.use('/equipos', equiposRouter);
app.use('/solicitudes', solicitudesRouter);

// Endpoint de verificación de salud
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'LabCare API MVC', timestamp: new Date().toISOString() });
});

// Manejo de rutas inexistentes (404 seguro)
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada en el servidor LabCare.' });
});

// Manejador global de errores (sin filtrar trazas internas)
app.use((err, req, res, next) => {
  console.error('[Error no controlado]:', err.message);
  res.status(500).json({ success: false, message: 'Ocurrió un error inesperado en el servidor.' });
});

app.listen(PORT, () => {
  console.log(`[LabCare Backend MVC] Servidor ejecutándose en http://localhost:${PORT}`);
});
