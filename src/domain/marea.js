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
