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

async function pedirForecastYMarine(playa, fetchImpl) {
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
  return { forecast: await forecastRes.json(), marine: await marineRes.json() }
}

export async function obtenerDatosPlaya(playa, fetchImpl = fetch) {
  const { forecast, marine } = await pedirForecastYMarine(playa, fetchImpl)
  return normalizarHoraActual(forecast, marine, new Date())
}

// Previsión de los próximos días: toma la hora central (14:00 local) de cada
// día del pronóstico horario y devuelve los datos con los que el motor de
// reglas evaluará su semáforo. Reutiliza el mismo fetch que el estado actual.
export function extraerPrevision(forecast, marine) {
  const times = forecast.hourly.time
  const dias = []
  for (let i = 0; i < times.length; i++) {
    if (!times[i].endsWith('T14:00')) continue
    const j = marine.hourly.time.indexOf(times[i])
    dias.push({
      fecha: new Date(times[i]),
      datos: {
        temperatura: forecast.hourly.temperature_2m[i],
        viento: forecast.hourly.wind_speed_10m[i],
        uv: forecast.hourly.uv_index[i],
        oleaje: j >= 0 ? marine.hourly.wave_height[j] : 0,
        tempAgua: j >= 0 ? marine.hourly.sea_surface_temperature[j] : 20,
      },
    })
  }
  return dias
}

export async function obtenerPrevisionPlaya(playa, fetchImpl = fetch) {
  const { forecast, marine } = await pedirForecastYMarine(playa, fetchImpl)
  return extraerPrevision(forecast, marine)
}
