import { useEffect, useState } from 'react'
import { colaDatos } from '../services/colaDatos.js'
import { ErrorCuota } from '../services/openMeteo.js'
import { evaluarPlaya } from '../domain/evaluarPlaya.js'

// enabled=false deja el hook en espera (no pide datos). Se usa con carga
// perezosa: la tarjeta solo pide su semáforo cuando entra en pantalla.
// La petición no va directa a la API: pasa por colaDatos, que agrupa todas
// las tarjetas visibles en un único lote y cachea el resultado.
export function usePlaya(playa, enabled = true) {
  const [estado, setEstado] = useState(enabled ? 'cargando' : 'espera')
  const [datos, setDatos] = useState(null)
  const [veredicto, setVeredicto] = useState(null)

  useEffect(() => {
    if (!enabled || !playa) return
    let activo = true
    setEstado('cargando')
    colaDatos
      .pedir(playa)
      .then((d) => {
        if (!activo) return
        setDatos(d)
        setVeredicto(evaluarPlaya(d))
        setEstado('ok')
      })
      .catch((e) => {
        if (activo) setEstado(e instanceof ErrorCuota ? 'sin-cuota' : 'error')
      })
    return () => {
      activo = false
    }
  }, [playa?.id, enabled])

  return { estado, datos, veredicto }
}
