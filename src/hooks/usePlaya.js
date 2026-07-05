import { useEffect, useState } from 'react'
import { obtenerDatosPlaya } from '../data/openMeteo.js'
import { evaluarPlaya } from '../rules/evaluarPlaya.js'

// enabled=false deja el hook en espera (no pide datos). Se usa con carga
// perezosa: la tarjeta solo pide su semáforo cuando entra en pantalla.
export function usePlaya(playa, enabled = true) {
  const [estado, setEstado] = useState(enabled ? 'cargando' : 'espera')
  const [datos, setDatos] = useState(null)
  const [veredicto, setVeredicto] = useState(null)

  useEffect(() => {
    if (!enabled) return
    let activo = true
    setEstado('cargando')
    obtenerDatosPlaya(playa)
      .then((d) => {
        if (!activo) return
        setDatos(d)
        setVeredicto(evaluarPlaya(d))
        setEstado('ok')
      })
      .catch(() => {
        if (activo) setEstado('error')
      })
    return () => {
      activo = false
    }
  }, [playa.id, enabled])

  return { estado, datos, veredicto }
}
