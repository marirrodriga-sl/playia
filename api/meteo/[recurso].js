import { urlProxy } from '../../src/services/proxyMeteo.js'

// Proxy de Open-Meteo para el NAVEGADOR cuando hay suscripción comercial.
// Existe por una razón: la clave no puede viajar al cliente (Vite inlinea
// cualquier variable VITE_ en el bundle), así que la pone aquí el servidor.
// Con OPEN_METEO_KEY sin definir no se usa: el navegador va directo a la API
// gratuita y esta función nunca se llama.
export default async function handler(req, res) {
  const clave = process.env.OPEN_METEO_KEY
  if (!clave) return res.status(503).json({ error: 'Sin suscripción de Open-Meteo configurada.' })

  const url = urlProxy(req.query?.recurso, req.query, clave)
  if (!url) return res.status(400).json({ error: 'Recurso no válido.' })

  try {
    const upstream = await fetch(url)
    const cuerpo = await upstream.text()
    // La cuota (429) y los errores se pasan tal cual: la interfaz ya sabe
    // distinguir "sin cuota" de "sin datos" por el código de estado.
    res.status(upstream.status)
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.setHeader('cache-control', 'public, max-age=600, s-maxage=600')
    return res.send(cuerpo)
  } catch {
    return res.status(502).json({ error: 'Open-Meteo no responde.' })
  }
}
