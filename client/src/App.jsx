import { useCallback, useEffect, useRef, useState } from 'react';
import { CircleAlert } from 'lucide-react';
import Navbar from './components/Navbar.jsx';
import SaldoCard from './components/SaldoCard.jsx';
import InfoCuenta from './components/InfoCuenta.jsx';
import Operaciones from './components/Operaciones.jsx';
import HistorialTransacciones from './components/HistorialTransacciones.jsx';
import Notificacion from './components/Notificacion.jsx';
import { CUENTAS_DEMO } from './config/cuentasDemo.js';
import {
  obtenerCuenta,
  obtenerHistorial,
  depositar,
  retirar,
  transferir,
} from './services/cuentaService.js';

function App() {
  const [cuentaId, setCuentaId] = useState(CUENTAS_DEMO[0].numeroCuenta);
  const [cuenta, setCuenta] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');
  const [notificacion, setNotificacion] = useState(null);

  // Evita operaciones duplicadas por múltiples clics (el estado tarda un render en actualizarse)
  const enviandoRef = useRef(false);
  // Evita que una respuesta tardía de otra cuenta pise los datos actuales
  const cuentaActualRef = useRef(cuentaId);

  const mostrarNotificacion = useCallback((tipo, mensaje) => {
    setNotificacion({ tipo, mensaje, id: Date.now() });
  }, []);

  const cerrarNotificacion = useCallback(() => setNotificacion(null), []);

  // Trae saldo e historial en paralelo desde la API
  const sincronizar = useCallback(async (id, { inicial = false } = {}) => {
    if (inicial) setCargando(true);
    else setSincronizando(true);

    try {
      const [datosCuenta, datosHistorial] = await Promise.all([obtenerCuenta(id), obtenerHistorial(id)]);
      if (cuentaActualRef.current !== id) return;
      setCuenta(datosCuenta);
      setHistorial(datosHistorial);
      setErrorCarga('');
    } catch (error) {
      if (cuentaActualRef.current !== id) return;
      setErrorCarga(error.message);
    } finally {
      if (cuentaActualRef.current === id) {
        setCargando(false);
        setSincronizando(false);
      }
    }
  }, []);

  // Carga inicial y cada vez que cambia la cuenta activa
  useEffect(() => {
    cuentaActualRef.current = cuentaId;
    sincronizar(cuentaId, { inicial: true });
  }, [cuentaId, sincronizar]);

  const cambiarCuenta = (nuevoId) => {
    if (enviandoRef.current || nuevoId === cuentaId) return;
    setCuenta(null);
    setHistorial([]);
    setCuentaId(nuevoId);
  };

  // Envía la operación al backend, espera la respuesta y sincroniza saldo + historial
  const ejecutarOperacion = async (tipo, datos) => {
    if (enviandoRef.current) return false;
    enviandoRef.current = true;
    setEnviando(true);

    try {
      let respuesta;

      if (tipo === 'DEPOSITO') {
        respuesta = await depositar({ cuentaId, monto: datos.monto, descripcion: datos.descripcion });
      } else if (tipo === 'RETIRO') {
        respuesta = await retirar({ cuentaId, monto: datos.monto, descripcion: datos.descripcion });
      } else {
        respuesta = await transferir({
          cuentaOrigen: cuentaId,
          cuentaDestino: datos.cuentaDestino,
          monto: datos.monto,
          descripcion: datos.descripcion,
        });
      }

      await sincronizar(cuentaId);
      mostrarNotificacion('exito', respuesta.mensaje);
      return true;
    } catch (error) {
      mostrarNotificacion('error', error.message);
      return false;
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar cuentas={CUENTAS_DEMO} cuentaActiva={cuentaId} onCambiarCuenta={cambiarCuenta} />
      <Notificacion notificacion={notificacion} onCerrar={cerrarNotificacion} />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-blue-950 sm:text-3xl">
            Hola{cuenta ? `, ${cuenta.titular.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">Gestiona tu dinero de forma rápida y segura.</p>
        </div>

        {errorCarga && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
              <p className="text-sm font-medium">{errorCarga}</p>
            </div>
            <button
              type="button"
              onClick={() => sincronizar(cuentaId, { inicial: true })}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SaldoCard
              cuenta={cuenta}
              cargando={cargando}
              sincronizando={sincronizando}
              onActualizar={() => sincronizar(cuentaId)}
            />
          </div>
          <InfoCuenta cuenta={cuenta} />
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Operaciones numeroCuentaActual={cuentaId} enviando={enviando || !cuenta} onOperacion={ejecutarOperacion} />
          </div>
          <div className="lg:col-span-7">
            <HistorialTransacciones
              movimientos={historial}
              numeroCuentaActual={cuenta?.numeroCuenta ?? cuentaId}
              moneda={cuenta?.moneda ?? 'PEN'}
              cargando={cargando}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        Banco Andino · Proyecto académico Full-Stack (React + Vite + Node.js + MongoDB)
      </footer>
    </div>
  );
}

export default App;
