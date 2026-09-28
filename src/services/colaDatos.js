import { obtenerDatosPlayas, TAM_LOTE } from './openMeteo.js'

const CLAVE = 'playia:datos'
const TTL_MS = 20 * 60 * 1000 // los partes horarios no cambian más rápido

function almacenPorDefecto() {
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : null
  } catch {
    return null // sessionStorage puede lanzar en modo restringido
  }
}

// Agrupa las peticiones que llegan casi a la vez (una por tarjeta visible) en
// un único lote, y recuerda lo ya pedido. Sin esto, recorrer el catálogo
// entero disparaba ~2 peticiones por playa y agotaba la cuota de Open-Meteo.
export function crearCola({
  obtener = obtenerDatosPlayas,
  esperaMs = 60,
  ttlMs = TTL_MS,
  almacen = almacenPorDefecto(),
  reloj = Date.now,
} = {}) {
  const cache = new Map(leerPersistido(almacen, reloj, ttlMs))
  const enEspera = new Map() // id -> { playa, resolver, rechazar }
  let temporizador = null

  function vigente(entrada) {
    return entrada && reloj() - entrada.ts < ttlMs
  }

  async function vaciar() {
    temporizador = null
    const pendientes = [...enEspera.values()].slice(0, TAM_LOTE)
    pendientes.forEach((p) => enEspera.delete(p.playa.id))
    if (!pendientes.length) return

    try {
      const mapa = await obtener(pendientes.map((p) => p.playa))
      for (const { playa, resolver, rechazar } of pendientes) {
        const datos = mapa.get(playa.id)
        if (datos === undefined) {
          rechazar(new Error(`Sin datos para ${playa.id}`))
          continue
        }
        cache.set(playa.id, { datos, ts: reloj() })
        resolver(datos)
      }
      persistir(almacen, cache)
    } catch (e) {
      // Un fallo del lote (cuota, red) es el mismo fallo para todas.
      pendientes.forEach(({ rechazar }) => rechazar(e))
    }
    if (enEspera.size) programar()
  }

  function programar() {
    if (temporizador) return
    temporizador = setTimeout(vaciar, esperaMs)
  }

  function pedir(playa) {
    const guardado = cache.get(playa.id)
    if (vigente(guardado)) return Promise.resolve(guardado.datos)

    const yaEnCola = enEspera.get(playa.id)
    if (yaEnCola) return yaEnCola.promesa

    let resolver, rechazar
    const promesa = new Promise((res, rej) => {
      resolver = res
      rechazar = rej
    })
    enEspera.set(playa.id, { playa, resolver, rechazar, promesa })
    if (enEspera.size >= TAM_LOTE) {
      clearTimeout(temporizador)
      temporizador = null
      vaciar()
    } else {
      programar()
    }
    return promesa
  }

  return { pedir }
}

function leerPersistido(almacen, reloj, ttlMs) {
  if (!almacen) return []
  try {
    const crudo = JSON.parse(almacen.getItem(CLAVE) || '{}')
    return Object.entries(crudo).filter(([, v]) => reloj() - v.ts < ttlMs)
  } catch {
    return []
  }
}

function persistir(almacen, cache) {
  if (!almacen) return
  try {
    almacen.setItem(CLAVE, JSON.stringify(Object.fromEntries(cache)))
  } catch {
    // cuota de sessionStorage llena: la caché en memoria sigue sirviendo
  }
}

export const colaDatos = crearCola()
