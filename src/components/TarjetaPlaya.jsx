import { Link } from 'react-router-dom'
import Semaforo from './Semaforo.jsx'
import { usePlaya } from '../hooks/usePlaya.js'
import { useEnVista } from '../hooks/useEnVista.js'

export default function TarjetaPlaya({ playa }) {
  const [ref, enVista] = useEnVista()
  const { estado, veredicto } = usePlaya(playa, enVista)

  return (
    <Link
      ref={ref}
      to={`/playa/${playa.id}`}
      className="block rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-400"
    >
      <article className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-sky-900">{playa.nombre}</h2>
          <p className="text-xs capitalize text-sky-500">
            {playa.isla} · {playa.orientacion}
          </p>
        </div>
        {estado === 'ok' ? (
          <Semaforo nivel={veredicto.nivel} />
        ) : estado === 'error' ? (
          <span className="shrink-0 text-sm text-red-400">sin datos</span>
        ) : (
          <span className="shrink-0 text-sm text-sky-300">…</span>
        )}
      </article>
    </Link>
  )
}
