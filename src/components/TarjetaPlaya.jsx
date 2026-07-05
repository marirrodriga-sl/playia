import { Link } from 'react-router-dom'
import Semaforo from './Semaforo.jsx'
import { usePlaya } from '../hooks/usePlaya.js'

export default function TarjetaPlaya({ playa }) {
  const { estado, veredicto } = usePlaya(playa)
  return (
    <Link
      to={`/playa/${playa.id}`}
      className="block rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-400"
    >
      <article className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-sky-900">{playa.nombre}</h2>
        {estado === 'cargando' && <span className="text-sm text-sky-500">Cargando…</span>}
        {estado === 'error' && <span className="text-sm text-red-500">Sin datos</span>}
        {estado === 'ok' && <Semaforo nivel={veredicto.nivel} />}
      </article>
    </Link>
  )
}
