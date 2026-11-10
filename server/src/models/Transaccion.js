import mongoose from 'mongoose';

const transaccionSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      required: [true, 'El tipo de transacción es obligatorio'],
      enum: { values: ['DEPOSITO', 'RETIRO', 'TRANSFERENCIA'], message: 'Tipo de transacción no válido' },
    },
    monto: {
      type: Number,
      required: [true, 'El monto es obligatorio'],
      min: [0.01, 'El monto debe ser mayor que cero'],
    },
    // Cuenta de la que sale el dinero (RETIRO y TRANSFERENCIA)
    cuentaOrigen: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cuenta',
      default: null,
    },
    // Cuenta que recibe el dinero (DEPOSITO y TRANSFERENCIA)
    cuentaDestino: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cuenta',
      default: null,
    },
    descripcion: {
      type: String,
      trim: true,
      maxlength: [120, 'La descripción no puede superar los 120 caracteres'],
      default: '',
    },
    fecha: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

// Consistencia según el tipo de operación
transaccionSchema.pre('validate', function validarCuentas(next) {
  const { tipo, cuentaOrigen, cuentaDestino } = this;

  if (tipo === 'DEPOSITO' && !cuentaDestino) {
    return next(new Error('Un depósito requiere cuenta destino'));
  }
  if (tipo === 'RETIRO' && !cuentaOrigen) {
    return next(new Error('Un retiro requiere cuenta origen'));
  }
  if (tipo === 'TRANSFERENCIA') {
    if (!cuentaOrigen || !cuentaDestino) {
      return next(new Error('Una transferencia requiere cuenta origen y destino'));
    }
    if (String(cuentaOrigen) === String(cuentaDestino)) {
      return next(new Error('La cuenta origen y destino no pueden ser la misma'));
    }
  }
  next();
});

// Índices para consultar rápido el historial de una cuenta
transaccionSchema.index({ cuentaOrigen: 1, fecha: -1 });
transaccionSchema.index({ cuentaDestino: 1, fecha: -1 });

export default mongoose.model('Transaccion', transaccionSchema);
