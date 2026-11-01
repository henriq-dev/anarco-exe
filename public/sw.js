/* ÂNCORA: cache do shell na primeira visita; arquivos grandes só entram quando o jogo realmente precisa deles. */
const VERSAO = "anarco-v4.1.1-lazy-menu-largo";
// O shell é pequeno e mantém o jogo iniciável offline. Áudio, notebook e chefes são buscados sob demanda.
const BASICO = ["./", "index.html", "style.css", "script.js", "manifest.webmanifest", "assets/dados/manifesto.js",
  "assets/share/favicon-192.png", "assets/share/favicon-512.png", "assets/img/skins/vanta.png",
  "assets/models/anarco.mdl"];

self.addEventListener("install", (event) => {
  // Se algum arquivo falhar, a instalação do SW continua mesmo assim.
  event.waitUntil(caches.open(VERSAO).then((cache) => Promise.allSettled(BASICO.map((url) => cache.add(url)))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  // Apaga caches de versões antigas.
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== VERSAO).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

// Rede primeiro: uma resposta bem-sucedida é armazenada para a próxima sessão offline.
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== location.origin) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(VERSAO);
        await cache.put(request, response.clone());
      }
      return response;
    } catch {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === "navigate") {
        const page = await caches.match("./") || await caches.match("index.html");
        if (page) return page;
      }
      // Não responder HTML como se fosse JavaScript, áudio, textura ou modelo 3D.
      return new Response("Offline: arquivo ainda não armazenado neste aparelho.", { status: 503, statusText: "Offline" });
    }
  })());
});
