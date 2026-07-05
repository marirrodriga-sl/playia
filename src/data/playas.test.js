import { describe, it, expect } from 'vitest'
import { PLAYAS } from './playas.js'

describe('PLAYAS', () => {
  it('contiene al menos 5 playas', () => {
    expect(PLAYAS.length).toBeGreaterThanOrEqual(5)
  })

  it('cada playa tiene id, nombre y coordenadas válidas', () => {
    for (const p of PLAYAS) {
      expect(typeof p.id).toBe('string')
      expect(typeof p.nombre).toBe('string')
      expect(p.lat).toBeGreaterThan(27)
      expect(p.lat).toBeLessThan(29)
      expect(p.lon).toBeLessThan(-15)
      expect(p.lon).toBeGreaterThan(-16)
    }
  })

  it('los ids son únicos', () => {
    const ids = PLAYAS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
