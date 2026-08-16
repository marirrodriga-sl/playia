import { Link } from 'react-router-dom'
import Semaforo from './Semaforo.jsx'
import { usePlaya } from '../hooks/usePlaya.js'
import { useEnVista } from '../hooks/useEnVista.js'
import { useFavoritos } from '../hooks/useFavoritos.js'

export default function TarjetaPlaya({ playa }) {
  const [ref, enVista] = useEnVista()
  const { estado, veredicto } = usePlaya(playa, enVista)
  const { favoritos, alternar } = useFavoritos()
  const esFav = favoritos.has(playa.id)

  return (
    <article
      ref={ref}
      className="flex items-center gap-2 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md focus-within:ring-2 focus-within:ring-sky-400"
    >
      <button
        type="button"
        onClick={() => alternar(playa.id)}
        aria-pressed={esFav}
        aria-label={esFav ? `Quitar ${playa.nombre} de favoritas` : `Añadir ${playa.nombre} a favoritas`}
        className={`shrink-0 rounded-full p-1 text-xl leading-none transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-sky-400 ${
          esFav ? 'text-amber-400' : 'text-sky-200 hover:text-amber-300'
        }`}
      >
        {esFav ? '★' : '☆'}
      </button>

      <Link
        to={`/playa/${playa.id}`}
        className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg focus:outline-none"
      >
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
      </Link>
    </article>
  )
}
