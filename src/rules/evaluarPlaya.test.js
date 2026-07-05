import { describe, it, expect } from 'vitest'
import { evaluarPlaya } from './evaluarPlaya.js'

const buenDia = { viento: 12, temperatura: 25, tempAgua: 22, oleaje: 0.4, uv: 6 }

describe('evaluarPlaya', () => {
  it('devuelve verde con condiciones ideales', () => {
    const v = evaluarPlaya(buenDia)
    expect(v.nivel).toBe('verde')
    expect(v.motivos).toEqual([])
    expect(typeof v.frase).toBe('string')
  })

  it('devuelve rojo con viento fuerte', () => {
    const v = evaluarPlaya({ ...buenDia, viento: 40 })
    expect(v.nivel).toBe('rojo')
    expect(v.motivos).toContain('viento fuerte')
  })

  it('devuelve rojo con oleaje alto', () => {
    const v = evaluarPlaya({ ...buenDia, oleaje: 1.8 })
    expect(v.nivel).toBe('rojo')
    expect(v.motivos).toContain('oleaje alto')
  })

  it('devuelve ámbar con viento molesto (no fuerte)', () => {
    const v = evaluarPlaya({ ...buenDia, viento: 25 })
    expect(v.nivel).toBe('ambar')
    expect(v.motivos).toContain('viento molesto')
  })

  it('devuelve ámbar con agua fría', () => {
    const v = evaluarPlaya({ ...buenDia, tempAgua: 17 })
    expect(v.nivel).toBe('ambar')
    expect(v.motivos).toContain('agua fría')
  })

  it('devuelve ámbar con UV muy alto', () => {
    const v = evaluarPlaya({ ...buenDia, uv: 10 })
    expect(v.nivel).toBe('ambar')
    expect(v.motivos).toContain('UV muy alto')
  })

  it('devuelve ámbar con temperatura fresca', () => {
    const v = evaluarPlaya({ ...buenDia, temperatura: 20 })
    expect(v.nivel).toBe('ambar')
    expect(v.motivos).toContain('temperatura fresca')
  })

  it('el rojo tiene prioridad sobre el ámbar', () => {
    const v = evaluarPlaya({ ...buenDia, viento: 40, tempAgua: 17 })
    expect(v.nivel).toBe('rojo')
  })
})
