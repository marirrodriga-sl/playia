import { useParams, Link } from 'react-router-dom'
import { PLAYAS } from '../data/playas.js'
import { usePlaya } from '../hooks/usePlaya.js'
import { useMarea } from '../hooks/useMarea.js'
import Semaforo from '../components/Semaforo.jsx'
import Marea from '../components/Marea.jsx'

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

  return (
    <section>
      <Link to="/" className="text-sm text-sky-600 underline">← Todas las playas</Link>
      <h1 className="mt-2 text-2xl font-bold text-sky-900">{playa.nombre}</h1>

      {estado === 'cargando' && <p className="mt-4 text-sky-500">Cargando datos…</p>}
      {estado === 'error' && <p className="mt-4 text-red-500">No se pudieron cargar los datos.</p>}

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

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Dato etiqueta="Temperatura" valor={Math.round(datos.temperatura)} unidad="°" />
            <Dato etiqueta="Viento" valor={Math.round(datos.viento)} unidad=" km/h" />
            <Dato etiqueta="Agua" valor={Math.round(datos.tempAgua)} unidad="°" />
            <Dato etiqueta="Oleaje" valor={datos.oleaje} unidad=" m" />
            <Dato etiqueta="UV" valor={Math.round(datos.uv)} unidad="" />
          </div>
        </>
      )}
    </section>
  )
}
