// ehRadio Remote — service worker
// يخزّن هيكل التطبيق فقط (الأيقونات، الإعدادات، الغلاف) — لا يخزّن محتوى الراديو نفسه،
// لأن التحكم الفعلي يحتاج اتصالًا حيًا بالجهاز على الشبكة المحلية.

const CACHE_NAME = "ehradio-shell-v1";
const SHELL_FILES = [
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // لا نتدخل أبدًا في الطلبات الموجهة لجهاز الراديو نفسه (IP مختلف) — تمر مباشرة للشبكة.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          return res;
        }).catch(() => cached)
      );
    })
  );
});
