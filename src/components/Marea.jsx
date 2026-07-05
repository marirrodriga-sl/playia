function hhmm(fecha) {
  return fecha.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Atlantic/Canary', // hora local de las playas, no la del visitante
  })
}

// Construye la curva de marea del día (0–24h) interpolando entre extremos con
// un coseno suave, para el mini-gráfico SVG.
function construirCurva(extremos, width, height, pad) {
  const dia = new Date(extremos[0].fecha)
  dia.setHours(0, 0, 0, 0)
  const t0 = dia.getTime()
  const t1 = t0 + 24 * 60 * 60000
  // Auto-escala vertical a las alturas reales (el datum de WorldTides puede ser
  // negativo y de rango pequeño), con un margen para que la curva respire.
  const alturas = extremos.map((e) => e.altura)
  const lo = Math.min(...alturas)
  const hi = Math.max(...alturas)
  const margen = (hi - lo) * 0.3 || 0.5
  const minA = lo - margen
  const maxA = hi + margen
  const x = (t) => pad + ((t - t0) / (t1 - t0)) * (width - 2 * pad)
  const y = (a) => height - pad - ((a - minA) / (maxA - minA)) * (height - 2 * pad)

  const alturaEn = (t) => {
    if (t <= extremos[0].fecha) return extremos[0].altura
    const ultimo = extremos[extremos.length - 1]
    if (t >= ultimo.fecha) return ultimo.altura
    for (let i = 0; i < extremos.length - 1; i++) {
      const a = extremos[i]
      const b = extremos[i + 1]
      if (t >= a.fecha && t <= b.fecha) {
        const frac = (t - a.fecha) / (b.fecha - a.fecha)
        const suave = (1 - Math.cos(Math.PI * frac)) / 2
        return a.altura + (b.altura - a.altura) * suave
      }
    }
    return extremos[0].altura
  }

  const pts = []
  for (let m = 0; m <= 24 * 60; m += 20) {
    const t = t0 + m * 60000
    pts.push([x(t), y(alturaEn(t))])
  }
  return { pts, x, y }
}

export default function Marea({ datos, ahora = new Date() }) {
  const { extremos, subiendo, coeficiente, rango, mareaViva, proximaPleamar, proximaBajamar, esDemo } = datos
  const detalleViva = coeficiente ? `coef. ${coeficiente}` : rango != null ? `rango ${rango} m` : ''

  const W = 320
  const H = 90
  const PAD = 12
  const { pts, x } = construirCurva(extremos, W, H, PAD)
  const linea = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const area = `${PAD},${H - PAD} ${linea} ${W - PAD},${H - PAD}`
  const nowX = x(ahora.getTime())

  return (
    <div className="mt-4 rounded-xl bg-white p-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold text-sky-900">Marea</h2>
        <span className="text-xs italic text-slate-400">
          {esDemo ? 'datos de ejemplo' : 'datos: WorldTides'}
        </span>
      </div>

      <p className="mt-1 text-lg font-medium text-sky-900">
        {subiendo ? '🌊 Marea subiendo' : '🏖️ Marea bajando'}
      </p>

      {mareaViva && (
        <p className="mt-2 rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-800">
          ⚠️ Marea viva{detalleViva ? ` (${detalleViva})` : ''} — en pleamar la playa
          puede quedarse con muy poca arena.
        </p>
      )}

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 w-full"
        role="img"
        aria-label={`Curva de marea del día. Ahora ${subiendo ? 'subiendo' : 'bajando'}.`}
      >
        <polygon points={area} fill="#bae6fd" />
        <polyline points={linea} fill="none" stroke="#0284c7" strokeWidth="2" />
        {extremos.map((e) => (
          <circle
            key={e.fecha.getTime()}
            cx={x(e.fecha.getTime())}
            cy={pts.reduce((best, p) =>
              Math.abs(p[0] - x(e.fecha.getTime())) < Math.abs(best[0] - x(e.fecha.getTime())) ? p : best,
            )[1]}
            r="3"
            fill={e.tipo === 'pleamar' ? '#0369a1' : '#38bdf8'}
          />
        ))}
        <line x1={nowX} y1={PAD - 6} x2={nowX} y2={H - PAD} stroke="#f59e0b" strokeWidth="2" />
      </svg>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-sky-50 p-3 text-center">
          <div className="text-xs text-sky-500">Próxima pleamar</div>
          <div className="text-lg font-semibold text-sky-900">{hhmm(proximaPleamar.fecha)}</div>
        </div>
        <div className="rounded-lg bg-sky-50 p-3 text-center">
          <div className="text-xs text-sky-500">Próxima bajamar</div>
          <div className="text-lg font-semibold text-sky-900">{hhmm(proximaBajamar.fecha)}</div>
        </div>
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-sky-700">
        {extremos.map((e) => (
          <li key={e.fecha.getTime()}>
            <span className="font-medium capitalize">{e.tipo}</span> {hhmm(e.fecha)}
          </li>
        ))}
      </ul>
    </div>
  )
}
