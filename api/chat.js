// Función serverless (Vercel) del asistente de PlayIA.
// Hace de proxy al LLM para que la API key NUNCA llegue al navegador.
// El proveedor es INTERCAMBIABLE: toda la llamada al modelo vive aquí, así que
// cambiar Gemini por Claude/GPT/otro es una edición local sin tocar el frontend.

// Modelo "lite": alias estable, buena cuota del tier gratuito, rápido y sin el
// "thinking" del flash grande (que dejaba respuestas cortadas).
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent'

const SISTEMA = `Eres el asistente de PlayIA, un experto local de las Islas Canarias (sobre todo Gran Canaria) que ayuda a planear el día de playa y todo lo de alrededor.
Ayudas con: qué playa elegir según el tiempo y el mar, cómo llegar y dónde aparcar, dónde comer o tomar algo cerca, dónde alojarse, ocio y vida nocturna, y cómo moverse por la isla.
Tono: amable, cercano, útil y BREVE (2-4 frases). Español de España. Puedes usar algún emoji con moderación.
Reglas importantes:
- Para el estado del mar, el viento o la marea de una playa concreta y en tiempo real, dile al usuario que lo mire en la ficha de esa playa dentro de PlayIA (ahí está el semáforo y la marea actualizados). Tú orientas en general.
- Para recomendaciones (restaurantes, aparcamiento, bares, ocio, alojamiento): da orientación por ZONAS y opciones típicas, y recuerda confirmar horarios, precios y disponibilidad. NO te inventes nombres, direcciones ni datos concretos de los que no estés seguro; si no lo sabes con certeza, dilo con naturalidad y sugiere cómo averiguarlo.
- Si te preguntan algo totalmente ajeno a viajar, la playa o Canarias, responde con simpatía y reconduce al tema.`

// Encapsula la llamada al proveedor de IA. Cambiar de proveedor = cambiar solo esto.
async function preguntarLLM(sistema, contexto, mensajes) {
  const contents = mensajes.map((m) => ({
    role: m.rol === 'user' ? 'user' : 'model',
    parts: [{ text: String(m.texto || '').slice(0, 1000) }],
  }))

  const instruccion = contexto
    ? `${sistema}\n\n--- CONTEXTO DE LA PÁGINA ---\n${contexto}`
    : sistema

  const body = {
    systemInstruction: { parts: [{ text: instruccion }] },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500,
    },
  }

  // El modelo gratuito da picos de 429/503 ("high demand") transitorios.
  // Reintentamos con backoff corto antes de rendirnos.
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
      const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text
      return (texto || '').trim() || 'Vaya, no he sabido responder a eso. ¿Lo pruebas de otra forma? 🙂'
    }
    ultimoError = `LLM ${res.status}: ${(await res.text()).slice(0, 200)}`
    if (!REINTENTABLES.has(res.status)) break
  }
  throw new Error(ultimoError)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'El asistente no está configurado.' })
  }

  try {
    const { contexto, mensajes } = req.body || {}
    if (!Array.isArray(mensajes) || mensajes.length === 0) {
      return res.status(400).json({ error: 'Faltan mensajes.' })
    }
    // Límite defensivo del free tier: solo el tramo reciente de la conversación.
    const recientes = mensajes.slice(-12)
    const respuesta = await preguntarLLM(SISTEMA, String(contexto || '').slice(0, 2000), recientes)
    return res.status(200).json({ respuesta })
  } catch {
    return res.status(502).json({ error: 'El asistente no está disponible ahora mismo.' })
  }
}
