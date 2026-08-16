// Función serverless (Vercel) del asistente de PlayIA.
// Proxy al LLM (key oculta) + herramienta con datos REALES.
//
// Con function-calling: cuando el usuario pregunta por el estado del mar/marea
// de una playa concreta, el modelo llama a `consulta_playa` y el backend
// resuelve la playa en el catálogo, pide Open-Meteo y ejecuta el MOTOR DE
// REGLAS. Así el veredicto y las cifras son reales; el modelo solo redacta.
import { PLAYAS } from '../src/data/playas.js'
import { obtenerDatosPlaya } from '../src/services/openMeteo.js'
import { evaluarPlaya } from '../src/domain/evaluarPlaya.js'
import { obtenerMarea } from '../src/services/mareaService.js'

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent'

const SISTEMA = `Eres el asistente de PlayIA, un experto local de las Islas Canarias (sobre todo Gran Canaria) que ayuda a planear el día de playa y todo lo de alrededor.
Ayudas con: qué playa elegir según el tiempo y el mar, cómo llegar y dónde aparcar, dónde comer o tomar algo, dónde alojarse, ocio y vida nocturna, y cómo moverse por la isla.
Tono: amable, cercano, útil y BREVE (2-4 frases). Español de España. Puedes usar algún emoji con moderación.
Reglas importantes:
- Para el estado del mar, el viento, el oleaje, el UV o la marea de una playa concreta, USA SIEMPRE la herramienta consulta_playa: te devuelve datos reales y actuales. No te los inventes ni digas que los mire en otro sitio. Si la herramienta no encuentra la playa, dilo y pide que concrete el nombre.
- Para recomendaciones (restaurantes, aparcamiento, ocio, alojamiento): orienta por ZONAS y opciones típicas, y recuerda confirmar horarios, precios y disponibilidad. No inventes nombres ni datos concretos de los que no estés seguro.
- Si te preguntan algo totalmente ajeno a viajar, la playa o Canarias, responde con simpatía y reconduce.`

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'consulta_playa',
        description:
          'Estado REAL y actual de una playa de Canarias: veredicto (semáforo verde/ámbar/rojo), temperatura del aire, viento, temperatura del agua, oleaje, UV y marea (subiendo/bajando, próxima pleamar/bajamar, aviso de marea viva). Úsala siempre que pregunten por el tiempo, el mar, el baño o la marea de una playa concreta.',
        parameters: {
          type: 'OBJECT',
          properties: {
            nombre: { type: 'STRING', description: 'Nombre de la playa, p. ej. "Las Canteras" o "Maspalomas".' },
          },
          required: ['nombre'],
        },
      },
    ],
  },
]

function normaliza(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/playas?( de(l| las?| los?)?)?/g, ' ')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buscarPlaya(nombre) {
  const q = normaliza(nombre)
  if (!q) return null
  let mejor = null
  let mejorScore = 0
  for (const p of PLAYAS) {
    const n = normaliza(p.nombre)
    let score = 0
    if (n === q) score = 100
    else if (n.includes(q) || q.includes(n)) score = 60 + Math.min(q.length, n.length)
    if (score > mejorScore) {
      mejorScore = score
      mejor = p
    }
  }
  return mejorScore > 0 ? mejor : null
}

function hhmm(f) {
  return new Date(f).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Atlantic/Canary' })
}

async function consultaPlaya(nombre) {
  const playa = buscarPlaya(nombre)
  if (!playa) return { encontrada: false, nombre_buscado: nombre }
  const [datos, marea] = await Promise.all([obtenerDatosPlaya(playa), obtenerMarea(playa).catch(() => null)])
  const v = evaluarPlaya(datos)
  return {
    encontrada: true,
    playa: playa.nombre,
    isla: playa.isla,
    orientacion: playa.orientacion,
    veredicto: v.nivel,
    resumen: v.frase,
    motivos: v.motivos,
    temperatura_aire_c: Math.round(datos.temperatura),
    viento_kmh: Math.round(datos.viento),
    agua_c: Math.round(datos.tempAgua),
    oleaje_m: datos.oleaje,
    uv: Math.round(datos.uv),
    marea: marea
      ? {
          estado: marea.subiendo ? 'subiendo' : 'bajando',
          proxima_pleamar: marea.proximaPleamar?.fecha ? hhmm(marea.proximaPleamar.fecha) : null,
          proxima_bajamar: marea.proximaBajamar?.fecha ? hhmm(marea.proximaBajamar.fecha) : null,
          marea_viva: !!marea.mareaViva,
        }
      : null,
  }
}

// Una llamada al modelo con reintentos ante 429/503 (picos del free tier).
async function llamarModelo(contents) {
  const body = {
    systemInstruction: { parts: [{ text: SISTEMA }] },
    contents,
    tools: TOOLS,
    generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
  }
  const REINTENTABLES = new Set([429, 500, 502, 503, 504])
  let ultimoError = ''
  for (let intento = 0; intento < 3; intento++) {
    if (intento > 0) await new Promise((r) => setTimeout(r, 500 * intento))
    const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const data = await res.json()
      return data?.candidates?.[0]?.content ?? { parts: [] }
    }
    ultimoError = `LLM ${res.status}: ${(await res.text()).slice(0, 200)}`
    if (!REINTENTABLES.has(res.status)) break
  }
  throw new Error(ultimoError)
}

const functionCallDe = (content) => (content?.parts || []).find((p) => p.functionCall)?.functionCall
const textoDe = (content) =>
  (content?.parts || [])
    .filter((p) => p.text)
    .map((p) => p.text)
    .join('')
    .trim()

async function ejecutarHerramienta(fc) {
  if (fc.name === 'consulta_playa') return consultaPlaya(fc.args?.nombre || '')
  return { error: 'herramienta desconocida' }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'El asistente no está configurado.' })

  try {
    const { mensajes } = req.body || {}
    if (!Array.isArray(mensajes) || mensajes.length === 0) {
      return res.status(400).json({ error: 'Faltan mensajes.' })
    }
    const contents = mensajes.slice(-12).map((m) => ({
      role: m.rol === 'user' ? 'user' : 'model',
      parts: [{ text: String(m.texto || '').slice(0, 1000) }],
    }))

    let content = await llamarModelo(contents)
    // Ronda(s) de herramienta: si el modelo pide datos de una playa, se los damos.
    for (let ronda = 0; ronda < 3 && functionCallDe(content); ronda++) {
      const fc = functionCallDe(content)
      contents.push(content)
      const resultado = await ejecutarHerramienta(fc)
      contents.push({ role: 'user', parts: [{ functionResponse: { name: fc.name, response: resultado } }] })
      content = await llamarModelo(contents)
    }

    const respuesta = textoDe(content) || 'Vaya, no he sabido responder a eso. ¿Lo pruebas de otra forma? 🙂'
    return res.status(200).json({ respuesta })
  } catch {
    return res.status(502).json({ error: 'El asistente no está disponible ahora mismo.' })
  }
}
