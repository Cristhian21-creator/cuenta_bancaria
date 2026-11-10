import { RefreshCw, ShieldCheck, Wallet } from 'lucide-react';
import Loading from './Loading.jsx';
import { formatearMoneda } from '../utils/formato.js';

function SaldoCard({ cuenta, cargando, sincronizando, onActualizar }) {
  return (
    <section
      id="resumen"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 p-6 text-white shadow-xl sm:p-8"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl" />

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-blue-100">
            <Wallet className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-medium uppercase tracking-wider">Saldo disponible</span>
          </div>
          <button
            type="button"
            onClick={onActualizar}
            disabled={cargando || sincronizando}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-50 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${sincronizando ? 'animate-spin' : ''}`} aria-hidden="true" />
            Actualizar
          </button>
        </div>

        {cargando || !cuenta ? (
          <Loading mensaje="Consultando saldo..." className="text-blue-100" />
        ) : (
          <>
            <p className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              {formatearMoneda(cuenta.saldo, cuenta.moneda)}
            </p>

            <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-blue-200">Titular</p>
                <p className="text-lg font-semibold">{cuenta.titular}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-blue-200">N.º de cuenta</p>
                <p className="font-mono text-lg font-semibold tracking-widest">{cuenta.numeroCuenta}</p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Cuenta {cuenta.estado.toLowerCase()}
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default SaldoCard;
