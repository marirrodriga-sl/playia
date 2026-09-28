import { describe, it, expect } from 'vitest'
import {
  normalizarHoraActual,
  extraerPrevision,
  obtenerDatosPlaya,
  obtenerDatosPlayas,
  ErrorCuota,
  ErrorApi,
} from './openMeteo.js'

const forecast = {
  hourly: {
    time: ['2026-07-05T10:00', '2026-07-05T11:00', '2026-07-05T12:00'],
    temperature_2m: [23, 24, 25],
    wind_speed_10m: [10, 12, 14],
    uv_index: [5, 6, 7],
  },
}

const marine = {
  hourly: {
    time: ['2026-07-05T10:00', '2026-07-05T11:00', '2026-07-05T12:00'],
    wave_height: [0.3, 0.4, 0.5],
    sea_surface_temperature: [21, 21.5, 22],
  },
}

describe('normalizarHoraActual', () => {
  it('extrae la hora que coincide con "ahora"', () => {
    const datos = normalizarHoraActual(forecast, marine, new Date('2026-07-05T11:20'))
    expect(datos).toEqual({
      temperatura: 24,
      viento: 12,
      uv: 6,
      oleaje: 0.4,
      tempAgua: 21.5,
    })
  })

  it('usa la primera hora si "ahora" es anterior a todos los tramos', () => {
    const datos = normalizarHoraActual(forecast, marine, new Date('2026-07-05T08:00'))
    expect(datos.temperatura).toBe(23)
  })
})

describe('extraerPrevision', () => {
  const f = {
    hourly: {
      time: ['2026-07-05T13:00', '2026-07-05T14:00', '2026-07-06T14:00'],
      temperature_2m: [24, 26, 27],
      wind_speed_10m: [10, 11, 40],
      uv_index: [5, 7, 8],
    },
  }
  const m = {
    hourly: {
      time: ['2026-07-05T13:00', '2026-07-05T14:00', '2026-07-06T14:00'],
      wave_height: [0.3, 0.4, 0.5],
      sea_surface_temperature: [21, 22, 22],
    },
  }

  it('toma un punto por día a las 14:00 con sus datos', () => {
    const dias = extraerPrevision(f, m)
    expect(dias).toHaveLength(2)
    expect(dias[0].datos).toEqual({ temperatura: 26, viento: 11, uv: 7, oleaje: 0.4, tempAgua: 22 })
    expect(dias[1].datos.viento).toBe(40)
    expect(dias[0].fecha).toBeInstanceOf(Date)
  })
})

// --- Cuota y errores -------------------------------------------------------

describe('control de errores HTTP', () => {
  const resFake = (status, body) => async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  })

  it('lanza ErrorCuota (no TypeError) cuando la API responde 429', async () => {
    const f = resFake(429, { error: true, reason: 'Daily API request limit exceeded' })
    await expect(obtenerDatosPlaya({ lat: 27.7, lon: -15.6 }, f)).rejects.toBeInstanceOf(ErrorCuota)
  })

  it('lanza ErrorApi ante un 500', async () => {
    const f = resFake(500, {})
    await expect(obtenerDatosPlaya({ lat: 27.7, lon: -15.6 }, f)).rejects.toBeInstanceOf(ErrorApi)
  })
})

// --- Lote ------------------------------------------------------------------

describe('obtenerDatosPlayas (lote)', () => {
  const playas = [
    { id: 'a', lat: 27.7, lon: -15.6 },
    { id: 'b', lat: 28.1, lon: -15.4 },
  ]

  it('pide TODAS las playas en una sola llamada por API y las casa por orden', async () => {
    const urls = []
    const fetchLote = async (url) => {
      urls.push(url)
      const marina = url.includes('marine')
      const uno = (t, w) =>
        marina
          ? { hourly: { time: ['2026-07-05T11:00'], wave_height: [w], sea_surface_temperature: [21] } }
          : { hourly: { time: ['2026-07-05T11:00'], temperature_2m: [t], wind_speed_10m: [5], uv_index: [6] } }
      return { ok: true, status: 200, json: async () => [uno(20, 0.2), uno(30, 0.9)] }
    }

    const mapa = await obtenerDatosPlayas(playas, fetchLote, new Date('2026-07-05T11:00'))

    expect(urls).toHaveLength(2) // 2 APIs, NO 2 por playa
    expect(urls[0]).toContain('latitude=27.7%2C28.1')
    expect(mapa.get('a')).toMatchObject({ temperatura: 20, oleaje: 0.2 })
    expect(mapa.get('b')).toMatchObject({ temperatura: 30, oleaje: 0.9 })
  })

  it('propaga ErrorCuota del lote', async () => {
    const f = async () => ({ ok: false, status: 429, json: async () => ({}) })
    await expect(obtenerDatosPlayas(playas, f)).rejects.toBeInstanceOf(ErrorCuota)
  })
})
