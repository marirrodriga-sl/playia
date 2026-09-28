import { describe, it, expect, vi } from 'vitest'
import { crearCola } from './colaDatos.js'
import { ErrorCuota } from './openMeteo.js'

const playa = (id) => ({ id, lat: 27.7, lon: -15.6 })
const datos = (t) => ({ temperatura: t, viento: 5, uv: 6, oleaje: 0.3, tempAgua: 21 })

function almacenFalso() {
  const m = new Map()
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }
}

describe('crearCola', () => {
  it('agrupa peticiones simultáneas de varias playas en UN solo lote', async () => {
    const obtener = vi.fn(async (ps) => new Map(ps.map((p, i) => [p.id, datos(20 + i)])))
    const cola = crearCola({ obtener, esperaMs: 5, almacen: almacenFalso() })

    const [a, b, c] = await Promise.all([
      cola.pedir(playa('a')),
      cola.pedir(playa('b')),
      cola.pedir(playa('c')),
    ])

    expect(obtener).toHaveBeenCalledTimes(1)
    expect(obtener.mock.calls[0][0]).toHaveLength(3)
    expect([a.temperatura, b.temperatura, c.temperatura]).toEqual([20, 21, 22])
  })

  it('no vuelve a pedir una playa ya cacheada', async () => {
    const obtener = vi.fn(async (ps) => new Map(ps.map((p) => [p.id, datos(25)])))
    const cola = crearCola({ obtener, esperaMs: 5, almacen: almacenFalso() })

    await cola.pedir(playa('a'))
    const segunda = await cola.pedir(playa('a'))

    expect(obtener).toHaveBeenCalledTimes(1)
    expect(segunda.temperatura).toBe(25)
  })

  it('reparte el fallo de cuota a todas las playas del lote', async () => {
    const obtener = vi.fn(async () => {
      throw new ErrorCuota()
    })
    const cola = crearCola({ obtener, esperaMs: 5, almacen: almacenFalso() })

    const resultados = await Promise.allSettled([cola.pedir(playa('a')), cola.pedir(playa('b'))])

    expect(obtener).toHaveBeenCalledTimes(1)
    expect(resultados.every((r) => r.status === 'rejected')).toBe(true)
    expect(resultados[0].reason).toBeInstanceOf(ErrorCuota)
  })

  it('reaprovecha la caché persistida entre recargas', async () => {
    const almacen = almacenFalso()
    const obtener = vi.fn(async (ps) => new Map(ps.map((p) => [p.id, datos(28)])))

    await crearCola({ obtener, esperaMs: 5, almacen }).pedir(playa('a'))
    const otra = crearCola({ obtener, esperaMs: 5, almacen })
    const r = await otra.pedir(playa('a'))

    expect(obtener).toHaveBeenCalledTimes(1) // la 2ª cola no repite la llamada
    expect(r.temperatura).toBe(28)
  })

  it('descarta la caché caducada', async () => {
    const almacen = almacenFalso()
    const obtener = vi.fn(async (ps) => new Map(ps.map((p) => [p.id, datos(30)])))
    let ahora = 1000
    const reloj = () => ahora

    const cola = crearCola({ obtener, esperaMs: 5, almacen, ttlMs: 100, reloj })
    await cola.pedir(playa('a'))
    ahora += 500
    await cola.pedir(playa('a'))

    expect(obtener).toHaveBeenCalledTimes(2)
  })
})
