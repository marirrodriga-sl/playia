const PUNTO = { verde: 'bg-green-500', ambar: 'bg-amber-400', rojo: 'bg-red-500' }

function diaCorto(fecha, i) {
  if (i === 0) return 'Hoy'
  if (i === 1) return 'Mañ.'
  return fecha.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')
}

// Tira horizontal con el semáforo previsto de los próximos días (hora central).
export default function Prevision({ dias }) {
  if (!dias || dias.length === 0) return null

  return (
    <div className="mt-4 rounded-xl bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-sky-900">Próximos días</h2>
      <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {dias.slice(0, 7).map((d, i) => (
          <li
            key={d.fecha.toISOString()}
            className="flex min-w-[3.5rem] shrink-0 flex-col items-center gap-1 rounded-lg bg-sky-50 px-2 py-2"
          >
            <span className="text-xs font-medium capitalize text-sky-500">{diaCorto(d.fecha, i)}</span>
            <span
              className={`h-3.5 w-3.5 rounded-full ${PUNTO[d.veredicto.nivel] ?? PUNTO.ambar}`}
              role="img"
              aria-label={`Estado previsto: ${d.veredicto.frase}`}
            />
            <span className="text-sm font-semibold text-sky-900">{Math.round(d.datos.temperatura)}°</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
