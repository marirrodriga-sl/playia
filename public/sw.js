// Service worker de PlayIA — habilita instalación como app y un mínimo de offline.
const CACHE = 'playia-v1'
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // Datos frescos: marea y clima → red primero, cache como respaldo.
  if (url.pathname.startsWith('/api/') || url.origin !== self.location.origin) {
    event.respondWith(fetch(request).catch(() => caches.match(request)))
    return
  }

  // Navegación → red, y si no hay conexión, sirve el shell cacheado.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/index.html')))
    return
  }

  // Estáticos propios → cache primero y rellena en segundo plano.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(request, copy))
          }
          return res
        }),
    ),
  )
})
