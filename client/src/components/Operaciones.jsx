import { useState } from 'react';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from 'lucide-react';
import FormOperacion from './FormOperacion.jsx';

const PESTANAS = [
  { tipo: 'DEPOSITO', texto: 'Depositar', Icono: ArrowDownLeft, activa: 'bg-emerald-600 text-white shadow' },
  { tipo: 'RETIRO', texto: 'Retirar', Icono: ArrowUpRight, activa: 'bg-rose-600 text-white shadow' },
  { tipo: 'TRANSFERENCIA', texto: 'Transferir', Icono: ArrowLeftRight, activa: 'bg-blue-900 text-white shadow' },
];

function Operaciones({ numeroCuentaActual, enviando, onOperacion }) {
  const [tipoActivo, setTipoActivo] = useState('DEPOSITO');

  return (
    <section id="operaciones" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-bold text-blue-950">Operaciones bancarias</h2>
      <p className="mt-1 text-sm text-slate-500">Elige una operación y completa los datos.</p>

      <div
        role="tablist"
        aria-label="Tipo de operación"
        className="mt-5 grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 p-1.5"
      >
        {PESTANAS.map(({ tipo, texto, Icono, activa }) => {
          const seleccionada = tipo === tipoActivo;
          return (
            <button
              key={tipo}
              type="button"
              role="tab"
              aria-selected={seleccionada}
              onClick={() => setTipoActivo(tipo)}
              disabled={enviando}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed sm:text-sm ${
                seleccionada ? activa : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              <Icono className="h-4 w-4" aria-hidden="true" />
              {texto}
            </button>
          );
        })}
      </div>

      <div className="mt-6" role="tabpanel">
        {/* key: al cambiar de pestaña o de cuenta el formulario se reinicia */}
        <FormOperacion
          key={`${tipoActivo}-${numeroCuentaActual}`}
          tipo={tipoActivo}
          numeroCuentaActual={numeroCuentaActual}
          enviando={enviando}
          onSubmit={(datos) => onOperacion(tipoActivo, datos)}
        />
      </div>
    </section>
  );
}

export default Operaciones;
