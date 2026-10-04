import { COMERCIAL } from './openMeteo.js'

// Lo único que la función del servidor deja pasar hacia Open-Meteo. Es una
// lista blanca a propósito: así /api/meteo no puede usarse como relé para
// llamar a otra cosa, ni para colar una apikey ajena.
const PERMITIDOS = ['latitude', 'longitude', 'hourly', 'timezone', 'forecast_days']

// Devuelve la URL de cliente (comercial) a la que reenviar, o null si el
// recurso no es uno de los dos que conocemos.
export function urlProxy(recurso, consulta, clave) {
  const base = COMERCIAL[recurso]
  if (!base) return null
  const params = new URLSearchParams()
  for (const nombre of PERMITIDOS) {
    const valor = consulta?.[nombre]
    if (valor !== undefined && valor !== null && valor !== '') params.set(nombre, String(valor))
  }
  params.set('apikey', clave)
  return `${base}?${params}`
}
