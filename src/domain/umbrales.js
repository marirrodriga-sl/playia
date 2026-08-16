// Umbrales del semáforo (spec §6). Todos configurables aquí, en un solo sitio.
// Calibrados para Canarias (16 ago 2026): alisios, Atlántico fresco y UV
// subtropical alto. Ajustar tras uso real.
export const UMBRALES = {
  vientoFlojo: 20,     // km/h — viento molesto (ámbar). Con alisios, por aquí ya vuela la arena
  vientoFuerte: 35,    // km/h — a partir de aquí, rojo
  tempAgradable: 20,   // °C aire — por debajo o igual, temperatura fresca (ámbar). En Canarias 22-24 es buen día
  aguaFria: 18,        // °C agua — por debajo, agua fría (ámbar). El Atlántico canario es fresco; a 19-20 se baña bien
  oleajeModerado: 1.0, // m — a partir de aquí, oleaje moderado (ámbar). Típico de costa norte
  oleajeAlto: 1.5,     // m — por encima, rojo
  uvMuyAlto: 10,       // índice UV — por encima, UV extremo (ámbar). En verano canario UV 8-9 es lo normal; solo 11+ es alarma
}
