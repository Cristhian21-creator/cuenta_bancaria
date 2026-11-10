import { Banknote, CalendarDays, CreditCard, User } from 'lucide-react';
import { formatearFecha } from '../utils/formato.js';

function Dato({ icono: Icono, etiqueta, valor }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-900">
        <Icono className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{etiqueta}</p>
        <p className="truncate text-sm font-semibold text-slate-800">{valor}</p>
      </div>
    </li>
  );
}

function InfoCuenta({ cuenta }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-bold text-blue-950">Información de la cuenta</h2>

      {cuenta ? (
        <ul className="mt-5 space-y-4">
          <Dato icono={User} etiqueta="Titular" valor={cuenta.titular} />
          <Dato icono={CreditCard} etiqueta="Número de cuenta" valor={cuenta.numeroCuenta} />
          <Dato icono={Banknote} etiqueta="Moneda" valor={cuenta.moneda === 'PEN' ? 'Soles (PEN)' : cuenta.moneda} />
          <Dato icono={CalendarDays} etiqueta="Apertura" valor={formatearFecha(cuenta.fechaCreacion)} />
        </ul>
      ) : (
        <p className="mt-5 text-sm text-slate-400">Sin datos de cuenta.</p>
      )}
    </section>
  );
}

export default InfoCuenta;
