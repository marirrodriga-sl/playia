// La API gratuita es SOLO para uso no comercial y está limitada (600/min,
// 5.000/hora, 10.000/día). Con una clave de suscripción, Open-Meteo sirve el
// mismo API desde el endpoint de cliente, con licencia comercial y sin tope
// diario: el día que PlayIA se monetice (white-label B2B) basta con definir
// VITE_OPEN_METEO_KEY, sin tocar el código.
const GRATIS = {
  forecast: 'https://api.open-meteo.com/v1/forecast',
  marine: 'https://marine-api.open-meteo.com/v1/marine',
}
const COMERCIAL = {
  forecast: 'https://customer-api.open-meteo.com/v1/forecast',
  marine: 'https://customer-marine-api.open-meteo.com/v1/marine',
}

function clavePorDefecto() {
  try {
    return import.meta.env?.VITE_OPEN_METEO_KEY || null
  } catch {
    return null // fuera de Vite (tests, función serverless)
  }
}

const CAMPOS_FORECAST = 'temperature_2m,wind_speed_10m,uv_index'
const CAMPOS_MARINE = 'wave_height,sea_surface_temperature'

// Open-Meteo admite varias coordenadas por llamada, pero la URL no puede
// crecer sin límite: troceamos en grupos de este tamaño.
export const TAM_LOTE = 100

// La cuota agotada (429) es un caso esperado y recuperable: merece su propio
// tipo para que la interfaz pueda decir "sin cuota" en vez de "sin datos".
export class ErrorCuota extends Error {
  constructor(mensaje = 'Se ha agotado la cuota de Open-Meteo') {
    super(mensaje)
    this.name = 'ErrorCuota'
  }
}

export class ErrorApi extends Error {
  constructor(status) {
    super(`Open-Meteo respondió ${status}`)
    this.name = 'ErrorApi'
    this.status = status
  }
}

// Sin esto, un 429 devolvía un cuerpo sin `hourly` y el fallo afloraba mucho
// más tarde como un TypeError opaco que la interfaz pintaba como "sin datos".
async function leerJson(res) {
  if (res.ok) return res.json()
  if (res.status === 429) throw new ErrorCuota()
  throw new ErrorApi(res.status)
}

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

function construirUrl(base, playas, hourly, clave) {
  const params = new URLSearchParams({
    latitude: playas.map((p) => p.lat).join(','),
    longitude: playas.map((p) => p.lon).join(','),
    hourly,
    timezone: 'auto',
  })
  if (clave) params.set('apikey', clave)
  return `${base}?${params}`
}

// Con una sola coordenada la API devuelve un objeto; con varias, un array en
// el mismo orden en que se pidieron. Normalizamos siempre a array.
function comoLista(json, n) {
  const lista = Array.isArray(json) ? json : [json]
  if (lista.length !== n) throw new ErrorApi(`respuesta con ${lista.length} de ${n} localizaciones`)
  return lista
}

async function pedirLote(playas, fetchImpl, clave = clavePorDefecto()) {
  const base = clave ? COMERCIAL : GRATIS
  const [forecastRes, marineRes] = await Promise.all([
    fetchImpl(construirUrl(base.forecast, playas, CAMPOS_FORECAST, clave)),
    fetchImpl(construirUrl(base.marine, playas, CAMPOS_MARINE, clave)),
  ])
  const [forecast, marine] = await Promise.all([leerJson(forecastRes), leerJson(marineRes)])
  return {
    forecast: comoLista(forecast, playas.length),
    marine: comoLista(marine, playas.length),
  }
}

// Pide N playas gastando 2 peticiones por lote en vez de 2 por playa.
// Devuelve un Map id -> datos normalizados.
export async function obtenerDatosPlayas(
  playas,
  fetchImpl = fetch,
  ahora = new Date(),
  clave = clavePorDefecto(),
) {
  const mapa = new Map()
  for (let i = 0; i < playas.length; i += TAM_LOTE) {
    const trozo = playas.slice(i, i + TAM_LOTE)
    const { forecast, marine } = await pedirLote(trozo, fetchImpl, clave)
    trozo.forEach((playa, k) => {
      mapa.set(playa.id, normalizarHoraActual(forecast[k], marine[k], ahora))
    })
  }
  return mapa
}

export async function obtenerDatosPlaya(playa, fetchImpl = fetch) {
  const { forecast, marine } = await pedirLote([playa], fetchImpl)
  return normalizarHoraActual(forecast[0], marine[0], new Date())
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
  const { forecast, marine } = await pedirLote([playa], fetchImpl)
  return extraerPrevision(forecast[0], marine[0])
}
