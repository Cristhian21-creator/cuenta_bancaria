import { useState } from 'react';
import { Landmark, Menu, X } from 'lucide-react';

const ENLACES = [
  { href: '#resumen', texto: 'Resumen' },
  { href: '#operaciones', texto: 'Operaciones' },
  { href: '#movimientos', texto: 'Movimientos' },
];

function Navbar({ cuentas, cuentaActiva, onCambiarCuenta }) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-blue-950 text-white shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <a href="#resumen" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-blue-950">
            <Landmark className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Banco <span className="text-emerald-400">Andino</span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Navegación principal">
          {ENLACES.map((enlace) => (
            <a
              key={enlace.href}
              href={enlace.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-blue-100 transition hover:bg-white/10 hover:text-white"
            >
              {enlace.texto}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <label htmlFor="selector-cuenta" className="sr-only">
            Cuenta activa
          </label>
          <select
            id="selector-cuenta"
            value={cuentaActiva}
            onChange={(e) => onCambiarCuenta(e.target.value)}
            className="max-w-[10.5rem] rounded-lg border border-white/20 bg-blue-900 px-3 py-2 text-sm font-medium text-white outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40 sm:max-w-none"
          >
            {cuentas.map((cuenta) => (
              <option key={cuenta.numeroCuenta} value={cuenta.numeroCuenta}>
                {cuenta.numeroCuenta} · {cuenta.etiqueta}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            className="rounded-lg p-2 text-blue-100 transition hover:bg-white/10 md:hidden"
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuAbierto}
          >
            {menuAbierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuAbierto && (
        <nav className="border-t border-white/10 px-4 pb-3 md:hidden" aria-label="Navegación móvil">
          {ENLACES.map((enlace) => (
            <a
              key={enlace.href}
              href={enlace.href}
              onClick={() => setMenuAbierto(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-blue-100 transition hover:bg-white/10 hover:text-white"
            >
              {enlace.texto}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

export default Navbar;
