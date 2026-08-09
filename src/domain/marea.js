// Lógica de negocio pura de la marea (sin I/O, sin React).
// La usan tanto los datos reales (mareaService) como los de ejemplo (mareaDemo).

const UMBRAL_MAREA_VIVA = 2.0 // m de rango pleamar-bajamar sobre el nivel medio (MSL)

const r2 = (n) => Math.round(n * 100) / 100

// Convierte una hora local de la playa (ISO sin zona, p. ej. '2026-08-09T12:00')
// más el desfase UTC de esa zona (segundos, de Open-Meteo `utc_offset_seconds`)
// en un instante absoluto (Date). Así la marea se muestra en hora de la PLAYA
// aunque quien mira la web esté en otra zona horaria.
export function instanteDesdeLocal(localISO, offsetSeconds) {
  return new Date(Date.parse(`${localISO}Z`) - offsetSeconds * 1000)
}

// Extrae los extremos de marea (pleamar/bajamar) de una serie horaria de nivel
// del mar (Open-Meteo `sea_level_height_msl`). Función PURA: detecta máximos y
// mínimos locales y se queda con los del primer día de la serie (Open-Meteo
// empieza en 00:00 local de hoy). Trabaja con horas locales SIN zona, así que es
// independiente de la zona horaria de la máquina.
// Entrada: { time: string[], sea_level_height_msl: number[] } (ISO local + metros).
// Salida:  { extremos: [{ tipo, fecha(ISO local), altura }], rango, mareaViva }.
export function extraerMarea(hourly, { umbralViva = UMBRAL_MAREA_VIVA } = {}) {
  const time = hourly?.time ?? []
  const sea = hourly?.sea_level_height_msl ?? []
  const diaPrimero = time[0]?.slice(0, 10) // 'YYYY-MM-DD' del primer punto

  const extremos = []
  for (let i = 1; i < sea.length - 1; i++) {
    const [prev, cur, next] = [sea[i - 1], sea[i], sea[i + 1]]
    const esMax = cur >= prev && cur >= next && (cur > prev || cur > next)
    const esMin = cur <= prev && cur <= next && (cur < prev || cur < next)
    if (!esMax && !esMin) continue
    if (time[i].slice(0, 10) !== diaPrimero) continue
    extremos.push({ tipo: esMax ? 'pleamar' : 'bajamar', fecha: time[i], altura: r2(cur) })
  }

  const pleamares = extremos.filter((e) => e.tipo === 'pleamar').map((e) => e.altura)
  const bajamares = extremos.filter((e) => e.tipo === 'bajamar').map((e) => e.altura)
  const rango =
    pleamares.length && bajamares.length
      ? r2(Math.max(...pleamares) - Math.min(...bajamares))
      : null
  return { extremos, rango, mareaViva: rango != null && rango >= umbralViva }
}

// Estado de la marea "ahora": subiendo hacia pleamar o bajando hacia bajamar.
export function estadoMarea(extremos, ahora = new Date()) {
  let anterior = null
  let siguiente = null
  for (const e of extremos) {
    if (e.fecha <= ahora) anterior = e
    else {
      siguiente = e
      break
    }
  }
  const subiendo = siguiente
    ? siguiente.tipo === 'pleamar'
    : anterior?.tipo === 'bajamar'
  return { subiendo, anterior, siguiente }
}

// Primer extremo de un tipo ('pleamar' | 'bajamar') posterior a "ahora"
// (o el primero de la lista si ya han pasado todos).
export function proximo(extremos, tipo, ahora = new Date()) {
  return (
    extremos.find((e) => e.tipo === tipo && e.fecha > ahora) ??
    extremos.find((e) => e.tipo === tipo)
  )
}

// Altura del mar "ahora", interpolando entre extremos con un coseno suave
// (igual que la curva de la ficha).
export function alturaMareaAhora(extremos, ahora = new Date()) {
  if (!extremos || extremos.length === 0) return null
  if (ahora <= extremos[0].fecha) return extremos[0].altura
  const ultimo = extremos[extremos.length - 1]
  if (ahora >= ultimo.fecha) return ultimo.altura
  for (let i = 0; i < extremos.length - 1; i++) {
    const a = extremos[i]
    const b = extremos[i + 1]
    if (ahora >= a.fecha && ahora <= b.fecha) {
      const frac = (ahora - a.fecha) / (b.fecha - a.fecha)
      const suave = (1 - Math.cos(Math.PI * frac)) / 2
      return a.altura + (b.altura - a.altura) * suave
    }
  }
  return extremos[0].altura
}

// Nivel del mar "ahora" normalizado a 0..1 (0 = bajamar del día, 1 = pleamar).
// Sirve para dibujar cuánto sube el agua en el fondo dinámico.
export function fraccionMareaAhora(extremos, ahora = new Date()) {
  if (!extremos || extremos.length === 0) return 0.5
  const alturas = extremos.map((e) => e.altura)
  const lo = Math.min(...alturas)
  const hi = Math.max(...alturas)
  if (hi === lo) return 0.5
  const actual = alturaMareaAhora(extremos, ahora)
  return Math.max(0, Math.min(1, (actual - lo) / (hi - lo)))
}
