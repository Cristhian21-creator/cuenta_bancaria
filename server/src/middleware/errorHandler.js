/**
 * Error controlado de la aplicación: lleva un código HTTP asociado.
 */
export class AppError extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.name = 'AppError';
    this.status = status;
  }
}

/**
 * Middleware para rutas inexistentes (404).
 */
export const notFound = (req, res, next) => {
  next(new AppError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`));
};

/**
 * Middleware centralizado de errores. Siempre responde JSON con la forma:
 * { ok: false, error: "mensaje" }
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let status = 500;
  let mensaje = 'Error interno del servidor';

  if (err instanceof AppError) {
    status = err.status;
    mensaje = err.message;
  } else if (err.name === 'ValidationError') {
    status = 400;
    mensaje = Object.values(err.errors)
      .map((e) => e.message)
      .join('. ');
  } else if (err.name === 'CastError') {
    status = 400;
    mensaje = 'Identificador o dato con formato inválido';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    mensaje = 'El cuerpo de la petición no es un JSON válido';
  } else if (err.type === 'entity.too.large') {
    status = 400;
    mensaje = 'El cuerpo de la petición es demasiado grande';
  } else if (err.code === 11000) {
    status = 400;
    mensaje = 'Ya existe un registro con esos datos';
  } else if (/replica set|Transaction numbers/i.test(err.message || '')) {
    status = 500;
    mensaje =
      'MongoDB no está configurado como replica set, por lo que no se pueden usar transacciones. Revisa el README.';
  }

  if (status === 500) {
    console.error('❌ Error interno:', err);
  }

  res.status(status).json({ ok: false, error: mensaje });
};
