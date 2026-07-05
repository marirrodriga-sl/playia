import { zonaActiva } from '../data/escalas.js'

export default function Escala({ config, valor }) {
  const { icono, etiqueta, unidad, min, max, zonas } = config
  const zona = zonaActiva(valor, zonas)
  const pct = Math.max(0, Math.min(100, ((valor - min) / (max - min)) * 100))

  // Anchura de cada segmento coloreado, proporcional a su tramo dentro [min,max].
  let prev = min
  const segmentos = zonas.map((z) => {
    const fin = Math.min(z.hasta, max)
    const w = Math.max(0, ((fin - prev) / (max - min)) * 100)
    prev = fin
    return { clase: z.clase, w }
  })

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-sky-700">
          {icono} {etiqueta}
        </span>
        <span className="text-xl font-bold text-sky-900">
          {Math.round(valor)}
          {unidad}
        </span>
      </div>

      <div className="relative mt-3">
        <div className="flex h-3 w-full overflow-hidden rounded-full">
          {segmentos.map((s, i) => (
            <div key={i} className={s.clase} style={{ width: `${s.w}%` }} />
          ))}
        </div>
        <div
          className="absolute -top-1 -translate-x-1/2"
          style={{ left: `${pct}%` }}
          aria-hidden="true"
        >
          <div className="h-5 w-1 rounded-full bg-sky-900 ring-2 ring-white" />
        </div>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-sky-900">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${zona.clase}`} />
        {zona.etiqueta}
      </p>
    </div>
  )
}
