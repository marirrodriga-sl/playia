import { describe, it, expect } from 'vitest'
import { estadoMarea, proximo, fraccionMareaAhora, extraerMarea, instanteDesdeLocal } from './marea.js'

// Construye una serie horaria tipo Open-Meteo (sea_level_height_msl) siguiendo
// un coseno de periodo 12 h → máximos en las horas 0,12,24 y mínimos en 6,18.
// Así los extremos caen en horas exactas y son predecibles.
function serieCos({ horas = 48, amp = 1, base = 0 } = {}) {
  // Strings ISO locales construidos a mano (sin Date/UTC) para que la hora del
  // string coincida siempre con el índice, independientemente de la zona de la máquina.
  const dias = ['2026-08-09', '2026-08-10', '2026-08-11']
  const time = []
  const sea = []
  for (let i = 0; i < horas; i++) {
    const dia = dias[Math.floor(i / 24)]
    const hora = String(i % 24).padStart(2, '0')
    time.push(`${dia}T${hora}:00`)
    sea.push(base + amp * Math.cos((2 * Math.PI * i) / 12))
  }
  return { time, sea_level_height_msl: sea }
}

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

describe('extraerMarea', () => {
  it('extrae los extremos (pleamar/bajamar) del primer día de la curva horaria', () => {
    const { extremos } = extraerMarea(serieCos())
    // periodo 12h → dentro del día: bajamar@06, pleamar@12, bajamar@18
    expect(extremos).toHaveLength(3)
    expect(extremos[0]).toMatchObject({ tipo: 'bajamar', altura: -1 })
    expect(extremos[1]).toMatchObject({ tipo: 'pleamar', altura: 1 })
    expect(extremos[2]).toMatchObject({ tipo: 'bajamar', altura: -1 })
    expect(extremos[1].fecha).toBe('2026-08-09T12:00')
  })

  it('solo devuelve extremos del primer día (no del siguiente)', () => {
    const { extremos } = extraerMarea(serieCos())
    for (const e of extremos) {
      expect(e.fecha.slice(0, 10)).toBe('2026-08-09')
    }
  })

  it('calcula el rango pleamar-bajamar del día', () => {
    const { rango } = extraerMarea(serieCos({ amp: 1 }))
    expect(rango).toBe(2) // pleamar +1, bajamar -1
  })

  it('marca marea viva cuando el rango supera el umbral', () => {
    const viva = extraerMarea(serieCos({ amp: 1.2 }), { umbralViva: 2 })
    expect(viva.mareaViva).toBe(true) // rango 2.4 >= 2
    const muerta = extraerMarea(serieCos({ amp: 0.5 }), { umbralViva: 2 })
    expect(muerta.mareaViva).toBe(false) // rango 1 < 2
  })

  it('curva plana (sin extremos) devuelve lista vacía y rango null', () => {
    const plana = { time: ['2026-08-09T00:00', '2026-08-09T01:00', '2026-08-09T02:00'], sea_level_height_msl: [0.5, 0.5, 0.5] }
    const { extremos, rango, mareaViva } = extraerMarea(plana)
    expect(extremos).toEqual([])
    expect(rango).toBe(null)
    expect(mareaViva).toBe(false)
  })
})

describe('instanteDesdeLocal', () => {
  it('convierte hora local de la playa + offset a instante UTC absoluto', () => {
    // 12:00 en Canarias (UTC+1) es 11:00 UTC, sea cual sea la zona de quien mira.
    const t = instanteDesdeLocal('2026-08-09T12:00', 3600)
    expect(t.getTime()).toBe(Date.UTC(2026, 7, 9, 11, 0))
  })

  it('se muestra como la misma hora de pared en la zona de la playa', () => {
    const t = instanteDesdeLocal('2026-08-09T23:00', 3600)
    const hhmm = t.toLocaleTimeString('es-ES', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Atlantic/Canary',
    })
    expect(hhmm).toBe('23:00')
  })
})
