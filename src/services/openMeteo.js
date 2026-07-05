const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine'

// Devuelve el índice de la hora <= ahora más cercana (o 0 si todas son futuras).
function indiceHora(times, ahora) {
  const t = ahora.getTime()
  let idx = 0
  for (let i = 0; i < times.length; i++) {
    if (new Date(times[i]).getTime() <= t) idx = i
    else break
  }
  return idx
}

export function normalizarHoraActual(forecast, marine, ahora = new Date()) {
  const i = indiceHora(forecast.hourly.time, ahora)
  const j = indiceHora(marine.hourly.time, ahora)
  return {
    temperatura: forecast.hourly.temperature_2m[i],
    viento: forecast.hourly.wind_speed_10m[i],
    uv: forecast.hourly.uv_index[i],
    oleaje: marine.hourly.wave_height[j],
    tempAgua: marine.hourly.sea_surface_temperature[j],
  }
}

export async function obtenerDatosPlaya(playa, fetchImpl = fetch) {
  const forecastParams = new URLSearchParams({
    latitude: playa.lat,
    longitude: playa.lon,
    hourly: 'temperature_2m,wind_speed_10m,uv_index',
    timezone: 'auto',
  })
  const marineParams = new URLSearchParams({
    latitude: playa.lat,
    longitude: playa.lon,
    hourly: 'wave_height,sea_surface_temperature',
    timezone: 'auto',
  })

  const [forecastRes, marineRes] = await Promise.all([
    fetchImpl(`${FORECAST_URL}?${forecastParams}`),
    fetchImpl(`${MARINE_URL}?${marineParams}`),
  ])
  const forecast = await forecastRes.json()
  const marine = await marineRes.json()
  return normalizarHoraActual(forecast, marine, new Date())
}
