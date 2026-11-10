import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/database.js';
import Cuenta from '../models/Cuenta.js';
import Transaccion from '../models/Transaccion.js';

/**
 * Cuentas de prueba para la demostración.
 * Uso:
 *   npm run seed         -> inserta solo las cuentas que no existan (no duplica)
 *   npm run seed:reset   -> BORRA cuentas y transacciones y vuelve a crearlas
 */
const cuentasDePrueba = [
  { titular: 'Ana Torres Quispe', numeroCuenta: '1001', saldo: 5000, moneda: 'PEN' },
  { titular: 'Luis Rojas Mendoza', numeroCuenta: '1002', saldo: 1500, moneda: 'PEN' },
  { titular: 'María Salazar Huamán', numeroCuenta: '1003', saldo: 250.75, moneda: 'PEN' },
];

const ejecutarSeed = async () => {
  const reiniciar = process.argv.includes('--reset');

  try {
    await connectDB();

    if (reiniciar) {
      await Transaccion.deleteMany({});
      await Cuenta.deleteMany({});
      console.log('🧹 Se eliminaron todas las cuentas y transacciones');
    }

    for (const datos of cuentasDePrueba) {
      const existente = await Cuenta.findOne({ numeroCuenta: datos.numeroCuenta });
      if (existente) {
        console.log(`⏭️  La cuenta ${datos.numeroCuenta} ya existe (se omite). Usa "npm run seed:reset" para reiniciar.`);
        continue;
      }
      await Cuenta.create(datos);
      console.log(`✅ Cuenta creada: ${datos.numeroCuenta} - ${datos.titular} - ${datos.moneda} ${datos.saldo.toFixed(2)}`);
    }

    console.log('🌱 Seed finalizado');
  } catch (error) {
    console.error('❌ Error ejecutando el seed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

ejecutarSeed();
