import { useEffect, useState } from 'react'
import { obtenerPrevisionPlaya } from '../services/openMeteo.js'
import { evaluarPlaya } from '../domain/evaluarPlaya.js'

// Previsión de los próximos días para la ficha: cada día con su veredicto del
// semáforo (evaluado sobre la hora central) y su temperatura.
export function usePrevision(playa) {
  const [dias, setDias] = useState(null)

  useEffect(() => {
    if (!playa) return
    let activo = true
    obtenerPrevisionPlaya(playa)
      .then((prev) => {
        if (!activo) return
        setDias(prev.map((d) => ({ ...d, veredicto: evaluarPlaya(d.datos) })))
      })
      .catch(() => {
        if (activo) setDias([])
      })
    return () => {
      activo = false
    }
  }, [playa?.id])

  return dias
}
