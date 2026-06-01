self.addEventListener('install', e => {
    e.waitUntil(caches.open('pwa-v3').then(c => c.addAll(['index.html','styles.css','db.js','app.js'])));
});
self.addEventListener('fetch', e => {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
