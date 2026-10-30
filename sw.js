/* my-planner 서비스워커 — 앱 셸 오프라인 캐시 (2026-10-31 품질수리 3호)
   주의: VER은 index.html 상단 APPVER 주석과 함께 올릴 것 (앱 셸 캐시 무효화 기준).
   페이지(index)는 network-first → 기존 APPVER 자동 새로고침(checkAppUpdate)과 공존, 옛 페이지 고착 없음.
   구글 OAuth·API 등 외부 요청은 손대지 않음(동일 오리진만 처리). */
const VER = "2026.10.31a";
const CACHE = "mp-" + VER;
const SHELL = ["./", "manifest.json", "icon-192.png", "icon-512.png", "icon-maskable.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k.startsWith("mp-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const u = new URL(req.url);
  if (u.origin !== self.location.origin) return;
  const isPage = req.mode === "navigate" || u.pathname.endsWith("/") || u.pathname.endsWith(".html");
  if (isPage) {
    e.respondWith(
      fetch(req).then(r => {
        if (r && r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put("./", c)); }
        return r;
      }).catch(() => caches.match("./"))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(r => {
      if (r && r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); }
      return r;
    }))
  );
});
