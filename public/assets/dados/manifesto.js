// ÂNCORA: caminhos das imagens do jogo (antes eram Base64 embutido).
// Estes arquivos precisam ser abertos por um servidor (Vercel, Netlify, Live Server, python -m http.server).

// Ícones do HUD e dos itens
const ICON = {
  hack: "assets/img/icones/hack.png",
  data: "assets/img/icones/data.png",
  energy: "assets/img/icones/energy.png",
  keycard: "assets/img/icones/keycard.png",
  drone: "assets/img/icones/drone.png",
  usb: "assets/img/icones/usb.png",
};

// Props do cenário do esconderijo (ar = proporção largura/altura)
const PR = {
  laptop: { src: "assets/img/props/laptop.webp", ar: 1.2444444444444445 },
  rack: { src: "assets/img/props/rack.webp", ar: 0.6071428571428571 },
  crt: { src: "assets/img/props/crt.webp", ar: 0.9857142857142858 },
  usb: { src: "assets/img/props/usb.webp", ar: 1.2556053811659194 },
  mask: { src: "assets/img/props/mask.webp", ar: 1.0294117647058822 },
};

// Mural da fase 4 (é a mesma arte do fundo do briefing: um arquivo só)
const SCENE = "assets/img/fundo-briefing.jpg";
