import { obtenerMareaDemo } from './mareaDemo.js'
import { estadoMarea, proximo } from '../domain/marea.js'

// Obtiene la marea REAL desde el backend (/api/marea, que oculta la key de
// WorldTides). Si el backend falla, cae a los datos de ejemplo para no dejar
// la ficha vacía.
export async function obtenerMarea(playa, ahora = new Date()) {
  try {
    const res = await fetch(`/api/marea?lat=${playa.lat}&lon=${playa.lon}`)
    if (!res.ok) throw new Error('marea no disponible')
    const data = await res.json()
    const extremos = (data.extremos ?? []).map((e) => ({
      ...e,
      fecha: new Date(e.fecha),
    }))
    if (extremos.length === 0) throw new Error('sin extremos')

    const { subiendo, anterior, siguiente } = estadoMarea(extremos, ahora)
    return {
      extremos,
      subiendo,
      anterior,
      siguiente,
      proximaPleamar: proximo(extremos, 'pleamar', ahora),
      proximaBajamar: proximo(extremos, 'bajamar', ahora),
      rango: data.rango,
      mareaViva: data.mareaViva,
      esDemo: false,
    }
  } catch {
    return obtenerMareaDemo(playa, ahora)
  }
}
