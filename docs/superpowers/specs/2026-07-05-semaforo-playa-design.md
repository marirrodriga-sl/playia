# Semáforo de Playa — Diseño (spec)

- **Fecha:** 2026-07-05
- **Autor:** Marco (Marirrodriga S.L.) + Claude
- **Estado:** Aprobado para pasar a plan de implementación
- **Nombre del producto:** provisional ("Semáforo de Playa")

---

## 1. Problema y objetivo

En Canarias no existe una app/web **clara, legible y entendible** sobre el estado real de las playas
(temperatura, viento, estado del mar y **marea**). Herramientas como Windy o Windguru tienen todos los
datos, pero están pensadas para surfistas y pescadores, no para alguien que solo quiere saber
*"¿me llevo hoy a la playa o no?"*. Un caso doloroso típico: temporada de **marea viva**, uno va
esperando un buen día y se encuentra la playa sin arena.

**Objetivo:** responder de un vistazo *"¿qué tal está HOY esta playa?"* con un **semáforo** (🟢🟠🔴)
y una frase clara, más un **chatbot** al que preguntar en lenguaje natural. Producto propio de
Marirrodriga, con datos reales desde el día 1.

**No-objetivos (V1):** no cubrir todas las islas, no analítica avanzada, no cuentas de usuario,
no notificaciones push.

---

## 2. Concepto: dos capas

El producto **no** es "semáforo o chatbot". Son dos capas que colaboran:

1. **Motor de reglas (determinista) — la fuente de verdad.**
   Coge los datos crudos y calcula el veredicto (🟢🟠🔴, marea alta/baja, horas de buen tiempo).
   Sin IA. Determinista y seguro: nunca alucina sobre condiciones del mar.

2. **Chatbot con IA (capa conversacional).**
   Cuando el usuario pregunta en lenguaje natural, el LLM **no adivina**: usa una *herramienta*
   (tool-use) que consulta el motor de reglas y los datos de previsión, y traduce el resultado a
   lenguaje natural. La IA conversa; los números salen de las reglas.

**Principio rector:** el valor del producto no es un LLM, es el **motor de reglas** que traduce
números aburridos a un veredicto claro. La IA es una capa de conveniencia encima.

---

## 3. Arquitectura

```
Frontend (React + Vite + Tailwind, deploy en Vercel)
      │
      ├─→ Open-Meteo (llamada directa, sin API key)
      │      Forecast API  → temperatura, viento, UV, previsión horaria 7 días
      │      Marine API    → oleaje, altura de olas, temperatura del agua
      │
      └─→ Backend proxy (Vercel serverless functions)
                ├─→ API de mareas (key oculta) → pleamar/bajamar, coeficiente
                └─→ Gemini API (key oculta)    → chatbot con tool-use
                         └─ herramienta consulta_playa(zona, cuando)
                              → llama al motor de reglas + datos de previsión
```

**Reglas de arquitectura:**
- El **frontend nunca ve ninguna API key**. Todo lo que necesite key pasa por el backend.
- Open-Meteo es gratis y sin key → se puede llamar directo desde el frontend.
- La API de mareas y Gemini **sí** requieren key → pasan por el backend proxy.
- El **proveedor de IA es intercambiable**: hoy Gemini, mañana Claude/GPT/otro, cambiando solo
  una función en el backend. El frontend no se entera.

---

## 4. Componentes

Cada componente tiene un propósito único y se puede entender/probar de forma aislada.

### 4.1 Motor de reglas (`rules-engine`)
- **Qué hace:** input = datos meteo/mar/marea de una playa y una franja horaria → output = veredicto
  estructurado (nivel 🟢🟠🔴, motivos, frase resumen, datos de marea).
- **Cómo se usa:** función pura, sin efectos secundarios, sin red. `evaluarPlaya(datos) → veredicto`.
- **De qué depende:** de nada externo. Recibe datos ya obtenidos.
- **Testing:** unitario, TDD. Es el corazón del producto.

### 4.2 Capa de datos (`data`)
- **Qué hace:** obtiene y normaliza datos de Open-Meteo (frontend) y de la API de mareas (backend).
- **Cómo se usa:** `obtenerDatosPlaya(playa) → datos normalizados`.
- **De qué depende:** Open-Meteo (directo), backend proxy (mareas).

### 4.3 Backend proxy (`api/` serverless functions en Vercel)
- **Qué hace:** guarda las keys, hace de proxy a la API de mareas y a Gemini, expone la
  herramienta `consulta_playa` al chatbot.
- **Cómo se usa:** endpoints `/api/mareas`, `/api/chat`.
- **De qué depende:** API de mareas, Gemini API, motor de reglas (compartido).

### 4.4 Frontend — pantallas
- **Home:** lista (y/o mapa) de las playas de Gran Canaria, cada una con su semáforo actual.
- **Ficha de playa:** veredicto grande + desglose (viento, temp, agua, UV, marea) + **franjas**
  (mañana / mediodía / tarde) + previsión próximos días.
- **Chatbot:** burbuja flotante. Preguntas tipo:
  - *"¿Está buena Las Canteras hoy?"*
  - *"¿Cuándo baja el viento en Maspalomas?"*
  - *"¿Está la marea alta ahora en El Confital?"*

---

## 5. Datos y cobertura

### 5.1 Fuentes
- **Open-Meteo Forecast + Marine API**: gratis, sin key, previsión horaria a 7 días. Base del semáforo.
- **API de mareas** (vía backend): pleamar/bajamar y coeficiente. **Mayor riesgo de integración** del
  proyecto — se aísla detrás del backend. En implementación:
  - Validar que el tier gratuito cubre las playas canarias objetivo.
  - **Caché agresiva** (los datos de marea cambian de forma predecible) para no agotar el free tier.
  - Candidatas a evaluar: WorldTides, Stormglass u otra con tier gratuito; o armónicos de
    Puertos del Estado como plan B.

### 5.2 Cobertura V1
5–8 playas clave de **Gran Canaria**:
Las Canteras, El Confital, Maspalomas, Playa del Inglés, Amadores, San Agustín, Melenara
(lista final a confirmar en implementación). El chatbot responde sobre estas playas/zonas.

---

## 6. Motor de reglas — criterio "buen día"

Pensado para **público general y familias**, no para surfistas. Umbrales de partida (ajustables tras
pruebas reales):

- 🟢 **Buen día:** viento flojo (< 20 km/h), temperatura agradable (> 22 °C), oleaje bajo,
  sin aviso de marea que "coma" la playa en horas de sol.
- 🟠 **Regular:** alguna variable molesta — viento incómodo (20–35 km/h), agua fría (< 19 °C),
  UV muy alto, o marea que reduce la playa en parte de la tarde.
- 🔴 **Mejor otro día / otra playa:** viento fuerte (> 35 km/h), oleaje alto, o **marea viva** que
  deja la playa sin arena durante las horas centrales.

El motor devuelve, además del nivel, los **motivos** (para la frase clara) y los datos de marea
(alta/baja + próxima pleamar/bajamar), que el chatbot reutiliza.

---

## 7. IA (chatbot)

- **Proveedor V1:** **Gemini** (tier gratuito de Google AI Studio / Gemini API). Elegido por coste
  cero para validar. Modelo Flash/Flash-Lite.
- **Patrón:** *tool-use / function calling*. El LLM dispone de la herramienta `consulta_playa(zona, cuando)`
  que devuelve el veredicto del motor de reglas + previsión. El LLM redacta la respuesta en español
  natural; **no calcula ni inventa** los datos.
- **Caveats del tier gratuito** (asumidos): límites de peticiones por minuto/día; en gratis Google
  puede usar los envíos para mejorar sus modelos (solo se envían datos meteorológicos públicos y la
  pregunta del usuario, nada sensible).
- **Proveedor intercambiable:** la llamada al LLM se encapsula tras una interfaz en el backend, de
  modo que cambiar a Claude/GPT/otro sea una modificación local, sin tocar el frontend.

---

## 8. Estética y marca

**Tono visual:** luminoso y amigable, como corresponde a una página de **tiempo y playas** — NO el
dark mode de marca Marirrodriga. Paleta de **azules claros** (cielo/mar) y **amarillos** (sol/arena).

- Fondos claros, cielo/mar; acentos soleados. Sensación fresca y accesible.
- El **semáforo** (🟢🟠🔴) mantiene sus colores propios (verde/ámbar/rojo) por encima de la paleta.
- **Mobile-first**: diseñar primero pantalla estrecha, expandir con `sm:`/`md:`/`lg:`.
- HTML semántico, estados interactivos definidos (hover/focus/disabled/active).
- Se activará la skill `frontend-design` en la fase de UI.

**Marca Marirrodriga.IA:**
- Presente sobre todo vía **logo** de Marirrodriga.IA (más que el nombre del producto).
- El logo es **clicable** y lleva a la web oficial de la empresa:
  <https://www.marirrodriga-ia.com/> (abre en nueva pestaña).

---

## 9. Testing y calidad

- **Motor de reglas:** tests unitarios con TDD (superpowers `test-driven-development`).
- **Verificación visual:** Playwright al cerrar cada pantalla (márgenes, textos, dark mode).
- **Auditoría de entrega:** `web-design-guidelines` + `vercel-react-best-practices`.

---

## 10. Stack

- **Frontend:** React + Vite + Tailwind. Páginas en `pages/`, router centralizado en `router.jsx`,
  componentes reutilizables (Navbar, etc.), composición en `Layout.jsx`.
- **Backend:** Vercel serverless functions (`api/`).
- **Deploy:** Vercel.

---

## 11. Riesgos y decisiones abiertas

| Riesgo / decisión | Mitigación |
|---|---|
| API de mareas: cobertura y límites del free tier en Canarias | Aislar tras backend; evaluar 2-3 candidatas; caché agresiva; plan B Puertos del Estado |
| Límites de ritmo de Gemini gratis | Suficiente para validación; proveedor intercambiable si escala |
| Umbrales del semáforo poco calibrados al inicio | Umbrales configurables; ajustar tras pruebas reales en playas conocidas |
| Nombre del producto sin decidir | Provisional; decidir antes de lanzamiento público |

---

## 12. Alcance del primer incremento de implementación

Orden sugerido (se detallará en el plan):
1. Andamiaje del proyecto (Vite + Tailwind + estructura).
2. **Motor de reglas** con tests (TDD) — sin UI todavía.
3. Capa de datos Open-Meteo + ficha de una playa (Las Canteras) mostrando el semáforo real.
4. Resto de playas de Gran Canaria + Home.
5. Backend proxy + integración de mareas.
6. Backend proxy + chatbot Gemini con tool-use.
7. Pulido visual, verificación Playwright, auditoría.
