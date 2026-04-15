const CACHE_NAME = 'tufit-v2'

self.addEventListener('install', event => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Não interceptar nada que não seja do mesmo origin ou que seja API
  if (
    url.origin !== location.origin ||
    url.hostname.includes('supabase.co') ||
    event.request.method !== 'GET'
  ) {
    return
  }

  // Só cachear assets estáticos (js, css, png, svg, woff)
  const isAsset = /\.(js|css|png|jpg|svg|ico|woff2?)(\?.*)?$/.test(url.pathname)

  if (isAsset) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // Para tudo mais (navegação, rotas do React), deixa passar normalmente
  // NÃO interceptar — o React Router cuida das rotas
})
