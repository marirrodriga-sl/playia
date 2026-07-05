// Umbrales del semáforo (spec §6). Todos configurables aquí, en un solo sitio.
export const UMBRALES = {
  vientoFlojo: 20,     // km/h — a partir de aquí, viento molesto (ámbar)
  vientoFuerte: 35,    // km/h — a partir de aquí, rojo
  tempAgradable: 22,   // °C aire — por debajo o igual, temperatura fresca (ámbar)
  aguaFria: 19,        // °C agua — por debajo, agua fría (ámbar)
  oleajeAlto: 1.5,     // m — por encima, rojo
  uvMuyAlto: 8,        // índice UV — por encima, UV muy alto (ámbar)
}
