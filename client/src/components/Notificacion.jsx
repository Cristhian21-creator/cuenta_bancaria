import { useEffect } from 'react';
import { CircleAlert, CircleCheck, X } from 'lucide-react';

const ESTILOS = {
  exito: {
    contenedor: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    icono: 'text-emerald-600',
    Icono: CircleCheck,
  },
  error: {
    contenedor: 'border-rose-200 bg-rose-50 text-rose-900',
    icono: 'text-rose-600',
    Icono: CircleAlert,
  },
};

function Notificacion({ notificacion, onCerrar }) {
  // Se oculta sola a los 5 segundos
  useEffect(() => {
    if (!notificacion) return undefined;
    const temporizador = setTimeout(onCerrar, 5000);
    return () => clearTimeout(temporizador);
  }, [notificacion, onCerrar]);

  if (!notificacion) return null;

  const { contenedor, icono, Icono } = ESTILOS[notificacion.tipo] ?? ESTILOS.error;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4">
      <div
        role={notificacion.tipo === 'error' ? 'alert' : 'status'}
        className={`animate-aparecer pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border p-4 shadow-lg ${contenedor}`}
      >
        <Icono className={`mt-0.5 h-5 w-5 shrink-0 ${icono}`} aria-hidden="true" />
        <p className="flex-1 text-sm font-medium">{notificacion.mensaje}</p>
        <button
          type="button"
          onClick={onCerrar}
          className="rounded-md p-0.5 opacity-60 transition hover:opacity-100"
          aria-label="Cerrar notificación"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default Notificacion;
