import { useState, useRef, useEffect } from 'react'

// Hora local de las playas (Canarias), no la del visitante.
function hhmm(fecha) {
  return fecha.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Atlantic/Canary',
  })
}

// Construye el bloque de DATOS REALES que se inyecta al modelo. Todo sale del
// motor de reglas y de Open-Meteo; el modelo solo redacta, no calcula.
function construirContexto(playa, datos, veredicto, marea) {
  const L = []
  L.push(`Playa: ${playa.nombre} (${playa.isla}, costa ${playa.orientacion}).`)
  L.push(
    `Veredicto de hoy: ${veredicto.nivel} — ${veredicto.frase}` +
      (veredicto.motivos.length ? ` Motivos: ${veredicto.motivos.join(', ')}.` : ''),
  )
  L.push(`Temperatura del aire: ${Math.round(datos.temperatura)} °C.`)
  L.push(`Viento: ${Math.round(datos.viento)} km/h.`)
  L.push(`Temperatura del agua: ${Math.round(datos.tempAgua)} °C.`)
  L.push(`Oleaje: ${datos.oleaje} m.`)
  L.push(`Índice UV: ${Math.round(datos.uv)}.`)
  if (marea) {
    L.push(`Marea ahora mismo: ${marea.subiendo ? 'subiendo' : 'bajando'}.`)
    if (marea.proximaPleamar?.fecha) L.push(`Próxima pleamar: ${hhmm(marea.proximaPleamar.fecha)}.`)
    if (marea.proximaBajamar?.fecha) L.push(`Próxima bajamar: ${hhmm(marea.proximaBajamar.fecha)}.`)
    if (marea.extremos?.length) {
      L.push(`Mareas del día: ${marea.extremos.map((e) => `${e.tipo} ${hhmm(e.fecha)}`).join(', ')}.`)
    }
    if (marea.mareaViva) {
      L.push(
        `AVISO: hay marea viva${marea.rango != null ? ` (rango ${marea.rango} m)` : ''}; ` +
          `en pleamar la playa puede quedarse con muy poca arena.`,
      )
    }
  }
  return L.join('\n')
}

const SUGERENCIAS = ['¿Me baño esta tarde?', '¿Hace viento?', '¿Cómo está la marea?']

export default function ChatPlaya({ playa, datos, veredicto, marea }) {
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState([
    { rol: 'bot', texto: `¡Hola! Pregúntame lo que quieras sobre ${playa.nombre} 🏖️` },
  ])
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(false)
  const finRef = useRef(null)

  useEffect(() => {
    if (abierto) finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, abierto])

  async function enviar(pregunta) {
    const q = (pregunta ?? texto).trim()
    if (!q || cargando) return
    setTexto('')
    const nuevos = [...mensajes, { rol: 'user', texto: q }]
    setMensajes(nuevos)
    setCargando(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contexto: construirContexto(playa, datos, veredicto, marea),
          mensajes: nuevos,
        }),
      })
      const data = await res.json()
      setMensajes((m) => [
        ...m,
        { rol: 'bot', texto: res.ok ? data.respuesta : 'Ahora mismo no puedo responder. Inténtalo en un momento 🙏' },
      ])
    } catch {
      setMensajes((m) => [...m, { rol: 'bot', texto: 'No hay conexión con el asistente ahora mismo.' }])
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      {/* Burbuja flotante */}
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label={abierto ? 'Cerrar asistente' : 'Abrir asistente de la playa'}
        aria-expanded={abierto}
        className="fixed bottom-4 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 text-2xl text-white shadow-lg transition hover:bg-sky-700 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-sky-300 active:scale-95"
    >
        {abierto ? '✕' : '💬'}
      </button>

      {/* Panel de chat */}
      {abierto && (
        <div
          role="dialog"
          aria-label={`Asistente de ${playa.nombre}`}
          className="fixed bottom-20 right-4 z-30 flex h-[28rem] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-sky-100"
        >
          <header className="flex items-center gap-2 bg-sky-600 px-4 py-3 text-white">
            <span className="text-xl">🏖️</span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Asistente de PlayIA</p>
              <p className="text-xs text-sky-100">{playa.nombre}</p>
            </div>
          </header>

          <div className="flex-1 space-y-2 overflow-y-auto bg-sky-50/50 p-3">
            {mensajes.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  m.rol === 'user'
                    ? 'ml-auto bg-sky-600 text-white'
                    : 'mr-auto bg-white text-sky-900 ring-1 ring-sky-100'
                }`}
              >
                {m.texto}
              </div>
            ))}
            {cargando && (
              <div className="mr-auto rounded-2xl bg-white px-3 py-2 text-sm text-sky-400 ring-1 ring-sky-100">
                escribiendo…
              </div>
            )}
            {mensajes.length <= 1 && !cargando && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGERENCIAS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => enviar(s)}
                    className="rounded-full bg-white px-3 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-200 transition hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={finRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              enviar()
            }}
            className="flex items-center gap-2 border-t border-sky-100 p-2"
          >
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribe tu pregunta…"
              aria-label="Escribe tu pregunta"
              className="min-w-0 flex-1 rounded-full bg-sky-50 px-4 py-2 text-sm text-sky-900 placeholder:text-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            <button
              type="submit"
              disabled={cargando || !texto.trim()}
              aria-label="Enviar"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ➤
            </button>
          </form>

          <p className="bg-white px-3 pb-2 text-center text-[10px] text-slate-400">
            Datos reales de Open-Meteo · IA de Marirrodriga.IA
          </p>
        </div>
      )}
    </>
  )
}
