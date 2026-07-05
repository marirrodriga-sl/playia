import { UMBRALES } from '../rules/umbrales.js'

// Escalas visuales para la ficha. Las zonas del viento se atan a los umbrales
// del semáforo (umbrales.js) para que todo sea coherente. Cada zona: hasta qué
// valor llega, su etiqueta y el color (clase Tailwind).

export const ESCALA_TEMP = {
  icono: '🌡️',
  etiqueta: 'Temperatura',
  unidad: '°',
  min: 10,
  max: 40,
  zonas: [
    { hasta: 18, etiqueta: 'Frío', clase: 'bg-sky-400' },
    { hasta: UMBRALES.tempAgradable, etiqueta: 'Fresco', clase: 'bg-cyan-300' },
    { hasta: 29, etiqueta: 'Genial', clase: 'bg-green-400' },
    { hasta: 34, etiqueta: 'Caluroso', clase: 'bg-amber-400' },
    { hasta: Infinity, etiqueta: 'Mucho calor', clase: 'bg-red-400' },
  ],
}

export const ESCALA_VIENTO = {
  icono: '💨',
  etiqueta: 'Viento',
  unidad: ' km/h',
  min: 0,
  max: 50,
  zonas: [
    { hasta: 10, etiqueta: 'Calma', clase: 'bg-sky-300' },
    { hasta: UMBRALES.vientoFlojo, etiqueta: 'Ideal', clase: 'bg-green-400' },
    { hasta: UMBRALES.vientoFuerte, etiqueta: 'Molesto', clase: 'bg-amber-400' },
    { hasta: Infinity, etiqueta: 'Mucho viento', clase: 'bg-red-400' },
  ],
}

// Devuelve la zona activa para un valor: la primera cuyo tope (hasta) es mayor
// que el valor; si ninguna, la última.
export function zonaActiva(valor, zonas) {
  return zonas.find((z) => valor < z.hasta) ?? zonas[zonas.length - 1]
}
