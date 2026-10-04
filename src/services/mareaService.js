import { obtenerMareaDemo } from './mareaDemo.js'
import { destino } from './openMeteo.js'
import {
  estadoMarea,
  proximo,
  extraerMarea,
  instanteDesdeLocal,
  rangosPorDia,
  esMareaViva,
} from '../domain/marea.js'

// Obtiene la marea REAL desde Open-Meteo (nivel del mar por horas) y el
// dominio (extraerMarea) deriva pleamar/bajamar de la curva. Va por donde diga
// `destino`: la API gratuita, el endpoint de cliente o /api/meteo — igual que
// el resto de los datos, para que la suscripción comercial valga también aquí.
// Si algo falla, cae a los datos de ejemplo para no dejar la ficha vacía.
export async function obtenerMarea(playa, ahora = new Date(), opciones = {}) {
  const { fetchImpl = fetch, ...rutas } = opciones
  try {
    const { base, clave } = destino('marine', rutas)
    const params = new URLSearchParams({
      latitude: playa.lat,
      longitude: playa.lon,
      hourly: 'sea_level_height_msl',
      timezone: 'auto',
      forecast_days: '10', // ~ciclo mareal completo, para auto-calibrar la marea viva
    })
    if (clave) params.set('apikey', clave)
    const res = await fetchImpl(`${base}?${params}`)
    if (!res.ok) throw new Error('marea no disponible')
    const data = await res.json()

    const { extremos: extremosISO, rango } = extraerMarea(data.hourly)
    const mareaViva = esMareaViva(rango, rangosPorDia(data.hourly))
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
