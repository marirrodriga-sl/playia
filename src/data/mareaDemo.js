// Datos de marea de EJEMPLO (demo).
// La estructura imita lo que devolverá la API real (WorldTides / Puertos del Estado),
// de modo que conectarla luego sea solo cambiar la fuente, no la UI.

// Genera los 4 extremos de marea de un día tipo (~cada 6h12m), con un pequeño
// desfase por playa para que no sean todas idénticas.
export function extremosDelDia(playa, base = new Date()) {
  const desfaseMin = (playa.nombre.charCodeAt(0) % 3) * 20 // 0, 20 o 40 min
  const inicio = new Date(base)
  inicio.setHours(2, 30 + desfaseMin, 0, 0) // primera bajamar ~02:30
  const tipos = ['bajamar', 'pleamar', 'bajamar', 'pleamar']
  const alturas = { bajamar: 0.8, pleamar: 2.6 }
  return tipos.map((tipo, i) => ({
    tipo,
    fecha: new Date(inicio.getTime() + i * (6 * 60 + 12) * 60000),
    altura: alturas[tipo],
  }))
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
// (o el primero del día si ya han pasado todos).
export function proximo(extremos, tipo, ahora = new Date()) {
  return (
    extremos.find((e) => e.tipo === tipo && e.fecha > ahora) ??
    extremos.find((e) => e.tipo === tipo)
  )
}

export function obtenerMareaDemo(playa, ahora = new Date()) {
  const extremos = extremosDelDia(playa, ahora)
  const { subiendo, anterior, siguiente } = estadoMarea(extremos, ahora)
  const coeficiente = 95 // demo: coeficiente alto → marea viva
  return {
    extremos,
    subiendo,
    anterior,
    siguiente,
    proximaPleamar: proximo(extremos, 'pleamar', ahora),
    proximaBajamar: proximo(extremos, 'bajamar', ahora),
    coeficiente,
    mareaViva: coeficiente >= 90,
    esDemo: true,
  }
}
