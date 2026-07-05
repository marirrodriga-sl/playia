// Lógica de negocio pura de la marea (sin I/O, sin React).
// La usan tanto los datos reales (mareaService) como los de ejemplo (mareaDemo).

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
