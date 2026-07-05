import { useState } from 'react'
import { PLAYAS, ISLAS } from '../data/playas.js'
import TarjetaPlaya from '../components/TarjetaPlaya.jsx'

const ORIENTACIONES = [
  { valor: 'todas', etiqueta: 'Todas' },
  { valor: 'norte', etiqueta: 'Norte' },
  { valor: 'sur', etiqueta: 'Sur' },
]

export default function Home() {
  const [isla, setIsla] = useState('Gran Canaria')
  const [orientacion, setOrientacion] = useState('todas')
  const [busqueda, setBusqueda] = useState('')

  const q = busqueda.trim().toLowerCase()
  const playas = PLAYAS.filter(
    (p) =>
      p.isla === isla &&
      (orientacion === 'todas' || p.orientacion === orientacion) &&
      (q === '' || p.nombre.toLowerCase().includes(q)),
  )

  return (
    <section>
      <h1 className="text-2xl font-bold text-sky-900">Playas de Canarias</h1>

      <div className="mt-4 space-y-3">
        {/* Isla */}
        <label className="block">
          <span className="text-xs font-medium text-sky-600">Isla</span>
          <select
            value={isla}
            onChange={(e) => setIsla(e.target.value)}
            className="mt-1 w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sky-900 focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            {ISLAS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </label>

        {/* Norte / Sur */}
        <div
          className="inline-flex rounded-lg bg-sky-100 p-1"
          role="group"
          aria-label="Filtrar por orientación"
        >
          {ORIENTACIONES.map((o) => (
            <button
              key={o.valor}
              type="button"
              onClick={() => setOrientacion(o.valor)}
              aria-pressed={orientacion === o.valor}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                orientacion === o.valor
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-sky-700 hover:bg-sky-200'
              }`}
            >
              {o.etiqueta}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar playa por nombre…"
          className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sky-900 placeholder:text-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
        />
      </div>

      <p className="mt-4 text-sm text-sky-600">
        {playas.length} {playas.length === 1 ? 'playa' : 'playas'}
      </p>

      <div className="mt-2 grid gap-3">
        {playas.map((p) => (
          <TarjetaPlaya key={p.id} playa={p} />
        ))}
      </div>

      {playas.length === 0 && (
        <p className="mt-6 text-center text-sky-500">
          No hay playas que coincidan con la búsqueda.
        </p>
      )}
    </section>
  )
}
