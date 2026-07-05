import { describe, it, expect } from 'vitest'
import { normalizarExtremos } from './_worldtides.js'

const respuesta = {
  status: 200,
  extremes: [
    { dt: 1751683800, height: 0.75, type: 'Low' },
    { dt: 1751706120, height: 2.61, type: 'High' },
    { dt: 1751728440, height: 0.82, type: 'Low' },
    { dt: 1751750760, height: 2.58, type: 'High' },
  ],
}

describe('normalizarExtremos', () => {
  it('mapea High→pleamar y Low→bajamar', () => {
    const { extremos } = normalizarExtremos(respuesta)
    expect(extremos.map((e) => e.tipo)).toEqual([
      'bajamar',
      'pleamar',
      'bajamar',
      'pleamar',
    ])
  })

  it('convierte dt (unix) a fecha ISO', () => {
    const { extremos } = normalizarExtremos(respuesta)
    expect(extremos[0].fecha).toBe(new Date(1751683800 * 1000).toISOString())
  })

  it('calcula el rango y marca marea viva cuando es grande', () => {
    const r = normalizarExtremos(respuesta)
    expect(r.rango).toBe(1.86) // 2.61 - 0.75
    expect(r.mareaViva).toBe(false)
  })

  it('marca marea viva cuando el rango supera el umbral', () => {
    const grande = {
      extremes: [
        { dt: 1, height: 0.3, type: 'Low' },
        { dt: 2, height: 2.9, type: 'High' },
      ],
    }
    expect(normalizarExtremos(grande).mareaViva).toBe(true)
  })

  it('no rompe con respuesta vacía', () => {
    const r = normalizarExtremos({})
    expect(r.extremos).toEqual([])
    expect(r.rango).toBe(null)
    expect(r.mareaViva).toBe(false)
  })
})
