import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Plugin de desarrollo: sirve /api/marea localmente usando el mismo handler
// que en Vercel, con la key cargada desde .env (nunca llega al navegador).
function apiDev(env) {
  return {
    name: 'api-dev',
    configureServer(server) {
      server.middlewares.use('/api/marea', async (req, res) => {
        process.env.WORLDTIDES_KEY = env.WORLDTIDES_KEY
        const { default: handler } = await server.ssrLoadModule('/api/marea.js')
        return handler(req, res)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), apiDev(env)],
    test: {
      environment: 'jsdom',
      globals: true,
    },
  }
})
