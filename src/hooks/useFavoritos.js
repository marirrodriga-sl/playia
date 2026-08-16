import { useSyncExternalStore, useCallback } from 'react'

// Favoritos guardados en localStorage (sin cuentas, sin backend). Reactivo
// entre componentes (tarjeta ↔ Home) vía un evento propio + el evento nativo
// 'storage' (para sincronizar entre pestañas).
const CLAVE = 'playia:favoritos'
const EVENTO = 'playia:favoritos'

function leerLista() {
  try {
    const v = JSON.parse(localStorage.getItem(CLAVE))
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

function subscribe(cb) {
  window.addEventListener(EVENTO, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(EVENTO, cb)
    window.removeEventListener('storage', cb)
  }
}

// getSnapshot debe devolver una referencia ESTABLE mientras no cambie, o
// useSyncExternalStore entra en bucle. Cacheamos el string crudo.
let crudoCache = null
let listaCache = []
function getSnapshot() {
  const crudo = localStorage.getItem(CLAVE)
  if (crudo !== crudoCache) {
    crudoCache = crudo
    listaCache = leerLista()
  }
  return listaCache
}

export function useFavoritos() {
  const lista = useSyncExternalStore(subscribe, getSnapshot, () => [])
  const favoritos = new Set(lista)

  const alternar = useCallback((id) => {
    const actual = leerLista()
    const siguiente = actual.includes(id) ? actual.filter((x) => x !== id) : [...actual, id]
    localStorage.setItem(CLAVE, JSON.stringify(siguiente))
    window.dispatchEvent(new Event(EVENTO))
  }, [])

  return { favoritos, alternar }
}
