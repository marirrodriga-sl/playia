# Núcleo Frontend — Semáforo de Playa — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una web app React que muestra, para un puñado de playas de Gran Canaria, un semáforo (🟢🟠🔴) calculado con datos reales de Open-Meteo, más las fichas por playa y una Home. Sin backend (Open-Meteo no requiere key). Mareas y chatbot quedan para un plan posterior.

**Architecture:** Motor de reglas puro y determinista (`src/rules/`) que recibe datos normalizados y devuelve un veredicto. Capa de datos (`src/data/`) que llama directamente a las APIs gratuitas de Open-Meteo (Forecast + Marine) y normaliza el resultado. Frontend React (páginas en `src/pages/`, router en `src/router.jsx`, composición en `src/Layout.jsx`) que consume ambas capas.

**Tech Stack:** React 18 + Vite + Tailwind CSS v4 + Vitest. Deploy final en Vercel (fuera de este plan).

## Global Constraints

- **Estética luminosa y amigable**: azules claros (cielo/mar) + amarillos (sol/arena). NO dark mode. Copiado verbatim del spec §8.
- **El semáforo mantiene sus colores propios**: verde / ámbar / rojo por encima de la paleta.
- **Mobile-first**: diseñar primero pantalla estrecha, expandir con `sm:`/`md:`/`lg:`.
- **HTML semántico** (`<nav>`, `<main>`, `<article>`, `<section>`) y estados interactivos definidos (hover/focus/disabled/active).
- **Logo Marirrodriga.IA clicable** que abre <https://www.marirrodriga-ia.com/> en nueva pestaña (`target="_blank" rel="noopener noreferrer"`).
- **Umbrales del semáforo configurables** en un único objeto (spec §6), no dispersos por el código.
- **Idioma de la UI: español.**
- Commits frecuentes; convención `feat:` / `test:` / `chore:` / `docs:`.

---

### Task 1: Andamiaje del proyecto (Vite + React + Tailwind v4 + Vitest)

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/index.css`
- Create: `src/rules/smoke.test.js` (test humo temporal, se borra en Task 2)

**Interfaces:**
- Consumes: nada (primer task).
- Produces: proyecto ejecutable con `npm run dev` y `npm test`; Tailwind operativo.

- [ ] **Step 1: Crear el proyecto Vite React en el directorio actual**

El repo ya existe con `docs/`. Andamiar dentro del directorio actual:

```bash
npm create vite@latest . -- --template react
npm install
```

Si `npm create` avisa de que el directorio no está vacío, elegir la opción de continuar sin borrar (conserva `docs/` y `.git`).

- [ ] **Step 2: Instalar Tailwind v4 (plugin de Vite) y Vitest**

```bash
npm install tailwindcss @tailwindcss/vite
npm install -D vitest jsdom
```

- [ ] **Step 3: Configurar Vite con Tailwind y Vitest**

Sustituir el contenido de `vite.config.js` por:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 4: Activar Tailwind en el CSS**

Sustituir el contenido de `src/index.css` por (elimina el CSS de ejemplo de Vite):

```css
@import "tailwindcss";
```

Y en `src/App.jsx`, sustituir el contenido por un componente mínimo que valide Tailwind:

```jsx
export default function App() {
  return (
    <main className="min-h-screen bg-sky-100 flex items-center justify-center">
      <h1 className="text-3xl font-bold text-sky-800">Semáforo de Playa</h1>
    </main>
  )
}
```

- [ ] **Step 5: Añadir el script de test a package.json**

En `package.json`, dentro de `"scripts"`, añadir:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Escribir un test humo temporal**

Crear `src/rules/smoke.test.js`:

```js
import { describe, it, expect } from 'vitest'

describe('smoke', () => {
  it('el entorno de test funciona', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 7: Verificar que dev y test arrancan**

```bash
npm test
```
Expected: PASS (1 test).

```bash
npm run dev
```
Expected: servidor Vite en `http://localhost:5173`, se ve "Semáforo de Playa" sobre fondo azul claro. Cerrar con Ctrl+C.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: andamiaje Vite + React + Tailwind v4 + Vitest"
```

---

### Task 2: Motor de reglas — umbrales y veredicto (TDD)

**Files:**
- Create: `src/rules/umbrales.js`
- Create: `src/rules/evaluarPlaya.js`
- Create: `src/rules/evaluarPlaya.test.js`
- Delete: `src/rules/smoke.test.js`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `UMBRALES` (objeto de configuración) en `src/rules/umbrales.js`.
  - `evaluarPlaya(datos)` en `src/rules/evaluarPlaya.js`, donde
    `datos = { viento: number /*km/h*/, temperatura: number /*°C aire*/, tempAgua: number /*°C agua*/, oleaje: number /*m*/, uv: number }`
    y devuelve `{ nivel: 'verde'|'ambar'|'rojo', motivos: string[], frase: string }`.

- [ ] **Step 1: Borrar el test humo**

```bash
git rm src/rules/smoke.test.js
```

- [ ] **Step 2: Escribir los tests del motor (fallarán)**

Crear `src/rules/evaluarPlaya.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { evaluarPlaya } from './evaluarPlaya.js'

const buenDia = { viento: 12, temperatura: 25, tempAgua: 22, oleaje: 0.4, uv: 6 }

describe('evaluarPlaya', () => {
  it('devuelve verde con condiciones ideales', () => {
    const v = evaluarPlaya(buenDia)
    expect(v.nivel).toBe('verde')
    expect(v.motivos).toEqual([])
    expect(typeof v.frase).toBe('string')
  })

  it('devuelve rojo con viento fuerte', () => {
    const v = evaluarPlaya({ ...buenDia, viento: 40 })
    expect(v.nivel).toBe('rojo')
    expect(v.motivos).toContain('viento fuerte')
  })

  it('devuelve rojo con oleaje alto', () => {
    const v = evaluarPlaya({ ...buenDia, oleaje: 1.8 })
    expect(v.nivel).toBe('rojo')
    expect(v.motivos).toContain('oleaje alto')
  })

  it('devuelve ámbar con viento molesto (no fuerte)', () => {
    const v = evaluarPlaya({ ...buenDia, viento: 25 })
    expect(v.nivel).toBe('ambar')
    expect(v.motivos).toContain('viento molesto')
  })

  it('devuelve ámbar con agua fría', () => {
    const v = evaluarPlaya({ ...buenDia, tempAgua: 17 })
    expect(v.nivel).toBe('ambar')
    expect(v.motivos).toContain('agua fría')
  })

  it('devuelve ámbar con UV muy alto', () => {
    const v = evaluarPlaya({ ...buenDia, uv: 10 })
    expect(v.nivel).toBe('ambar')
    expect(v.motivos).toContain('UV muy alto')
  })

  it('devuelve ámbar con temperatura fresca', () => {
    const v = evaluarPlaya({ ...buenDia, temperatura: 20 })
    expect(v.nivel).toBe('ambar')
    expect(v.motivos).toContain('temperatura fresca')
  })

  it('el rojo tiene prioridad sobre el ámbar', () => {
    const v = evaluarPlaya({ ...buenDia, viento: 40, tempAgua: 17 })
    expect(v.nivel).toBe('rojo')
  })
})
```

- [ ] **Step 3: Ejecutar los tests para verificar que fallan**

```bash
npm test
```
Expected: FAIL ("Failed to resolve import './evaluarPlaya.js'").

- [ ] **Step 4: Crear el objeto de umbrales**

Crear `src/rules/umbrales.js`:

```js
// Umbrales del semáforo (spec §6). Todos configurables aquí, en un solo sitio.
export const UMBRALES = {
  vientoFlojo: 20,     // km/h — a partir de aquí, viento molesto (ámbar)
  vientoFuerte: 35,    // km/h — a partir de aquí, rojo
  tempAgradable: 22,   // °C aire — por debajo o igual, temperatura fresca (ámbar)
  aguaFria: 19,        // °C agua — por debajo, agua fría (ámbar)
  oleajeAlto: 1.5,     // m — por encima, rojo
  uvMuyAlto: 8,        // índice UV — por encima, UV muy alto (ámbar)
}
```

- [ ] **Step 5: Implementar el motor de reglas**

Crear `src/rules/evaluarPlaya.js`:

```js
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
```

- [ ] **Step 6: Ejecutar los tests para verificar que pasan**

```bash
npm test
```
Expected: PASS (8 tests).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: motor de reglas del semáforo con umbrales configurables"
```

---

### Task 3: Catálogo de playas de Gran Canaria

**Files:**
- Create: `src/data/playas.js`
- Create: `src/data/playas.test.js`

**Interfaces:**
- Consumes: nada.
- Produces: `PLAYAS` — array de `{ id: string, nombre: string, lat: number, lon: number }`.

- [ ] **Step 1: Escribir el test (fallará)**

Crear `src/data/playas.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { PLAYAS } from './playas.js'

describe('PLAYAS', () => {
  it('contiene al menos 5 playas', () => {
    expect(PLAYAS.length).toBeGreaterThanOrEqual(5)
  })

  it('cada playa tiene id, nombre y coordenadas válidas', () => {
    for (const p of PLAYAS) {
      expect(typeof p.id).toBe('string')
      expect(typeof p.nombre).toBe('string')
      expect(p.lat).toBeGreaterThan(27)
      expect(p.lat).toBeLessThan(29)
      expect(p.lon).toBeLessThan(-15)
      expect(p.lon).toBeGreaterThan(-16)
    }
  })

  it('los ids son únicos', () => {
    const ids = PLAYAS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

```bash
npm test src/data/playas.test.js
```
Expected: FAIL ("Failed to resolve import './playas.js'").

- [ ] **Step 3: Crear el catálogo**

Crear `src/data/playas.js` (coordenadas aproximadas de Gran Canaria; refinar si hace falta):

```js
export const PLAYAS = [
  { id: 'las-canteras', nombre: 'Las Canteras', lat: 28.138, lon: -15.437 },
  { id: 'el-confital', nombre: 'El Confital', lat: 28.156, lon: -15.435 },
  { id: 'maspalomas', nombre: 'Maspalomas', lat: 27.736, lon: -15.586 },
  { id: 'playa-del-ingles', nombre: 'Playa del Inglés', lat: 27.746, lon: -15.573 },
  { id: 'amadores', nombre: 'Amadores', lat: 27.766, lon: -15.706 },
  { id: 'san-agustin', nombre: 'San Agustín', lat: 27.766, lon: -15.531 },
  { id: 'melenara', nombre: 'Melenara', lat: 27.993, lon: -15.373 },
]
```

- [ ] **Step 4: Ejecutar el test para verificar que pasa**

```bash
npm test src/data/playas.test.js
```
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: catálogo de playas de Gran Canaria"
```

---

### Task 4: Capa de datos Open-Meteo (fetch + normalización)

**Files:**
- Create: `src/data/openMeteo.js`
- Create: `src/data/openMeteo.test.js`

**Interfaces:**
- Consumes: `PLAYAS` (Task 3) para las coordenadas al llamar.
- Produces:
  - `normalizarHoraActual(forecastJson, marineJson, ahora)` → `{ viento, temperatura, tempAgua, oleaje, uv }` (misma forma que consume `evaluarPlaya`).
  - `obtenerDatosPlaya(playa, fetchImpl = fetch)` → `Promise<{ viento, temperatura, tempAgua, oleaje, uv }>` (async, hace las dos llamadas HTTP).

- [ ] **Step 1: Escribir el test de normalización (fallará)**

`normalizarHoraActual` es pura y se testea sin red. Crear `src/data/openMeteo.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { normalizarHoraActual } from './openMeteo.js'

const forecast = {
  hourly: {
    time: ['2026-07-05T10:00', '2026-07-05T11:00', '2026-07-05T12:00'],
    temperature_2m: [23, 24, 25],
    wind_speed_10m: [10, 12, 14],
    uv_index: [5, 6, 7],
  },
}

const marine = {
  hourly: {
    time: ['2026-07-05T10:00', '2026-07-05T11:00', '2026-07-05T12:00'],
    wave_height: [0.3, 0.4, 0.5],
    sea_surface_temperature: [21, 21.5, 22],
  },
}

describe('normalizarHoraActual', () => {
  it('extrae la hora que coincide con "ahora"', () => {
    const datos = normalizarHoraActual(forecast, marine, new Date('2026-07-05T11:20'))
    expect(datos).toEqual({
      temperatura: 24,
      viento: 12,
      uv: 6,
      oleaje: 0.4,
      tempAgua: 21.5,
    })
  })

  it('usa la primera hora si "ahora" es anterior a todos los tramos', () => {
    const datos = normalizarHoraActual(forecast, marine, new Date('2026-07-05T08:00'))
    expect(datos.temperatura).toBe(23)
  })
})
```

- [ ] **Step 2: Ejecutar el test para verificar que falla**

```bash
npm test src/data/openMeteo.test.js
```
Expected: FAIL ("Failed to resolve import './openMeteo.js'").

- [ ] **Step 3: Implementar normalización + fetch**

Crear `src/data/openMeteo.js`:

```js
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine'

// Devuelve el índice de la hora <= ahora más cercana (o 0 si todas son futuras).
function indiceHora(times, ahora) {
  const t = ahora.getTime()
  let idx = 0
  for (let i = 0; i < times.length; i++) {
    if (new Date(times[i]).getTime() <= t) idx = i
    else break
  }
  return idx
}

export function normalizarHoraActual(forecast, marine, ahora = new Date()) {
  const i = indiceHora(forecast.hourly.time, ahora)
  const j = indiceHora(marine.hourly.time, ahora)
  return {
    temperatura: forecast.hourly.temperature_2m[i],
    viento: forecast.hourly.wind_speed_10m[i],
    uv: forecast.hourly.uv_index[i],
    oleaje: marine.hourly.wave_height[j],
    tempAgua: marine.hourly.sea_surface_temperature[j],
  }
}

export async function obtenerDatosPlaya(playa, fetchImpl = fetch) {
  const forecastParams = new URLSearchParams({
    latitude: playa.lat,
    longitude: playa.lon,
    hourly: 'temperature_2m,wind_speed_10m,uv_index',
    timezone: 'auto',
  })
  const marineParams = new URLSearchParams({
    latitude: playa.lat,
    longitude: playa.lon,
    hourly: 'wave_height,sea_surface_temperature',
    timezone: 'auto',
  })

  const [forecastRes, marineRes] = await Promise.all([
    fetchImpl(`${FORECAST_URL}?${forecastParams}`),
    fetchImpl(`${MARINE_URL}?${marineParams}`),
  ])
  const forecast = await forecastRes.json()
  const marine = await marineRes.json()
  return normalizarHoraActual(forecast, marine, new Date())
}
```

- [ ] **Step 4: Ejecutar el test para verificar que pasa**

```bash
npm test src/data/openMeteo.test.js
```
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: capa de datos Open-Meteo (normalización + fetch)"
```

---

### Task 5: Componente Semáforo y hook de datos de playa

**Files:**
- Create: `src/components/Semaforo.jsx`
- Create: `src/hooks/usePlaya.js`

**Interfaces:**
- Consumes: `evaluarPlaya` (Task 2), `obtenerDatosPlaya` (Task 4).
- Produces:
  - `<Semaforo nivel="verde|ambar|rojo" />` — círculo de color con etiqueta accesible.
  - `usePlaya(playa)` → `{ estado: 'cargando'|'ok'|'error', datos, veredicto }`.

- [ ] **Step 1: Crear el componente Semáforo**

Crear `src/components/Semaforo.jsx` (los colores del semáforo son propios, no de la paleta de marca):

```jsx
const COLORES = {
  verde: { bg: 'bg-green-500', texto: 'Buen día' },
  ambar: { bg: 'bg-amber-400', texto: 'Regular' },
  rojo: { bg: 'bg-red-500', texto: 'Evitar' },
}

export default function Semaforo({ nivel }) {
  const c = COLORES[nivel] ?? COLORES.ambar
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`inline-block h-4 w-4 rounded-full ${c.bg}`}
        role="img"
        aria-label={`Estado: ${c.texto}`}
      />
      <span className="text-sm font-medium text-sky-900">{c.texto}</span>
    </span>
  )
}
```

- [ ] **Step 2: Crear el hook usePlaya**

Crear `src/hooks/usePlaya.js`:

```js
import { useEffect, useState } from 'react'
import { obtenerDatosPlaya } from '../data/openMeteo.js'
import { evaluarPlaya } from '../rules/evaluarPlaya.js'

export function usePlaya(playa) {
  const [estado, setEstado] = useState('cargando')
  const [datos, setDatos] = useState(null)
  const [veredicto, setVeredicto] = useState(null)

  useEffect(() => {
    let activo = true
    setEstado('cargando')
    obtenerDatosPlaya(playa)
      .then((d) => {
        if (!activo) return
        setDatos(d)
        setVeredicto(evaluarPlaya(d))
        setEstado('ok')
      })
      .catch(() => {
        if (activo) setEstado('error')
      })
    return () => {
      activo = false
    }
  }, [playa.id])

  return { estado, datos, veredicto }
}
```

- [ ] **Step 3: Verificar que compila (los tests siguen pasando)**

```bash
npm test
```
Expected: PASS (todos los tests previos siguen verdes; estos ficheros no rompen nada).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: componente Semaforo y hook usePlaya"
```

---

### Task 6: Layout con branding Marirrodriga.IA

**Files:**
- Create: `src/Layout.jsx`
- Create: `src/components/Navbar.jsx`
- Modify: `src/App.jsx` (se reescribe en Task 8 con el router; aquí solo Navbar/Layout)

**Interfaces:**
- Consumes: nada.
- Produces:
  - `<Navbar />` con logo Marirrodriga.IA clicable → <https://www.marirrodriga-ia.com/> (nueva pestaña).
  - `<Layout>{children}</Layout>` con fondo azul claro y el Navbar.

- [ ] **Step 1: Crear el Navbar con branding**

Crear `src/components/Navbar.jsx` (logo textual por ahora; sustituir por imagen del logo cuando esté disponible):

```jsx
export default function Navbar() {
  return (
    <nav className="bg-sky-500 text-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <span className="text-lg font-bold">🏖️ Semáforo de Playa</span>
        <a
          href="https://www.marirrodriga-ia.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded bg-yellow-300 px-3 py-1 text-sm font-semibold text-sky-900 transition hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-100 active:bg-yellow-400"
        >
          Marirrodriga.IA
        </a>
      </div>
    </nav>
  )
}
```

> Nota de ejecución: cuando exista el archivo del logo, colocarlo en `src/assets/` y sustituir el texto "Marirrodriga.IA" por un `<img>` dentro del `<a>`.

- [ ] **Step 2: Crear el Layout**

Crear `src/Layout.jsx`:

```jsx
import Navbar from './components/Navbar.jsx'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-sky-100 text-sky-950">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: Verificar que compila**

```bash
npm test
```
Expected: PASS (sin regresiones).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: Layout y Navbar con branding Marirrodriga.IA clicable"
```

---

### Task 7: Página Home (lista de playas con su semáforo)

**Files:**
- Create: `src/pages/Home.jsx`
- Create: `src/components/TarjetaPlaya.jsx`

**Interfaces:**
- Consumes: `PLAYAS` (Task 3), `usePlaya` (Task 5), `<Semaforo>` (Task 5).
- Produces: `<Home />` — lista de tarjetas, cada una con nombre + semáforo + enlace a la ficha (`/playa/:id`).

- [ ] **Step 1: Crear la tarjeta de playa**

Crear `src/components/TarjetaPlaya.jsx`:

```jsx
import { Link } from 'react-router-dom'
import Semaforo from './Semaforo.jsx'
import { usePlaya } from '../hooks/usePlaya.js'

export default function TarjetaPlaya({ playa }) {
  const { estado, veredicto } = usePlaya(playa)
  return (
    <Link
      to={`/playa/${playa.id}`}
      className="block rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-400"
    >
      <article className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-sky-900">{playa.nombre}</h2>
        {estado === 'cargando' && <span className="text-sm text-sky-500">Cargando…</span>}
        {estado === 'error' && <span className="text-sm text-red-500">Sin datos</span>}
        {estado === 'ok' && <Semaforo nivel={veredicto.nivel} />}
      </article>
    </Link>
  )
}
```

- [ ] **Step 2: Crear la Home**

Crear `src/pages/Home.jsx`:

```jsx
import { PLAYAS } from '../data/playas.js'
import TarjetaPlaya from '../components/TarjetaPlaya.jsx'

export default function Home() {
  return (
    <section>
      <h1 className="mb-4 text-2xl font-bold text-sky-900">Playas de Gran Canaria</h1>
      <div className="grid gap-3">
        {PLAYAS.map((p) => (
          <TarjetaPlaya key={p.id} playa={p} />
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: página Home con lista de playas y su semáforo"
```

---

### Task 8: Ficha de playa + router (app funcional de punta a punta)

**Files:**
- Create: `src/pages/FichaPlaya.jsx`
- Create: `src/router.jsx`
- Modify: `src/App.jsx`
- Modify: `src/main.jsx`

**Interfaces:**
- Consumes: `PLAYAS`, `usePlaya`, `<Semaforo>`, `<Layout>`.
- Produces: rutas `/` (Home) y `/playa/:id` (Ficha); app completa arrancable.

- [ ] **Step 1: Instalar el router**

```bash
npm install react-router-dom
```

- [ ] **Step 2: Crear la ficha de playa**

Crear `src/pages/FichaPlaya.jsx`:

```jsx
import { useParams, Link } from 'react-router-dom'
import { PLAYAS } from '../data/playas.js'
import { usePlaya } from '../hooks/usePlaya.js'
import Semaforo from '../components/Semaforo.jsx'

function Dato({ etiqueta, valor, unidad }) {
  return (
    <div className="rounded-lg bg-white p-3 text-center shadow-sm">
      <div className="text-xs text-sky-500">{etiqueta}</div>
      <div className="text-lg font-semibold text-sky-900">
        {valor}
        {unidad}
      </div>
    </div>
  )
}

export default function FichaPlaya() {
  const { id } = useParams()
  const playa = PLAYAS.find((p) => p.id === id)
  if (!playa) {
    return (
      <section>
        <p className="text-sky-900">Playa no encontrada.</p>
        <Link to="/" className="text-sky-600 underline">Volver</Link>
      </section>
    )
  }

  const { estado, datos, veredicto } = usePlaya(playa)

  return (
    <section>
      <Link to="/" className="text-sm text-sky-600 underline">← Todas las playas</Link>
      <h1 className="mt-2 text-2xl font-bold text-sky-900">{playa.nombre}</h1>

      {estado === 'cargando' && <p className="mt-4 text-sky-500">Cargando datos…</p>}
      {estado === 'error' && <p className="mt-4 text-red-500">No se pudieron cargar los datos.</p>}

      {estado === 'ok' && (
        <>
          <div className="mt-4 rounded-xl bg-white p-5 shadow-sm">
            <Semaforo nivel={veredicto.nivel} />
            <p className="mt-2 text-lg font-medium text-sky-900">{veredicto.frase}</p>
            {veredicto.motivos.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-sm text-sky-700">
                {veredicto.motivos.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Dato etiqueta="Temperatura" valor={Math.round(datos.temperatura)} unidad="°" />
            <Dato etiqueta="Viento" valor={Math.round(datos.viento)} unidad=" km/h" />
            <Dato etiqueta="Agua" valor={Math.round(datos.tempAgua)} unidad="°" />
            <Dato etiqueta="Oleaje" valor={datos.oleaje} unidad=" m" />
            <Dato etiqueta="UV" valor={Math.round(datos.uv)} unidad="" />
          </div>
        </>
      )}
    </section>
  )
}
```

- [ ] **Step 3: Crear el router**

Crear `src/router.jsx`:

```jsx
import { createBrowserRouter } from 'react-router-dom'
import Home from './pages/Home.jsx'
import FichaPlaya from './pages/FichaPlaya.jsx'

export const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/playa/:id', element: <FichaPlaya /> },
])
```

- [ ] **Step 4: Conectar App con Layout + RouterProvider**

Sustituir el contenido de `src/App.jsx` por:

```jsx
import { RouterProvider } from 'react-router-dom'
import Layout from './Layout.jsx'
import { router } from './router.jsx'

export default function App() {
  return (
    <Layout>
      <RouterProvider router={router} />
    </Layout>
  )
}
```

> Nota: el Navbar del Layout es global; el router pinta la página activa dentro del `<main>`.

- [ ] **Step 5: Verificar que main.jsx monta App**

Confirmar que `src/main.jsx` (generado por Vite) renderiza `<App />`. Si el scaffold dejó imports de CSS de ejemplo, dejar solo:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 6: Verificar toda la suite de tests**

```bash
npm test
```
Expected: PASS (todos los tests de rules y data siguen verdes).

- [ ] **Step 7: Verificación manual end-to-end**

```bash
npm run dev
```
Expected: en `http://localhost:5173` se ve la Home con la lista de playas; cada tarjeta carga su semáforo con datos reales de Open-Meteo; al pulsar una playa se abre la ficha con el veredicto, la frase, los motivos y los datos; el logo Marirrodriga.IA abre la web oficial en nueva pestaña. Cerrar con Ctrl+C.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: ficha de playa y router — app funcional de punta a punta"
```

---

### Task 9: Verificación visual (Playwright) y auditoría

**Files:**
- Ninguno nuevo (verificación).

**Interfaces:**
- Consumes: la app completa.
- Produces: confirmación de que la UI está bien y cumple guías.

- [ ] **Step 1: Verificación visual con Playwright**

Con `npm run dev` corriendo, usar Playwright MCP para renderizar y capturar la Home y una ficha. Revisar: márgenes rotos, textos superpuestos, contraste de la paleta azules/amarillos, semáforo legible, responsive en pantalla estrecha.

- [ ] **Step 2: Auditoría de guías**

Pasar la UI por la skill `web-design-guidelines` y aplicar `vercel-react-best-practices`. Corregir hallazgos relevantes (accesibilidad de los enlaces/botones, estados de foco, HTML semántico).

- [ ] **Step 3: Commit de correcciones (si las hay)**

```bash
git add -A
git commit -m "fix: correcciones de verificación visual y auditoría"
```

---

## Fuera de alcance de este plan (plan siguiente)

- Backend proxy en Vercel serverless functions.
- Integración de la API de mareas (pleamar/bajamar + coeficiente + aviso de marea viva).
- Chatbot con Gemini vía tool-use.
- Franjas horarias (mañana/mediodía/tarde) y previsión a varios días en la ficha.
- Sustituir el logo textual por la imagen real del logo Marirrodriga.IA.
- Deploy en Vercel.
