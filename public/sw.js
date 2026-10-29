/* ÂNCORA: service worker = "porteiro" que guarda os arquivos no aparelho. Depois da 1ª visita o jogo abre até sem internet. */
const VERSAO = "anarco-v3.9";
// Só nomes estáveis; os arquivos com hash (assets/index-XXXX.js) entram no cache na 1ª visita, pela regra de fetch abaixo.
const BASICO = ["./", "index.html", "style.css", "script.js", "manifest.webmanifest", "assets/dados/manifesto.js",
  "assets/share/favicon-192.png", "assets/share/favicon-512.png", "assets/img/skins/vanta.png",
  "assets/models/anarco.bin", "assets/models/laptop.bin"];

self.addEventListener("install", (e) => {
  // se algum arquivo falhar, a instalação do SW continua mesmo assim
  e.waitUntil(caches.open(VERSAO).then((c) => Promise.allSettled(BASICO.map((u) => c.add(u)))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  // apaga caches de versões antigas
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// ÂNCORA: "rede primeiro, cache de reserva": online pega a versão nova (e guarda); offline usa a guardada.
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copia = res.clone(); caches.open(VERSAO).then((c) => c.put(req, copia)); }
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("index.html")))
  );
});
