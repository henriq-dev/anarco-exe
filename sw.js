/* ÂNCORA: service worker = "porteiro" que guarda os arquivos no aparelho. Depois da 1ª visita o jogo abre até sem internet. */
const VERSAO = "anarco-v3.4-merge3";
const BASICO = ["./", "index.html", "style.css", "script.js", "manifest.webmanifest", "sw.js",
  "assets/dados/cena.js", "assets/dados/icones.js", "assets/dados/manifesto.js", "assets/dados/modelo.js", "assets/dados/props.js",
  "assets/lib/three.min.js", "assets/lib/three.module.js", "assets/lib/three.core.js", "assets/lib/GLTFLoader.js",
  "assets/utils/BufferGeometryUtils.js", "assets/utils/SkeletonUtils.js", "assets/fonts/fonts.css",
  "assets/fonts/anton-latin.woff2", "assets/fonts/anton-latin-ext.woff2", "assets/fonts/special-elite-latin.woff2", "assets/fonts/special-elite-latin-ext.woff2",
  "assets/img/icone-180.png", "assets/img/icone-192.png", "assets/img/icone-512.png", "assets/img/favicon.png", "assets/img/favicon.svg",
  "assets/img/fundo-menu.jpg", "assets/img/fundo-briefing.jpg", "assets/img/skins/capuz.png", "assets/img/skins/cachos.png",
  "assets/img/icones/data.png", "assets/img/icones/drone.png", "assets/img/icones/energy.png", "assets/img/icones/hack.png", "assets/img/icones/keycard.png", "assets/img/icones/usb.png",
  "assets/img/props/crt.webp", "assets/img/props/laptop.webp", "assets/img/props/mask.webp", "assets/img/props/rack.webp", "assets/img/props/usb.webp",
  "assets/models/anarco.bin", "assets/models/laptop.bin", "assets/models/boss-banqueiro-animated.glb",
  "assets/models/boss-petroleo-rigged.glb", "assets/models/boss-ceo-rigged.glb"];

self.addEventListener("install", (e) => {
  // guarda o básico; se algum arquivo falhar, a instalação do SW continua mesmo assim
  e.waitUntil(caches.open(VERSAO).then((c) => Promise.allSettled(BASICO.map((u) => c.add(u)))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  // apaga caches de versões antigas
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// ÂNCORA: estratégia "rede primeiro, cache de reserva": online pega a versão nova (e guarda); offline usa a guardada.
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
