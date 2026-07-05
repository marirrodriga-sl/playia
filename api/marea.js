import { fetchMarea } from './_worldtides.js'

// Caché en memoria por (lat,lon,día) para no gastar créditos de WorldTides
// en recargas del mismo día. En Vercel persiste mientras la instancia esté caliente.
const cache = new Map()

function claveDia(lat, lon) {
  const dia = new Date().toISOString().slice(0, 10)
  return `${lat},${lon},${dia}`
}

export default async function handler(req, res) {
  res.setHeader('content-type', 'application/json; charset=utf-8')

  const url = new URL(req.url, 'http://localhost')
  const lat = url.searchParams.get('lat')
  const lon = url.searchParams.get('lon')
  if (!lat || !lon) {
    res.statusCode = 400
    res.end(JSON.stringify({ error: 'Faltan lat/lon' }))
    return
  }

  const key = process.env.WORLDTIDES_KEY
  if (!key) {
    res.statusCode = 500
    res.end(JSON.stringify({ error: 'Falta WORLDTIDES_KEY en el servidor' }))
    return
  }

  const clave = claveDia(lat, lon)
  if (cache.has(clave)) {
    res.statusCode = 200
    res.end(JSON.stringify({ ...cache.get(clave), cacheado: true }))
    return
  }

  try {
    const marea = await fetchMarea(lat, lon, key)
    cache.set(clave, marea)
    res.statusCode = 200
    res.end(JSON.stringify(marea))
  } catch (e) {
    res.statusCode = 502
    res.end(JSON.stringify({ error: e.message || 'Error consultando la marea' }))
  }
}
