import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Inbox } from 'lucide-react';
import Loading from './Loading.jsx';
import { formatearFecha, formatearMoneda } from '../utils/formato.js';

const TIPOS = {
  DEPOSITO: { texto: 'Depósito', Icono: ArrowDownLeft, insignia: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  RETIRO: { texto: 'Retiro', Icono: ArrowUpRight, insignia: 'bg-rose-50 text-rose-700 ring-rose-200' },
  TRANSFERENCIA: { texto: 'Transferencia', Icono: ArrowLeftRight, insignia: 'bg-blue-50 text-blue-800 ring-blue-200' },
};

// Indica si el movimiento suma (+1) o resta (-1) al saldo de la cuenta consultada
const direccionMovimiento = (mov, numeroCuentaActual) => {
  if (mov.tipo === 'DEPOSITO') return 1;
  if (mov.tipo === 'RETIRO') return -1;
  return mov.cuentaOrigen?.numeroCuenta === numeroCuentaActual ? -1 : 1;
};

const textoCuenta = (cuenta) => (cuenta ? `${cuenta.numeroCuenta}` : '—');

function Insignia({ tipo, direccion }) {
  const { texto, Icono, insignia } = TIPOS[tipo];
  const etiqueta = tipo === 'TRANSFERENCIA' ? (direccion < 0 ? 'Enviada' : 'Recibida') : texto;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${insignia}`}>
      <Icono className="h-3.5 w-3.5" aria-hidden="true" />
      {etiqueta}
    </span>
  );
}

function Monto({ monto, direccion, moneda }) {
  const positivo = direccion > 0;
  return (
    <span className={`font-semibold tabular-nums ${positivo ? 'text-emerald-600' : 'text-rose-600'}`}>
      {positivo ? '+' : '−'} {formatearMoneda(monto, moneda)}
    </span>
  );
}

function HistorialTransacciones({ movimientos, numeroCuentaActual, moneda, cargando }) {
  return (
    <section id="movimientos" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-bold text-blue-950">Últimos movimientos</h2>
        <span className="text-xs text-slate-400">Más recientes primero</span>
      </div>

      {cargando ? (
        <Loading mensaje="Cargando movimientos..." />
      ) : movimientos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
          <Inbox className="h-10 w-10" aria-hidden="true" />
          <p className="text-sm font-medium">Aún no hay movimientos en esta cuenta</p>
        </div>
      ) : (
        <>
          {/* Vista de tabla: tablets y computadoras */}
          <div className="mt-5 hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-3 pr-4 font-semibold">Tipo</th>
                  <th className="pb-3 pr-4 font-semibold">Fecha y hora</th>
                  <th className="pb-3 pr-4 font-semibold">Origen</th>
                  <th className="pb-3 pr-4 font-semibold">Destino</th>
                  <th className="pb-3 text-right font-semibold">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movimientos.map((mov) => {
                  const direccion = direccionMovimiento(mov, numeroCuentaActual);
                  return (
                    <tr key={mov._id} className="transition hover:bg-slate-50">
                      <td className="py-3.5 pr-4">
                        <Insignia tipo={mov.tipo} direccion={direccion} />
                      </td>
                      <td className="py-3.5 pr-4 text-slate-600">{formatearFecha(mov.fecha)}</td>
                      <td className="py-3.5 pr-4 font-mono text-slate-600">{textoCuenta(mov.cuentaOrigen)}</td>
                      <td className="py-3.5 pr-4 font-mono text-slate-600">{textoCuenta(mov.cuentaDestino)}</td>
                      <td className="py-3.5 text-right">
                        <Monto monto={mov.monto} direccion={direccion} moneda={moneda} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Vista de tarjetas: celulares */}
          <ul className="mt-5 space-y-3 md:hidden">
            {movimientos.map((mov) => {
              const direccion = direccionMovimiento(mov, numeroCuentaActual);
              return (
                <li key={mov._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Insignia tipo={mov.tipo} direccion={direccion} />
                    <Monto monto={mov.monto} direccion={direccion} moneda={moneda} />
                  </div>
                  <p className="mt-3 text-xs text-slate-500">{formatearFecha(mov.fecha)}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Origen: <span className="font-mono font-semibold text-slate-700">{textoCuenta(mov.cuentaOrigen)}</span>
                    {' · '}
                    Destino: <span className="font-mono font-semibold text-slate-700">{textoCuenta(mov.cuentaDestino)}</span>
                  </p>
                  {mov.descripcion && <p className="mt-1 text-xs italic text-slate-400">{mov.descripcion}</p>}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

export default HistorialTransacciones;
