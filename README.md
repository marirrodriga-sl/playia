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
│   ├── mareaService.js   Marea real vía backend /api/marea (con fallback a demo)
│   └── mareaDemo.js      Datos de marea de ejemplo
├── data/          Datos estáticos y configuración de UI
│   ├── playas.js         Catálogo de playas (generado desde OpenStreetMap)
│   └── escalas.js        Config de las escalas de temperatura y viento
├── hooks/         Pegamento React (estado + efectos)
├── components/    Componentes de UI (+ layout/)
├── pages/         Páginas (Home, FichaPlaya)
├── router.jsx     Rutas
└── App.jsx        Composición raíz

api/               Funciones serverless (Vercel) — el backend proxy
├── marea.js       Endpoint /api/marea: oculta la key y cachea por día
└── _worldtides.js Cliente de WorldTides (normalización + fetch)
```

**Flujo de dependencias:** `components/pages` → `hooks` → `services` → `domain`. El dominio no
importa nada de las capas externas.

## Fuentes de datos

- **Tiempo/mar** (temperatura, viento, UV, oleaje, temp. agua): [Open-Meteo](https://open-meteo.com)
  — gratis y sin API key, llamado directamente desde el navegador.
- **Marea** (pleamar/bajamar, marea viva): [WorldTides](https://www.worldtides.info) — vía el backend
  `api/marea.js`, que **oculta la API key** (nunca llega al frontend) y cachea por día.

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo (incluye el backend /api en un middleware de Vite)
npm test         # tests unitarios (Vitest) del dominio y los servicios
npm run build    # build de producción
```

Crea un `.env` (ver `.env.example`) con tu API key de WorldTides:

```
WORLDTIDES_KEY=tu_key_aqui
```

## Deploy

Desplegado en Vercel. La variable `WORLDTIDES_KEY` se configura en el panel de Vercel (Settings →
Environment Variables), nunca en el código.

## Stack

React 19 · Vite · Tailwind CSS v4 · Vitest · Vercel (frontend + funciones serverless).
