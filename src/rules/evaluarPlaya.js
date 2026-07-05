import { UMBRALES } from './umbrales.js'

const FRASES = {
  verde: 'Buen día de playa.',
  ambar: 'Día regular: revisa los detalles.',
  rojo: 'Mejor otro día u otra playa.',
}

export function evaluarPlaya(datos) {
  const motivos = []

  // Condiciones de rojo (prioridad máxima)
  if (datos.viento > UMBRALES.vientoFuerte) motivos.push('viento fuerte')
  if (datos.oleaje > UMBRALES.oleajeAlto) motivos.push('oleaje alto')

  if (motivos.length > 0) {
    return { nivel: 'rojo', motivos, frase: FRASES.rojo }
  }

  // Condiciones de ámbar
  if (datos.viento >= UMBRALES.vientoFlojo) motivos.push('viento molesto')
  if (datos.tempAgua < UMBRALES.aguaFria) motivos.push('agua fría')
  if (datos.uv > UMBRALES.uvMuyAlto) motivos.push('UV muy alto')
  if (datos.temperatura <= UMBRALES.tempAgradable) motivos.push('temperatura fresca')

  if (motivos.length > 0) {
    return { nivel: 'ambar', motivos, frase: FRASES.ambar }
  }

  return { nivel: 'verde', motivos: [], frase: FRASES.verde }
}
