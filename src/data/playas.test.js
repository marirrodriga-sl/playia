import { describe, it, expect } from 'vitest'
import { PLAYAS, ISLAS, dedupePlayas } from './playas.js'

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

  it('no hay playas duplicadas (mismo nombre + isla) tras el deduplicado', () => {
    const claves = PLAYAS.map((p) => `${p.isla}|${p.nombre.toLowerCase()}`)
    expect(new Set(claves).size).toBe(claves.length)
  })
})

describe('dedupePlayas', () => {
  it('colapsa mismo nombre+isla y playas a menos de 300 m', () => {
    const entrada = [
      { id: 'a', nombre: 'Playa de Mogán', isla: 'Gran Canaria', orientacion: 'sur', lat: 27.816, lon: -15.759 },
      { id: 'b', nombre: 'Playa de Mogán', isla: 'Gran Canaria', orientacion: 'sur', lat: 27.817, lon: -15.76 }, // mismo nombre
      { id: 'c', nombre: 'Otro Arenal', isla: 'Gran Canaria', orientacion: 'sur', lat: 27.8161, lon: -15.7591 }, // a <300 m
      { id: 'd', nombre: 'Playa Lejana', isla: 'Gran Canaria', orientacion: 'norte', lat: 28.15, lon: -15.42 }, // distinta
    ]
    const salida = dedupePlayas(entrada)
    expect(salida.map((p) => p.id)).toEqual(['a', 'd'])
  })

  it('conserva playas con el mismo nombre en islas distintas', () => {
    const entrada = [
      { id: 'chica-h', nombre: 'Playa Chica', isla: 'El Hierro', orientacion: 'sur', lat: 27.68, lon: -17.96 },
      { id: 'chica-gc', nombre: 'Playa Chica', isla: 'Gran Canaria', orientacion: 'norte', lat: 28.1, lon: -15.4 },
    ]
    expect(dedupePlayas(entrada)).toHaveLength(2)
  })

  it('todas las islas del listado tienen al menos una playa', () => {
    for (const isla of ISLAS) {
      expect(PLAYAS.some((p) => p.isla === isla)).toBe(true)
    }
  })
})
