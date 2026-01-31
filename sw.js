
const CACHE_NAME = 'sawtify-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// معالجة الملفات المشاركة عبر POST من تطبيقات مثل واتساب
self.addEventListener('fetch', (event) => {
  if (event.request.method === 'POST' && event.request.url.includes('index.html')) {
    event.respondWith(Response.redirect('./?share-target=true', 303));
    
    event.waitUntil(async function() {
      const data = await event.request.formData();
      const files = data.getAll('mediaFiles');
      const client = await clients.get(event.resultingClientId || event.clientId);
      if (client) {
        client.postMessage({ type: 'SHARED_FILES', files });
      }
    }());
  }
});
