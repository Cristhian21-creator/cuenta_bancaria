import { AppError } from '../middleware/errorHandler.js';

const REGEX_IDENTIFICADOR = /^[A-Za-z0-9-]{3,24}$/;
const MONTO_MAXIMO = 1_000_000;

/**
 * Valida que el monto sea numérico, positivo, con máximo 2 decimales
 * y no supere el límite por operación. Devuelve el monto como Number.
 */
export const validarMonto = (valor) => {
  if (valor === undefined || valor === null || valor === '') {
    throw new AppError(400, 'El monto es obligatorio');
  }

  const monto = typeof valor === 'string' ? Number(valor.trim()) : valor;

  if (typeof monto !== 'number' || !Number.isFinite(monto)) {
    throw new AppError(400, 'El monto debe ser un número válido');
  }
  if (monto <= 0) {
    throw new AppError(400, 'El monto debe ser mayor que cero');
  }
  if (Math.abs(monto * 100 - Math.round(monto * 100)) > 1e-6) {
    throw new AppError(400, 'El monto admite como máximo 2 decimales');
  }
  if (monto > MONTO_MAXIMO) {
    throw new AppError(400, `El monto máximo por operación es ${MONTO_MAXIMO.toLocaleString('en-US')}`);
  }

  return Math.round(monto * 100) / 100;
};

/**
 * Valida un identificador de cuenta: puede ser el _id de MongoDB (24 hex)
 * o el número de cuenta (letras, números y guiones, de 3 a 24 caracteres).
 */
export const validarIdentificador = (valor, campo = 'cuenta') => {
  if (valor === undefined || valor === null || String(valor).trim() === '') {
    throw new AppError(400, `El identificador de ${campo} es obligatorio`);
  }
  if (typeof valor !== 'string' && typeof valor !== 'number') {
    throw new AppError(400, `El identificador de ${campo} es inválido`);
  }

  const id = String(valor).trim();

  if (!REGEX_IDENTIFICADOR.test(id)) {
    throw new AppError(
      400,
      `El identificador de ${campo} es inválido (usa de 3 a 24 letras, números o guiones)`
    );
  }
  return id;
};

/**
 * Valida la descripción opcional de una operación.
 */
export const validarDescripcion = (valor, porDefecto) => {
  if (valor === undefined || valor === null || String(valor).trim() === '') return porDefecto;
  if (typeof valor !== 'string') {
    throw new AppError(400, 'La descripción debe ser texto');
  }
  const texto = valor.trim();
  if (texto.length > 120) {
    throw new AppError(400, 'La descripción no puede superar los 120 caracteres');
  }
  return texto;
};
