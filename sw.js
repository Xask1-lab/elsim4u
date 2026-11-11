// ElSim4U — службовий модуль (service worker): дозволяє програмі працювати без інтернету.
// Стратегія: сторінку завжди спершу беремо з мережі (так оновлення приходять самі),
// а якщо мережі немає — віддаємо збережену копію. Іконки й маніфести — з кешу, з тихим оновленням.
const CACHE='elsim4u-v1';
const CORE=['./','manifest-1.webmanifest','manifest-2.webmanifest','manifest-3.webmanifest','manifest-4.webmanifest',
 ...['1','2','3','4'].flatMap(k=>[`icons/icon-${k}-192.png`,`icons/icon-${k}-512.png`,`icons/icon-${k}-maskable.png`,`icons/apple-${k}.png`])];

// встановлення: одразу зберігаємо все потрібне для роботи без мережі
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
// активація: прибираємо старі кеші попередніх версій модуля
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});

self.addEventListener('fetch',e=>{
 const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
 const page=r.mode==='navigate'||/\/(index\.html)?$/.test(new URL(r.url).pathname);
 if(page){
  // сторінка: мережа → кеш (свіжа версія при наявності інтернету)
  e.respondWith(fetch(r,{cache:'no-cache'}).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put('./',cp))}return res})
   .catch(()=>caches.match('./')));
 }else{
  // решта файлів: кеш → мережа, кеш оновлюється у фоні
  e.respondWith(caches.match(r).then(hit=>{const net=fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res}).catch(()=>hit);return hit||net}));
 }
});
