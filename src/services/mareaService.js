import { obtenerMareaDemo } from './mareaDemo.js'
import { estadoMarea, proximo, extraerMarea, instanteDesdeLocal } from '../domain/marea.js'

const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine'

// Obtiene la marea REAL desde Open-Meteo (nivel del mar por horas, gratis y sin
// API key). El navegador la llama directamente y el dominio (extraerMarea)
// deriva pleamar/bajamar de la curva. Si algo falla, cae a los datos de ejemplo
// para no dejar la ficha vacía.
export async function obtenerMarea(playa, ahora = new Date()) {
  try {
    const params = new URLSearchParams({
      latitude: playa.lat,
      longitude: playa.lon,
      hourly: 'sea_level_height_msl',
      timezone: 'auto',
      forecast_days: '2', // 2 días para tener vecinos y clasificar los extremos del día
    })
    const res = await fetch(`${MARINE_URL}?${params}`)
    if (!res.ok) throw new Error('marea no disponible')
    const data = await res.json()

    const { extremos: extremosISO, rango, mareaViva } = extraerMarea(data.hourly)
    const offset = data.utc_offset_seconds ?? 0
    const extremos = extremosISO.map((e) => ({ ...e, fecha: instanteDesdeLocal(e.fecha, offset) }))
    if (extremos.length === 0) throw new Error('sin extremos')

    const { subiendo, anterior, siguiente } = estadoMarea(extremos, ahora)
    return {
      extremos,
      subiendo,
      anterior,
      siguiente,
      proximaPleamar: proximo(extremos, 'pleamar', ahora),
      proximaBajamar: proximo(extremos, 'bajamar', ahora),
      rango,
      mareaViva,
      esDemo: false,
    }
  } catch {
    return obtenerMareaDemo(playa, ahora)
  }
}
