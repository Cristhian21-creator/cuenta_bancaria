import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';

// Textos y colores de cada operación (clases completas para que Tailwind las detecte)
const CONFIG = {
  DEPOSITO: {
    boton: 'Realizar depósito',
    enviando: 'Procesando depósito...',
    ayuda: 'El dinero se acreditará de inmediato en tu cuenta.',
    claseBoton: 'bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500',
  },
  RETIRO: {
    boton: 'Realizar retiro',
    enviando: 'Procesando retiro...',
    ayuda: 'Solo puedes retirar hasta el saldo disponible.',
    claseBoton: 'bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-500',
  },
  TRANSFERENCIA: {
    boton: 'Enviar transferencia',
    enviando: 'Procesando transferencia...',
    ayuda: 'La transferencia se realiza de forma atómica: o se completa todo, o no se mueve nada.',
    claseBoton: 'bg-blue-900 hover:bg-blue-950 focus-visible:ring-blue-700',
  },
};

const claseInput = (hayError) =>
  `w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:ring-2 ${
    hayError
      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
      : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-200'
  }`;

function Campo({ id, etiqueta, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {etiqueta}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs font-medium text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function FormOperacion({ tipo, numeroCuentaActual, enviando, onSubmit }) {
  const [monto, setMonto] = useState('');
  const [cuentaDestino, setCuentaDestino] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [errores, setErrores] = useState({});

  const config = CONFIG[tipo];
  const esTransferencia = tipo === 'TRANSFERENCIA';

  const validar = () => {
    const nuevos = {};
    const valor = Number(monto);

    if (monto.trim() === '') {
      nuevos.monto = 'Ingresa un monto';
    } else if (!Number.isFinite(valor)) {
      nuevos.monto = 'El monto debe ser numérico';
    } else if (valor <= 0) {
      nuevos.monto = 'El monto debe ser mayor que cero';
    } else if (Math.abs(valor * 100 - Math.round(valor * 100)) > 1e-6) {
      nuevos.monto = 'Usa como máximo 2 decimales';
    }

    if (esTransferencia) {
      const destino = cuentaDestino.trim();
      if (!destino) {
        nuevos.cuentaDestino = 'Ingresa la cuenta destino';
      } else if (destino === numeroCuentaActual) {
        nuevos.cuentaDestino = 'No puedes transferir a tu propia cuenta';
      }
    }

    return nuevos;
  };

  const manejarEnvio = async (evento) => {
    evento.preventDefault();
    if (enviando) return;

    const nuevosErrores = validar();
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    const exito = await onSubmit({
      monto: Number(monto),
      cuentaDestino: cuentaDestino.trim(),
      descripcion: descripcion.trim(),
    });

    // Solo se limpia el formulario si el servidor confirmó la operación
    if (exito) {
      setMonto('');
      setCuentaDestino('');
      setDescripcion('');
      setErrores({});
    }
  };

  return (
    <form onSubmit={manejarEnvio} noValidate className="space-y-5">
      {esTransferencia && (
        <Campo id="cuentaDestino" etiqueta="Cuenta destino" error={errores.cuentaDestino}>
          <input
            id="cuentaDestino"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Ej. 1002"
            value={cuentaDestino}
            onChange={(e) => setCuentaDestino(e.target.value)}
            disabled={enviando}
            className={claseInput(errores.cuentaDestino)}
          />
        </Campo>
      )}

      <Campo id="monto" etiqueta="Monto" error={errores.monto}>
        <input
          id="monto"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          disabled={enviando}
          className={claseInput(errores.monto)}
        />
      </Campo>

      <Campo id="descripcion" etiqueta="Descripción (opcional)">
        <input
          id="descripcion"
          type="text"
          maxLength={120}
          placeholder="Ej. Pago de servicios"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          disabled={enviando}
          className={claseInput(false)}
        />
      </Campo>

      <p className="text-xs text-slate-500">{config.ayuda}</p>

      <button
        type="submit"
        disabled={enviando}
        className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${config.claseBoton}`}
      >
        {enviando && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {enviando ? config.enviando : config.boton}
      </button>
    </form>
  );
}

export default FormOperacion;
