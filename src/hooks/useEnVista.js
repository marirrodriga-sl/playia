import { useEffect, useRef, useState } from 'react'

// Devuelve [ref, enVista]. enVista pasa a true la primera vez que el elemento
// entra (casi) en pantalla, y se queda así (se carga una sola vez). Permite
// pedir los datos solo de las tarjetas que el usuario realmente ve.
export function useEnVista(rootMargin = '200px') {
  const ref = useRef(null)
  const [enVista, setEnVista] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || enVista) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setEnVista(true)
          obs.disconnect()
        }
      },
      { rootMargin },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [enVista, rootMargin])

  return [ref, enVista]
}
