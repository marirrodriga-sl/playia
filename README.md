# 🏖️ PlayIA

App web del estado real de las playas de Canarias: un **semáforo** (🟢🟠🔴) que responde de un
vistazo *"¿qué tal está hoy esta playa?"*, con datos reales de tiempo, viento, oleaje y **marea**
(pleamar/bajamar y aviso de marea viva).

En vivo: **https://playia-iamarirrodriga.vercel.app**

Un producto de [Marirrodriga.IA](https://www.marirrodriga-ia.com/).

## Qué hace

- **474 playas** de las 7 islas, filtrables por isla, orientación (Norte/Sur) y buscador.
- **Semáforo** calculado con un motor de reglas determinista (no IA) a partir de datos reales.
- **Ficha por playa**: veredicto + marea (curva, horas, marea viva) + escalas de temperatura y
  viento + agua, oleaje y UV.

## Arquitectura (por capas)

Separación limpia de responsabilidades: el dominio es puro (sin I/O ni React) y no depende de nada;
las capas externas dependen hacia dentro.

```
src/
├── domain/        Lógica de negocio PURA (sin I/O, sin React)
│   ├── umbrales.js       Umbrales configurables del semáforo
│   ├── evaluarPlaya.js   Motor de reglas → veredicto 🟢🟠🔴
│   └── marea.js          Estado de marea (subiendo/bajando, próximos extremos)
├── services/      Acceso a datos externos (I/O)
│   ├── openMeteo.js      Tiempo/viento/oleaje/UV (Open-Meteo, sin key)
│   ├── mareaService.js   Marea real vía Open-Meteo (con fallback a demo)
│   └── mareaDemo.js      Datos de marea de ejemplo
├── data/          Datos estáticos y configuración de UI
│   ├── playas.js         Catálogo de playas (generado desde OpenStreetMap)
│   └── escalas.js        Config de las escalas de temperatura y viento
├── hooks/         Pegamento React (estado + efectos)
├── components/    Componentes de UI (+ layout/)
├── pages/         Páginas (Home, FichaPlaya)
├── router.jsx     Rutas
└── App.jsx        Composición raíz
```

La marea se deriva de la curva horaria de nivel del mar de Open-Meteo: el dominio
(`extraerMarea`) detecta los máximos/mínimos locales → pleamar/bajamar, sin API key
ni backend.

**Flujo de dependencias:** `components/pages` → `hooks` → `services` → `domain`. El dominio no
importa nada de las capas externas.

## Fuentes de datos

- **Tiempo/mar** (temperatura, viento, UV, oleaje, temp. agua): [Open-Meteo](https://open-meteo.com)
  — gratis y sin API key, llamado directamente desde el navegador.
- **Marea** (pleamar/bajamar, marea viva): [Open-Meteo Marine](https://open-meteo.com) — nivel del mar
  (`sea_level_height_msl`) por horas, también gratis y sin key. Los extremos se calculan en el cliente.

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo
npm test         # tests unitarios (Vitest) del dominio y los servicios
npm run build    # build de producción
```

No hace falta ninguna API key ni fichero `.env`: todas las fuentes de datos (Open-Meteo) son
gratuitas y sin autenticación.

## Deploy

Desplegado en Vercel como SPA estática. No requiere variables de entorno ni funciones serverless.

## Stack

React 19 · Vite · Tailwind CSS v4 · Vitest · Vercel (frontend + funciones serverless).
