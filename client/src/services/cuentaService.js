const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Función base para llamar a la API. Lanza un Error con el mensaje
 * del servidor cuando la respuesta no es exitosa.
 */
const solicitar = async (ruta, opciones = {}) => {
  let respuesta;

  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opciones,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.');
  }

  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    // La respuesta no era JSON
  }

  if (!respuesta.ok || !datos?.ok) {
    throw new Error(datos?.error || `Error inesperado del servidor (${respuesta.status})`);
  }

  return datos;
};

export const obtenerCuenta = async (id) => {
  const respuesta = await solicitar(`/cuenta/${encodeURIComponent(id)}`);
  return respuesta.data;
};

export const obtenerHistorial = async (id, limite = 20) => {
  const respuesta = await solicitar(`/cuenta/${encodeURIComponent(id)}/historial?limite=${limite}`);
  return respuesta.data;
};

export const depositar = ({ cuentaId, monto, descripcion }) =>
  solicitar('/cuenta/deposito', {
    method: 'POST',
    body: JSON.stringify({ cuentaId, monto, descripcion }),
  });

export const retirar = ({ cuentaId, monto, descripcion }) =>
  solicitar('/cuenta/retiro', {
    method: 'POST',
    body: JSON.stringify({ cuentaId, monto, descripcion }),
  });

export const transferir = ({ cuentaOrigen, cuentaDestino, monto, descripcion }) =>
  solicitar('/cuenta/transferencia', {
    method: 'POST',
    body: JSON.stringify({ cuentaOrigen, cuentaDestino, monto, descripcion }),
  });
