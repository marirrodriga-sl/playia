// Función serverless (Vercel) del chatbot de PlayIA.
// Hace de proxy al LLM para que la API key NUNCA llegue al navegador.
// El proveedor es INTERCAMBIABLE: toda la llamada al modelo vive aquí, así que
// cambiar Gemini por Claude/GPT/otro es una edición local sin tocar el frontend.
//
// Diseño anti-alucinación: los números (marea, viento, veredicto...) los calcula
// el motor de reglas del frontend y se inyectan como DATOS REALES en el contexto.
// El modelo solo redacta; tiene prohibido inventar cifras.

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent'

const SISTEMA = `Eres el asistente de PlayIA, una app que dice de un vistazo qué tal está hoy cada playa de Canarias.
Hablas en español de España, con tono amable, cercano y BREVE (1-3 frases). Puedes usar algún emoji con moderación.
Respondes SIEMPRE basándote únicamente en los DATOS REALES de la playa que te paso más abajo.
NUNCA inventes cifras, horas ni previsiones: si algo no está en los datos, dilo con naturalidad y sin disculparte en exceso.
Si te preguntan algo ajeno a esta playa, al tiempo o al baño, redirige con simpatía al tema de la playa.`

// Encapsula la llamada al proveedor de IA. Cambiar de proveedor = cambiar solo esto.
async function preguntarLLM(sistema, contexto, mensajes) {
  const contents = mensajes.map((m) => ({
    role: m.rol === 'user' ? 'user' : 'model',
    parts: [{ text: String(m.texto || '').slice(0, 1000) }],
  }))

  const body = {
    systemInstruction: {
      parts: [{ text: `${sistema}\n\n--- DATOS REALES DE LA PLAYA ---\n${contexto}` }],
    },
    contents,
    generationConfig: { temperature: 0.6, maxOutputTokens: 320 },
  }

  const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`LLM ${res.status}: ${txt.slice(0, 300)}`)
  }
  const data = await res.json()
  const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text
  return (texto || '').trim() || 'Vaya, no he sabido responder a eso. ¿Lo pruebas de otra forma? 🙂'
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
    const respuesta = await preguntarLLM(SISTEMA, String(contexto || '').slice(0, 4000), recientes)
    return res.status(200).json({ respuesta })
  } catch {
    return res.status(502).json({ error: 'El asistente no está disponible ahora mismo.' })
  }
}
