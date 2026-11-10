import mongoose from 'mongoose';

/**
 * Conecta a MongoDB local usando la URI definida en .env.
 * Además verifica que el servidor sea un replica set, requisito para
 * usar transacciones multidocumento.
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('Falta la variable MONGODB_URI. Copia .env.example a .env y complétala.');
  }

  mongoose.set('strictQuery', true);

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB desconectado. Mongoose intentará reconectar automáticamente...');
  });
  mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconectado');
  });

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log(`✅ MongoDB conectado: ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);

  const info = await mongoose.connection.db.admin().command({ hello: 1 });
  if (!info.setName) {
    console.warn(
      '⚠️  MongoDB NO está corriendo como replica set. Los depósitos, retiros y transferencias ' +
        'fallarán porque usan transacciones. Revisa la sección "Replica set" del README.'
    );
  } else {
    console.log(`✅ Replica set activo: ${info.setName}`);
  }
};
