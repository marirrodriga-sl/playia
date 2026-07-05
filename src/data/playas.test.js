import { describe, it, expect } from 'vitest'
import { PLAYAS, ISLAS } from './playas.js'

describe('PLAYAS', () => {
  it('contiene muchas playas de todas las islas', () => {
    expect(PLAYAS.length).toBeGreaterThan(200)
  })

  it('cada playa tiene los campos y coordenadas dentro de Canarias', () => {
    for (const p of PLAYAS) {
      expect(typeof p.id).toBe('string')
      expect(typeof p.nombre).toBe('string')
      expect(ISLAS).toContain(p.isla)
      expect(['norte', 'sur']).toContain(p.orientacion)
      expect(p.lat).toBeGreaterThan(27.5)
      expect(p.lat).toBeLessThan(29.5)
      expect(p.lon).toBeGreaterThan(-18.3)
      expect(p.lon).toBeLessThan(-13.3)
    }
  })

  it('los ids son únicos', () => {
    const ids = PLAYAS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('todas las islas del listado tienen al menos una playa', () => {
    for (const isla of ISLAS) {
      expect(PLAYAS.some((p) => p.isla === isla)).toBe(true)
    }
  })
})
