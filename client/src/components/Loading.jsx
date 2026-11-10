import { LoaderCircle } from 'lucide-react';

function Loading({ mensaje = 'Cargando...', className = '' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 py-10 text-slate-500 ${className}`}
    >
      <LoaderCircle className="h-8 w-8 animate-spin text-emerald-600" aria-hidden="true" />
      <span className="text-sm font-medium">{mensaje}</span>
    </div>
  );
}

export default Loading;
