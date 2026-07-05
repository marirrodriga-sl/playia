import { useEffect, useState } from 'react'
import { obtenerDatosPlaya } from '../data/openMeteo.js'
import { evaluarPlaya } from '../rules/evaluarPlaya.js'

export function usePlaya(playa) {
  const [estado, setEstado] = useState('cargando')
  const [datos, setDatos] = useState(null)
  const [veredicto, setVeredicto] = useState(null)

  useEffect(() => {
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
  }, [playa.id])

  return { estado, datos, veredicto }
}
