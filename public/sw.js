const CACHE_NAME = "kastoko-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/",
        "/manifest.json",
        "/icon-192.png",
        "/icon-512.png"
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Hanya proses request GET
  if (event.request.method !== "GET") return;

  // Lewati request API, biarkan Dexie / aplikasi yang menangani logic API offline
  if (event.request.url.includes("/api/")) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return dari cache jika ada
      if (cachedResponse) return cachedResponse;

      // Jika tidak ada di cache, fetch dari network
      return fetch(event.request).then((response) => {
        // Jangan cache jika gagal
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Simpan salinan ke cache
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Jika offline dan tidak ada di cache, bisa fallback ke halaman utama
        if (event.request.destination === "document") {
          return caches.match("/");
        }
      });
    })
  );
});
