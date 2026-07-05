import { useParams, Link } from 'react-router-dom'
import { PLAYAS } from '../data/playas.js'
import { usePlaya } from '../hooks/usePlaya.js'
import { useMarea } from '../hooks/useMarea.js'
import { fraccionMareaAhora } from '../domain/marea.js'
import { ESCALA_TEMP, ESCALA_VIENTO } from '../data/escalas.js'
import Semaforo from '../components/Semaforo.jsx'
import Marea from '../components/Marea.jsx'
import Escala from '../components/Escala.jsx'
import FondoPlaya from '../components/FondoPlaya.jsx'

function Dato({ etiqueta, valor, unidad }) {
  return (
    <div className="rounded-lg bg-white p-3 text-center shadow-sm">
      <div className="text-xs text-sky-500">{etiqueta}</div>
      <div className="text-lg font-semibold text-sky-900">
        {valor}
        {unidad}
      </div>
    </div>
  )
}

export default function FichaPlaya() {
  const { id } = useParams()
  const playa = PLAYAS.find((p) => p.id === id)
  if (!playa) {
    return (
      <section>
        <p className="text-sky-900">Playa no encontrada.</p>
        <Link to="/" className="text-sky-600 underline">Volver</Link>
      </section>
    )
  }

  const { estado, datos, veredicto } = usePlaya(playa)
  const marea = useMarea(playa)
  const fraccionAgua = marea ? fraccionMareaAhora(marea.extremos) : 0.5
  const comoLlegar = `https://www.google.com/maps/dir/?api=1&destination=${playa.lat},${playa.lon}`

  return (
    <section>
      <FondoPlaya nivel={veredicto?.nivel ?? 'ambar'} fraccionAgua={fraccionAgua} />

      <div className="relative z-10">
      <Link to="/" className="text-sm font-medium text-sky-800 underline drop-shadow-sm">← Todas las playas</Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-sky-950 drop-shadow-sm">{playa.nombre}</h1>
        <a
          href={comoLlegar}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-sky-800 shadow-sm backdrop-blur transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
        >
          📍 Cómo llegar
        </a>
      </div>

      {estado === 'cargando' && <p className="mt-4 text-sky-800">Cargando datos…</p>}
      {estado === 'error' && <p className="mt-4 text-red-600">No se pudieron cargar los datos.</p>}

      {estado === 'ok' && (
        <>
          <div className="mt-4 rounded-xl bg-white p-5 shadow-sm">
            <Semaforo nivel={veredicto.nivel} />
            <p className="mt-2 text-lg font-medium text-sky-900">{veredicto.frase}</p>
            {veredicto.motivos.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-sm text-sky-700">
                {veredicto.motivos.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            )}
          </div>

          {marea && <Marea datos={marea} />}

          <div className="mt-4 space-y-3">
            <Escala config={ESCALA_TEMP} valor={datos.temperatura} />
            <Escala config={ESCALA_VIENTO} valor={datos.viento} />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3">
            <Dato etiqueta="Agua" valor={Math.round(datos.tempAgua)} unidad="°" />
            <Dato etiqueta="Oleaje" valor={datos.oleaje} unidad=" m" />
            <Dato etiqueta="UV" valor={Math.round(datos.uv)} unidad="" />
          </div>
        </>
      )}
      </div>
    </section>
  )
}
