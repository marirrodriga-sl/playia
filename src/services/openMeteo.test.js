import { describe, it, expect } from 'vitest'
import { normalizarHoraActual } from './openMeteo.js'

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
