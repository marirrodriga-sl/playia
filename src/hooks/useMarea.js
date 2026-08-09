import { useEffect, useState } from 'react'
import { obtenerMarea } from '../services/mareaService.js'

export function useMarea(playa) {
  const [marea, setMarea] = useState(null)

  useEffect(() => {
    if (!playa) return
    let activo = true
    obtenerMarea(playa).then((m) => {
      if (activo) setMarea(m)
    })
    return () => {
      activo = false
    }
  }, [playa?.id])

  return marea
}
