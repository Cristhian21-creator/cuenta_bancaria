import mongoose from 'mongoose';

const cuentaSchema = new mongoose.Schema(
  {
    titular: {
      type: String,
      required: [true, 'El titular es obligatorio'],
      trim: true,
      maxlength: [100, 'El titular no puede superar los 100 caracteres'],
    },
    numeroCuenta: {
      type: String,
      required: [true, 'El número de cuenta es obligatorio'],
      unique: true,
      trim: true,
      match: [/^[A-Za-z0-9-]{3,24}$/, 'El número de cuenta tiene un formato inválido'],
    },
    saldo: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'El saldo no puede ser negativo'],
    },
    moneda: {
      type: String,
      enum: { values: ['PEN', 'USD'], message: 'Moneda no soportada' },
      default: 'PEN',
    },
    estado: {
      type: String,
      enum: { values: ['ACTIVA', 'INACTIVA', 'BLOQUEADA'], message: 'Estado no válido' },
      default: 'ACTIVA',
    },
    fechaCreacion: {
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

export default mongoose.model('Cuenta', cuentaSchema);
