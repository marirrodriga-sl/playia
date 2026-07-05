// Datos de marea de EJEMPLO (demo).
// La estructura imita lo que devuelve la API real (mareaService), de modo que
// alternar entre real y demo sea transparente para la UI.
import { estadoMarea, proximo } from '../domain/marea.js'

// Genera los 4 extremos de marea de un día tipo (~cada 6h12m), con un pequeño
// desfase por playa para que no sean todas idénticas.
export function extremosDelDia(playa, base = new Date()) {
  const desfaseMin = (playa.nombre.charCodeAt(0) % 3) * 20 // 0, 20 o 40 min
  const inicio = new Date(base)
  inicio.setHours(2, 30 + desfaseMin, 0, 0) // primera bajamar ~02:30
  const tipos = ['bajamar', 'pleamar', 'bajamar', 'pleamar']
  const alturas = { bajamar: 0.8, pleamar: 2.6 }
  return tipos.map((tipo, i) => ({
    tipo,
    fecha: new Date(inicio.getTime() + i * (6 * 60 + 12) * 60000),
    altura: alturas[tipo],
  }))
}

export function obtenerMareaDemo(playa, ahora = new Date()) {
  const extremos = extremosDelDia(playa, ahora)
  const { subiendo, anterior, siguiente } = estadoMarea(extremos, ahora)
  const coeficiente = 95 // demo: coeficiente alto → marea viva
  return {
    extremos,
    subiendo,
    anterior,
    siguiente,
    proximaPleamar: proximo(extremos, 'pleamar', ahora),
    proximaBajamar: proximo(extremos, 'bajamar', ahora),
    coeficiente,
    mareaViva: coeficiente >= 90,
    esDemo: true,
  }
}
