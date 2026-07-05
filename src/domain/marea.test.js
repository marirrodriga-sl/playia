import { describe, it, expect } from 'vitest'
import { estadoMarea, proximo, fraccionMareaAhora } from './marea.js'

const extremos = [
  { tipo: 'bajamar', fecha: new Date('2026-07-05T02:30') },
  { tipo: 'pleamar', fecha: new Date('2026-07-05T08:42') },
  { tipo: 'bajamar', fecha: new Date('2026-07-05T14:54') },
  { tipo: 'pleamar', fecha: new Date('2026-07-05T21:06') },
]

describe('estadoMarea', () => {
  it('sube entre una bajamar y la siguiente pleamar', () => {
    const e = estadoMarea(extremos, new Date('2026-07-05T05:00'))
    expect(e.subiendo).toBe(true)
    expect(e.siguiente.tipo).toBe('pleamar')
  })

  it('baja entre una pleamar y la siguiente bajamar', () => {
    const e = estadoMarea(extremos, new Date('2026-07-05T11:00'))
    expect(e.subiendo).toBe(false)
    expect(e.siguiente.tipo).toBe('bajamar')
  })

  it('antes del primer extremo, baja hacia la primera bajamar', () => {
    const e = estadoMarea(extremos, new Date('2026-07-05T01:00'))
    expect(e.subiendo).toBe(false)
    expect(e.anterior).toBe(null)
  })
})

describe('proximo', () => {
  it('devuelve la siguiente pleamar posterior a ahora', () => {
    const p = proximo(extremos, 'pleamar', new Date('2026-07-05T10:00'))
    expect(p.fecha.getHours()).toBe(21)
  })

  it('si ya pasaron todas, devuelve la primera del día', () => {
    const p = proximo(extremos, 'bajamar', new Date('2026-07-05T23:00'))
    expect(p.fecha.getHours()).toBe(2)
  })
})

describe('fraccionMareaAhora', () => {
  const conAltura = [
    { tipo: 'bajamar', fecha: new Date('2026-07-05T02:30'), altura: 0.5 },
    { tipo: 'pleamar', fecha: new Date('2026-07-05T08:42'), altura: 2.5 },
    { tipo: 'bajamar', fecha: new Date('2026-07-05T14:54'), altura: 0.5 },
  ]

  it('en pleamar la fracción es ~1', () => {
    const f = fraccionMareaAhora(conAltura, new Date('2026-07-05T08:42'))
    expect(f).toBeCloseTo(1, 2)
  })

  it('en bajamar la fracción es ~0', () => {
    const f = fraccionMareaAhora(conAltura, new Date('2026-07-05T02:30'))
    expect(f).toBeCloseTo(0, 2)
  })

  it('a medio camino la fracción está entre 0 y 1', () => {
    const f = fraccionMareaAhora(conAltura, new Date('2026-07-05T05:36'))
    expect(f).toBeGreaterThan(0.2)
    expect(f).toBeLessThan(0.8)
  })

  it('sin extremos devuelve 0.5 por defecto', () => {
    expect(fraccionMareaAhora([])).toBe(0.5)
  })
})
