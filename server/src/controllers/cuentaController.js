import mongoose from 'mongoose';
import Cuenta from '../models/Cuenta.js';
import Transaccion from '../models/Transaccion.js';
import { AppError } from '../middleware/errorHandler.js';
import { validarMonto, validarIdentificador, validarDescripcion } from '../utils/validators.js';

const REGEX_OBJECT_ID = /^[a-f\d]{24}$/i;

/**
 * Busca una cuenta por _id (24 hex) o por número de cuenta.
 * Si se pasa una sesión, la lectura participa en la transacción.
 */
const buscarCuenta = (identificador, session = null) => {
  const filtro = REGEX_OBJECT_ID.test(identificador)
    ? { $or: [{ _id: identificador }, { numeroCuenta: identificador }] }
    : { numeroCuenta: identificador };

  const consulta = Cuenta.findOne(filtro);
  if (session) consulta.session(session);
  return consulta;
};

const exigirCuenta = async (identificador, etiqueta, session = null) => {
  const cuenta = await buscarCuenta(identificador, session);
  if (!cuenta) {
    const nombre = etiqueta ? ` ${etiqueta}` : '';
    throw new AppError(404, `La cuenta${nombre} (${identificador}) no existe`);
  }
  if (cuenta.estado !== 'ACTIVA') {
    const nombre = etiqueta ? ` ${etiqueta}` : '';
    throw new AppError(400, `La cuenta${nombre} (${cuenta.numeroCuenta}) no está activa`);
  }
  return cuenta;
};

/**
 * Ejecuta una función dentro de una transacción de MongoDB.
 * Si la función lanza un error, TODOS los cambios se revierten (rollback).
 */
const ejecutarEnTransaccion = async (operacion) => {
  const session = await mongoose.startSession();
  try {
    let resultado;
    await session.withTransaction(async () => {
      resultado = await operacion(session);
    });
    return resultado;
  } finally {
    await session.endSession();
  }
};

const formatoMoneda = (monto, moneda) => `${moneda} ${monto.toFixed(2)}`;

// GET /api/cuenta/:id
export const obtenerCuenta = async (req, res, next) => {
  try {
    const id = validarIdentificador(req.params.id, 'cuenta');
    const cuenta = await buscarCuenta(id);

    if (!cuenta) {
      throw new AppError(404, `La cuenta (${id}) no existe`);
    }

    res.json({ ok: true, data: cuenta });
  } catch (error) {
    next(error);
  }
};

// POST /api/cuenta/deposito   body: { cuentaId, monto, descripcion? }
export const depositar = async (req, res, next) => {
  try {
    const cuentaId = validarIdentificador(req.body.cuentaId, 'cuenta');
    const monto = validarMonto(req.body.monto);
    const descripcion = validarDescripcion(req.body.descripcion, 'Depósito en cuenta');

    const resultado = await ejecutarEnTransaccion(async (session) => {
      const cuenta = await exigirCuenta(cuentaId, '', session);

      const actualizada = await Cuenta.findOneAndUpdate(
        { _id: cuenta._id },
        { $inc: { saldo: monto } },
        { new: true, session }
      );

      const [transaccion] = await Transaccion.create(
        [{ tipo: 'DEPOSITO', monto, cuentaDestino: cuenta._id, descripcion }],
        { session }
      );

      return { cuenta: actualizada, transaccion };
    });

    res.status(201).json({
      ok: true,
      mensaje: `Depósito de ${formatoMoneda(monto, resultado.cuenta.moneda)} realizado con éxito`,
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/cuenta/retiro   body: { cuentaId, monto, descripcion? }
export const retirar = async (req, res, next) => {
  try {
    const cuentaId = validarIdentificador(req.body.cuentaId, 'cuenta');
    const monto = validarMonto(req.body.monto);
    const descripcion = validarDescripcion(req.body.descripcion, 'Retiro de efectivo');

    const resultado = await ejecutarEnTransaccion(async (session) => {
      const cuenta = await exigirCuenta(cuentaId, '', session);

      // La condición saldo >= monto se evalúa de forma atómica en la base de datos:
      // aunque lleguen dos retiros simultáneos, el saldo nunca puede quedar negativo.
      const actualizada = await Cuenta.findOneAndUpdate(
        { _id: cuenta._id, saldo: { $gte: monto } },
        { $inc: { saldo: -monto } },
        { new: true, session }
      );

      if (!actualizada) {
        throw new AppError(
          400,
          `Saldo insuficiente. Saldo disponible: ${formatoMoneda(cuenta.saldo, cuenta.moneda)}`
        );
      }

      const [transaccion] = await Transaccion.create(
        [{ tipo: 'RETIRO', monto, cuentaOrigen: cuenta._id, descripcion }],
        { session }
      );

      return { cuenta: actualizada, transaccion };
    });

    res.status(201).json({
      ok: true,
      mensaje: `Retiro de ${formatoMoneda(monto, resultado.cuenta.moneda)} realizado con éxito`,
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/cuenta/transferencia   body: { cuentaOrigen, cuentaDestino, monto, descripcion? }
export const transferir = async (req, res, next) => {
  try {
    const origenId = validarIdentificador(req.body.cuentaOrigen, 'cuenta origen');
    const destinoId = validarIdentificador(req.body.cuentaDestino, 'cuenta destino');
    const monto = validarMonto(req.body.monto);
    const descripcion = validarDescripcion(req.body.descripcion, 'Transferencia entre cuentas');

    const resultado = await ejecutarEnTransaccion(async (session) => {
      const origen = await exigirCuenta(origenId, 'origen', session);
      const destino = await exigirCuenta(destinoId, 'destino', session);

      if (origen._id.equals(destino._id)) {
        throw new AppError(400, 'No puedes transferir a la misma cuenta');
      }
      if (origen.moneda !== destino.moneda) {
        throw new AppError(400, 'Las cuentas tienen monedas distintas; no se puede transferir');
      }

      // 1) Debitar el origen (solo si tiene fondos suficientes)
      const origenActualizado = await Cuenta.findOneAndUpdate(
        { _id: origen._id, saldo: { $gte: monto } },
        { $inc: { saldo: -monto } },
        { new: true, session }
      );

      if (!origenActualizado) {
        throw new AppError(
          400,
          `Saldo insuficiente. Saldo disponible: ${formatoMoneda(origen.saldo, origen.moneda)}`
        );
      }

      // 2) Acreditar el destino
      const destinoActualizado = await Cuenta.findOneAndUpdate(
        { _id: destino._id },
        { $inc: { saldo: monto } },
        { new: true, session }
      );

      // 3) Registrar el movimiento
      const [transaccion] = await Transaccion.create(
        [
          {
            tipo: 'TRANSFERENCIA',
            monto,
            cuentaOrigen: origen._id,
            cuentaDestino: destino._id,
            descripcion,
          },
        ],
        { session }
      );

      return { cuentaOrigen: origenActualizado, cuentaDestino: destinoActualizado, transaccion };
    });

    res.status(201).json({
      ok: true,
      mensaje: `Transferencia de ${formatoMoneda(monto, resultado.cuentaOrigen.moneda)} a la cuenta ${
        resultado.cuentaDestino.numeroCuenta
      } realizada con éxito`,
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/cuenta/:id/historial?limite=20
export const obtenerHistorial = async (req, res, next) => {
  try {
    const id = validarIdentificador(req.params.id, 'cuenta');
    const cuenta = await buscarCuenta(id);

    if (!cuenta) {
      throw new AppError(404, `La cuenta (${id}) no existe`);
    }

    const limite = Math.min(Math.max(parseInt(req.query.limite, 10) || 20, 1), 100);

    const movimientos = await Transaccion.find({
      $or: [{ cuentaOrigen: cuenta._id }, { cuentaDestino: cuenta._id }],
    })
      .sort({ fecha: -1, _id: -1 })
      .limit(limite)
      .populate('cuentaOrigen', 'numeroCuenta titular')
      .populate('cuentaDestino', 'numeroCuenta titular')
      .lean();

    res.json({ ok: true, total: movimientos.length, data: movimientos });
  } catch (error) {
    next(error);
  }
};
