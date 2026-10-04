import { describe, it, expect } from 'vitest'
import { obtenerMarea } from './mareaService.js'

const playa = { id: 'a', nombre: 'A', lat: 27.7, lon: -15.6 }

describe('obtenerMarea: por dónde pide la marea', () => {
  const capturar = () => {
    const urls = []
    const fetchImpl = async (url) => {
      urls.push(url)
      return { ok: false, status: 503, json: async () => ({}) }
    }
    return { urls, fetchImpl }
  }

  it('sin suscripción la pide a la API marina gratuita', async () => {
    const { urls, fetchImpl } = capturar()
    await obtenerMarea(playa, new Date(), { fetchImpl, clave: null, proxy: false })
    expect(urls[0]).toContain('https://marine-api.open-meteo.com/v1/marine')
  })

  it('con proxy (navegador) la pide por /api/meteo y no a la gratuita', async () => {
    const { urls, fetchImpl } = capturar()
    await obtenerMarea(playa, new Date(), { fetchImpl, clave: null, proxy: true })
    expect(urls[0]).toContain('/api/meteo/marine')
    expect(urls[0]).not.toContain('marine-api.open-meteo.com')
  })

  it('con clave (servidor) la pide al endpoint de cliente con su clave', async () => {
    const { urls, fetchImpl } = capturar()
    await obtenerMarea(playa, new Date(), { fetchImpl, clave: 'CLAVE123', proxy: false })
    expect(urls[0]).toContain('https://customer-marine-api.open-meteo.com/v1/marine')
    expect(urls[0]).toContain('apikey=CLAVE123')
  })
})
