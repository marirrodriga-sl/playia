// Lógica de WorldTides para el backend proxy.
// La key nunca sale de aquí (servidor); el frontend solo llama a /api/marea.

const BASE = 'https://www.worldtides.info/api/v3'
const UMBRAL_MAREA_VIVA = 2.2 // m de rango pleamar-bajamar (Canarias: viva ~2.5-3m)

// Convierte la respuesta de WorldTides (extremes) a nuestra forma neutra.
// Entrada: { extremes: [{ dt, height, type: 'High'|'Low' }, ...] }
// Salida:  { extremos: [{ tipo, fecha(ISO), altura }], rango, mareaViva, fuente }
export function normalizarExtremos(json) {
  const extremes = json?.extremes ?? []
  const extremos = extremes.map((e) => ({
    tipo: e.type === 'High' ? 'pleamar' : 'bajamar',
    fecha: new Date(e.dt * 1000).toISOString(),
    altura: Math.round(e.height * 100) / 100,
  }))
  const pleamares = extremos.filter((e) => e.tipo === 'pleamar').map((e) => e.altura)
  const bajamares = extremos.filter((e) => e.tipo === 'bajamar').map((e) => e.altura)
  const rango =
    pleamares.length && bajamares.length
      ? Math.round((Math.max(...pleamares) - Math.min(...bajamares)) * 100) / 100
      : null
  return {
    extremos,
    rango,
    mareaViva: rango != null && rango >= UMBRAL_MAREA_VIVA,
    fuente: 'worldtides',
  }
}

// Llama a WorldTides para los extremos del día de hoy (hora local del servidor).
export async function fetchMarea(lat, lon, key, fetchImpl = fetch) {
  const inicioDia = new Date()
  inicioDia.setHours(0, 0, 0, 0)
  const start = Math.floor(inicioDia.getTime() / 1000)
  const params = new URLSearchParams({
    extremes: '',
    start: String(start),
    length: String(25 * 3600), // 25h para cubrir todo el día local
    lat: String(lat),
    lon: String(lon),
    key,
  })
  const res = await fetchImpl(`${BASE}?${params}`)
  const json = await res.json()
  if (json?.status && json.status !== 200) {
    const err = new Error(json.error || 'WorldTides error')
    err.status = json.status
    throw err
  }
  return normalizarExtremos(json)
}
