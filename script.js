/* ==========================================================
   ANARCO.EXE 3D — lógica do jogo
   Ordem do arquivo: cena -> torres -> jogador -> drones -> entrada
   -> estado/níveis -> minigame -> itens -> chefão -> loop principal
   Imagens ficam em assets/img/ (caminhos em assets/dados/manifesto.js)
   ========================================================== */

// ÂNCORA: armazenamento seguro — se o navegador bloquear o localStorage (modo privado, cookies
// desligados), o jogo continua funcionando; só não guarda tutorial, finais e vazamentos.
const guardar = (chave, valor) => {
  try {
    localStorage.setItem(chave, valor);
  } catch (e) {}
};
const ler = (chave) => {
  try {
    return localStorage.getItem(chave);
  } catch (e) {
    return null;
  }
};
const apagar = (chave) => {
  try {
    localStorage.removeItem(chave);
  } catch (e) {}
};

// ÂNCORA: aviso quando o jogo é aberto com duplo clique (file://). As imagens do cenário são
// texturas WebGL, e o navegador bloqueia texturas lidas de arquivos locais.
if (location.protocol === "file:") {
  const av = document.createElement("div");
  av.id = "aviso-local";
  av.setAttribute("role", "alert");
  av.innerHTML =
    "Abra o jogo por um servidor para ver tudo (Live Server do VS Code ou <code>python -m http.server</code>). " +
    'Na Vercel e na Netlify funciona normal. <button type="button">Entendi</button>';
  av.querySelector("button").onclick = () => av.remove();
  document.body.append(av);
}
const T = THREE,
  $cache = new Map(),
  $ = (id) => {
    // OTIMIZAÇÃO: guarda o elemento e só procura de novo se ele saiu da página
    let el = $cache.get(id);
    if (!el || !el.isConnected) {
      el = document.getElementById(id);
      if (el) $cache.set(id, el);
    }
    return el;
  };
// OTIMIZAÇÃO: só mexe na página quando o valor muda (evita recalcular estilos a cada quadro)
const setTxt = (el, v) => { if (el && el.__t !== v) { el.__t = v; el.textContent = v; } };
const setCls = (el, c, on) => { if (!el) return; const k = "__c_" + c; if (el[k] !== on) { el[k] = on; el.classList.toggle(c, on); } };
const setSty = (el, prop, v) => { if (el) { const k = "__s_" + prop; if (el[k] !== v) { el[k] = v; el.style[prop] = v; } } };
function syncHudClearance() {
  const hud = $("hud"), obj = $("obj"), routes = $("routePicker");
  if (!hud || !obj || !routes) return;
  // ÂNCORA: no modo lateral o painel fica na esquerda (desktop) e o topo da tela fica livre para o objetivo
  const lateral = ["lateral", "slim"].includes(document.body.dataset.hud) && matchMedia("(min-width: 981px)").matches;
  const hudBottom = lateral ? 0 : Math.ceil(hud.getBoundingClientRect().bottom);
  const objHeight = Math.max(30, Math.ceil(obj.getBoundingClientRect().height));
  const objTop = hudBottom + 8;
  const routeTop = objTop + objHeight + 8;
  const routeHeight = Math.ceil(routes.getBoundingClientRect().height) || 38;
  const portraitControls = matchMedia("(max-width: 980px) and (orientation: portrait)").matches;
  const eventTop = portraitControls ? routeTop + routeHeight + 10 : objTop + objHeight + 12;
  const style = document.documentElement.style;
  style.setProperty("--anarco-objective-top", `${objTop}px`);
  style.setProperty("--anarco-route-top", `${routeTop}px`);
  style.setProperty("--anarco-event-top", `${eventTop}px`);
}
syncHudClearance();
window.addEventListener("resize", syncHudClearance, { passive: true });
if ("ResizeObserver" in window) {
  const hudObserver = new ResizeObserver(syncHudClearance);
  [$("hud"), $("obj"), $("routePicker")].forEach((el) => el && hudObserver.observe(el));
}

// Pacote 1: identidade visual semantica por fase.
const PHASE_THEME = [
  { key: "finance", name: "DISTRITO FINANCEIRO", threat: "VIGILANCIA CORPORATIVA", sky: 0x0a0818, fog: 0x0a0818, ground: 0x111114, grid: 0xff3fd0, sun: 0x2fe6ff },
  { key: "industrial", name: "ZONA INDUSTRIAL", threat: "CALOR, FUMACA E DRONES", sky: 0x160d0a, fog: 0x160d0a, ground: 0x1b1412, grid: 0xff6b2d, sun: 0xff9a4a },
  { key: "surveillance", name: "CENTRO DE VIGILANCIA", threat: "CAMERAS E LINHA DE VISAO", sky: 0x07131d, fog: 0x07131d, ground: 0x101b26, grid: 0x2fe6ff, sun: 0x72cfff },
  { key: "hideout", name: "ESCONDERIJO DATA", threat: "REDE INFILTRADA", sky: 0x07170f, fog: 0x07170f, ground: 0x2b2a33, grid: 0x39ff88, sun: 0x64ffb0 },
  { key: "grid", name: "SUBESTACAO ELETRICA", threat: "BLECAUTE E CAMPOS ELETRICOS", sky: 0x060d1f, fog: 0x060d1f, ground: 0x0e1626, grid: 0x6ea8ff, sun: 0x9cc4ff },
  { key: "megacorp", name: "NUCLEO MEGACORP", threat: "TRES CHEFOES CORPORATIVOS", sky: 0x180719, fog: 0x180719, ground: 0x160f1d, grid: 0xff3fd0, sun: 0xff3fd0 },
];
function applyPhaseReadout() {
  routeGeometry.forEach((o) => {
    if (o.solid && !solids.includes(o)) solids.push(o);
  });
  applyRouteLayout();
  const theme = PHASE_THEME[lvl] || PHASE_THEME[0];
  document.body.dataset.phase = theme.key;
  if (fxSystem) fxSystem.setPhase(theme.key);
  $("phaseName").textContent = theme.name;
  $("phaseThreat").textContent = "AMEACA: " + theme.threat;
}
function applyPhaseKit() {
  const theme = PHASE_THEME[lvl] || PHASE_THEME[0];
  let kit = phaseKitCache.get(theme.key);
  if (kit) {
    phaseKitCache.forEach((candidate) => { candidate.visible = candidate === kit; });
    return;
  }
  kit = new T.Group();
  kit.name = "phase-kit-" + theme.key;
  phaseKit.add(kit);
  phaseKitCache.set(theme.key, kit);
  const solid = new T.MeshStandardMaterial({ color: theme.ground, emissive: theme.grid, emissiveIntensity: 0.22, metalness: 0.65, roughness: 0.5 });
  const glow = new T.MeshBasicMaterial({ color: theme.grid, transparent: true, opacity: 0.72, blending: T.AdditiveBlending });
  const addBlock = (x, z, w, h, d, y = h / 2) => {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), solid);
    m.position.set(x, y, z);
    kit.add(m);
    const edge = new T.LineSegments(new T.EdgesGeometry(m.geometry), glow);
    edge.position.copy(m.position);
    kit.add(edge);
  };
  const addPipe = (x, z, h, rot = 0) => {
    const p = new T.Mesh(new T.CylinderGeometry(0.22, 0.3, h, 8), glow);
    p.position.set(x, h / 2, z);
    p.rotation.z = rot;
    kit.add(p);
  };
  if (theme.key === "finance") {
    [-28, -20, 20, 28].forEach((x, i) => addBlock(x, -22 + (i % 2) * 7, 3.4, 7 + (i % 3) * 2, 3));
  } else if (theme.key === "industrial") {
    [-26, -18, 18, 26].forEach((x, i) => addPipe(x, -21, 7 + (i % 2) * 3, i % 2 ? 0.06 : -0.06));
    addBlock(0, -30, 16, 1.2, 1.2, 0.6);
  } else if (theme.key === "surveillance") {
    [-25, -13, 13, 25].forEach((x) => { addBlock(x, -27, 0.7, 10, 0.7, 5); addBlock(x, -21, 3.4, 0.18, 0.4, 8.6); });
  } else if (theme.key === "hideout") {
    [-26, -13, 13, 26].forEach((x) => { addBlock(x, -28, 2.8, 5.5, 1.2); addBlock(x, -27.3, 2.1, 0.08, 0.08, 3.8); });
  } else if (theme.key === "grid") {
    [-26, -13, 13, 26].forEach((x, i) => { addBlock(x, -28, 3, 4.5 + (i % 2) * 1.5, 2.4); addPipe(x, -26.6, 6 + (i % 2) * 2, 0.04); });
    addBlock(0, -31, 18, 0.25, 0.25, 7);
  } else {
    [-24, -12, 12, 24].forEach((x, i) => { addBlock(x, -27, 2.4, 10 + (i % 2) * 4, 2.4); addPipe(x, -25.6, 4, Math.PI / 2); });
  }
  phaseKitCache.forEach((candidate) => { candidate.visible = candidate === kit; });
}
const buzz = (ms = 24) => {
  if (navigator.vibrate) navigator.vibrate(ms);
};
let flashTimer = 0;
function flashFeedback(kind) {
  const el = $("fxFlash");
  if (!el) return;
  el.dataset.kind = kind;
  el.classList.remove("pulse");
  void el.offsetWidth;
  el.classList.add("pulse");
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => el.classList.remove("pulse"), 420);
}
// gerador com semente: o cenário decorativo é sempre igual
let SEED = 1337;
const rnd = () => {
  SEED = (SEED + 0x6d2b79f5) | 0;
  let t = Math.imul(SEED ^ (SEED >>> 15), 1 | SEED);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
$("ic_d").src = ICON.data;
$("ic_h").src = ICON.hack;
$("ic_a").src = ICON.drone;
// ÂNCORA: celular (toque) com tela densa gasta muita GPU: limita os pixels e dispensa o antialias (MSAA)
let fxSystem = null;
const toque = matchMedia("(pointer: coarse)").matches;
const R = new T.WebGLRenderer({ antialias: !(toque && devicePixelRatio >= 2) });
let pixelRatio = Math.min(devicePixelRatio, toque ? 1.25 : 2);
R.setPixelRatio(pixelRatio);
document.body.prepend(R.domElement);
const S = new T.Scene();
S.background = new T.Color(0x0a0818);
S.fog = new T.Fog(0x0a0818, 30, 90);
const C = new T.PerspectiveCamera(55, 1, 0.1, 220);
const phaseKit = new T.Group();
const phaseKitCache = new Map();
S.add(phaseKit);
S.add(new T.HemisphereLight(0xffffff, 0x330a0a, 0.6));
const sun = new T.DirectionalLight(0xff6a5a, 0.5);
sun.position.set(-10, 30, 10);
sun.userData.anarcoKeyLight = true;
S.add(sun);
function resize() {
  R.setSize(innerWidth, innerHeight);
  C.aspect = innerWidth / innerHeight;
  C.updateProjectionMatrix();
  if (fxSystem) fxSystem.resize();
}
addEventListener("resize", resize);
resize();
fxSystem = new window.ANARCO_FX.AnarcoFxSystem(R, S, C);
if (window.__ANARCO_DEBUG__) window.__ANARCO_FX_INSTANCE__ = fxSystem;

const ground = new T.Mesh(new T.PlaneGeometry(90, 90), new T.MeshStandardMaterial({ color: 0x111114 }));
ground.rotation.x = -Math.PI / 2;
S.add(ground);
const grid = new T.GridHelper(90, 45, 0x6a2bd0, 0x1a1030);
grid.position.y = 0.02;
S.add(grid);
// V3.6: poças refletivas leves e tiras de neon para aumentar profundidade sem pesar o mobile.
const puddles = [];
const puddleColors = [0x2fe6ff, 0xff3fd0, 0x39ff88];
for (let i = 0; i < 14; i++) {
  const color = puddleColors[i % puddleColors.length];
  const mat = new T.MeshStandardMaterial({ color: 0x07101d, emissive: color, emissiveIntensity: 0.14, metalness: 0.92, roughness: 0.12, transparent: true, opacity: 0.58 });
  const m = new T.Mesh(new T.CircleGeometry(1, 24), mat);
  m.rotation.x = -Math.PI / 2;
  m.rotation.z = rnd() * Math.PI;
  m.scale.set(1.2 + rnd() * 2.2, 0.45 + rnd() * 0.7, 1);
  m.position.set((rnd() - 0.5) * 60, 0.035, (rnd() - 0.5) * 58);
  S.add(m);
  puddles.push({ m, mat, phase: rnd() * 6.28 });
}
const routeVisuals = new T.Group();
S.add(routeVisuals);
const ROUTE_POINTS = {
  fast: [[0, 22], [0, 10], [-13, -2], [-18, -20]],
  safe: [[0, 22], [12, 16], [22, 5], [18, -18]],
  tech: [[0, 22], [-10, 14], [-4, 2], [8, -12]],
};
Object.entries(ROUTE_POINTS).forEach(([kind, points]) => {
  const color = kind === "fast" ? 0x2fe6ff : kind === "safe" ? 0x39ff88 : 0xff3fd0;
  const line = new T.Line(
    new T.BufferGeometry().setFromPoints(points.map(([x, z]) => new T.Vector3(x, 0.045, z))),
    new T.LineBasicMaterial({ color, transparent: true, opacity: 0.2, depthWrite: false }),
  );
  line.userData.route = kind;
  routeVisuals.add(line);
});
const routeObjects = [];
function makeRouteObject(kind, shape) {
  const color = kind === "fast" ? 0x2fe6ff : kind === "safe" ? 0x39ff88 : 0xff3fd0;
  const geo = shape === "cover" ? new T.BoxGeometry(3.4, 1.6, 2.2) : shape === "block" ? new T.BoxGeometry(7.5, 1.1, 1.1) : new T.TorusGeometry(1.25, 0.08, 8, 24);
  const isBarrier = shape !== "shortcut";
  const mat = new T.MeshStandardMaterial({ color: shape === "block" ? 0xff244d : color, emissive: color, emissiveIntensity: isBarrier ? 0.42 : 0.7, transparent: !isBarrier, opacity: isBarrier ? 1 : 0.5, depthWrite: isBarrier });
  const mesh = new T.Mesh(geo, mat);
  mesh.visible = false;
  routeVisuals.add(mesh);
  const item = { kind, shape, mesh, x: 999, z: 999, w: shape === "cover" ? 3.4 : shape === "block" ? 7.5 : 0, d: shape === "cover" ? 2.2 : shape === "block" ? 1.1 : 0, rot: 0, solid: shape !== "shortcut" };
  routeObjects.push(item);
  return item;
}
const routeGeometry = [
  makeRouteObject("safe", "cover"), makeRouteObject("safe", "cover"),
  makeRouteObject("fast", "block"), makeRouteObject("fast", "block"),
  makeRouteObject("tech", "shortcut"), makeRouteObject("tech", "shortcut"),
];
const ROUTE_LAYOUTS = [
  { safe: [[-9, 13], [9, 4]], fast: [[-3, 7], [14, -9]], tech: [[-12, 7], [5, -8]] },
  { safe: [[-18, 15], [17, -2]], fast: [[-5, 2], [5, -14]], tech: [[-22, 3], [20, 10]] },
  { safe: [[-22, 9], [19, 17]], fast: [[0, 4], [0, -15]], tech: [[-14, -7], [14, -7]] },
  { safe: [[-8, 15], [8, -15]], fast: [[-20, 0], [20, 0]], tech: [[-18, 12], [18, -12]] },
  { safe: [[-16, 18], [16, 18]], fast: [[-16, -12], [16, -12]], tech: [[-7, 1], [7, 1]] },
];
function applyRouteLayout() {
  const layout = ROUTE_LAYOUTS[lvl] || ROUTE_LAYOUTS[0];
  const safe = routeGeometry.filter((o) => o.kind === "safe");
  const fast = routeGeometry.filter((o) => o.kind === "fast");
  const tech = routeGeometry.filter((o) => o.kind === "tech");
  [ [safe, "safe"], [fast, "fast"], [tech, "tech"] ].forEach(([items, kind]) => {
    items.forEach((o, i) => {
      const pt = layout[kind][i];
      o.x = pt[0]; o.z = pt[1]; o.mesh.position.set(o.x, o.shape === "cover" ? 0.8 : o.shape === "block" ? 0.55 : 0.08, o.z);
      o.mesh.rotation.y = kind === "tech" ? (i ? Math.PI / 2 : 0) : i * 0.35;
      o.mesh.visible = lvl < LV.length - 1 || kind === "tech";
      if (o.solid) { o.rot = o.mesh.rotation.y; }
    });
  });
}

function winTex(h) {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "#08080a";
  g.fillRect(0, 0, 64, 128);
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 8; x++)
      if (rnd() < 0.55) {
        g.fillStyle = h ? "#f2efe6" : rnd() < 0.5 ? "#ff4fd8" : "#2fe6ff";
        g.fillRect(x * 8 + 1, y * 8 + 1, 5, 5);
      }
  const t = new T.CanvasTexture(c);
  t.magFilter = T.NearestFilter;
  return t;
}
function bld(w, h, d, tex) {
  return new T.Mesh(
    new T.BoxGeometry(w, h, d),
    new T.MeshStandardMaterial({
      color: 0x151518,
      emissive: 0xffffff,
      emissiveMap: tex,
      emissiveIntensity: 0.9,
    }),
  );
}

// skyline
const sk = [winTex(), winTex(), winTex()];
const cityEdgeMats = [
  new T.MeshBasicMaterial({ color: 0x2fe6ff }),
  new T.MeshBasicMaterial({ color: 0xff3fd0 }),
  new T.MeshBasicMaterial({ color: 0x39ff88 }),
];
const cityRoofMat = new T.MeshStandardMaterial({ color: 0x0b0e18, metalness: 0.8, roughness: 0.32, emissive: 0x101c36, emissiveIntensity: 0.55 });
const sky = [];
for (let i = 0; i < 46; i++) {
  const a = rnd() * Math.PI * 2,
    r = 50 + rnd() * 25,
    h = 10 + rnd() * 34;
  const w = 5 + rnd() * 6, d = 5 + rnd() * 6;
  const b = bld(w, h, d, sk[i % 3]);
  const edgeMat = cityEdgeMats[i % cityEdgeMats.length];
  const edge = new T.Mesh(new T.BoxGeometry(0.12, h * 0.82, 0.12), edgeMat);
  edge.position.set(-w * 0.34, h * 0.02, d * 0.5 + 0.05);
  const edge2 = edge.clone();
  edge2.position.x = w * 0.34;
  const crown = new T.Mesh(new T.BoxGeometry(w * 0.86, 0.16, d * 0.86), cityRoofMat);
  crown.position.y = h * 0.5 + 0.08;
  const antenna = new T.Mesh(new T.CylinderGeometry(0.035, 0.055, 1.4 + (i % 3) * 0.45, 6), edgeMat);
  antenna.position.set((i % 2 ? 1 : -1) * w * 0.18, h * 0.5 + 0.82, 0);
  b.add(edge, edge2, crown, antenna);
  b.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
  S.add(b);
  sky.push(b);
}

// anarchy sprite
const ac = document.createElement("canvas");
ac.width = ac.height = 128;
{
  const g = ac.getContext("2d");
  g.strokeStyle = "#e0261c";
  g.lineWidth = 9;
  g.beginPath();
  g.arc(64, 64, 52, 0, 7);
  g.stroke();
  g.fillStyle = "#e0261c";
  g.font = "bold 86px Impact,sans-serif";
  g.textAlign = "center";
  g.fillText("A", 64, 94);
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(34, 102);
  g.lineTo(96, 30);
  g.stroke();
}
const aTex = new T.CanvasTexture(ac);

// torres corporativas: blindagem modular, conduítes luminosos e ferragens de infraestrutura crítica.
const towerArmor = new T.MeshStandardMaterial({ color: 0x111824, metalness: 0.82, roughness: 0.34, emissive: 0x081722, emissiveIntensity: 0.35 });
const towerTrimCyan = new T.MeshBasicMaterial({ color: 0x2fe6ff });
const towerTrimGreen = new T.MeshBasicMaterial({ color: 0x39ff88 });
function makeSurveillancePlate() {
  const c = document.createElement("canvas"); c.width = 512; c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "#071017"; g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = "#2fe6ff"; g.lineWidth = 4; g.strokeRect(3, 3, c.width - 6, c.height - 6);
  g.fillStyle = "#53f6ff"; g.font = "bold 35px monospace"; g.textAlign = "center";
  g.fillText("VIGILÂNCIA TOTAL", 256, 54);
  g.fillStyle = "#94a8b6"; g.font = "19px monospace"; g.fillText("DATACENTER // CAM-NET 07", 256, 93);
  const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; return tex;
}
const surveillancePlate = makeSurveillancePlate();
const TD = [
  { x: -20, z: -16, h: 22, n: "BancoUsura S.A." },
  { x: 22, z: -6, h: 28, n: "PetroNegra Ltda." },
  { x: 3, z: -30, h: 34, n: "Vigilância Total Corp." },
];
const towers = TD.map((d, towerIndex) => {
  d.lit = winTex(false);
  d.hot = winTex(true);
  d.mesh = bld(6, d.h, 6, d.lit);
  const towerEdge = cityEdgeMats[towerIndex % cityEdgeMats.length];
  const finL = new T.Mesh(new T.BoxGeometry(0.18, d.h * 0.92, 0.18), towerEdge);
  finL.position.set(-2.35, 0, 2.88);
  const finR = finL.clone();
  finR.position.x = 2.35;
  const crown = new T.Mesh(new T.BoxGeometry(5.4, 0.2, 5.4), cityRoofMat);
  crown.position.y = d.h / 2 + 0.12;
  d.mesh.add(finL, finR, crown);
  // placas blindadas laterais e reforços verticais: detalhes visuais, sem colisões extras.
  [-1, 1].forEach((side) => {
    const guard = new T.Mesh(new T.BoxGeometry(0.28, d.h * 0.88, 0.2), towerArmor);
    guard.position.set(side * 2.72, 0, 3.03);
    d.mesh.add(guard);
    const conduit = new T.Mesh(new T.BoxGeometry(0.07, d.h * 0.78, 0.045), towerTrimCyan);
    conduit.position.set(side * 2.48, 0, 3.15);
    d.mesh.add(conduit);
  });
  [-1, 1].forEach((side) => [-0.27, 0.27].forEach((height) => {
    const plate = new T.Mesh(new T.BoxGeometry(1.05, 0.62, 0.18), towerArmor);
    plate.position.set(side * 1.82, d.h * height, 3.03);
    const edge = new T.LineSegments(new T.EdgesGeometry(plate.geometry), towerTrimCyan);
    plate.add(edge); d.mesh.add(plate);
  }));
  const band = new T.Mesh(new T.BoxGeometry(5.55, 0.22, 0.16), towerArmor);
  band.position.set(0, -d.h * 0.04, 3.06); d.mesh.add(band);
  if (towerIndex === 2) {
    // A antena elevada e a placa da Vigilância Total tornam o alvo reconhecível à distância.
    const mast = new T.Mesh(new T.CylinderGeometry(0.055, 0.09, 3.2, 8), towerArmor);
    mast.position.set(0, d.h / 2 + 1.75, 0); d.mesh.add(mast);
    const crossbar = new T.Mesh(new T.BoxGeometry(2.25, 0.09, 0.09), towerTrimCyan);
    crossbar.position.set(0, d.h / 2 + 2.7, 0); d.mesh.add(crossbar);
    const beacon = new T.Mesh(new T.SphereGeometry(0.2, 12, 8), towerTrimGreen);
    beacon.position.set(0, d.h / 2 + 3.35, 0); d.mesh.add(beacon);
    const dish = new T.Mesh(new T.TorusGeometry(0.55, 0.055, 7, 24), towerTrimCyan);
    dish.position.set(0, d.h / 2 + 2.1, 0.28); dish.rotation.x = Math.PI / 2; d.mesh.add(dish);
    const plate = new T.Mesh(new T.PlaneGeometry(3.6, 0.9), new T.MeshBasicMaterial({ map: surveillancePlate, transparent: false, side: T.DoubleSide }));
    plate.position.set(0, d.h * 0.29, 3.13); d.mesh.add(plate);
  }
  d.mesh.position.set(d.x, d.h / 2, d.z);
  S.add(d.mesh);
  d.ring = new T.Mesh(
    new T.RingGeometry(4.6, 5, 48).rotateX(-Math.PI / 2),
    new T.MeshBasicMaterial({ color: 0xe0261c }),
  );
  d.ring.position.set(d.x, 0.06, d.z);
  S.add(d.ring);
  d.spr = new T.Sprite(new T.SpriteMaterial({ map: aTex, transparent: true }));
  d.spr.scale.set(6, 6, 1);
  d.spr.position.set(d.x, d.h + 5, d.z + 3.5);
  d.spr.visible = false;
  S.add(d.spr);
  d.wave = new T.Mesh(
    new T.RingGeometry(0.9, 1, 48).rotateX(-Math.PI / 2),
    new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }),
  );
  d.wave.position.set(d.x, 0.1, d.z);
  S.add(d.wave);
  d.p = 0;
  d.done = false;
  d.glitch = 0;
  d.wt = -1;
  d.state = "patrol";
  d.virus = 0;
  return d;
});
// O núcleo de interação substitui o círculo vazio por um uplink ciano pulsante ligado ao alvo.
for (const t of towers) {
  const root = new T.Group();
  const pedestal = new T.Mesh(new T.CylinderGeometry(0.58, 0.72, 0.22, 8), towerArmor);
  pedestal.position.y = -0.44; root.add(pedestal);
  const coreMaterial = new T.MeshStandardMaterial({ color: 0x53f6ff, emissive: 0x2fe6ff, emissiveIntensity: 1.8, metalness: 0.28, roughness: 0.22 });
  const core = new T.Mesh(new T.IcosahedronGeometry(0.34, 1), coreMaterial); root.add(core);
  const haloMat = new T.MeshBasicMaterial({ color: 0x53f6ff, transparent: true, opacity: 0.78, blending: T.AdditiveBlending, depthWrite: false });
  const halo = new T.Mesh(new T.TorusGeometry(0.58, 0.035, 8, 36), haloMat); halo.rotation.x = Math.PI / 2; halo.position.y = -0.18; root.add(halo);
  const upright = new T.Mesh(new T.TorusGeometry(0.47, 0.022, 7, 32), haloMat.clone()); upright.position.z = 0.05; root.add(upright);
  const beam = new T.Mesh(new T.CylinderGeometry(0.025, 0.11, 1.8, 8), new T.MeshBasicMaterial({ color: 0x2fe6ff, transparent: true, opacity: 0.16, depthWrite: false, blending: T.AdditiveBlending }));
  beam.position.y = 0.89; root.add(beam);
  S.add(root);
  t.node = { root, core, halo, upright, beam };
}
const hackFlowCount = 28;
const hackFlowPositions = new Float32Array(hackFlowCount * 3);
const hackFlowGeometry = new T.BufferGeometry();
hackFlowGeometry.setAttribute("position", new T.BufferAttribute(hackFlowPositions, 3).setUsage(T.DynamicDrawUsage));
hackFlowGeometry.setDrawRange(0, 0);
const hackFlowMaterial = new T.PointsMaterial({ color: 0x53f6ff, size: 0.19, transparent: true, opacity: 0.9, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true });
const hackFlow = new T.Points(hackFlowGeometry, hackFlowMaterial); hackFlow.frustumCulled = false; hackFlow.renderOrder = 8; hackFlow.visible = false; S.add(hackFlow);
const hackFlowStart = new T.Vector3(), hackFlowEnd = new T.Vector3();

// crates
const crates = [
  [-8, 6],
  [10, 8],
  [-14, -2],
  [14, -18],
  [-6, -12],
  [8, -2],
  [-26, 8],
  [26, 10],
].map(([x, z]) => {
  const m = new T.Mesh(new T.BoxGeometry(3, 2.4, 3), new T.MeshStandardMaterial({ color: 0x1b1b1f }));
  m.position.set(x, 1.2, z);
  m.add(new T.LineSegments(new T.EdgesGeometry(m.geometry), new T.LineBasicMaterial({ color: 0xe0261c })));
  S.add(m);
  return { x, z, w: 3, d: 3, rot: 0, m, bx: x, bz: z }; // m = malha, bx/bz = posição na cidade
});
const solids = [
  ...towers.map((t) => ({ x: t.x, z: t.z, r: 3.9 })),
  ...crates.map((c) => ({ x: c.x, z: c.z, r: 2.1, w: c.w, d: c.d, rot: 0 })),
];

// player
const P = new T.Group(),
  mk = (g, c, e) => new T.Mesh(g, new T.MeshStandardMaterial({ color: c, emissive: e || 0, roughness: 0.8 }));
const body = mk(new T.CylinderGeometry(0.45, 0.65, 1.5, 10), 0x0e0e10);
body.position.y = 1;
const head = mk(new T.SphereGeometry(0.4, 16, 12), 0xf2efe6);
head.position.y = 2.1;
const hood = mk(new T.ConeGeometry(0.52, 0.9, 12), 0x0e0e10);
hood.position.y = 2.45;
const e1 = mk(new T.BoxGeometry(0.12, 0.05, 0.05), 0x000000),
  e2 = e1.clone();
e1.position.set(-0.14, 2.15, 0.38);
e2.position.set(0.14, 2.15, 0.38);
const lap = mk(new T.BoxGeometry(0.7, 0.5, 0.08), 0x220000, 0xe0261c);
lap.position.set(0, 1.3, -0.55);
P.add(body, head, hood, e1, e2, lap);
S.add(P);
fxSystem.setPlayer(P);
const sh = new T.Mesh(
  new T.CircleGeometry(0.8, 16).rotateX(-Math.PI / 2),
  new T.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.5 }),
);
sh.position.y = 0.04;
S.add(sh);
// modelo 3D do personagem (dados embutidos)
let model = null,
  bone = null,
  won = false,
  hacking = false,
  wob = 0,
  hackUiTarget = null,
  hackHoldTarget = null,
  hackHoldUntil = 0,
  hackFailureTarget = null,
  hackFailureUntil = 0,
  lastHackTarget = null;
function playHackFeedback(kind) {
  const sound = { connect: "hack-connect", error: "hack-fail", root: "root-access" }[kind];
  if (!playCustomSound(sound, kind === "connect" ? 0.48 : 0.56)) {
    sfx(kind === "connect" ? "hack" : kind === "error" ? "bad" : "done");
  }
}
function updateHackFlow(target, progress, error) {
  if (!target || !target.node || state !== "play") { hackFlow.visible = false; hackFlowGeometry.setDrawRange(0, 0); setHackStream(false); return; }
  hackFlow.visible = true;
  setHackStream(true);
  const node = target.node.root.position;
  hackFlowStart.set(node.x, node.y + 0.15, node.z);
  hackFlowEnd.set(P.position.x, P.position.y + 1.25, P.position.z);
  const count = Math.min(hackFlowCount, 5 + Math.round(Math.max(0, Math.min(1, progress)) * (hackFlowCount - 5)));
  hackFlowMaterial.color.set(error ? 0xff3fd0 : 0x53f6ff);
  hackFlowMaterial.opacity = error ? 1 : 0.48 + Math.max(0, Math.min(1, progress)) * 0.45;
  for (let i = 0; i < count; i++) {
    const along = (time * (error ? 1.8 : 0.82) + i / count) % 1;
    const jitter = error ? Math.sin(time * 64 + i * 7.1) * 0.42 : Math.sin(time * 6 + i * 2.3) * 0.12;
    const k = i * 3;
    hackFlowPositions[k] = hackFlowStart.x + (hackFlowEnd.x - hackFlowStart.x) * along + jitter;
    hackFlowPositions[k + 1] = hackFlowStart.y + (hackFlowEnd.y - hackFlowStart.y) * along + Math.sin(time * 8 + i * 1.9) * (error ? 0.25 : 0.09);
    hackFlowPositions[k + 2] = hackFlowStart.z + (hackFlowEnd.z - hackFlowStart.z) * along + Math.cos(time * 7 + i * 2.1) * (error ? 0.25 : 0.09);
  }
  hackFlowGeometry.attributes.position.needsUpdate = true;
  hackFlowGeometry.setDrawRange(0, count);
}
function updateHackPanel(target, error = false, committed = false) {
  const panel = $("hackPanel");
  if (!panel || !target || state !== "play") {
    if (panel) panel.hidden = true;
    hackUiTarget = null;
    updateHackFlow(null, 0, false);
    return;
  }
  hackUiTarget = target;
  panel.hidden = false;
  const miniProgress = mini && mini.t === target ? Math.round((mini.pos / mini.seq.length) * 100) : 0;
  const progress = committed ? 100 : Math.round(Math.max(0, Math.min(1, target.p)) * 100);
  let stateKey = committed ? "committed" : error ? "error" : progress >= 70 ? "root" : progress < 7 ? "connect" : "extract";
  if (error) stateKey = "error";
  panel.dataset.state = stateKey;
  const status = committed
    ? (target.n === "Vigilância Total Corp." ? "VIGILÂNCIA TOTAL // COMPROMETIDA" : target.n.toUpperCase() + " // COMPROMETIDA")
    : error ? "SEQUÊNCIA INCORRETA // LINK INSTÁVEL"
    : progress < 7 ? "CONEXÃO ESTABELECIDA"
    : progress >= 70 ? "ACESSO ROOT"
    : "EXTRAINDO DADOS";
  setTxt($("hackBuilding"), target.n.toUpperCase());
  setTxt($("hackState"), status);
  setTxt($("hackPercent"), progress + "%");
  setSty($("hackProgressBar"), "width", progress + "%");
  const bar = $("hackProgress");
  if (bar && bar.getAttribute("aria-valuenow") !== String(progress)) bar.setAttribute("aria-valuenow", String(progress));
  const root = $("hackRoot");
  if (root) {
    const rootText = committed ? "ROOT // CONCEDIDO" : error ? "ROOT // NEGADO" : progress >= 70 ? "ROOT // VALIDANDO" : "ROOT // BLOQUEADO";
    setTxt(root.querySelector("b"), rootText);
    setTxt(root.querySelector("small"), committed ? "CONTROLE DE CÂMERAS OBTIDO" : error ? "REFAÇA A SEQUÊNCIA" : mini && mini.t === target ? `CHAVE ${miniProgress}% // AUTENTICAÇÃO` : "SEQUÊNCIA NECESSÁRIA");
  }
  const trace = committed ? "CAM-NET // ROOT TOKEN // UPLINK OWNED" : error ? "PACKET REJECTED // RETRY AUTH" : mini && mini.t === target ? `AUTH TOKEN // ${mini.pos}/${mini.seq.length} // CAM-07` : progress >= 70 ? "ROOT SHELL // VALIDANDO CREDENCIAIS" : `CAM-07 // DATA STREAM // ${Math.max(1, Math.round(progress * 3))}KB/s`;
  setTxt($("hackTrace"), trace);
  updateHackFlow(target, committed ? 1 : target.p, error);
}
function positionHackPanel() {
  const panel = $("hackPanel"), target = hackUiTarget;
  if (!panel || panel.hidden || !target) return;
  const touchLayout = innerWidth <= 980 || matchMedia("(pointer: coarse)").matches;
  const miniEl = $("mini");
  if (touchLayout) {
    panel.style.left = "50%";
    panel.style.transform = "translateX(-50%)";
    const hud = $("hud"), routes = $("routePicker");
    let top = Math.max(8, Math.ceil(Math.max(hud?.getBoundingClientRect().bottom || 0, routes?.getBoundingClientRect().bottom || 0)) + 7);
    const panelHeight = panel.getBoundingClientRect().height;
    if (!miniEl.hidden) {
      const miniHeight = miniEl.getBoundingClientRect().height;
      const controls = $("touchActions");
      const safeBottom = controls && getComputedStyle(controls).display !== "none" ? controls.getBoundingClientRect().top - 8 : innerHeight - 10;
      const desiredCenter = top + panelHeight + 7 + miniHeight / 2;
      const miniCenter = Math.min(desiredCenter, safeBottom - miniHeight / 2);
      top = Math.max(6, miniCenter - miniHeight / 2 - 7 - panelHeight);
      miniEl.style.top = `${miniCenter}px`;
    } else miniEl.style.removeProperty("top");
    panel.style.top = `${top}px`;
    return;
  }
  panel.style.transform = "none";
  hackProjectPoint.set(target.x + 5.25, Math.min(target.h - 1, Math.max(3, target.h * 0.54)), target.z).project(C);
  const x = (hackProjectPoint.x * 0.5 + 0.5) * innerWidth + 16;
  const y = (-hackProjectPoint.y * 0.5 + 0.5) * innerHeight - 36;
  panel.style.left = `${Math.max(10, Math.min(innerWidth - panel.offsetWidth - 10, x))}px`;
  panel.style.top = `${Math.max(88, Math.min(innerHeight - panel.offsetHeight - 18, y))}px`;
  miniEl.style.removeProperty("top");
}
const hackProjectPoint = new T.Vector3();
// ÂNCORA: formato do arquivo assets/models/anarco.mdl (tudo em sequência, sem separadores):
//   [posições Int16 x3 por vértice] [índices Uint16 x3 por triângulo] [cores Uint8 x3 por vértice]
const RIM_FORCA = 0.75; // intensidade do contorno neon (0 desliga)
// ===== SKINS DO PERSONAGEM =====
// ÂNCORA: cada skin tem seu .bin (n vértices, f triângulos) e seu esqueleto.
// ossos: [nome, x, y, z, pai]  ·  SG: [índice do osso, x1,y1,z1, x2,y2,z2, raio] = cápsula que "puxa" os vértices próximos
const NOMES_OSSOS = ["hips", "spine", "head", "armP", "armN", "legP", "legN", "foreP", "foreN", "shinP", "shinN"];
const SKINS = {
  capuz: {
    nome: "Capuz",
    escala: 1.15, // tamanho (1 = original)
    arq: "assets/models/anarco.mdl",
    n: 24953,
    f: 50000,
    ossos: [
      ["hips", 0, 0.9, 0, null],
      ["spine", 0, 1.3, 0, "hips"],
      ["head", 0, 2.25, 0, "spine"],
      ["armP", 0.36, 2.05, 0, "spine"],
      ["armN", -0.36, 2.05, 0, "spine"],
      ["legP", 0.17, 0.9, 0, "hips"],
      ["legN", -0.17, 0.9, 0, "hips"],
      ["foreP", 0.43, 1.55, 0, "armP"],
      ["foreN", -0.43, 1.55, 0, "armN"],
      ["shinP", 0.17, 0.48, 0, "legP"],
      ["shinN", -0.17, 0.48, 0, "legN"],
    ],
    SG: [
      [0, 0, 0.75, 0, 0, 1.25, 0, 0.25],
      [1, 0, 1.3, 0, 0, 2.1, 0, 0.3],
      [2, 0, 2.3, 0, 0, 2.7, 0, 0.2],
      [3, 0.36, 2.05, 0, 0.43, 1.55, 0.02, 0.07],
      [7, 0.43, 1.55, 0.02, 0.5, 1.05, 0.05, 0.07],
      [4, -0.36, 2.05, 0, -0.43, 1.55, 0, 0.07],
      [8, -0.43, 1.55, 0, -0.5, 1.05, 0, 0.07],
      [5, 0.17, 0.88, 0, 0.17, 0.48, 0, 0.13],
      [9, 0.17, 0.48, 0, 0.17, 0.05, 0, 0.13],
      [6, -0.17, 0.88, 0, -0.17, 0.48, 0, 0.13],
      [10, -0.17, 0.48, 0, -0.17, 0.05, 0, 0.13],
    ],
  },
  // corpo "chibi": cabeça e cabelo enormes, braços curtos; medidas tiradas do próprio modelo
  cachos: {
    nome: "Cachos",
    escala: 1.05, // a cabeça grande já ocupa muito espaço na tela
    arq: "assets/models/cachos.mdl",
    n: 22351,
    f: 45000,
    ossos: [
      ["hips", 0, 0.95, 0, null],
      ["spine", 0, 1.2, 0, "hips"],
      ["head", 0, 1.75, 0, "spine"],
      ["armP", 0.4, 1.52, 0, "spine"],
      ["armN", -0.4, 1.52, 0, "spine"],
      ["legP", 0.22, 0.88, 0, "hips"],
      ["legN", -0.22, 0.88, 0, "hips"],
      ["foreP", 0.5, 1.06, 0, "armP"],
      ["foreN", -0.5, 1.06, 0, "armN"],
      ["shinP", 0.22, 0.48, 0, "legP"],
      ["shinN", -0.22, 0.48, 0, "legN"],
    ],
    SG: [
      [0, 0, 0.62, 0, 0, 1.05, 0, 0.28],
      [1, 0, 1.15, 0, 0, 1.6, 0, 0.3],
      [2, 0, 1.9, 0, 0, 2.55, 0, 0.5],
      [3, 0.4, 1.52, 0, 0.5, 1.06, 0, 0.09],
      [7, 0.5, 1.06, 0, 0.58, 0.62, 0, 0.09],
      [4, -0.4, 1.52, 0, -0.5, 1.06, 0, 0.09],
      [8, -0.5, 1.06, 0, -0.58, 0.62, 0, 0.09],
      [5, 0.22, 0.88, 0, 0.22, 0.48, 0, 0.17],
      [9, 0.22, 0.48, 0, 0.22, 0.05, 0, 0.17],
      [6, -0.22, 0.88, 0, -0.22, 0.48, 0, 0.17],
      [10, -0.22, 0.48, 0, -0.22, 0.05, 0, 0.17],
    ],
  },
  vanta: {
    nome: "VANTA",
    classe: "INFILTRADORA",
    escala: 1.0,
    procedural: true,
  },
};
const PROGRESS_KEY = "anarco_progress";
let progression;
try { progression = JSON.parse(ler(PROGRESS_KEY) || "{}"); } catch (e) { progression = {}; }
progression.wins = Number.isFinite(progression.wins) ? progression.wins : 0;
progression.skins = Array.isArray(progression.skins) ? progression.skins.filter((id) => SKINS[id]) : ["capuz", "vanta"];
if (!progression.skins.includes("capuz")) progression.skins.unshift("capuz");
if (!progression.skins.includes("vanta")) progression.skins.push("vanta");
// ÂNCORA: CACHOS agora já vem liberada desde a 1ª partida (antes só destravava após a 1ª vitória).
// Para voltar a ser prêmio de vitória: apague esta linha (o destravamento em end() continua lá).
if (SKINS.cachos && !progression.skins.includes("cachos")) progression.skins.push("cachos");
const saveProgress = () => guardar(PROGRESS_KEY, JSON.stringify(progression));
function applyRewardCosmetic() {
  document.body.dataset.reward = progression.wins >= 3 ? "glitch" : progression.wins >= 2 ? "neon" : "base";
}
let skinAtual = ler("anarco_skin");
if (!SKINS[skinAtual] || !progression.skins.includes(skinAtual)) skinAtual = "capuz";
let pedidoSkin = 0, // só o pedido mais recente vale (cliques rápidos não embaralham)
  skinCarregada = null; // skin que está de fato na tela
function makeVantaModel() {
  const g = new T.Group();
  const mat = (color, emissive = 0x000000, intensity = 0) => new T.MeshStandardMaterial({ color, emissive, emissiveIntensity: intensity, roughness: 0.5, metalness: 0.35 });
  const jacket = mat(0x101522, 0x122b52, 0.45);
  const dark = mat(0x080a10, 0x160c28, 0.28);
  const cyan = new T.MeshBasicMaterial({ color: 0x53f6ff, transparent: true, opacity: 0.92, blending: T.AdditiveBlending });
  const magenta = new T.MeshBasicMaterial({ color: 0xff3fd0, transparent: true, opacity: 0.88, blending: T.AdditiveBlending });
  const part = (geo, material, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const m = new T.Mesh(geo, material);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    g.add(m);
    return m;
  };
  part(new T.BoxGeometry(0.86, 1.05, 0.48), jacket, 0, 1.48, 0);
  part(new T.BoxGeometry(0.18, 0.92, 0.54), dark, -0.48, 1.48, 0);
  part(new T.BoxGeometry(0.18, 0.92, 0.54), dark, 0.48, 1.48, 0);
  part(new T.SphereGeometry(0.43, 16, 12), dark, 0, 2.32, 0);
  part(new T.BoxGeometry(0.54, 0.16, 0.06), cyan, 0, 2.34, 0.4);
  part(new T.BoxGeometry(0.38, 0.05, 0.06), magenta, 0, 2.1, 0.39);
  part(new T.BoxGeometry(0.08, 0.65, 0.08), cyan, -0.49, 1.65, 0.28);
  part(new T.BoxGeometry(0.08, 0.65, 0.08), magenta, 0.49, 1.65, 0.28);
  part(new T.CylinderGeometry(0.09, 0.11, 0.86, 8), dark, -0.58, 1.35, 0, 0, 0, -0.08);
  part(new T.CylinderGeometry(0.09, 0.11, 0.86, 8), dark, 0.58, 1.35, 0, 0, 0, 0.08);
  part(new T.BoxGeometry(0.12, 0.62, 0.12), jacket, -0.2, 0.57, 0);
  part(new T.BoxGeometry(0.12, 0.62, 0.12), jacket, 0.2, 0.57, 0);
  part(new T.BoxGeometry(0.28, 0.12, 0.5), dark, -0.2, 0.12, 0.08);
  part(new T.BoxGeometry(0.28, 0.12, 0.5), dark, 0.2, 0.12, 0.08);
  const halo = new T.Mesh(new T.TorusGeometry(0.64, 0.018, 6, 32), cyan);
  halo.position.set(0, 1.5, -0.28);
  halo.rotation.x = Math.PI / 2;
  g.add(halo);
  g.userData.vanta = true;
  return g;
}
function instalarModelo(novo, id, novoBone = null) {
  if (model) {
    P.remove(model);
    model.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
  } else P.remove(body, head, hood, e1, e2, lap);
  model = novo;
  bone = novoBone;
  P.add(model);
  skinCarregada = id;
}
async function carregarModelo(id = skinAtual) {
  const cfg = SKINS[id],
    pedido = ++pedidoSkin;
  try {
    if (cfg.procedural) {
      const novo = makeVantaModel();
      novo.scale.setScalar(cfg.escala);
      if (pedido !== pedidoSkin) return;
      instalarModelo(novo, id);
      return;
    }
    const N = cfg.n,
      F = cfg.f;
    const resp = await fetch(cfg.arq); // precisa de servidor (Vercel, Netlify, Live Server)
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    const bin = await resp.arrayBuffer();
    if (bin.byteLength !== N * 6 + F * 6 + N * 3)
      throw new Error("tamanho inesperado do modelo: " + bin.byteLength);
    if (pedido !== pedidoSkin) return; // chegou outro pedido depois deste: descarta
    const pos = new Int16Array(bin, 0, N * 3),
      idx = new Uint16Array(bin, N * 6, F * 3),
      col = new Uint8Array(bin, N * 6 + F * 6, N * 3);
    const pf = new Float32Array(N * 3);
    for (let i = 0; i < N * 3; i++) pf[i] = pos[i] / 10000;
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.BufferAttribute(pf, 3));
    g.setAttribute("color", new T.BufferAttribute(col, 3, true));
    g.setIndex(new T.BufferAttribute(idx, 1));
    g.computeVertexNormals();
    const novo = new T.Group();
    const B = {};
    cfg.ossos.forEach(([n, x, y, z, pai]) => {
      const par = pai ? B[pai] : null,
        b = new T.Bone();
      b.position.set(x - (par ? par.px : 0), y - (par ? par.py : 0), z - (par ? par.pz : 0));
      b.px = x;
      b.py = y;
      b.pz = z;
      if (par) par.add(b);
      B[n] = b;
    });
    const hips = B.hips;
    // ÂNCORA: peso de cada vértice = quão perto ele está de cada cápsula (gaussiana); guarda os 4 maiores
    const si = new Uint16Array(N * 4),
      sw = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) {
      const x = pf[i * 3],
        y = pf[i * 3 + 1],
        z = pf[i * 3 + 2];
      const ws = cfg.SG.map((s) => {
        const vx = s[4] - s[1],
          vy = s[5] - s[2],
          vz = s[6] - s[3];
        let t = ((x - s[1]) * vx + (y - s[2]) * vy + (z - s[3]) * vz) / (vx * vx + vy * vy + vz * vz);
        t = Math.max(0, Math.min(1, t));
        const dx = x - s[1] - vx * t,
          dy = y - s[2] - vy * t,
          dz = z - s[3] - vz * t;
        return [s[0], Math.exp(-(dx * dx + dy * dy + dz * dz) / (s[7] * s[7]))];
      })
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);
      const sum = ws.reduce((a, w) => a + w[1], 0) + 1e-9;
      ws.forEach((w, k) => {
        si[i * 4 + k] = w[0];
        sw[i * 4 + k] = w[1] / sum;
      });
    }
    g.setAttribute("skinIndex", new T.Uint16BufferAttribute(si, 4));
    g.setAttribute("skinWeight", new T.Float32BufferAttribute(sw, 4));
    const mat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0.05, skinning: true });
    // ÂNCORA: o personagem é quase todo preto sobre chão escuro. Um toque de emissivo levanta as sombras e o
    // "rim light" (Fresnel) pinta as bordas de rosa/ciano, como os neons da cidade, destacando a silhueta.
    mat.emissive.set(0x0a0614);
    mat.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace(
        "gl_FragColor = vec4( outgoingLight, diffuseColor.a );",
        `float rimF = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vViewPosition)), 0.0, 1.0), 2.2);
        vec3 rimCor = mix(vec3(1.0, 0.25, 0.8), vec3(0.18, 0.9, 1.0), clamp(vNormal.x * 0.5 + 0.5, 0.0, 1.0));
        outgoingLight += rimCor * rimF * ${RIM_FORCA.toFixed(2)};
        gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,
      );
    };
    const sm = new T.SkinnedMesh(g, mat);
    sm.scale.setScalar(cfg.escala); // só o visual cresce; o raio de colisão continua o mesmo
    sm.add(hips);
    hips.updateMatrixWorld(true);
    sm.bind(new T.Skeleton(NOMES_OSSOS.map((n) => B[n])));
    sm.frustumCulled = false;
    novo.add(sm);
    // troca atômica: o personagem nunca fica sem corpo durante a troca
    instalarModelo(novo, id, B);
  } catch (err) {
    console.warn("modelo não carregou", err); // mantém o que já estava na tela (ou o boneco simples)
    if (pedido === pedidoSkin && skinCarregada && skinCarregada !== id) {
      skinAtual = skinCarregada; // o botão volta a mostrar a skin que está realmente na tela
      guardar("anarco_skin", skinAtual);
      rotuloSkin();
    }
  }
}
carregarModelo();
// ===== ESCOLHA DE SKIN =====
// ÂNCORA: o botão do menu passa para a próxima skin da lista, lembra a escolha e recarrega o corpo
const ordemSkins = Object.keys(SKINS);
function rotuloSkin() {
  const total = Object.keys(SKINS).length;
  $("skn").textContent = "Operador: " + SKINS[skinAtual].nome + " · " + (SKINS[skinAtual].classe || "HACKER") + " · " + progression.skins.length + "/" + total;
  $("sk").querySelector("img").src = "assets/img/skins/" + skinAtual + ".png";
}
$("sk").onclick = () => {
  const desbloqueadas = ordemSkins.filter((id) => progression.skins.includes(id));
  skinAtual = desbloqueadas[(desbloqueadas.indexOf(skinAtual) + 1) % desbloqueadas.length];
  guardar("anarco_skin", skinAtual);
  rotuloSkin();
  carregarModelo(skinAtual);
};
rotuloSkin();
applyRewardCosmetic();
// luzes neon que seguem o jogador
const rig = new T.Group();
S.add(rig);
const rim = new T.PointLight(0xff3fd0, 1.6, 18);
rim.position.set(-2, 3.4, -2.5);
rig.add(rim);
const cy = new T.PointLight(0x2fe6ff, 1.2, 16);
cy.position.set(2.5, 2.8, 2.5);
rig.add(cy);
const glow = new T.PointLight(0x39ff88, 0, 6);
glow.position.set(0, 1.5, 1.1);
P.add(glow);
// laptop que aparece na frente do personagem ao hackear (tela verde + luz no chão)
const lapG = new T.Group();
const lapBase = mk(new T.BoxGeometry(0.62, 0.04, 0.42), 0x141416);
const lapScr = mk(new T.BoxGeometry(0.62, 0.42, 0.03), 0x0a0a0c, 0x39ff88);
lapScr.material.emissiveIntensity = 1.3;
lapScr.position.set(0, 0.22, -0.2);
lapScr.rotation.x = -0.25;
lapG.add(lapBase, lapScr);
lapG.position.set(0, 1.15, 0.62);
lapG.visible = false;
P.add(lapG);
// ÂNCORA: notebook 3D do usuário (laptop.bin = Int16 pos/10000 + Uint16 uv/65535 + Uint16 índices). Se falhar, fica o notebook de caixas.
const HACK_ANG = Math.PI / 2, LAP_POS = [0, 0.02, 1.05], LAP_ROT = 3.84, LAP_TAM = 1.3;
const LAP_N = 10764, LAP_F = 20000, LAP_ESCALA = 1.0;
let lapEsc = 0; // escala atual do "pop" ao abrir (0 -> 1)
fetch("assets/models/laptop.mdl")
  .then((r) => r.arrayBuffer())
  .then((buf) => {
    if (buf.byteLength !== LAP_N * 10 + LAP_F * 6) throw new Error("laptop.bin com tamanho inesperado");
    const pos = new Float32Array(LAP_N * 3), uv = new Float32Array(LAP_N * 2);
    const i16 = new Int16Array(buf, 0, LAP_N * 3), u16 = new Uint16Array(buf, LAP_N * 6, LAP_N * 2);
    for (let i = 0; i < pos.length; i++) pos[i] = i16[i] / 10000;
    for (let i = 0; i < uv.length; i++) uv[i] = u16[i] / 65535;
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.BufferAttribute(pos, 3));
    g.setAttribute("uv", new T.BufferAttribute(uv, 2));
    g.setIndex(new T.BufferAttribute(new Uint16Array(buf, LAP_N * 10, LAP_F * 3), 1));
    g.computeVertexNormals();
    new T.TextureLoader().load(PR.laptop.src, (tex) => {
      // ÂNCORA: tela "digitando" — a textura vira um canvas; a área da tela (topo do atlas) recebe um terminal
      // que escreve letra por letra durante o hack, e teclas do teclado (base do atlas) acendem como se fossem apertadas.
      const cv = document.createElement("canvas");
      cv.width = cv.height = 1024;
      const cx = cv.getContext("2d");
      const ctex = new T.CanvasTexture(cv);
      ctex.anisotropy = 4;
      ctex.colorSpace = tex.colorSpace;
      ctex.flipY = tex.flipY;
      lapTela = { cv, cx, ctex, img: tex.image, txt: "", li: 0, ci: 0, t: 0, keys: [] };
      desenharTela(0);
      const m = new T.MeshStandardMaterial({ map: ctex, emissiveMap: ctex, emissive: 0xffffff, emissiveIntensity: 0.4, roughness: 0.6, metalness: 0.1 });
      const mesh = new T.Mesh(g, m);
      mesh.scale.setScalar(LAP_ESCALA);
      lapG.children.slice().forEach((c) => { lapG.remove(c); c.geometry.dispose(); c.material.dispose(); });
      lapG.add(mesh);
    });
  })
  .catch((e) => console.warn("notebook 3D indisponível, usando o de caixas:", e));
// ÂNCORA: terminal que aparece digitando na tela do notebook
let lapTela = null;
const TERM = [
  "root@kali-anarc:~# nmap -sS 10.0.0.0/24",
  "Host up: 10.0.0.13  (torre-corp)",
  "root@kali-anarc:~# hydra -l root -P rockyou.txt ssh://10.0.0.13",
  "[attempt] 438/1000 checking 'root' 'pass123'...",
  "[SUCCESS] login: 'root'",
  "root@kali-anarc:~# ./anarco.exe --breach --silent",
  ">> injetando payload..........OK",
  ">> desligando firewall........OK",
  ">> copiando /corp/dados.......OK",
  "root@kali-anarc:~# rm -rf /logs/*",
  "A REDE E LIVRE. NO CTRL.",
];
const TELA = { x: 104, y: 80, w: 920, h: 535 };
function desenharTela(dt) {
  const L = lapTela;
  if (!L) return;
  if (dt > 0) {
    L.t += dt;
    // digita ~45 caracteres por segundo
    while (L.t > 0.022) {
      L.t -= 0.022;
      const linha = TERM[L.li % TERM.length];
      if (L.ci < linha.length) L.ci++;
      else { L.li++; L.ci = 0; }
      if (Math.random() < 0.5) L.keys.push({ i: (Math.random() * 52) | 0, v: 1 });
    }
    L.keys.forEach((k) => (k.v -= dt * 9));
    L.keys = L.keys.filter((k) => k.v > 0);
  }
  const c = L.cx;
  c.drawImage(L.img, 0, 0, 1024, 1024);
  c.fillStyle = "#04080a";
  c.fillRect(TELA.x, TELA.y, TELA.w, TELA.h);
  c.font = "bold 30px monospace";
  c.textBaseline = "top";
  const linhas = [];
  for (let i = Math.max(0, L.li - 13); i <= L.li; i++) {
    const t = TERM[i % TERM.length];
    linhas.push(i === L.li ? t.slice(0, L.ci) : t);
  }
  linhas.forEach((t, i) => {
    c.fillStyle = t.startsWith("[SUCCESS]") || t.startsWith("A REDE") ? "#39ff88" : t.startsWith("root@") ? "#ff5a5a" : "#b8ffd2";
    c.fillText(t, TELA.x + 18, TELA.y + 16 + i * 37);
  });
  // cursor piscando
  if (Math.floor(time * 3) % 2 === 0) {
    const w = c.measureText(linhas[linhas.length - 1]).width;
    c.fillStyle = "#39ff88";
    c.fillRect(TELA.x + 20 + w, TELA.y + 16 + (linhas.length - 1) * 37, 16, 30);
  }
  // teclas acesas (4 fileiras do teclado)
  L.keys.forEach((k) => {
    const row = (k.i / 13) | 0, col = k.i % 13;
    c.fillStyle = "rgba(57,255,136," + (0.55 * k.v).toFixed(2) + ")";
    c.fillRect(145 + col * 67, 880 + row * 31, 52, 24);
  });
  L.ctex.needsUpdate = true;
}
const lapLight = new T.PointLight(0x39ff88, 0, 7);
lapLight.position.set(0, 0.3, 1.5);
P.add(lapLight);
const KN = { legP: -1.45, shinP: 1.5, legN: 0.1, shinN: 1.65, arm: -0.55, fore: -0.45, head: 0.45, lean: 0.25, y: -0.42 };
function animChar(dt, sp) {
  if (!model) return;
  const k = Math.min(1, sp / 9);
  // ÂNCORA: r = "fator de corrida" (0 andando a 9, 1 correndo a ~14). Antes tudo parava em k = 1, então
  // correr tinha a mesma animação de andar. Com r: passos mais rápidos e largos, corpo mais inclinado, cotovelos dobrados.
  const r = Math.max(0, Math.min(1, (sp - 9) / 5));
  wob += dt * (6 + k * 10 + r * 6);
  model.position.y = Math.abs(Math.sin(wob)) * 0.14 * k * (1 + 0.5 * r);
  const tx = hacking ? KN.lean : 0.16 * k + 0.14 * r;
  model.rotation.x += (tx - model.rotation.x) * Math.min(1, dt * 10);
  if (hacking && bone) model.position.y = KN.y;
  model.rotation.z = Math.sin(wob) * 0.07 * k + Math.sin(time * 1.6) * 0.01 * (1 - k);
  model.rotation.y = Math.sin(wob) * 0.12 * k;
  model.scale.y = 1 + Math.sin(time * 2.2) * 0.012 * (1 - k) + Math.abs(Math.sin(wob)) * 0.02 * k;
  if (bone) {
    const s = Math.sin(wob),
      idle = Math.sin(time * 1.6) * 0.04 * (1 - k),
      hk = hacking;
    bone.legP.rotation.x = s * 0.9 * k * (1 + 0.3 * r);
    bone.legN.rotation.x = -s * 0.9 * k * (1 + 0.3 * r);
    bone.armN.rotation.x = hk ? -0.9 + Math.sin(time * 38) * 0.07 : s * 0.7 * k * (1 + 0.4 * r) + idle;
    bone.armP.rotation.x = hk ? -1 : -s * 0.18 * k;
    bone.armP.rotation.z = 0.08;
    bone.armN.rotation.z = -0.08;
    bone.shinP.rotation.x = Math.max(0, s) * 1.1 * k * (1 + 0.3 * r);
    bone.shinN.rotation.x = Math.max(0, -s) * 1.1 * k * (1 + 0.3 * r);
    bone.foreN.rotation.x = hk ? -0.35 + Math.sin(time * 38) * 0.05 : -0.5 * k - 0.3 * Math.max(0, s) * k - 0.5 * r;
    bone.foreP.rotation.x = hk ? -0.3 : -0.15 * k - 0.5 * r;
    bone.spine.rotation.y = -s * 0.18 * k;
    bone.head.rotation.y = s * 0.1 * k;
    bone.head.rotation.x = hk ? 0.12 : 0;
    // ÂNCORA: pose de hack ajoelhado — perna P à frente (joelho para cima), perna N ajoelhada, mãos no teclado no chão
    if (hk) {
      const tA = Math.sin(time * 26), tB = Math.sin(time * 26 + 2.1);
      bone.legP.rotation.x = KN.legP; bone.shinP.rotation.x = KN.shinP;
      bone.legN.rotation.x = KN.legN; bone.shinN.rotation.x = KN.shinN;
      bone.armP.rotation.x = KN.arm + Math.max(0, tA) * 0.08; bone.armN.rotation.x = KN.arm + Math.max(0, tB) * 0.08;
      bone.foreP.rotation.x = KN.fore - Math.max(0, tA) * 0.12; bone.foreN.rotation.x = KN.fore - Math.max(0, tB) * 0.12;
      bone.armP.rotation.z = 0.25; bone.armN.rotation.z = -0.25;
      bone.spine.rotation.y = 0; bone.head.rotation.y = 0; bone.head.rotation.x = KN.head;
    }
    if (castT > 0) {
      bone.armP.rotation.z = 1.5;
      bone.armN.rotation.z = -1.5;
      bone.armP.rotation.x = bone.armN.rotation.x = -0.4;
    }
  }
}

// drones
const rect = (cx, cz, w, d) => [
  [cx - w, cz - d],
  [cx + w, cz - d],
  [cx + w, cz + d],
  [cx - w, cz + d],
];
const drones = [
  rect(-20, -16, 9, 9),
  rect(22, -6, 9, 10),
  rect(0, 0, 20, 14),
  rect(10, -18, 10, 7),
  rect(-12, 12, 14, 8),
].map((path, i) => {
  const g = new T.Group();
  const body = new T.Mesh(
    new T.BoxGeometry(1.05, 0.48, 1.05),
    new T.MeshStandardMaterial({ color: 0x15151d, emissive: 0xe0261c, emissiveIntensity: 0.8, roughness: 0.45, metalness: 0.55 }),
  );
  body.position.y = 0.05;
  g.add(body);
  const eye = new T.Mesh(
    new T.SphereGeometry(0.22, 12, 8),
    new T.MeshStandardMaterial({ color: 0xff3fd0, emissive: 0xff3fd0, emissiveIntensity: 2.2 }),
  );
  eye.position.set(0, 0.02, 0.56);
  g.add(eye);
  const rg = new T.Group();
  [[-0.68, -0.68], [0.68, -0.68], [-0.68, 0.68], [0.68, 0.68]].forEach(([x, z]) => {
    const rotor = new T.Mesh(
      new T.TorusGeometry(0.22, 0.045, 6, 12),
      new T.MeshBasicMaterial({ color: 0x2fe6ff }),
    );
    rotor.rotation.x = Math.PI / 2;
    rotor.position.set(x, 0.08, z);
    rg.add(rotor);
  });
  g.add(rg);
  g.rg = rg;
  g.eye = eye;
  const disc = new T.Mesh(
    new T.CircleGeometry(3.4, 32).rotateX(-Math.PI / 2),
    new T.MeshBasicMaterial({ color: 0xe0261c, transparent: true, opacity: 0.25 }),
  );
  const edgeR = new T.Mesh(
    new T.RingGeometry(3.25, 3.45, 48).rotateX(-Math.PI / 2),
    new T.MeshBasicMaterial({ color: 0xe0261c, transparent: true, opacity: 0.9 }),
  );
  edgeR.position.y = 0.01;
  disc.add(edgeR);
  const beam = new T.Mesh(
    new T.ConeGeometry(3.4, 5, 24, 1, true),
    new T.MeshBasicMaterial({
      color: 0xe0261c,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      side: T.DoubleSide,
    }),
  );
  beam.position.y = 2.5;
  disc.add(beam);
  const virusFx = new T.Group();
  for (let k = 0; k < 3; k++) {
    const tendril = new T.Mesh(
      new T.TorusGeometry(0.82 + k * 0.13, 0.035, 6, 18),
      new T.MeshBasicMaterial({ color: 0xff3fd0, transparent: true, opacity: 0.8, blending: T.AdditiveBlending }),
    );
    tendril.rotation.set(k * 0.8, k * 0.45, k * 0.3);
    virusFx.add(tendril);
  }
  virusFx.visible = false;
  g.add(virusFx);
  g.virusFx = virusFx;
  g.scale.setScalar(1.35);
  g.state = "patrol";
  g.virus = 0;
  S.add(g, disc);
  g.disc = disc;
  g.edge = edgeR;
  g.beam = beam;
  g.path = path;
  g.i = 0;
  g.sp = 4.6 + i * 0.35;
  g.position.set(path[0][0], 5, path[0][1]);
  return g;
});

// V3.7: o pool de pontos, cores por partícula, vida, gravidade e reutilização está em AnarcoFxSystem.
function burst(x, y, z, color = 0xff4a3d, count = 44, force = 12) {
  if (fxSystem) fxSystem.burstAt(new T.Vector3(x, y, z), color, count, force);
}
const playerFx = new T.Mesh(
  new T.RingGeometry(0.7, 0.86, 32).rotateX(-Math.PI / 2),
  new T.MeshBasicMaterial({ color: 0x2fe6ff, transparent: true, opacity: 0, depthWrite: false }),
);
playerFx.position.y = 0.08;
playerFx.renderOrder = 8;
S.add(playerFx);
let playerFxT = 0;
function triggerPlayerFx(color, strength = 1) {
  playerFx.material.color.set(color);
  playerFx.material.opacity = 0.9;
  playerFx.scale.setScalar(0.8 + strength * 0.2);
  playerFxT = 0.5;
}
function updatePlayerFx(dt) {
  if (playerFxT <= 0) { playerFx.material.opacity = 0; return; }
  playerFxT = Math.max(0, playerFxT - dt);
  const k = 1 - playerFxT / 0.5;
  playerFx.position.set(P.position.x, 0.08, P.position.z);
  playerFx.scale.setScalar(0.8 + k * 1.5);
  playerFx.material.opacity = (1 - k) * 0.9;
}

// input
const keys = {};
// ÂNCORA: se a janela perde o foco (ou a aba some), o "soltar tecla" nunca chega — então zeramos tudo, senão o personagem anda sozinho
const soltarTeclas = () => Object.keys(keys).forEach((k) => (keys[k] = 0));
addEventListener("blur", soltarTeclas);
document.addEventListener("visibilitychange", () => document.hidden && soltarTeclas());
addEventListener("keydown", (e) => (keys[e.key.toLowerCase()] = 1));
addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = 0));
let jx = 0,
  jz = 0;
const joy = $("joy"),
  nub = $("nub");
function jmove(e) {
  const r = joy.getBoundingClientRect(),
    cx = r.left + r.width / 2,
    cy = r.top + r.height / 2;
  let dx = (e.clientX - cx) / 50,
    dy = (e.clientY - cy) / 50;
  const l = Math.hypot(dx, dy);
  if (l > 1) {
    dx /= l;
    dy /= l;
  }
  jx = dx;
  jz = dy;
  nub.style.transform = `translate(${dx * 34}px,${dy * 34}px)`;
}
joy.addEventListener("pointerdown", (e) => {
  joy.setPointerCapture(e.pointerId);
  jmove(e);
});
joy.addEventListener("pointermove", (e) => {
  if (e.buttons || e.pressure) jmove(e);
});
const jend = () => {
  jx = jz = 0;
  nub.style.transform = "";
};
joy.addEventListener("pointerup", jend);
joy.addEventListener("pointercancel", jend);

// ÂNCORA: botão CORRER (celular) — segurar = Shift apertado (mesmo caminho do teclado)
const btnCorrer = $("rn");
const correr = (on) => {
  keys.shift = on ? 1 : 0;
  btnCorrer.classList.toggle("on", !!on);
};
btnCorrer.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  btnCorrer.setPointerCapture(e.pointerId); // continua valendo se o dedo escorregar
  correr(true);
});
["pointerup", "pointercancel", "lostpointercapture"].forEach((ev) =>
  btnCorrer.addEventListener(ev, () => correr(false)),
);

// state
let state = "menu",
  cnt = 0,
  alert_ = 0,
  shake = 0,
  grace = 0,
  endT = 0,
  camFx = null;
const runStats = { hacks: 0, failedHacks: 0, alerts: 0, items: 0, skills: 0, side: 0 };
const SIDE_MISSIONS = [
  { type: "e", text: "ENERGIA: atravesse a rota rapida", reward: "corrida silenciosa por 6s" },
  { type: "k", text: "KEYCARD: abra a rota tecnica", reward: "torres +50%" },
  { type: "u", text: "USB: proteja a rota segura", reward: "drones congelados por 5s" },
  { type: "e", text: "ENERGIA: recupere o backup", reward: "velocidade extra" },
  { type: "u", text: "USB: religue o gerador reserva", reward: "drones congelados por 5s" },
  { type: "k", text: "KEYCARD: invada o nucleo", reward: "torres +50%" },
];
let sideMission = { type: "e", text: "LOCALIZANDO...", reward: "" , done: false };
function renderSideMission() {
  const el = $("sideText");
  if (!el) return;
  el.textContent = sideMission.done ? "CONCLUIDA · " + sideMission.reward : sideMission.text;
  $("sideRead").style.color = sideMission.done ? "#39ff88" : "#ffe14a";
}
function resetStats() {
  runStats.hacks = 0;
  runStats.failedHacks = 0;
  runStats.alerts = 0;
  runStats.items = 0;
  runStats.skills = 0;
  runStats.side = 0;
}
function renderStats() {
  $("stTowers").textContent = (won ? 3 : cnt) + "/3";
  $("stHacks").textContent = runStats.hacks;
  $("stFails").textContent = runStats.failedHacks;
  $("stAlerts").textContent = runStats.alerts;
  $("stItems").textContent = runStats.items;
  $("stSkills").textContent = runStats.skills;
  const score = runStats.failedHacks === 0 && runStats.alerts === 0 ? "FANTASMA" : runStats.alerts <= 2 ? "INFILTRADOR" : "AGENTE DE RUPTURA";
  $("stProfile").textContent = "PERFIL // " + score + (runStats.side ? " · OP. SECUNDARIA OK" : "");
}
const vel = new T.Vector3();
// ÂNCORA: calm = true quando o sistema pede menos movimento (acessibilidade); atualiza ao vivo
const reduzMov = matchMedia("(prefers-reduced-motion:reduce)");
let calm = reduzMov.matches;
reduzMov.addEventListener("change", (e) => (calm = e.matches));
const codeRainSelect = $("codeRainMode");
const codeRainStatus = $("codeRainStatus");
let codeRainMode = matchMedia("(pointer: coarse)").matches ? "auto" : "on";
try {
  const savedCodeRainMode = localStorage.getItem("anarco_code_rain_mode");
  if (["on", "auto", "off"].includes(savedCodeRainMode)) codeRainMode = savedCodeRainMode;
} catch { /* preferência apenas desta sessão */ }
if (codeRainSelect) {
  codeRainSelect.value = codeRainMode;
  const syncCodeRainSetting = () => {
    codeRainMode = codeRainSelect.value;
    if (codeRainStatus) codeRainStatus.textContent = codeRainMode === "on"
      ? "ATIVA · chuva de códigos no BREACH"
      : codeRainMode === "auto" ? "AUTOMÁTICA · segue Reduzir Movimento do sistema" : "DESATIVADA";
    try { localStorage.setItem("anarco_code_rain_mode", codeRainMode); } catch { /* preferência apenas desta sessão */ }
  };
  codeRainSelect.addEventListener("change", syncCodeRainSetting);
  syncCodeRainSetting();
}
function breachCodeRainEnabled() {
  return codeRainMode === "on" || (codeRainMode === "auto" && !calm);
}
function cameraMoment(kind, x, z, duration) {
  if (calm) { camFx = null; return; }
  camFx = { kind, x, z, t: duration, duration };
}
function cameraShot(kind, x, z) {
  const shot = kind === "boss"
    ? { x: x + 10, y: 10, z: z + 12, lookY: 2.2 }
    : kind === "tower"
      ? { x: x + 6, y: 9, z: z + 8, lookY: 1.5 }
      : { x: x + 4.5, y: 7.5, z: z + 6.5, lookY: 1.1 };
  return shot;
}
function reset(keep) {
  if (!keep) {
    lvl = 0;
    resetStats();
  }
  mini = null;
  hackUiTarget = hackHoldTarget = hackFailureTarget = lastHackTarget = null;
  hackHoldUntil = hackFailureUntil = 0;
  $("hackPanel").hidden = true;
  setHackStream(false);
  document.body.dataset.hackMini = "0";
  $("mini").style.removeProperty("top");
  blackoutClock = 0;
  blackoutOn = false;
  document.body.classList.remove("blackout");
  sideMission = { ...(SIDE_MISSIONS[lvl] || SIDE_MISSIONS[0]), done: false };
  renderSideMission();
  $("mini").hidden = true;
  emp = boost = empCd = virusCd = ghostCd = ghostT = dodgeT = dodgeCd = dodgeInv = 0;
  dodgeVx = dodgeVz = 0;
  $("msg").textContent = "";
  applyLevel();
  resetSceneProps();
  spawnPickups();
  $("lv").textContent = "NÍVEL " + (lvl + 1) + "/" + LV.length;
  won = false;
  if (model) model.rotation.set(0, 0, 0);
  cnt = 0;
  alert_ = 0;
  grace = 1.5;
  shake = 0;
  camFx = null;
  vel.set(0, 0, 0);
  P.position.set(0, 0, 22);
  towers.forEach((t) => {
    t.done = false;
    t.p = 0;
    t.glitch = 0;
    t.mesh.material.emissiveMap = t.lit;
    t.mesh.material.needsUpdate = true;
    t.ring.material.color.set(0xe0261c);
    t.spr.visible = false;
    t.mesh.position.x = t.x;
  });
  drones.forEach((d) => {
    d.i = 0;
    d.chase = 0;
    d.state = "patrol";
    d.virus = 0;
    d.position.set(d.path[0][0], 5, d.path[0][1]);
  });
  $("cnt").textContent = LV[lvl].boss ? "—" : "0/3";
  state = "play";
  applyPhaseReadout();
  $("stats").hidden = true;
  $("ov").style.display = "none";
  $("ov").dataset.mode = "menu";
}
function chooseEnd(k) {
  $("ch").hidden = true;
  $("st").hidden = false;
  guardar("anarco_final", k);
  sfx(k === "caos" ? "win" : "pulse");
  if (k === "caos") {
    $("ot").innerHTML = "FINAL <span>CAOS</span>";
    $("od").textContent =
      "Você jogou tudo na rede. Bancos travam, a MegaCorp desaba e as ruas acendem. Ninguém manda mais — nem você. A verdade é de todos.";
  } else {
    $("ot").innerHTML = "FINAL <span>SOMBRIO</span>";
    $("od").textContent =
      "Você guardou os arquivos e mandou um recado ao CEO. Agora as corporações pagam e obedecem... a você. O capuz sem chefe virou o novo chefe.";
  }
  $("st").textContent = "Jogar de novo";
}
$("cCaos").onclick = () => chooseEnd("caos");
$("cSomb").onclick = () => chooseEnd("sombrio");
function registerCampaignProgress() {
  progression.wins++;
  if (progression.wins >= 1 && !progression.skins.includes("cachos") && SKINS.cachos) progression.skins.push("cachos");
  saveProgress();
  rotuloSkin();
  applyRewardCosmetic();
}
function end(win) {
  $("ch").hidden = true;
  $("st").hidden = false;
  state = "over";
  won = win;
  sfx(win ? "win" : "lose");
  buzz(win ? [60, 40, 60, 40, 140] : [160, 70, 220]); // vitória: vibração em "ta-ta-TÁ"; derrota: longa e grave
  mini = null;
  $("mini").hidden = true;
  $("hackPanel").hidden = true;
  setHackStream(false);
  document.body.dataset.hackMini = "0";
  $("msg").textContent = "";
  $("ot").innerHTML = win ? "A REDE É <span>LIVRE</span>" : "RASTRE<span>ADO</span>";
  $("od").textContent = win
    ? "As três corporações caíram e a verdade está solta. Nenhum chefe, nenhum servidor sagrado."
    : "Os drones te localizaram. Troque de proxy e tente de novo.";
  $("st").textContent = win ? "Jogar de novo" : "Tentar de novo";
  $("rkres").hidden = true;
  $("stats").hidden = false;
  renderStats();
  if (win) {
    registerCampaignProgress();
    const r = registrarTempo(runT);
    $("rkres").hidden = false;
    $("rkres").innerHTML =
      "TEMPO <b>" +
      fmtTempo(r.t) +
      "</b> · " +
      (r.pos === 1 ? "NOVO RECORDE!" : r.pos ? "#" + r.pos + " no ranking" : "fora do top " + RK_MAX) +
      ' <button id="rkv" type="button">ver ranking</button>';
    $("rkv").onclick = () => showRank(r.pos);
    if (r.pos === 1) sfx("record"); // fanfarra um pouco depois do "win"
    $("ot").innerHTML = "A ESCOLHA É <span>SUA</span>";
    $("od").textContent =
      "Os arquivos das três corporações estão no seu laptop. Vazar tudo e libertar a rede — ou usar isso para chantagear quem manda?";
    $("ch").hidden = false;
    $("st").hidden = true;
  }
  $("ov").style.display = "flex";
  $("ov").dataset.mode = "results";
  // O mesmo cartão é reutilizado entre menu, vitória e derrota: sempre reabre no topo.
  $("ov").scrollTop = 0;
  const overlayCard = $("ov").querySelector(".ov-card");
  if (overlayCard) overlayCard.scrollTop = 0;
}
function hackDone(t) {
  buzz(42);
  cameraMoment("tower", t.x, t.z, 0.9);
  runStats.hacks++;
  t.done = true;
  hackHoldTarget = t;
  hackHoldUntil = performance.now() + 2200;
  hackFailureUntil = 0;
  playHackFeedback("root");
  cnt++;
  $("cnt").textContent = cnt + "/3";
  t.mesh.material.emissiveMap = t.hot;
  t.mesh.material.needsUpdate = true;
  t.ring.material.color.set(0x39ff88);
  t.spr.visible = true;
  t.glitch = 1.2;
  t.wt = 0;
  fxSystem.emit("code", new T.Vector3(t.x, t.h, t.z), 0.9);
  fxSystem.lightAt(new T.Vector3(t.x, 2, t.z), "#39ff88", 2.8, 0.32, 14);
  fxSystem.flash("hack", 280);
  burst(t.x, t.h, t.z);
  const doc = addLeak(t.n);
  leakCard(t.n, doc);
  t.pulse = 1;
  slowT = 0.2;
  sfx("pulse");
  if (!calm) shake = 0.7;
  $("msg").textContent = t.n + " caiu. Vazamento publicado.";
  if (cnt === 3) {
    if (lvl < LV.length - 1) {
      $("msg").textContent = "Nível " + (lvl + 1) + " completo!";
      setTimeout(() => {
        if (state === "play") brief();
      }, 1600);
    } else endT = 1.4;
  }
}
function introTerm(done) {
  const L = [
    "> conectando a rede anonima...",
    "> identidade: BRECH",
    "> hacker de periferia, 19 anos.",
    "> as corporacoes vigiam, lucram e mentem.",
    "> missao: invadir os servidores e vazar a verdade.",
    "> cuidado com os drones. correr faz barulho.",
    "> boa sorte. a escolha final sera sua.",
  ];
  const o = document.createElement("div");
  o.style.cssText =
    "position:fixed;inset:0;z-index:9999;background:#000;color:#39ff6a;font:18px 'Special Elite',monospace;padding:8vh 8vw;white-space:pre-wrap;cursor:pointer;line-height:1.6";
  document.body.appendChild(o);
  let i = 0,
    c = 0,
    fin = false,
    txt = "";
  const end = () => {
    if (fin) return;
    fin = true;
    clearInterval(t);
    o.remove();
    done();
  };
  const t = setInterval(() => {
    if (i >= L.length) {
      clearInterval(t);
      o.innerHTML = txt + "\n\n<b>[ clique ou aperte qualquer tecla ]</b>";
      return;
    }
    txt += L[i][c++] || "";
    if (c > L[i].length) {
      txt += "\n";
      i++;
      c = 0;
    }
    o.textContent = txt + "█";
  }, 15);
  o.onclick = end;
  addEventListener("keydown", function k() {
    if (i >= L.length || fin) {
      removeEventListener("keydown", k);
      end();
    }
  });
}
$("st").onclick = () => {
  tut = ler("anarco_tut") ? -1 : 0;
  introTerm(startGame);
};
$("tb").onclick = () => {
  tut = 0;
  startGame();
};
function startGame() {
  if (!actx) {
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {}
  }
  runT = 0;
  tmShown = "";
  $("tmv").textContent = fmtTempo(0);
  reset();
  tutShow();
}
// níveis, minigame de sequência e itens
// ÂNCORA: dr = drones, sp = velocidade, seq/t = sequência do hack e tempo, vis = raio de visão do drone (metros)
const LV = [
  { dr: 3, sp: 1, seq: 4, t: 7, vis: 3.4 },
  { dr: 4, sp: 1.15, seq: 5, t: 7, vis: 3.6 },
  { dr: 5, sp: 1.3, seq: 6, t: 7, vis: 3.8 },
  { dr: 5, sp: 1.35, seq: 7, t: 6, vis: 4.0, room: true },
  { dr: 5, sp: 1.4, seq: 6, t: 7, vis: 4.2, mode: 2, blackout: true },
  { dr: 2, sp: 1.1, seq: 5, t: 7, vis: 3.6, boss: true, mode: 4 },
];
let blackoutClock = 0, blackoutOn = false;
const VIS_BASE = 3.4; // raio com que o disco e o cone foram modelados
  routeMode = "fast";
const ROUTE_BALANCE = [
  { fast: { speed: 1.18, noise: 1.35, alertGain: 1.35, alertRecovery: 0.9, cd: 1 }, safe: { speed: 0.92, noise: 0.65, alertGain: 0.65, alertRecovery: 1.25, cd: 1 }, tech: { speed: 1, noise: 0.9, alertGain: 0.82, alertRecovery: 1, cd: 0.82 } },
  { fast: { speed: 1.24, noise: 1.42, alertGain: 1.42, alertRecovery: 0.88, cd: 1 }, safe: { speed: 0.9, noise: 0.6, alertGain: 0.6, alertRecovery: 1.3, cd: 1 }, tech: { speed: 0.98, noise: 0.84, alertGain: 0.78, alertRecovery: 1.04, cd: 0.8 } },
  { fast: { speed: 1.2, noise: 1.55, alertGain: 1.5, alertRecovery: 0.82, cd: 1 }, safe: { speed: 0.88, noise: 0.55, alertGain: 0.55, alertRecovery: 1.38, cd: 1 }, tech: { speed: 1, noise: 0.8, alertGain: 0.75, alertRecovery: 1.08, cd: 0.78 } },
  { fast: { speed: 1.15, noise: 1.65, alertGain: 1.6, alertRecovery: 0.8, cd: 1 }, safe: { speed: 0.86, noise: 0.5, alertGain: 0.5, alertRecovery: 1.45, cd: 1 }, tech: { speed: 0.96, noise: 0.76, alertGain: 0.7, alertRecovery: 1.1, cd: 0.75 } },
  { fast: { speed: 1.12, noise: 1.7, alertGain: 1.65, alertRecovery: 0.78, cd: 1 }, safe: { speed: 0.88, noise: 0.54, alertGain: 0.54, alertRecovery: 1.4, cd: 1 }, tech: { speed: 0.95, noise: 0.74, alertGain: 0.69, alertRecovery: 1.1, cd: 0.73 } },
  { fast: { speed: 1.1, noise: 1.72, alertGain: 1.72, alertRecovery: 0.76, cd: 1 }, safe: { speed: 0.9, noise: 0.58, alertGain: 0.58, alertRecovery: 1.32, cd: 1 }, tech: { speed: 0.94, noise: 0.72, alertGain: 0.68, alertRecovery: 1.12, cd: 0.72 } },
];
function routeTune() { return (ROUTE_BALANCE[lvl] || ROUTE_BALANCE[0])[routeMode]; }
const ROUTES = {
  fast: { label: "RÁPIDA", text: "velocidade +18% · ruído +35%", speed: 1.18, noise: 1.35, alertGain: 1.35, alertRecovery: 0.9, color: "#2fe6ff" },
  safe: { label: "PROTEGIDA", text: "detecção -35% · velocidade -8%", speed: 0.92, noise: 0.65, alertGain: 0.65, alertRecovery: 1.25, color: "#39ff88" },
  tech: { label: "TÉCNICA", text: "hack estável · habilidades -18%", speed: 1, noise: 0.9, alertGain: 0.82, alertRecovery: 1.0, color: "#ff3fd0" },
};
function renderRoute() {
  const r = { ...ROUTES[routeMode], ...routeTune() };
  $("routeText").textContent = r.label + " · " + r.text;
  $("routeRead").style.color = r.color;
  ["fast", "safe", "tech"].forEach((k) => {
    const b = $("route" + (k === "fast" ? "Fast" : k === "safe" ? "Safe" : "Tech"));
    b.dataset.route = k;
    b.dataset.active = String(k === routeMode);
  });
  routeVisuals.children.forEach((line) => { line.material.opacity = line.userData.route === routeMode ? 0.7 : 0.12; });
}
function setRoute(mode) {
  if (!ROUTES[mode] || mode === routeMode) return;
  routeMode = mode;
  renderRoute();
  sfx("route", mode === "fast" ? 0 : mode === "safe" ? 1 : 2);
  note = "Rota " + ROUTES[mode].label + " selecionada: " + ROUTES[mode].text;
  noteT = 2.4;
  flashFeedback(mode === "safe" ? "collect" : mode === "tech" ? "hack" : "danger");
}
let lvl = 0,
  emp = 0,
  boost = 0,
  mini = null,
  note = "",
  noteT = 0;
const DIRS = ["←", "↑", "→", "↓"];
const HACK_PROTOCOLS = [
  { name: "PROTOCOLO // SETAS", rule: "sequencia livre" },
  { name: "PROTOCOLO // RELE", rule: "sem repetir o ultimo sinal" },
  { name: "PROTOCOLO // PULSO", rule: "ritmo alternado de invasao" },
  { name: "PROTOCOLO // NUCLEO", rule: "sequencia curta · alerta alto" },
  { name: "PROTOCOLO // CHEFAO", rule: "memorize e reaja" },
];
function hackSequence(length, mode) {
  const out = [];
  for (let i = 0; i < length; i++) {
    if (mode === 1) {
      let d = Math.floor(Math.random() * 4);
      while (d === out[i - 1]) d = Math.floor(Math.random() * 4);
      out.push(d);
    } else if (mode === 2) {
      out.push(i % 2 ? (Math.floor(Math.random() * 2) + 2) : Math.floor(Math.random() * 2));
    } else if (mode === 3) {
      out.push([0, 1, 3, 2, 1, 0, 2][i % 7]);
    } else {
      out.push(Math.floor(Math.random() * 4));
    }
  }
  return out;
}
function drawMini() {
  const protocol = HACK_PROTOCOLS[mini.mode] || HACK_PROTOCOLS[0];
  $("miniTitle").textContent = "BREACH — " + protocol.name.split("// ")[1];
  $("miniRule").textContent = protocol.rule;
  $("mini").dataset.mode = String(mini.mode);
  $("seq").innerHTML = mini.seq
    .map((d, i) => `<span class="${i < mini.pos ? "ok" : i === mini.pos ? "cur" : ""}">${DIRS[d]}</span>`)
    .join("");
}
function startMini(t) {
  flashFeedback("hack");
  triggerPlayerFx(0xff3fd0, 1);
  cameraMoment("hack", t.x, t.z, 0.75);
  mini = {
    t,
    mode: LV[lvl].mode ?? lvl,
    seq: hackSequence(LV[lvl].seq, LV[lvl].mode ?? lvl),
    pos: 0,
    left: LV[lvl].t,
  };
  drawMini();
  $("mini").hidden = false;
  document.body.dataset.hackMini = "1";
  buzz(16);
}
function miniKey(d) {
  if (!mini || state !== "play") return;
  if (d === mini.seq[mini.pos]) {
    mini.pos++;
    sfx("ok", mini.pos);
    if (mini.pos >= mini.seq.length) {
      const t = mini.t;
      mini = null;
      $("mini").hidden = true;
      document.body.dataset.hackMini = "0";
      hackDone(t);
      return;
    }
  } else {
    hackFailureTarget = mini.t;
    hackFailureUntil = performance.now() + 1150;
    playHackFeedback("error");
    buzz(18);
    runStats.failedHacks++;
    mini.pos = 0;
    alert_ = Math.min(0.98, alert_ + 0.2 * ROUTES[routeMode].alertGain);
    if (!calm) shake = 0.3;
  }
  drawMini();
}
addEventListener("keydown", (e) => {
  const k = { arrowleft: 0, a: 0, arrowup: 1, w: 1, arrowright: 2, d: 2, arrowdown: 3, s: 3 }[
    e.key.toLowerCase()
  ];
  if (mini && k !== undefined) {
    e.preventDefault();
    miniKey(k);
  }
});
[[ $("routeFast"), "fast" ], [ $("routeSafe"), "safe" ], [ $("routeTech"), "tech" ]].forEach(([button, mode]) => {
  button.addEventListener("click", () => setRoute(mode));
});
addEventListener("keydown", (e) => {
  if (state === "play" && !mini && { "1": "fast", "2": "safe", "3": "tech" }[e.key]) setRoute({ "1": "fast", "2": "safe", "3": "tech" }[e.key]);
});
renderRoute();
DIRS.forEach((g, i) => {
  const b = document.createElement("button");
  b.textContent = g;
  b.onpointerdown = (e) => {
    e.preventDefault();
    miniKey(i);
  };
  $("mk").appendChild(b);
});
const pick = [],
  sceneProps = [],
  PT = { e: "energy", k: "keycard", u: "usb" },
  tex = {};
for (const k in ICON) {
  tex[k] = new T.TextureLoader().load(ICON[k]);
  tex[k].magFilter = T.NearestFilter;
}
function spawnPickups() {
  pick.forEach((p) => S.remove(p.s));
  pick.length = 0;
  ["e", "k", "u"].forEach((t) => {
    let x, z, tentativas = 0;
    const raio = (s) => (Number.isFinite(s.r) ? s.r : Math.hypot(s.w || 0, s.d || 0) / 2);
    do {
      x = (Math.random() - 0.5) * 60;
      z = (Math.random() - 0.5) * 60;
      tentativas++;
    } while (tentativas < 400 && (!solids.every((s) => Math.hypot(x - s.x, z - s.z) > raio(s) + 2) || Math.hypot(x, z - 22) < 6));
    const s = new T.Sprite(
      new T.SpriteMaterial({
        map: tex[PT[t]],
        blending: T.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    );
    s.scale.set(2.2, 2.2, 1);
    s.position.set(x, 1.6, z);
    S.add(s);
    pick.push({ t, s, x, z });
  });
}
function getPick(t) {
  runStats.items++;
  fxSystem.emit("pickup", new T.Vector3(P.position.x, 1.4, P.position.z), 0.7);
  fxSystem.lightAt(new T.Vector3(P.position.x, 1.2, P.position.z), "#39ff88", 1.5, 0.2, 8);
  if (!sideMission.done && t === sideMission.type) {
    sideMission.done = true;
    runStats.side++;
    renderSideMission();
    note = "OP. SECUNDARIA CONCLUIDA: " + sideMission.reward;
    noteT = 3;
    sfx("done");
    buzz(48);
    flashFeedback("collect");
    triggerPlayerFx(0x39ff88, 1.2);
  }
  if (t === "e") {
    boost = 6;
    alert_ = 0;
    bz = 0;
    note = "Energia: velocidade extra e alerta zerado!";
  } else if (t === "k") {
    towers.forEach((q) => {
      if (!q.done) q.p = Math.min(0.95, q.p + 0.5);
    });
    note = "Keycard: torres 50% abertas!";
    if (boss) hitBoss(15);
  } else {
    emp = 5;
    note = "USB: drones congelados por 5s!";
  }
  noteT = 2.4;
  sfx("pick");
  if (!calm) shake = 0.25;
}
// props das suas imagens, letreiro neon, grafite, minimapa e som
[
  ["rack", -31, -26, 6],
  ["rack", 30, -24, 6],
  ["rack", -12, -26, 6],
  ["crt", -30, -4, 4.5],
  ["crt", 30, 4, 4.5],
  ["crt", 6, -14, 3.5],
  ["laptop", -4, 14, 1.8],
  ["laptop", 18, 22, 1.8],
  ["usb", -16, 18, 2],
  ["mask", 24, 20, 2.2],
].forEach(([k, x, z, hh]) => {
  const s = new T.Sprite(
    new T.SpriteMaterial({ map: new T.TextureLoader().load(PR[k].src), transparent: true, alphaTest: 0.05 }),
  );
  s.scale.set(hh * PR[k].ar, hh, 1);
  s.position.set(x, hh / 2, z);
  S.add(s);
  sceneProps.push({ node: s, x, z, kind: k, damage: 0, destroyed: false });
});
// Kit procedural de destrutíveis: painel, caixa, cabo e porta.
const propMat = {
  panel: new T.MeshStandardMaterial({ color: 0x1b2630, emissive: 0x2fe6ff, emissiveIntensity: 0.9, metalness: 0.5 }),
  crate: new T.MeshStandardMaterial({ color: 0x6b5435, emissive: 0x24160a, emissiveIntensity: 0.2 }),
  door: new T.MeshStandardMaterial({ color: 0x24202f, emissive: 0xff3fd0, emissiveIntensity: 0.35, metalness: 0.7 }),
  cable: new T.LineBasicMaterial({ color: 0xff3fd0, transparent: true, opacity: 0.9 }),
};
function addDestructible(kind, x, z, rot = 0) {
  let node;
  if (kind === "cable") {
    const geo = new T.BufferGeometry().setFromPoints([new T.Vector3(x - 2.5, 1.2, z), new T.Vector3(x, 0.25, z + 1), new T.Vector3(x + 2.5, 1.2, z)]);
    node = new T.Line(geo, propMat.cable);
  } else {
    const dims = kind === "door" ? [2.8, 4.4, 0.28] : kind === "crate" ? [1.8, 1.8, 1.8] : [2.4, 1.6, 0.18];
    node = new T.Mesh(new T.BoxGeometry(...dims), propMat[kind]);
    node.position.y = dims[1] / 2;
    node.rotation.y = rot;
    if (kind === "panel") {
      const led = new T.Mesh(new T.BoxGeometry(1.5, 0.08, 0.04), new T.MeshBasicMaterial({ color: 0x39ff88 }));
      led.position.set(0, 0.3, 0.12);
      node.add(led);
    }
  }
  node.position.x = x;
  node.position.z = z;
  S.add(node);
  sceneProps.push({ node, x, z, kind, damage: 0, destroyed: false });
}
addDestructible("panel", -24, 8, 0.08);
addDestructible("panel", 24, 10, -0.08);
addDestructible("crate", -4, -16, 0.25);
addDestructible("crate", 14, -8, -0.35);
addDestructible("door", 0, -32, 0);
addDestructible("cable", -8, 2, 0);
addDestructible("cable", 12, 18, 0);
function resetSceneProps() {
  sceneProps.forEach((p) => {
    p.damage = 0;
    p.destroyed = false;
    p.node.visible = true;
    p.node.scale.set(1, 1, 1);
    p.node.rotation.z = 0;
    p.node.userData.damaged = false;
  });
}
const PROP_FX = {
  panel: { color: 0x2fe6ff, force: 10 },
  crate: { color: 0xffa33a, force: 8 },
  cable: { color: 0xff3fd0, force: 16 },
  door: { color: 0xffe14a, force: 12 },
  rack: { color: 0x39ff88, force: 9 },
  crt: { color: 0x72cfff, force: 11 },
  laptop: { color: 0x39ff88, force: 7 },
  usb: { color: 0x2fe6ff, force: 6 },
  mask: { color: 0xff3fd0, force: 6 },
};
function destroyPropNear(x, z) {
  let target = null;
  let distance = 8;
  sceneProps.forEach((p) => {
    if (p.destroyed) return;
    const d = Math.hypot(x - p.x, z - p.z);
    if (d < distance) { distance = d; target = p; }
  });
  if (!target) return null;
  const fx = PROP_FX[target.kind] || PROP_FX.panel;
  target.damage = Math.min(2, (target.damage || 0) + 1);
  if (target.damage === 1) {
    target.node.scale.set(0.86, 0.9, 0.86);
    target.node.rotation.z = 0.08;
    target.node.userData.damaged = true;
    burst(target.x, target.kind === "door" ? 1.4 : 0.65, target.z, fx.color, 42, fx.force * 0.65);
    flashFeedback("danger");
    triggerPlayerFx(0xffe14a, 0.7);
    note = "Alvo danificado — use BREACH novamente para desmontar.";
    noteT = 1.8;
    sfx("bad");
  } else {
    target.destroyed = true;
    target.node.visible = false;
    fxSystem.emit(target.kind === "crate" || target.kind === "panel" ? "metal" : "code", new T.Vector3(target.x, target.kind === "door" ? 2.2 : 1, target.z), 1.25);
    fxSystem.lightAt(new T.Vector3(target.x, 1.2, target.z), "#ff8a48", 2.2, 0.22, 10);
    burst(target.x, target.kind === "door" ? 2.2 : 1, target.z, fx.color, 130, fx.force);
    flashFeedback("hack");
    triggerPlayerFx(0xff3fd0, 0.9);
    sfx("boss");
    note = "Estrutura desmontada.";
    noteT = 1.4;
  }
  return target.kind;
}
const nc = document.createElement("canvas");
nc.width = 1024;
nc.height = 200;
{
  const g = nc.getContext("2d");
  g.font = "bold 150px Impact,Anton,sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.shadowColor = "#ff3fd0";
  g.shadowBlur = 40;
  g.fillStyle = "#ff9be8";
  g.fillText("ANARCO.EXE", 512, 104);
  g.shadowBlur = 12;
  g.fillText("ANARCO.EXE", 512, 104);
}
const sign = new T.Mesh(
  new T.PlaneGeometry(44, 8.6),
  new T.MeshBasicMaterial({
    map: new T.CanvasTexture(nc),
    transparent: true,
    blending: T.AdditiveBlending,
    depthWrite: false,
    fog: false,
  }),
);
sign.position.set(0, 26, -46);
S.add(sign);
const gr = new T.Mesh(
  new T.PlaneGeometry(9, 9).rotateX(-Math.PI / 2),
  new T.MeshBasicMaterial({ map: aTex, transparent: true, opacity: 0.55, depthWrite: false }),
);
gr.position.set(0, 0.03, 20);
S.add(gr);
const mc = $("map").getContext("2d"),
  MK = 130 / 74;
function drawMap() {
  sign.material.opacity = 0.85 + Math.sin(time * 3) * 0.1;
  mc.clearRect(0, 0, 130, 130);
  const X = (x) => (x + 37) * MK,
    Y = (z) => (z + 37) * MK;
  crates.forEach((c) => {
    mc.fillStyle = "#3a3350";
    mc.fillRect(X(c.x) - 2, Y(c.z) - 2, 4, 4);
  });
  towers.forEach((t) => {
    mc.fillStyle = t.done ? "#39ff88" : t.state === "hack" ? "#ff3fd0" : t.state === "target" ? "#ffe14a" : "#e0261c";
    mc.fillRect(X(t.x) - 4, Y(t.z) - 4, 8, 8);
  });
  pick.forEach((p) => {
    const special = !sideMission.done && p.t === sideMission.type;
    mc.fillStyle = special ? "#ffe14a" : p.t === "e" ? "#2fe6ff" : p.t === "k" ? "#ff3fd0" : "#39ff88";
    mc.beginPath();
    mc.arc(X(p.x), Y(p.z), special ? 4 : 2.5, 0, 7);
    mc.fill();
  });
  drones.forEach((d, n) => {
    if (n >= LV[lvl].dr) return;
    mc.fillStyle = d.state === "virus" ? "#ff3fd0" : d.state === "frozen" ? "#2fe6ff" : d.state === "detected" ? "#ffe14a" : d.chase ? "#ff8a00" : "#ff4d4d";
    mc.beginPath();
    mc.arc(X(d.position.x), Y(d.position.z), 3, 0, 7);
    mc.fill();
  });
  if (boss) {
    mc.fillStyle = "#fff";
    mc.beginPath();
    mc.arc(X(boss.g.position.x), Y(boss.g.position.z), 6, 0, 7);
    mc.fill();
  }
  mc.save();
  mc.translate(X(P.position.x), Y(P.position.z));
  mc.rotate(Math.PI - P.rotation.y);
  mc.fillStyle = "#fff";
  mc.beginPath();
  mc.moveTo(0, -5);
  mc.lineTo(4, 4);
  mc.lineTo(-4, 4);
  mc.fill();
  mc.restore();
}
let actx = null,
  mute = false,
  aLast = 0,
  alertAnt = 0,
  audioLayers = null,
  audioStateShown = "",
  customAudioBuffers = Object.create(null),
  customAudioLoad = null,
  customMusicSource = null,
  hackStreamSource = null,
  hackStreamGain = null,
  hackStreamWanted = false;
const CUSTOM_AUDIO = {
  music: "assets/audio/anarco-cyberpunk-ost.mp3",
  connect: "assets/audio/hack-connect.mp3",
  stream: "assets/audio/data-stream-loop.mp3",
  error: "assets/audio/hack-fail.mp3",
  root: "assets/audio/root-access.mp3",
};
function startCustomMusic() {
  const buffer = customAudioBuffers.music;
  if (!actx || !audioLayers || !buffer || customMusicSource) return;
  const source = actx.createBufferSource(), gain = actx.createGain();
  source.buffer = buffer; source.loop = true; gain.gain.value = 0.34;
  source.connect(gain).connect(audioLayers.master); source.start(); customMusicSource = source;
}
function playCustomSound(name, volume = 0.5) {
  const buffer = customAudioBuffers[name];
  if (!actx || !audioLayers || !buffer || mute) return false;
  const source = actx.createBufferSource(), gain = actx.createGain();
  source.buffer = buffer; gain.gain.value = volume;
  source.connect(gain).connect(audioLayers.master); source.start();
  return true;
}
function setHackStream(active) {
  hackStreamWanted = active;
  if (!actx || !audioLayers) return;
  if (active && !hackStreamSource && customAudioBuffers.stream) {
    hackStreamSource = actx.createBufferSource();
    hackStreamGain = actx.createGain();
    hackStreamSource.buffer = customAudioBuffers.stream;
    hackStreamSource.loop = true;
    hackStreamGain.gain.setValueAtTime(0.0001, actx.currentTime);
    hackStreamGain.gain.setTargetAtTime(mute ? 0.0001 : 0.13, actx.currentTime, 0.12);
    hackStreamSource.connect(hackStreamGain).connect(audioLayers.master);
    hackStreamSource.start();
  } else if (!active && hackStreamSource) {
    const source = hackStreamSource;
    if (hackStreamGain) hackStreamGain.gain.setTargetAtTime(0.0001, actx.currentTime, 0.045);
    hackStreamSource = null; hackStreamGain = null;
    window.setTimeout(() => { try { source.stop(); } catch (e) {} }, 260);
  }
}
async function loadCustomAudio() {
  if (customAudioLoad || !actx) return customAudioLoad;
  customAudioLoad = Promise.all(Object.entries(CUSTOM_AUDIO).map(async ([key, path]) => {
    try {
      const response = await fetch(new URL(path, document.baseURI).toString());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      customAudioBuffers[key] = await actx.decodeAudioData(await response.arrayBuffer());
      if (key === "music") startCustomMusic();
      if (key === "stream" && hackStreamWanted) setHackStream(true);
    } catch (error) { console.warn(`Áudio local indisponível (${key}); usando síntese de reserva.`, error); }
  }));
  return customAudioLoad;
}
$("snd").onclick = () => {
  mute = !mute;
  $("snd").textContent = mute ? "🔇" : "🔊";
  if (audioLayers && actx) audioLayers.master.gain.setTargetAtTime(mute ? 0.0001 : 0.9, actx.currentTime, 0.1);
  if (hackStreamGain && actx) hackStreamGain.gain.setTargetAtTime(mute ? 0.0001 : hackStreamWanted ? 0.13 : 0.0001, actx.currentTime, 0.08);
  audioStateShown = "";
};
function sfx(n, i) {
  if (mute || !actx) return;
  const t = actx.currentTime;
  const output = audioLayers?.master || actx.destination;
  const tone = (f, d, ty = "square", v = 0.06, at = 0) => {
    const o = actx.createOscillator(),
      g = actx.createGain();
    o.type = ty;
    o.frequency.setValueAtTime(f, t + at);
    g.gain.setValueAtTime(v, t + at);
    g.gain.exponentialRampToValueAtTime(0.0001, t + at + d);
    o.connect(g);
    g.connect(output);
    o.start(t + at);
    o.stop(t + at + d);
  };
  // ÂNCORA: sweep = tom que desliza de f1 até f2 (sirenes, "zaps")
  const sweep = (f1, f2, d, ty = "sawtooth", v = 0.06, at = 0) => {
    const o = actx.createOscillator(),
      g = actx.createGain();
    o.type = ty;
    o.frequency.setValueAtTime(f1, t + at);
    o.frequency.exponentialRampToValueAtTime(f2, t + at + d);
    g.gain.setValueAtTime(v, t + at);
    g.gain.exponentialRampToValueAtTime(0.0001, t + at + d);
    o.connect(g);
    g.connect(output);
    o.start(t + at);
    o.stop(t + at + d);
  };
  // ÂNCORA: ruído = números aleatórios no buffer; o filtro passa-baixa deixa o som "abafado" (impacto)
  const noise = (d, v = 0.15, corte = 1200, at = 0) => {
    const len = Math.floor(actx.sampleRate * d),
      buf = actx.createBuffer(1, len, actx.sampleRate),
      dado = buf.getChannelData(0);
    for (let k = 0; k < len; k++) dado[k] = (Math.random() * 2 - 1) * (1 - k / len); // some aos poucos
    const src = actx.createBufferSource(),
      f = actx.createBiquadFilter(),
      g = actx.createGain();
    src.buffer = buf;
    f.type = "lowpass";
    f.frequency.value = corte;
    g.gain.value = v;
    src.connect(f);
    f.connect(g);
    g.connect(output);
    src.start(t + at);
  };
  if (n === "tick") tone(1200, 0.04, "square", 0.03);
  else if (n === "ready") {
    tone(660, 0.07, "triangle", 0.05);
    tone(990, 0.1, "triangle", 0.05, 0.06);
  }
  else if (n === "spot") {
    sweep(300, 900, 0.18, "sawtooth", 0.07);
    sweep(900, 300, 0.18, "sawtooth", 0.07, 0.18);
  } else if (n === "boss") {
    noise(0.25, 0.22, 900);
    sweep(220, 55, 0.3, "square", 0.1);
  } else if (n === "freeze") {
    sweep(2400, 400, 0.45, "sine", 0.08);
    noise(0.35, 0.05, 6000);
  } else if (n === "record") [784, 988, 1175, 1568].forEach((f, k) => tone(f, 0.22, "triangle", 0.08, 0.7 + k * 0.11));
  else if (n === "ok") tone(440 + i * 90, 0.1);
  else if (n === "bad") tone(110, 0.25, "sawtooth", 0.08);
  else if (n === "hack") { tone(240, 0.12, "square", 0.08); tone(520, 0.18, "triangle", 0.06, 0.08); }
  else if (n === "done") [523, 659, 784, 1047].forEach((f, k) => tone(f, 0.18, "square", 0.07, k * 0.09));
  else if (n === "pick") {
    tone(880, 0.08, "triangle", 0.08);
    tone(1320, 0.12, "triangle", 0.08, 0.07);
  } else if (n === "pulse") {
    tone(70, 0.5, "sine", 0.25);
    tone(140, 0.3, "triangle", 0.1, 0.02);
  } else if (n === "alarm") tone(300, 0.12, "sawtooth", 0.06);
  else if (n === "lose") [400, 300, 200, 120].forEach((f, k) => tone(f, 0.25, "sawtooth", 0.08, k * 0.15));
  else if (n === "bossIn") {
    const snd = BOSS_SND[i] || BOSS_SND[0];
    sweep(snd.root * 4, snd.root, 0.9, "sawtooth", 0.12);
    tone(snd.root, 1.1, snd.wave, 0.14, 0.1);
    noise(0.6, 0.18, 700 + (i || 0) * 500, 0.05);
  } else if (n === "bossAtk") {
    const snd = BOSS_SND[i] || BOSS_SND[0];
    sweep(snd.root * 6, snd.root * 2, 0.35, snd.wave, 0.1);
    noise(0.3, 0.14, 1500 + (i || 0) * 900);
  } else if (n === "bossDie") {
    const snd = BOSS_SND[i] || BOSS_SND[0];
    [4, 3, 2, 1].forEach((m, k) => sweep(snd.root * m * 3, snd.root * m, 0.5, "sawtooth", 0.1, k * 0.16));
    noise(1.0, 0.2, 1800);
  }
  else if (n === "win") [523, 659, 784, 1047, 1319].forEach((f, k) => tone(f, 0.2, "square", 0.07, k * 0.1));
  else if (n === "route") {
    const root = [330, 392, 262][i || 0];
    tone(root, 0.12, "triangle", 0.07);
    tone(root * 1.5, 0.18, "sine", 0.045, 0.08);
    tone(root * 2, 0.22, "triangle", 0.035, 0.15);
  }
}
function ensureAudioLayers() {
  if (!actx || audioLayers) return;
  const master = actx.createGain();
  master.gain.value = 0.0001;
  master.connect(actx.destination);
  const make = (f, type, gain, detune = 0) => {
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type;
    o.frequency.value = f;
    o.detune.value = detune;
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(master);
    o.start();
    return { o, g, base: gain };
  };
  audioLayers = {
    master,
    explore: make(62, "sine", 0.055),
    exploreHi: make(124, "triangle", 0.018, 7),
    alert: make(92, "sawtooth", 0.045),
    chase: make(184, "square", 0.035),
    route: make(330, "triangle", 0.018),
    bossBass: make(65, "square", 0.05),
    bossPulse: make(130, "triangle", 0),
  };
  const lfo = actx.createOscillator(), lfoG = actx.createGain();
  lfo.frequency.value = 2;
  lfoG.gain.value = 0.0001;
  lfo.connect(lfoG);
  lfoG.connect(audioLayers.bossPulse.g.gain);
  lfo.start();
  audioLayers.bossLfo = { o: lfo, g: lfoG };
  audioLayers.musicStep = 0;
  audioLayers.musicTimer = window.setInterval(playMusicTick, 520);
  void loadCustomAudio();
}
// Música procedural leve: motivos diferentes para menu, infiltração, tensão e encerramento.
// Tudo passa pelo master existente, portanto mute e o volume geral continuam funcionando.
function playMusicTick() {
  if (!actx || !audioLayers || mute || customAudioBuffers.music) return;
  const now = actx.currentTime;
  const over = state === "over";
  const playing = state === "play" || state === "brief";
  const menu = !playing && !over;
  const step = audioLayers.musicStep++ % 8;
  const menuNotes = [196, 233, 293.7, 349.2, 293.7, 233, 174.6, 233];
  const briefNotes = [261.6, 293.7, 349.2, 392, 349.2, 293.7, 233, 261.6];
  const runNotes = [110, 130.8, 146.8, 164.8, 146.8, 130.8, 98, 130.8];
  const endNotes = won ? [261.6, 329.6, 392, 523.2, 392, 329.6, 261.6, 196] : [196, 174.6, 164.8, 146.8, 130.8, 123.5, 110, 98];
  const notes = over ? endNotes : state === "brief" ? briefNotes : state === "play" ? runNotes : menuNotes;
  const freq = notes[step];
  const osc = actx.createOscillator();
  const gain = actx.createGain();
  osc.type = over ? "triangle" : menu ? "sine" : "triangle";
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(over ? 0.045 : state === "brief" ? 0.032 : playing ? 0.028 : 0.022, now + 0.035);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
  osc.connect(gain).connect(audioLayers.master);
  osc.start(now);
  osc.stop(now + 0.46);
  if (step % 4 === 0) {
    const pad = actx.createOscillator();
    const padGain = actx.createGain();
    pad.type = "sine";
    pad.frequency.setValueAtTime(freq / 2, now);
    padGain.gain.setValueAtTime(0.0001, now);
    padGain.gain.linearRampToValueAtTime(over ? 0.024 : 0.014, now + 0.12);
    padGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.65);
    pad.connect(padGain).connect(audioLayers.master);
    pad.start(now);
    pad.stop(now + 1.7);
  }
}
function syncAudioLayers() {
  if (!actx || mute) return;
  ensureAudioLayers();
  if (!audioLayers) return;
  const now = actx.currentTime;
  const danger = Math.max(0, Math.min(1, alert_ || 0));
  const activeDrones = typeof drones !== "undefined" ? drones.slice(0, LV[lvl].dr) : [];
  const threat = activeDrones.some((d) => d.state === "chase" || d.state === "detected" || d.state === "virus") || !!boss;
  const route = typeof routeTune === "function" ? routeTune() : { };
  const routeId = typeof routeMode === "string" ? routeMode : "safe";
  const key = `${state}|${Math.round(danger * 4)}|${threat}|${routeId}|${boss ? "b" + bi : "-"}|${customAudioBuffers.music ? "score" : "synth"}`;
  if (key === audioStateShown) return;
  audioStateShown = key;
  const target = (node, value, time = 0.35) => {
    node.g.gain.cancelScheduledValues(now);
    node.g.gain.setTargetAtTime(value, now, time);
  };
  const playing = state === "play" || state === "brief";
  const hasCustomScore = !!customAudioBuffers.music;
  const explore = hasCustomScore ? 0 : playing ? 0.8 * (1 - danger * 0.75) : state === "menu" ? 0.3 : 0;
  const alert = playing ? danger * 0.7 : 0;
  const chase = playing && threat ? Math.max(0.18, danger) : 0;
  const routeTone = hasCustomScore ? 0 : playing ? (routeId === "fast" ? 0.8 : routeId === "tech" ? 0.55 : 0.25) : 0;
  const onBoss = state === "play" && !!boss;
  const snd = BOSS_SND[Math.min(bi, BOSS_SND.length - 1)] || BOSS_SND[0];
  if (onBoss) {
    audioLayers.bossBass.o.type = snd.wave;
    audioLayers.bossBass.o.frequency.setTargetAtTime(snd.root, now, 0.05);
    audioLayers.bossPulse.o.type = snd.pulse;
    audioLayers.bossPulse.o.frequency.setTargetAtTime(snd.root * 2, now, 0.05);
    audioLayers.bossLfo.o.frequency.setTargetAtTime(snd.tempo, now, 0.05);
  }
  const bossLevel = onBoss ? 0.05 : 0;
  target(audioLayers.bossBass, audioLayers.bossBass.base * bossLevel);
  target(audioLayers.bossPulse, bossLevel * 0.5);
  audioLayers.bossLfo.g.gain.setTargetAtTime(bossLevel * 0.5, now, 0.2);
  target(audioLayers.explore, audioLayers.explore.base * explore * (onBoss ? 0.3 : 1));
  target(audioLayers.exploreHi, audioLayers.exploreHi.base * explore);
  target(audioLayers.alert, audioLayers.alert.base * alert);
  target(audioLayers.chase, audioLayers.chase.base * chase);
  target(audioLayers.route, audioLayers.route.base * routeTone);
  audioLayers.route.o.frequency.setTargetAtTime(routeId === "fast" ? 440 : routeId === "tech" ? 260 : 180, now, 0.4);
  audioLayers.master.gain.setTargetAtTime(0.9, now, 0.25);
}
// ÂNCORA: todo <button> faz "tick"; o 1º clique também liga o áudio (navegadores exigem gesto do usuário)
document.addEventListener("click", (e) => {
  if (!e.target.closest("button")) return;
  if (!actx) {
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (err) {}
  }
  if (actx && actx.state === "suspended") actx.resume();
  ensureAudioLayers();
  sfx("tick");
});
function brief() {
  state = "brief";
  sfx("done");
  const data = [
    { title: "ZONA INDUSTRIAL — NIVEL 2/6", text: "O dinheiro virou maquina. Use as laterais e nao corra perto dos drones.", objective: "Hackear tres torres", threat: "Drones em patrulha", recommend: "EMP cria uma janela segura" },
    { title: "CENTRO DE VIGILANCIA — NIVEL 3/6", text: "Cada camera e uma testemunha. Leia o minimapa antes de atravessar.", objective: "Derrubar a rede de vigilancia", threat: "Linha de visao ampliada", recommend: "Use cobertura e rotas longas" },
    { title: "ESCONDERIJO DATA — NIVEL 4/6", text: "Tomaram os servidores do seu proprio esconderijo. Retome a sala.", objective: "Recuperar os servidores", threat: "Corredores e racks", recommend: "Fique atras das mesas" },
    { title: "SUBESTACAO ELETRICA — NIVEL 5/6", text: "Sem energia, sem olhos: a rede pisca e os drones cegam por instantes. Use o escuro.", objective: "Hackear as torres da rede eletrica", threat: "Blecaute periodico e drones rapidos", recommend: "Avance quando a tela escurecer" },
    { title: "NUCLEO MEGACORP — NIVEL 6/6", text: "Ultimo alvo: a sede da MEGACORP e seus tres chefoes.", objective: "Derrubar tres chefoes", threat: "Ataques telegráficos", recommend: "Guarde BREACH para a aproximacao" },
  ][lvl] || {};
  $("bfh").textContent = data.title || "PROXIMA OPERACAO";
  $("bft").textContent = data.text || "A rede abriu. Agora desapareca.";
  $("bfo").textContent = data.objective || "Avancar";
  $("bfa").textContent = data.threat || "Alerta";
  $("bfr").textContent = data.recommend || "Leia o ambiente";
  $("bf").hidden = false;
  setTimeout(() => {
    $("bf").hidden = true;
    lvl++;
    reset(true);
  }, 3200);
}
// fase 4: esconderijo
const BASE = towers.map((t) => [t.x, t.z, t.h, t.n]),
  ROOM = [
    [-14, -12],
    [14, -12],
    [0, -24],
  ],
  NAMES = ["Servidor Alfa", "Servidor Beta", "Servidor Gama"];
const CITYP = drones.map((d) => d.path),
  ROOMP = [
    rect(-14, -12, 8, 8),
    rect(14, -12, 8, 8),
    rect(0, -24, 12, 6),
    rect(0, 0, 22, 12),
    rect(0, 12, 18, 10),
  ];
const roomG = new T.Group();
roomG.visible = false;
S.add(roomG);
const wallM = new T.MeshStandardMaterial({ color: 0x2a2833, roughness: 0.9 });
[
  [-37, 7, 0, 1, 14, 74],
  [37, 7, 0, 1, 14, 74],
].forEach(([x, y, z, w, hh, d]) => {
  const m = new T.Mesh(new T.BoxGeometry(w, hh, d), wallM);
  m.position.set(x, y, z);
  roomG.add(m);
});
const mural = new T.Mesh(
  new T.PlaneGeometry(64, 42.7),
  new T.MeshBasicMaterial({ map: new T.TextureLoader().load(SCENE), fog: false }),
);
mural.position.set(0, 17, -36.4);
roomG.add(mural);
// Camada arquitetural do Data Center: detalhes decorativos, sem registro em solids.
const roomMetal = new T.MeshStandardMaterial({ color: 0x111a1b, metalness: 0.72, roughness: 0.42 });
const roomGlow = new T.MeshBasicMaterial({ color: 0x39ff88, transparent: true, opacity: 0.48, depthWrite: false });
const roomCyan = new T.MeshBasicMaterial({ color: 0x2fe6ff, transparent: true, opacity: 0.38, depthWrite: false });
function addRoomRail(w, h, d, x, y, z, material) {
  const rail = new T.Mesh(new T.BoxGeometry(w, h, d), material);
  rail.position.set(x, y, z);
  rail.renderOrder = material === roomGlow || material === roomCyan ? 2 : 0;
  roomG.add(rail);
  return rail;
}
[-27, -14, 0, 14, 27].forEach((z) => {
  [-1, 1].forEach((side) => addRoomRail(0.22, 11.2, 0.34, side * 36.2, 6.2, z, roomMetal));
});
[-1, 1].forEach((side) => {
  addRoomRail(0.12, 0.08, 62, side * 3.1, 0.065, 0, roomGlow);
  addRoomRail(0.42, 0.2, 60, side * 31, 9.1, 0, roomMetal);
  addRoomRail(0.14, 0.04, 57, side * 31, 8.98, 0, roomCyan);
});
[-23, -11, 11, 23].forEach((z) => addRoomRail(12, 0.025, 0.07, 0, 0.07, z, roomCyan));
// Linguagem de hacker datacenter: corredores legíveis, teto técnico, painéis de controle
// e um núcleo central visual. São elementos decorativos e não entram em `solids`.
const roomPanel = new T.MeshStandardMaterial({ color: 0x0b111b, metalness: 0.82, roughness: 0.3, emissive: 0x10243b, emissiveIntensity: 0.5 });
const roomScreen = new T.MeshBasicMaterial({ color: 0x53f6ff });
const roomPink = new T.MeshBasicMaterial({ color: 0xff3fd0 });
[-27, -14, 0, 14, 27].forEach((z, i) => {
  addRoomRail(64, 0.16, 0.24, 0, 11.5, z, roomPanel);
  addRoomRail(54, 0.035, 0.06, 0, 11.38, z, i % 2 ? roomCyan : roomGlow);
});
[-30, -15, 0, 15, 30].forEach((x) => {
  addRoomRail(0.18, 0.16, 62, x, 11.35, 0, roomPanel);
});
[-31, 31].forEach((x, i) => {
  const panel = new T.Mesh(new T.BoxGeometry(0.12, 2.4, 4.6), roomPanel);
  panel.position.set(x, 5.2, -8 + i * 16);
  roomG.add(panel);
  for (let k = 0; k < 5; k++) {
    const led = new T.Mesh(new T.BoxGeometry(0.025, 0.08, 0.5), k % 2 ? roomPink : roomScreen);
    led.position.set(x + (x > 0 ? -0.08 : 0.08), 4.4 + k * 0.32, -8 + i * 16);
    roomG.add(led);
  }
});
const coreBase = new T.Mesh(new T.CylinderGeometry(2.3, 2.7, 0.32, 8), roomPanel);
coreBase.position.set(0, 0.18, -10);
roomG.add(coreBase);
const coreRing = new T.Mesh(new T.TorusGeometry(2.1, 0.06, 8, 40), roomCyan);
coreRing.rotation.x = -Math.PI / 2;
coreRing.position.set(0, 0.38, -10);
roomG.add(coreRing);
const corePillar = new T.Mesh(new T.BoxGeometry(1.1, 1.5, 1.1), roomPanel);
corePillar.position.set(0, 0.95, -10);
roomG.add(corePillar);
const coreScreen = new T.Mesh(new T.BoxGeometry(0.78, 0.58, 0.035), roomScreen);
coreScreen.position.set(0, 1.05, -10.56);
roomG.add(coreScreen);
// ESCONDERIJO: mesas, racks e caixas (obstáculo + cobertura)
const HIDE = [];
{
  const mTab = new T.MeshStandardMaterial({ color: 0x3a2a20, roughness: 0.8 }),
    mRack = new T.MeshStandardMaterial({ color: 0x10191b, emissive: 0x2fe6ff, emissiveIntensity: 0.18, metalness: 0.58, roughness: 0.46 }),
    mBox = new T.MeshStandardMaterial({ color: 0x6b5435, roughness: 1 }),
    edge = new T.LineBasicMaterial({ color: 0x39ff88 });
  const add = (kind, x, z, w, h, d, rot) => {
    const g = new T.Group();
    if (kind === "mesa") {
      const top = new T.Mesh(new T.BoxGeometry(w, 0.2, d), mTab);
      top.position.y = h;
      g.add(top);
      [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].forEach(([a, b]) => {
        const l = new T.Mesh(new T.BoxGeometry(0.2, h, 0.2), mTab);
        l.position.set(a * (w / 2 - 0.2), h / 2, b * (d / 2 - 0.2));
        g.add(l);
      });
      const pc = new T.Mesh(new T.BoxGeometry(1.2, 0.8, 0.1), new T.MeshBasicMaterial({ color: 0x39ff88 }));
      pc.position.set(0, h + 0.5, 0);
      g.add(pc);
    } else {
      const m = new T.Mesh(new T.BoxGeometry(w, h, d), kind === "rack" ? mRack : mBox);
      m.position.y = h / 2;
      m.add(
        new T.LineSegments(
          new T.EdgesGeometry(m.geometry),
          kind === "rack" ? edge : new T.LineBasicMaterial({ color: 0x2a1f12 }),
        ),
      );
      g.add(m);
      if (kind === "rack")
        for (let k = 0; k < 6; k++) {
          const led = new T.Mesh(
            new T.BoxGeometry(w * 0.7, 0.08, 0.05),
            new T.MeshBasicMaterial({ color: k % 2 ? 0x39ff88 : 0x2fe6ff }),
          );
          led.position.set(0, 0.6 + k * (h / 7), d / 2 + 0.03);
          g.add(led);
        }
    }
    g.position.set(x, 0, z);
    g.rotation.y = rot || 0;
    roomG.add(g);
    const o = { x: 999, z: 999, r: Math.hypot(w, d) / 2, w, d, rot: rot || 0, hx: x, hz: z, kind };
    HIDE.push(o);
    solids.push(o);
  };
  add("mesa", -6, 6, 5, 1.1, 2.4);
  add("mesa", 6, 6, 5, 1.1, 2.4);
  add("mesa", 0, -4, 6, 1.1, 2.4);
  add("rack", -26, -22, 2.4, 5, 2.4);
  add("rack", 26, -22, 2.4, 5, 2.4);
  add("rack", -29, -4, 2.4, 5, 2.4);
  add("rack", 29, -4, 2.4, 5, 2.4);
  add("rack", -7, -24, 2.4, 5, 2.4);
  add("rack", 7, -24, 2.4, 5, 2.4);
  ["-20,12", "20,12", "-12,20", "12,20", "-24,24", "24,24", "-20,-6", "20,-6"].forEach((p) => {
    const [x, z] = p.split(",").map(Number);
    add("caixa", x, z, 2, 1.6, 2, rnd() * 1.5);
  });
}
// colisão círculo (jogador) x retângulo girado
function collideBox(s, pr = 0.5) {
  const c = Math.cos(s.rot),
    n = Math.sin(s.rot);
  const dx = P.position.x - s.x,
    dz = P.position.z - s.z;
  const lx = dx * c - dz * n,
    lz = dx * n + dz * c; // espaço local do retângulo
  const hw = s.w / 2,
    hd = s.d / 2;
  const qx = Math.max(-hw, Math.min(hw, lx)),
    qz = Math.max(-hd, Math.min(hd, lz));
  const ox = lx - qx,
    oz = lz - qz,
    d = Math.hypot(ox, oz);
  let nx, nz;
  if (d >= pr) return;
  if (d > 1e-4) {
    nx = (ox / d) * pr + qx;
    nz = (oz / d) * pr + qz;
  } else {
    const px = hw - Math.abs(lx),
      pz = hd - Math.abs(lz);
    if (px < pz) {
      nx = Math.sign(lx || 1) * (hw + pr);
      nz = lz;
    } else {
      nx = lx;
      nz = Math.sign(lz || 1) * (hd + pr);
    }
  }
  P.position.x = s.x + nx * c + nz * n; // de volta ao mundo
  P.position.z = s.z - nx * n + nz * c;
}
function applyLevel() {
  const r = !!LV[lvl].room,
    bs = !!LV[lvl].boss;
  towers.forEach((t, i) => {
    const b = BASE[i];
    t.x = bs ? 999 : r ? ROOM[i][0] : b[0];
    t.z = bs ? 999 : r ? ROOM[i][1] : b[1];
    t.h = r ? 10 : b[2];
    t.n = r ? NAMES[i] : b[3];
    t.mesh.visible = t.ring.visible = t.wave.visible = !bs;
    t.mesh.scale.y = t.h / b[2];
    t.mesh.position.set(t.x, t.h / 2, t.z);
    t.ring.position.set(t.x, 0.06, t.z);
    t.wave.position.set(t.x, 0.1, t.z);
    t.spr.position.set(t.x, t.h + 5, t.z + 3.5);
    if (t.node) { t.node.root.position.set(t.x + 4.75, 1.48, t.z + 0.2); t.node.root.visible = !bs; }
    solids[i].x = t.x;
    solids[i].z = t.z;
  });
  drones.forEach((d, i) => {
    d.path = r ? ROOMP[i] : CITYP[i];
  });
  crates.forEach((c, i) => {
    c.x = r ? 999 : c.bx; // fora da sala = sem colisão
    c.z = r ? 999 : c.bz;
    c.m.visible = !r;
    solids[towers.length + i].x = c.x;
    solids[towers.length + i].z = c.z;
  });
  HIDE.forEach((o) => {
    o.x = r ? o.hx : 999;
    o.z = r ? o.hz : 999;
  });
  sky.forEach((m) => (m.visible = !r));
  sign.visible = !r;
  roomG.visible = r;
  applyRouteLayout();
  // Objetos ocultos de uma fase não podem bloquear o jogador. Primeiro removemos
  // a geometria de rota do conjunto anterior e depois registramos somente os
  // elementos sólidos que estão visíveis no layout atual.
  routeGeometry.forEach((o) => {
    const oldIndex = solids.indexOf(o);
    if (oldIndex >= 0) solids.splice(oldIndex, 1);
    if (o.solid && o.mesh.visible) solids.push(o);
  });
  const theme = PHASE_THEME[lvl] || PHASE_THEME[0];
  S.background.set(theme.sky);
  S.fog.color.set(theme.fog);
  ground.material.color.set(r ? 0x2b2a33 : theme.ground);
  grid.material.color.set(theme.grid);
  sun.color.set(theme.sun);
  applyPhaseKit();
  applyPhaseReadout();
  bz = 0;
  bi = 0;
  if (boss) {
    S.remove(boss.g, boss.disc);
    boss = null;
  }
  $("bb").hidden = !bs;
  if (bs) spawnBoss(0);
}
// BREACH (chuva de código) e chefões da MEGACORP
let bz = 0,
  castT = 0,
  rainT = 0,
  ringT = -1,
  bi = 0,
  boss = null,
  bossIn = false,
  drops = [],
  empCd = 0,
  virusCd = 0,
  ghostCd = 0,
  ghostT = 0,
  dodgeT = 0,
  dodgeCd = 0,
  dodgeInv = 0,
  dodgeVx = 0,
  dodgeVz = 0,
  bossHazards = [],
  bossTelegraph = null;
const rc = $("rain"),
  rx = rc.getContext("2d");
function rainResize() {
  rc.width = innerWidth;
  rc.height = innerHeight;
  drops = Array.from({ length: Math.ceil(innerWidth / 18) }, () => Math.random() * -40);
}
rainResize();
addEventListener("resize", rainResize);
const ringM = new T.Mesh(
  new T.RingGeometry(0.9, 1, 64).rotateX(-Math.PI / 2),
  new T.MeshBasicMaterial({
    color: 0x2fe6ff,
    transparent: true,
    opacity: 0,
    blending: T.AdditiveBlending,
    depthWrite: false,
  }),
);
ringM.position.y = 0.15;
S.add(ringM);
const BOSS_SND = [
  { root: 65, tempo: 2.0, wave: "square", pulse: "triangle" },
  { root: 55, tempo: 2.7, wave: "sawtooth", pulse: "square" },
  { root: 49, tempo: 3.6, wave: "sawtooth", pulse: "sawtooth" },
];
const BOSS = [
  { n: "DIRETOR-BANQUEIRO", sp: 2.2, r: 5.5, s: 1, c: 0xe0261c, model: "banqueiro", attacks: ["AUDITORIA DE DÍVIDA", "MURALHA DE CONTRATOS", "EXECUÇÃO FISCAL"] },
  { n: "BARÃO DO PETRÓLEO", sp: 2.7, r: 6, s: 1.25, c: 0xff8a00, model: "petroleo", attacks: ["VAZAMENTO TÓXICO", "CHAMINÉ DE FOGO", "MARÉ DE PETRÓLEO"] },
  { n: "CEO MEGACORP", sp: 3.8, r: 7, s: 1.6, c: 0xff3fd0, model: "ceo", attacks: ["PROTOCOLO ZERO", "CAGE DE DADOS", "COLAPSO DE REDE"] },
];
const BOSS_MODEL_URLS = globalThis.BOSS_MODEL_URLS || {};
const BossGLTFLoader = globalThis.GLTFLoader;
let bossClips = null; // clipes idle/walk do banqueiro, compartilhados entre chefões
function clearBossHazards() {
  bossHazards.forEach((h) => S.remove(h.g));
  bossHazards = [];
  if (bossTelegraph) {
    bossTelegraph.remove();
    bossTelegraph = null;
  }
}
function createBossTelegraph(label, kind, color) {
  if (!bossTelegraph) {
    bossTelegraph = document.createElement("div");
    bossTelegraph.className = "boss-telegraph";
    document.body.appendChild(bossTelegraph);
  }
  bossTelegraph.textContent = "ALERTA // " + (boss ? boss.cfg.n : "CHEFÃO") + " // " + label;
  bossTelegraph.dataset.kind = kind;
  bossTelegraph.style.color = "#" + color.toString(16).padStart(6, "0");
}
function createBossHazard(x, z, r, color, delay, life, label) {
  const g = new T.Group();
  const ring = new T.Mesh(
    new T.RingGeometry(Math.max(0.5, r * 0.72), r, 64).rotateX(-Math.PI / 2),
    new T.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, depthWrite: false }),
  );
  const core = new T.Mesh(
    new T.CircleGeometry(Math.max(0.5, r * 0.7), 48).rotateX(-Math.PI / 2),
    new T.MeshBasicMaterial({ color, transparent: true, opacity: 0.06, depthWrite: false, blending: T.AdditiveBlending }),
  );
  const pillar = new T.Mesh(
    new T.CylinderGeometry(0.12, 0.5, 7, 12, 1, true),
    new T.MeshBasicMaterial({ color, transparent: true, opacity: 0.06, depthWrite: false, blending: T.AdditiveBlending }),
  );
  pillar.position.y = 3.5;
  g.add(core, ring, pillar);
  g.position.set(x, 0.09, z);
  S.add(g);
  bossHazards.push({ g, ring, core, pillar, x, z, r, delay, life, hit: false, label });
  createBossTelegraph(label, delay < 0.9 ? "danger" : "warning", color);
}
function startBossAttack(b) {
  sfx("bossAtk", bi);
  const index = (b.attackIndex || 0) % 3;
  b.attackIndex = index + 1;
  const targetX = index === 1 ? P.position.x : b.g.position.x;
  const targetZ = index === 1 ? P.position.z : b.g.position.z;
  const radius = b.cfg.r * (index === 2 ? 0.9 : 0.62);
  const delay = b.cfg.model === "petroleo" ? [1.45, 1.2, 0.95][index] : index === 0 ? 1.15 : index === 1 ? 0.8 : 0.55;
  const label = b.cfg.attacks[index];
  const at = new T.Vector3(targetX, 1, targetZ);
  fxSystem.emit(b.cfg.model === "banqueiro" ? "paper" : b.cfg.model === "petroleo" ? "oil" : "data", at, 0.8);
  if (b.cfg.model === "petroleo") fxSystem.emit("industrial", at.clone().add(new T.Vector3(0, 0.25, 0)), 0.72);
  fxSystem.lightAt(at, "#" + b.cfg.c.toString(16).padStart(6, "0"), 2.6, 0.32, 15);
  const screenFx = b.cfg.model === "ceo" && index === 2 ? "collapse" : b.cfg.model === "petroleo" ? "industrial" : index === 2 && fxSystem.effectiveQuality === "high" ? "chromatic" : "boss";
  fxSystem.flash(screenFx, screenFx === "collapse" ? 560 : 420);
  createBossHazard(targetX, targetZ, radius, b.cfg.c, delay, 1.3, label);
  if (b.cfg.model === "banqueiro" && index === 1) {
    createBossHazard(targetX - 4.2, targetZ, radius * 0.55, b.cfg.c, delay + 0.12, 1.05, "MURALHA LATERAL");
    createBossHazard(targetX + 4.2, targetZ, radius * 0.55, b.cfg.c, delay + 0.12, 1.05, "MURALHA LATERAL");
  } else if (b.cfg.model === "petroleo" && index === 2) {
    createBossHazard(targetX + 3.4, targetZ + 3.4, radius * 0.5, b.cfg.c, delay + 0.18, 1.15, "MARÉ SECUNDÁRIA");
    createBossHazard(targetX - 3.4, targetZ - 3.4, radius * 0.5, b.cfg.c, delay + 0.18, 1.15, "MARÉ SECUNDÁRIA");
  } else if (b.cfg.model === "ceo" && index === 0) {
    createBossHazard(targetX, targetZ, radius * 0.42, b.cfg.c, delay + 0.08, 1.5, "NÚCLEO ZERO");
  }
}
function bossSignature(kind, color) {
  const g = new T.Group();
  const mat = new T.MeshStandardMaterial({ color: 0x15151d, emissive: color, emissiveIntensity: 0.65, metalness: 0.55, roughness: 0.35 });
  const glow = new T.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, blending: T.AdditiveBlending });
  if (kind === "banqueiro") {
    const shoulders = new T.Mesh(new T.BoxGeometry(4.8, 0.55, 1.35), mat);
    shoulders.position.y = 1.65;
    g.add(shoulders);
    [-1, 1].forEach((side) => {
      const seal = new T.Mesh(new T.CylinderGeometry(0.55, 0.55, 0.12, 6), glow);
      seal.rotation.x = Math.PI / 2; seal.position.set(side * 2.35, 1.35, 0.35); g.add(seal);
    });
    const paperMat = new T.MeshBasicMaterial({ color: 0xf3f0e8, transparent: true, opacity: 0.76, side: T.DoubleSide });
    const inkMat = new T.MeshBasicMaterial({ color: 0xe0261c, transparent: true, opacity: 0.92 });
    for (let i = 0; i < 5; i++) {
      const sheet = new T.Group();
      const page = new T.Mesh(new T.PlaneGeometry(0.55, 0.78), paperMat.clone());
      const rule = new T.Mesh(new T.BoxGeometry(0.34, 0.025, 0.012), inkMat);
      rule.position.set(0, -0.05, 0.012);
      sheet.add(page, rule);
      sheet.position.set(Math.sin(i * 1.26) * 2.2, 2.8 + (i % 2) * 0.45, Math.cos(i * 1.26) * 1.2);
      sheet.rotation.set(0.25 + i * 0.1, i * 0.8, 0.22 - i * 0.09);
      sheet.userData.visualPaper = true;
      g.add(sheet);
    }
    [-1, 0, 1].forEach((x) => {
      const dataLine = new T.Mesh(new T.BoxGeometry(1.1, 0.025, 0.018), new T.MeshBasicMaterial({ color: x ? 0xefffff : 0xff3b52, transparent: true, opacity: 0.75 }));
      dataLine.position.set(x * 1.05, 2.25, -0.9);
      g.add(dataLine);
    });
  } else if (kind === "petroleo") {
    [-0.85, 0.85].forEach((side) => {
      const stack = new T.Mesh(new T.CylinderGeometry(0.3, 0.46, 3.2, 10), mat);
      stack.position.set(side * 1.05, 2.35, -0.25); g.add(stack);
      const flame = new T.Mesh(new T.ConeGeometry(0.22, 0.8, 8), glow);
      flame.position.set(side * 1.05, 4.2, -0.25); g.add(flame);
    });
    [-1, 1].forEach((side) => {
      const oil = new T.Mesh(new T.CircleGeometry(1.25, 28).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0x100d12, transparent: true, opacity: 0.5, depthWrite: false }));
      oil.position.set(side * 2.2, -0.13, 0.2);
      oil.scale.set(1.45, 0.72, 1);
      const rim = new T.Mesh(new T.RingGeometry(1.15, 1.25, 28).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0xff8a00, transparent: true, opacity: 0.52, blending: T.AdditiveBlending, depthWrite: false }));
      rim.position.copy(oil.position);
      rim.scale.copy(oil.scale);
      g.add(oil, rim);
    });
  } else {
    const crown = new T.Mesh(new T.ConeGeometry(2.05, 1.0, 5), glow);
    crown.position.y = 3.4; crown.rotation.y = Math.PI / 5; g.add(crown);
    const cage = new T.Mesh(new T.BoxGeometry(4.8, 5.2, 0.12), glow);
    cage.position.z = -1.6; cage.position.y = 2.15; g.add(cage);
    for (let i = 0; i < 7; i++) {
      const cube = new T.Mesh(new T.BoxGeometry(0.36 + (i % 2) * 0.14, 0.36 + (i % 2) * 0.14, 0.36 + (i % 2) * 0.14), new T.MeshBasicMaterial({ color: i % 2 ? 0x2fe6ff : 0xff3fd0, transparent: true, opacity: 0.7, wireframe: true }));
      const a = i * Math.PI * 2 / 7;
      cube.position.set(Math.cos(a) * 3.1, 1.1 + (i % 3) * 0.95, Math.sin(a) * 2.5);
      cube.userData.dataCube = true;
      g.add(cube);
    }
    for (let i = 0; i < 4; i++) {
      const scan = new T.Mesh(new T.BoxGeometry(4.5, 0.018, 0.025), new T.MeshBasicMaterial({ color: 0xff3fd0, transparent: true, opacity: 0.5 }));
      scan.position.set(0, 0.6 + i * 0.82, -1.48);
      g.add(scan);
    }
  }
  return g;
}
function updateBossHazards(dt) {
  for (let i = bossHazards.length - 1; i >= 0; i--) {
    const h = bossHazards[i];
    h.delay -= dt;
    if (h.delay > 0) {
      const pulse = 0.8 + Math.sin(time * 15) * 0.16;
      h.ring.material.opacity = 0.16 + pulse * 0.16;
      h.core.material.opacity = 0.03 + pulse * 0.03;
      h.g.scale.setScalar(0.88 + Math.min(0.16, (1 - h.delay) * 0.12));
    } else {
      h.life -= dt;
      h.ring.material.color.set(0xff244d);
      h.core.material.color.set(0xff244d);
      h.pillar.material.color.set(0xff244d);
      h.ring.material.opacity = 0.68 + Math.sin(time * 28) * 0.2;
      h.core.material.opacity = 0.11;
      h.pillar.material.opacity = 0.16;
      if (!h.hit && dodgeInv <= 0 && Math.hypot(P.position.x - h.x, P.position.z - h.z) < h.r) {
        h.hit = true;
        alert_ = Math.min(0.96, alert_ + 0.28);
        note = h.label + " atingiu a área!";
        flashFeedback("danger");
        triggerPlayerFx(0xff244d, 1.4);
        noteT = 1.4;
        if (!calm) shake = 0.8;
      }
    }
    if (h.life <= 0) {
      S.remove(h.g);
      bossHazards.splice(i, 1);
    }
  }
  if (!bossHazards.length && bossTelegraph) {
    bossTelegraph.remove();
    bossTelegraph = null;
  }
}
function spawnBoss(i) {
  const c = BOSS[i];
  clearBossHazards();
  if (boss) S.remove(boss.g, boss.disc);
  const g = new T.Group();
  g.add(
    new T.Mesh(
      new T.SphereGeometry(1.6, 20, 14),
      new T.MeshStandardMaterial({ color: 0x141418, emissive: c.c, emissiveIntensity: 0.35, roughness: 0.5 }),
    ),
  );
  const eye = new T.Mesh(new T.SphereGeometry(0.55, 16, 12), new T.MeshBasicMaterial({ color: c.c }));
  eye.position.set(0, 0.2, 1.45);
  g.add(eye);
  for (let k = 0; k < 2; k++) {
    const rg = new T.Mesh(
      new T.TorusGeometry(2.3 + k * 0.5, 0.1, 8, 32),
      new T.MeshBasicMaterial({ color: c.c, transparent: true, opacity: 0.8 }),
    );
    rg.rotation.x = Math.PI / 2 + k * 0.5;
    g.add(rg);
  }
  const aura = new T.Group();
  for (let k = 0; k < 3; k++) {
    const ring = new T.Mesh(
      new T.TorusGeometry(2.8 + k * 0.42, 0.035, 6, 24),
      new T.MeshBasicMaterial({ color: c.c, transparent: true, opacity: 0.28 - k * 0.05, blending: T.AdditiveBlending }),
    );
    ring.rotation.set(Math.PI / 2, k * 0.45, k * 0.2);
    aura.add(ring);
  }
  g.add(aura);
  const signature = bossSignature(c.model, c.c);
  g.add(signature);
  g.scale.setScalar(c.s);
  g.position.set(0, 0.22, -26);
  const disc = new T.Mesh(
    new T.CircleGeometry(1, 40).rotateX(-Math.PI / 2),
    new T.MeshBasicMaterial({ color: c.c, transparent: true, opacity: 0.22, depthWrite: false }),
  );
  disc.scale.set(c.r, 1, c.r);
  disc.position.set(0, 0.08, -26);
  S.add(g, disc);
  boss = { g, disc, aura, signature, hp: 100, fz: 0, cfg: c, atkT: 2.1, attackIndex: 0 };
  fxSystem.bossEvent(c.model, g.position, false);
  cameraMoment("boss", g.position.x, g.position.z, 1.8);
  sfx("bossIn", i);
  const modelUrl = BOSS_MODEL_URLS[c.model];
  if (modelUrl && BossGLTFLoader) {
    const loader = new BossGLTFLoader();
    loader.load(modelUrl, (res) => {
      if (!boss || boss.g !== g) return;
      const art = res.scene;
      const box = new T.Box3().setFromObject(art);
      const size = box.getSize(new T.Vector3());
      const k = 5.2 / Math.max(size.y, 0.1);
      art.scale.setScalar(k);
      art.position.set(-(box.min.x + box.max.x) * k * 0.5, -box.min.y * k, -(box.min.z + box.max.z) * k * 0.5);
      art.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = fxSystem.effectiveQuality === "high";
          o.receiveShadow = fxSystem.effectiveQuality === "high";
          // ÂNCORA: os chefões ficavam quase pretos na cena escura. Fazemos a própria textura emitir um pouco de luz
          // (emissiveMap = a cor do material), assim o rosto e as roupas aparecem sem "estourar" o brilho.
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
            if (m && m.map) {
              m.emissiveMap = m.map;
              m.emissive.setScalar(0.55);
              m.needsUpdate = true;
            }
          });
        }
      });
      g.add(art);
      // ÂNCORA: cada chefão tem 2 ações, "idle" (parado) e "walk" (andando), trocadas com crossFade conforme ele se move.
      // O banqueiro traz as duas gravadas; petróleo e CEO têm o mesmo esqueleto e EMPRESTAM só as tracks de ROTAÇÃO
      // (posição/escala deformariam o corpo diferente).
      const achar = (anims, nome) => anims.find((c) => c.name.toLowerCase().includes(nome));
      const montar = (idle, walk, soRotacao) => {
        if (!boss || boss.g !== g || !idle) return;
        const prep = (clip, nome) => (soRotacao ? new T.AnimationClip(nome, clip.duration, clip.tracks.filter((t) => t.name.endsWith(".quaternion"))) : clip);
        const mixer = new T.AnimationMixer(art);
        const aIdle = mixer.clipAction(prep(idle, "idle-emprestado"));
        const aWalk = walk ? mixer.clipAction(prep(walk, "walk-emprestado")) : null;
        aIdle.play();
        if (aWalk) { aWalk.play(); aWalk.setEffectiveWeight(0); }
        g.userData.mixer = mixer;
        g.userData.acoes = { idle: aIdle, walk: aWalk, andando: false };
      };
      if (res.animations && res.animations.length) {
        const idle = achar(res.animations, "idle") || res.animations[0];
        const walk = achar(res.animations, "walk");
        bossClips = bossClips || { idle, walk }; // guarda para os outros chefões
        montar(idle, walk, false);
      } else if (bossClips) montar(bossClips.idle, bossClips.walk, true);
      else
        new BossGLTFLoader().load(BOSS_MODEL_URLS.banqueiro, (r2) => {
          bossClips = bossClips || { idle: achar(r2.animations, "idle") || r2.animations[0], walk: achar(r2.animations, "walk") };
          montar(bossClips.idle, bossClips.walk, true);
        });
      g.children.slice(0, 3).forEach((o) => (o.visible = false));
      g.userData.art = art;
    }, undefined, () => undefined);
  }
  $("bn").textContent = "CHEFÃO " + (i + 1) + "/3 — " + c.n;
  $("bh").style.width = "100%";
}
function hitBoss(d) {
  if (!boss) return;
  boss.hp -= d;
  boss.fz = 3;
  fxSystem.emit(boss.cfg.model === "banqueiro" ? "paper" : boss.cfg.model === "petroleo" ? "oil" : "data", boss.g.position.clone().add(new T.Vector3(0, 1, 0)), 0.72);
  if (boss.hp <= 0) fxSystem.bossEvent(boss.cfg.model, boss.g.position, true);
  burst(boss.g.position.x, boss.g.position.y, boss.g.position.z);
  if (!calm) shake = 0.5;
  if (boss.hp > 0) {
    $("bh").style.width = boss.hp + "%";
    sfx("boss");
    note = "Chefão atingido!";
    noteT = 1.5;
    return;
  }
  sfx("bossDie", bi);
  sfx("win");
  clearBossHazards();
  S.remove(boss.g, boss.disc);
  boss = null;
  bi++;
  if (bi >= BOSS.length) {
    $("bh").style.width = "0%";
    note = "A MEGACORP caiu!";
    noteT = 3;
    endT = 1.6;
  } else {
    spawnBoss(bi);
    note = "Chefão derrotado! O próximo chegou.";
    noteT = 2.5;
  }
}
// ÂNCORA: balanceamento das 3 habilidades num só lugar (cada uma com um papel diferente)
// BREACH = golpe grande e raro · EMP = trava curta e frequente · VÍRUS = sequestro/dano preciso e lento
const SKILLS = {
  breach: { cd: 10, bossCd: 7, R: 16, freeze: 4.5, bossDmg: 34, alertCut: 0.2, towerBoost: 0.4 },
  emp: { cd: 8, R: 12, freeze: 3.5, bossDmg: 20, alertCut: 0.25 },
  virus: { cd: 10, R: 18, bossR: 20, hijack: 6, bossDmg: 20 },
};
function breach() {
  if (state !== "play" || bz > 0 || mini) return;
  runStats.skills++;
  buzz(32);
  bz = LV[lvl].boss ? SKILLS.breach.bossCd : SKILLS.breach.cd;
  rainT = breachCodeRainEnabled() ? 2.2 : 0; // modo explícito pode ativar a chuva mesmo com movimento reduzido
  ringT = 0;
  castT = 0.6;
  ringM.position.x = P.position.x;
  ringM.position.z = P.position.z;
  fxSystem.emit("breach", new T.Vector3(P.position.x, 0.5, P.position.z), 1.15);
  fxSystem.lightAt(new T.Vector3(P.position.x, 1.3, P.position.z), "#2fe6ff", 3.5, 0.35, 16);
  fxSystem.flash("breach", 460);
  sfx("freeze");
  if (!calm) shake = 0.3;
  const R = SKILLS.breach.R,
    near = (x, z) => Math.hypot(P.position.x - x, P.position.z - z) < R;
  // ÂNCORA: conta o que o BREACH atingiu para mostrar ao jogador (antes ele não sabia se valeu a pena)
  let nDr = 0,
    nTo = 0;
  drones.forEach((d, n) => {
    if (n < LV[lvl].dr && near(d.position.x, d.position.z)) {
      d.fz = SKILLS.breach.freeze;
      fxSystem.emit("code", d.position.clone().add(new T.Vector3(0, 1, 0)), 0.34);
      nDr++;
    }
  });
  towers.forEach((t) => {
    if (!t.done && near(t.x, t.z)) {
      t.p = Math.min(0.95, t.p + SKILLS.breach.towerBoost);
      nTo++;
    }
  });
  alert_ = Math.max(0, alert_ - SKILLS.breach.alertCut);
  const partes = [];
  const wrecked = destroyPropNear(P.position.x, P.position.z);
  if (wrecked) partes.push(wrecked + " desativado");
  if (nDr) partes.push(nDr + (nDr === 1 ? " drone congelado" : " drones congelados"));
  if (nTo) partes.push(nTo + (nTo === 1 ? " torre +40%" : " torres +40%"));
  note = "BREACH: " + (partes.length ? partes.join(" · ") : "nada ao alcance (raio 16)");
  noteT = 2;
  if (boss && near(boss.g.position.x, boss.g.position.z)) hitBoss(SKILLS.breach.bossDmg);
  else if (boss) {
    note = "BREACH longe demais! Chegue a menos de 16.";
    noteT = 1.8;
  }
}
function empAttack() {
  if (state !== "play" || empCd > 0 || mini) return;
  runStats.skills++;
  buzz(26);
  empCd = SKILLS.emp.cd * routeTune().cd;
  ringT = 0;
  ringM.material.color.set(0x39ff88);
  ringM.position.x = P.position.x;
  ringM.position.z = P.position.z;
  fxSystem.emit("emp", new T.Vector3(P.position.x, 0.7, P.position.z), 1.15);
  fxSystem.lightAt(new T.Vector3(P.position.x, 1.5, P.position.z), "#39ff88", 3.2, 0.4, 15);
  fxSystem.flash("emp", 330);
  const R = SKILLS.emp.R;
  let frozen = 0;
  drones.forEach((d, n) => {
    if (n < LV[lvl].dr && Math.hypot(P.position.x - d.position.x, P.position.z - d.position.z) < R) {
      d.fz = SKILLS.emp.freeze;
      fxSystem.emit("drone", d.position.clone().add(new T.Vector3(0, 1, 0)), 0.38);
      frozen++;
    }
  });
  if (boss && Math.hypot(P.position.x - boss.g.position.x, P.position.z - boss.g.position.z) < R) hitBoss(SKILLS.emp.bossDmg);
  alert_ = Math.max(0, alert_ - SKILLS.emp.alertCut);
  note = frozen ? "EMP: " + frozen + " drone(s) travado(s)!" : "EMP: firewall inimigo drenado.";
  noteT = 1.8;
  sfx("freeze");
  if (!calm) shake = 0.45;
}
function virusAttack() {
  if (state !== "play" || virusCd > 0 || mini) return;
  runStats.skills++;
  buzz(26);
  virusCd = SKILLS.virus.cd * routeTune().cd;
  flashFeedback("virus");
  fxSystem.emit("virus", new T.Vector3(P.position.x, 1, P.position.z), 1.1);
  fxSystem.lightAt(new T.Vector3(P.position.x, 1.5, P.position.z), "#ff3fd0", 2.7, 0.34, 13);
  fxSystem.flash("virus", 360);
  triggerPlayerFx(0xff3fd0, 1.1);
  ringT = 0;
  ringM.material.color.set(0xff3fd0);
  ringM.position.x = P.position.x;
  ringM.position.z = P.position.z;
  let target = null;
  let distance = Infinity;
  if (boss) {
    const d = Math.hypot(P.position.x - boss.g.position.x, P.position.z - boss.g.position.z);
    if (d < distance) { distance = d; target = boss; }
  }
  if (target && distance < SKILLS.virus.bossR) {
    hitBoss(SKILLS.virus.bossDmg);
    note = "VÍRUS: blindagem do chefão corrompida!";
  } else {
    let best = null;
    drones.forEach((d, n) => {
      if (n >= LV[lvl].dr) return;
      const d2 = Math.hypot(P.position.x - d.position.x, P.position.z - d.position.z);
      if (d2 < distance) { distance = d2; best = d; }
    });
    if (best && distance < SKILLS.virus.R) { best.fz = SKILLS.virus.hijack; best.virus = SKILLS.virus.hijack; }
    note = best && distance < SKILLS.virus.R ? "VÍRUS: drone sequestrado por " + SKILLS.virus.hijack + "s." : "VÍRUS lançado na rede.";
  }
  noteT = 1.8;
  sfx("pulse");
  if (!calm) shake = 0.3;
}
function dodge() {
  if (state !== "play" || dodgeCd > 0 || mini || dodgeT > 0) return;
  const ix = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0) + jx;
  const iz = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0) + jz;
  const l = Math.hypot(ix, iz);
  const dx = l > 0.1 ? ix / l : Math.sin(P.rotation.y);
  const dz = l > 0.1 ? iz / l : Math.cos(P.rotation.y);
  dodgeT = 0.28;
  dodgeInv = 0.36;
  dodgeCd = 1.35 * routeTune().cd;
  dodgeVx = dx * 21;
  dodgeVz = dz * 21;
  fxSystem.dodge(P, dx, dz, skinAtual === "vanta");
  vel.x = dodgeVx * 0.42;
  vel.z = dodgeVz * 0.42;
  flashFeedback("dodge");
  triggerPlayerFx(0x53f6ff, 1.5);
  note = "ESQUIVA: impulso e invulnerabilidade curta.";
  noteT = 0.8;
  buzz(18);
}
function ghostAttack() {
  if (skinAtual !== "vanta") {
    note = "NÓ FANTASMA: selecione a operadora VANTA.";
    noteT = 1.6;
    return;
  }
  if (state !== "play" || ghostCd > 0 || mini) return;
  runStats.skills++;
  ghostCd = 12 * routeTune().cd;
  ghostT = 4.2;
  fxSystem.emit("ghost", new T.Vector3(P.position.x, 1, P.position.z), 0.9);
  fxSystem.lightAt(new T.Vector3(P.position.x, 1.5, P.position.z), "#53f6ff", 2.4, 0.34, 12);
  fxSystem.flash("ghost", 300);
  alert_ = Math.max(0, alert_ - 0.28);
  ringM.material.color.set(0x53f6ff);
  ringM.position.x = P.position.x;
  ringM.position.z = P.position.z;
  ringT = 0;
  flashFeedback("ghost");
  note = "NÓ FANTASMA: VANTA saiu do radar por 4s.";
  noteT = 2.1;
  sfx("pulse");
  if (!calm) shake = 0.18;
}
addEventListener("keydown", (e) => {
  if (e.code === "KeyC") {
    e.preventDefault();
    dodge();
  }
  if (e.code === "KeyR") {
    e.preventDefault();
    ghostAttack();
  }
  if (e.code === "Space" || e.key.toLowerCase() === "b") {
    e.preventDefault();
    breach();
  }
  if (e.code === "KeyE") {
    e.preventDefault();
    empAttack();
  }
  if (e.code === "KeyQ") {
    e.preventDefault();
    virusAttack();
  }
});
$("bz").onpointerdown = (e) => {
  e.preventDefault();
  breach();
};
$("hx").onpointerdown = (e) => {
  e.preventDefault();
  empAttack();
};
$("vx").onpointerdown = (e) => {
  e.preventDefault();
  virusAttack();
};
$("gx").onpointerdown = (e) => {
  e.preventDefault();
  ghostAttack();
};
$("dg").onpointerdown = (e) => {
  e.preventDefault();
  dodge();
};
let bzShown = "",
  bzAntes = 0,
  chuvaFade = 0; // segundos de rastro restantes; 0 = canvas limpo e parado
function fxTick(dt) {
  if (state === "play" || state === "menu") bz = Math.max(0, bz - dt);
  if (state === "play" || state === "menu") {
    empCd = Math.max(0, empCd - dt);
    virusCd = Math.max(0, virusCd - dt);
    ghostCd = Math.max(0, ghostCd - dt);
    ghostT = Math.max(0, ghostT - dt);
    dodgeCd = Math.max(0, dodgeCd - dt);
    dodgeInv = Math.max(0, dodgeInv - dt);
    dodgeT = Math.max(0, dodgeT - dt);
  }
  const hx = $("hx"), vx = $("vx"), gx = $("gx"), dg = $("dg");
  setTxt(hx, empCd > 0 ? "EMP · " + Math.ceil(empCd) + "s" : "EMP · E");
  setTxt(vx, virusCd > 0 ? "VÍRUS · " + Math.ceil(virusCd) + "s" : "VÍRUS · Q");
  setCls(hx, "cooldown", empCd > 0);
  setCls(vx, "cooldown", virusCd > 0);
  setCls(hx, "ready", empCd <= 0 && state === "play");
  setCls(vx, "ready", virusCd <= 0 && state === "play");
  setTxt(gx, skinAtual === "vanta" ? (ghostCd > 0 ? "NÓ · " + Math.ceil(ghostCd) + "s" : "NÓ FANTASMA · R") : "NÓ · VANTA");
  setCls(gx, "cooldown", ghostCd > 0 || skinAtual !== "vanta");
  setCls(gx, "ready", ghostCd <= 0 && skinAtual === "vanta" && state === "play");
  setTxt(dg, dodgeCd > 0 ? "ESQUIVA · " + Math.ceil(dodgeCd) + "s" : "ESQUIVA · C");
  setCls(dg, "cooldown", dodgeCd > 0);
  setCls(dg, "ready", dodgeCd <= 0 && state === "play");
  // ÂNCORA: botão mostra os segundos restantes; ao zerar, avisa que está pronto (som + brilho)
  const txt = bz > 0 ? "BREACH · " + Math.ceil(bz) + "s" : "BREACH · Espaço";
  if (txt !== bzShown) {
    bzShown = txt;
    $("bz").textContent = txt;
  }
  if (bzAntes > 0 && bz <= 0 && state === "play") {
    sfx("ready");
    $("bz").classList.remove("pronto");
    void $("bz").offsetWidth; // reinicia a animação CSS se ela já estiver tocando
    $("bz").classList.add("pronto");
  }
  bzAntes = bz;
  if (castT > 0) castT -= dt;
  const cd = LV[lvl].boss ? 6 : 10;
  setSty($("bz"), "background", bz > 0 ? `linear-gradient(90deg,#7a2b8e ${Math.round((1 - bz / cd) * 100)}%,#141414 0)` : "#ff3fd0");
  setSty($("bz"), "color", bz > 0 ? "#bbb" : "#141414");
  // ÂNCORA: o canvas da chuva só trabalha enquanto há chuva ou rastro; depois limpa uma vez e fica parado
  if (rainT > 0) chuvaFade = 1.5;
  if (chuvaFade > 0) {
    chuvaFade -= dt;
    if (chuvaFade <= 0) rx.clearRect(0, 0, rc.width, rc.height);
    else {
      rx.globalCompositeOperation = "destination-out";
      rx.fillStyle = "rgba(0,0,0,.18)";
      rx.fillRect(0, 0, rc.width, rc.height);
      rx.globalCompositeOperation = "source-over";
      if (rainT > 0) {
        rainT -= dt;
        rx.font = "16px monospace";
        drops.forEach((y, i) => {
          rx.fillStyle = Math.random() < 0.2 ? "#ff9be8" : "#39ff88";
          rx.fillText(Math.random() < 0.5 ? "0" : Math.random() < 0.5 ? "1" : "A", i * 18, y * 18);
          drops[i] = y * 18 > rc.height && Math.random() > 0.93 ? 0 : y + 1;
        });
      }
    }
  }
  if (ringT >= 0) {
    ringT += dt;
    const s = 1 + ringT * 20;
    ringM.scale.set(s, 1, s);
    ringM.material.opacity = Math.max(0, 1 - ringT / 0.9);
    if (ringT > 0.9) ringT = -1;
  } else ringM.material.opacity = 0;
}
let slowT = 0,
  collisionFxCd = 0;
const clock = new T.Clock();
let time = 0;
let ultimoQuadro = performance.now();
function ajustarResolucao(dtReal) {
  // Janela móvel de 90 quadros: reduz primeiro o preset de FX e depois a resolução.
  if (fxSystem) fxSystem.samplePerformance(dtReal, state === "play");
}
let mapAcc = 1;
function loop() {
  requestAnimationFrame(loop);
  const rawDt = Math.min(clock.getDelta(), 0.05);
  // tempo REAL do quadro para o ranking (o jogo limita rawDt a 0,05 s; aqui só ignora travadas > 1 s, ex.: aba escondida)
  const agora = performance.now(),
    dtReal = Math.min((agora - ultimoQuadro) / 1000, 1);
  ultimoQuadro = agora;
  ajustarResolucao(dtReal);
  if (state === "pause") {
    fxSystem.render();
    return;
  }
  if (state === "play" && !(endT > 0)) {
    runT += dtReal;
    const txt = fmtTempo(runT);
    if (txt !== tmShown) {
      tmShown = txt;
      $("tmv").textContent = txt;
    }
  }
  const dt = slowT > 0 ? rawDt * 0.25 : rawDt; // câmera lenta de 0,2 s após um hack
  slowT = Math.max(0, slowT - rawDt);
  time += dt;
  updatePlayerFx(dt);
  puddles.forEach(({ mat, phase }) => { mat.emissiveIntensity = 0.1 + Math.abs(Math.sin(time * 1.8 + phase)) * 0.12; });
  syncAudioLayers();
  drones.forEach((d) => {
    d.rg.rotation.z += dt * 6;
    d.position.y = 5 + Math.sin(time * 2 + d.sp) * 0.3;
    d.disc.material.opacity = 0.2 + Math.sin(time * 5) * 0.06;
  });
  // próximo objetivo: torre não hackeada mais próxima
  let nextT = null,
    nd = 1e9;
  towers.forEach((t) => {
    if (t.done) return;
    const d = Math.hypot(P.position.x - t.x, P.position.z - t.z);
    if (d < nd) {
      nd = d;
      nextT = t;
    }
  });
  towers.forEach((t) => {
    if (t.done && t.wt >= 0) {
      t.wt += dt;
      const s = 1 + t.wt * 14;
      t.wave.scale.set(s, 1, s);
      t.wave.material.opacity = Math.max(0, 0.8 - t.wt * 0.6);
      if (t.wt > 1.4) t.wt = -1;
    }
    if (t.glitch > 0) {
      t.glitch -= dt;
      t.mesh.position.x = calm ? t.x : t.x + (Math.random() - 0.5) * 0.5 * Math.min(1, t.glitch);
    } else t.mesh.position.x = t.x;
    t.spr.position.y = t.h + 5 + Math.sin(time * 2) * 0.5;
    // anel por estado: concluída (verde), hackeando (pulso rápido),
    // próximo objetivo (brilho forte), pendente (pulso lento)
    const dP = Math.hypot(P.position.x - t.x, P.position.z - t.z);
    t.state = t.done ? "done" : dP < 5.1 ? "hack" : t === nextT ? "target" : "pending";
    if (t.done) {
      t.ring.material.color.set(0x39ff88);
      t.ring.material.opacity = 1;
      t.ring.scale.setScalar(1);
    } else if (dP < 5.1) {
      t.ring.material.color.set(0x53f6ff);
      t.ring.material.opacity = calm ? 0.9 : 0.62 + Math.abs(Math.sin(time * 10)) * 0.38;
      t.ring.scale.setScalar(calm ? 1 : 1 + Math.sin(time * 10) * 0.06);
    } else if (t === nextT) {
      t.ring.material.color.set(0xffe14a);
      t.ring.material.opacity = 0.75 + Math.sin(time * 4) * 0.25;
      t.ring.scale.setScalar(1.08 + Math.sin(time * 4) * 0.05);
    } else {
      t.ring.material.color.set(0xe0261c);
      t.ring.material.opacity = 0.55 + Math.sin(time * 2) * 0.15;
      t.ring.scale.setScalar(1);
    }
    if (t.node) {
      const activeNode = !t.done && dP < 5.1;
      const failedNode = hackFailureTarget === t && performance.now() < hackFailureUntil;
      const nodeColor = t.done ? 0x39ff88 : failedNode ? 0xff3fd0 : 0x53f6ff;
      t.node.core.material.color.set(nodeColor);
      t.node.core.material.emissive.set(nodeColor);
      t.node.core.material.emissiveIntensity = activeNode ? 2.2 + Math.sin(time * 16) * 0.55 : t.done ? 1.1 : 0.85;
      t.node.halo.material.color.set(nodeColor);
      t.node.upright.material.color.set(nodeColor);
      t.node.beam.material.color.set(nodeColor);
      t.node.beam.material.opacity = activeNode ? 0.27 : 0.12;
      t.node.halo.rotation.z += dt * (activeNode ? 1.8 : 0.55);
      t.node.upright.rotation.y += dt * (activeNode ? -1.6 : -0.45);
      const pulse = activeNode && !calm ? 1 + Math.sin(time * 12) * 0.09 : 1;
      t.node.root.scale.setScalar(pulse);
    }
    if (t.pulse > 0) {
      t.pulse = Math.max(0, t.pulse - dt * 2.5);
      const k = 1 + Math.sin(t.pulse * Math.PI) * 0.25;
      t.mesh.scale.x = t.mesh.scale.z = calm ? 1 : k; // em modo reduzido fica só o brilho, sem crescer
      t.mesh.material.emissiveIntensity = 0.9 + t.pulse * 2;
    }
  });
  // O pool cosmético é atualizado uma vez por quadro no fim do loop.

  if (state === "play") tutTick(dt);
  if (state === "play") {
    emp = Math.max(0, emp - dt);
    boost = Math.max(0, boost - dt);
    noteT -= dt;
    collisionFxCd = Math.max(0, collisionFxCd - dt);
    let ix = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0) + jx,
      iz = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0) + jz;
    if (mini) {
      ix = iz = 0;
    }
    const l = Math.hypot(ix, iz);
    if (l > 1) {
      ix /= l;
      iz /= l;
    }
    const running = keys.shift && l > 0.1 && !mini;
    const SP = (boost > 0 ? 13 : 9) * routeTune().speed * (running ? 1.55 : 1);
    if (running && grace <= 0) {
      // Corrida: rota rapida, mas deixa uma assinatura de ruido no alerta.
      const near = drones.some(
        (d, n) => n < LV[lvl].dr && Math.hypot(P.position.x - d.position.x, P.position.z - d.position.z) < 10,
      );
      if (near) {
        alert_ = Math.min(1, alert_ + dt * 0.35 * routeTune().noise);
        if (noteT <= 0) {
          note = "Correndo faz barulho — drones ouviram!";
          noteT = 0.4;
        }
      }
    }
    if (dodgeT > 0) {
      // Impulso físico curto: mantém o controle durante a esquiva e ainda passa pelo solver de colisão.
      vel.x += (dodgeVx - vel.x) * Math.min(1, dt * 18);
      vel.z += (dodgeVz - vel.z) * Math.min(1, dt * 18);
    } else {
      vel.x += (ix * SP - vel.x) * Math.min(1, dt * 10);
      vel.z += (iz * SP - vel.z) * Math.min(1, dt * 10);
    }
    const moveX = Math.max(-34, Math.min(34, P.position.x + vel.x * dt));
    const moveZ = Math.max(-34, Math.min(34, P.position.z + vel.z * dt));
    P.position.x = moveX;
    P.position.z = moveZ;
    for (let passada = 0; passada < 2; passada++) {
      solids.forEach((s) => {
        if (s.w) return collideBox(s);
        const dx = P.position.x - s.x,
          dz = P.position.z - s.z,
          d = Math.hypot(dx, dz),
          m = s.r + 0.5;
        if (d < m && d > 0) {
          P.position.x = s.x + (dx / d) * m;
          P.position.z = s.z + (dz / d) * m;
        }
      });
    }
    if (collisionFxCd <= 0 && Math.hypot(P.position.x - moveX, P.position.z - moveZ) > 0.035) {
      fxSystem.emit("metal", new T.Vector3(P.position.x, 0.48, P.position.z), 0.42);
      fxSystem.lightAt(new T.Vector3(P.position.x, 0.9, P.position.z), "#e5faff", 1.2, 0.14, 6);
      collisionFxCd = 0.22;
    }
    const sp = Math.hypot(vel.x, vel.z);
    // rotação suave: o personagem só vira quando está em movimento
    if (sp > 0.5) {
      const ta = Math.atan2(vel.x, vel.z);
      let da = ta - P.rotation.y;
      da = Math.atan2(Math.sin(da), Math.cos(da)); // caminho mais curto
      P.rotation.y += da * Math.min(1, dt * 12);
    } else if (hacking) {
      // ÂNCORA: ao hackear parado, vira de perfil para a câmera ver a tela do notebook no chão
      let da = HACK_ANG - P.rotation.y;
      da = Math.atan2(Math.sin(da), Math.cos(da));
      P.rotation.y += da * Math.min(1, dt * 8);
    }
    animChar(dt, sp);
    if (!model) P.position.y = Math.abs(Math.sin(time * 14)) * 0.15 * Math.min(1, sp / 9);
    sh.position.set(P.position.x, 0.04, P.position.z);

    // drones & alert
    let inside = false;
    const covered =
      !!LV[lvl].room &&
      Math.hypot(vel.x, vel.z) < 3 &&
      HIDE.some((o) => Math.hypot(P.position.x - o.x, P.position.z - o.z) < o.r + 1.4);
    if (covered && !mini && noteT <= 0) {
      note = "Coberto — fique parado atrás do móvel.";
      noteT = 0.3;
    }
    grace = Math.max(0, grace - dt);
    const blackoutWas = blackoutOn;
    blackoutClock += dt;
    blackoutOn = !!LV[lvl].blackout && blackoutClock % 12 > 9.5;
    if (blackoutOn !== blackoutWas) {
      document.body.classList.toggle("blackout", blackoutOn);
      if (blackoutOn) { note = "BLECAUTE — drones cegos"; noteT = 1.8; buzz(40); }
    }
    const visR = LV[lvl].vis * (blackoutOn ? 0.6 : 1);
    drones.forEach((d, n) => {
      const on = n < LV[lvl].dr;
      d.visible = on;
      d.disc.visible = on;
      if (!on) return;
      const px = P.position.x - d.position.x,
        pz = P.position.z - d.position.z,
        pd = Math.hypot(px, pz);
      d.fz = Math.max(0, (d.fz || 0) - dt);
      d.virus = Math.max(0, (d.virus || 0) - dt);
      const frz = emp > 0 || d.fz > 0;
      const virus = d.virus > 0;
      d.chase = ghostT > 0 ? 0 : alert_ > 0.35 && pd < 12 ? 1 : alert_ < 0.1 ? 0 : d.chase;
      let gx,
        gz,
        s2 = d.sp * LV[lvl].sp;
      if (d.chase) {
        gx = P.position.x;
        gz = P.position.z;
        s2 *= 0.75;
      } else {
        const w = d.path[d.i];
        gx = w[0];
        gz = w[1];
      }
      const dx = gx - d.position.x,
        dz = gz - d.position.z,
        dd = Math.hypot(dx, dz);
      if (!frz) {
        if (!d.chase && dd < 0.6) d.i = (d.i + 1) % 4;
        else if (dd > 0.3) {
          d.position.x += (dx / dd) * s2 * dt;
          d.position.z += (dz / dd) * s2 * dt;
        }
      }
      d.disc.position.set(d.position.x, 0.08, d.position.z);
      const k = visR / VIS_BASE; // disco e cone acompanham o raio efetivo, inclusive durante o blecaute
      d.disc.scale.set(k, 1, k);
      const sees = !frz && pd < visR && !covered && ghostT <= 0 && dodgeInv <= 0;
      if (sees) inside = true;
      // vermelho patrulha · amarelo te viu · laranja perseguindo · ciano congelado
      d.state = virus ? "virus" : frz ? "frozen" : sees ? "detected" : d.chase ? "chase" : "patrol";
      d.virusFx.visible = virus;
      if (virus) {
        d.virusFx.rotation.y += dt * 4.5;
        d.virusFx.rotation.z -= dt * 2.2;
        d.virusFx.scale.setScalar(1 + Math.sin(time * 10) * 0.12);
        d.virusFx.children.forEach((tendril, k) => {
          tendril.material.opacity = 0.35 + Math.abs(Math.sin(time * (8 + k * 2))) * 0.55;
        });
      }
      const col = virus ? 0xff3fd0 : frz ? 0x2fe6ff : sees ? 0xffe14a : d.chase ? 0xff8a00 : 0xe0261c;
      d.disc.material.color.set(col);
      d.edge.material.color.set(col);
      d.beam.material.color.set(col);
      d.beam.material.opacity = sees ? 0.22 + (calm ? 0 : Math.sin(time * 20) * 0.06) : 0.1; // piscar do feixe: fixo em modo reduzido
      d.children[0].material.emissive.set(col);
      d.eye.material.color.set(col);
      d.eye.material.emissive.set(col);
      d.rg.children.forEach((rotor) => rotor.material.color.set(virus ? 0xff3fd0 : frz ? 0x2fe6ff : 0x39e6ff));
    });
    const activeDrones = drones.slice(0, LV[lvl].dr);
    const priority = ["detected", "chase", "virus", "frozen", "patrol"];
    const drState = priority.find((kind) => activeDrones.some((d) => d.state === kind)) || "patrol";
    const drLabels = { detected: "DETECCAO", chase: "PERSEGUICAO", virus: "VIRUS", frozen: "CONGELADOS", patrol: "PATRULHA" };
    $("drstate").textContent = drLabels[drState];
    $("sideRead").title = sideMission.done ? "Recompensa: " + sideMission.reward : "Item especial no minimapa: " + sideMission.type.toUpperCase();
    $("drread").style.color = drState === "detected" ? "#ffe14a" : drState === "chase" ? "#ff8a00" : drState === "virus" ? "#ff3fd0" : drState === "frozen" ? "#2fe6ff" : "#ff8a00";
    bossIn = false;
    if (boss) {
      const b = boss,
        dx = P.position.x - b.g.position.x,
        dz = P.position.z - b.g.position.z,
        dd = Math.hypot(dx, dz);
      b.fz = Math.max(0, b.fz - dt);
      b.atkT = Math.max(0, b.atkT - dt);
      if (b.fz <= 0 && dd > 1.5) {
        b.g.position.x += (dx / dd) * b.cfg.sp * dt;
        b.g.position.z += (dz / dd) * b.cfg.sp * dt;
      }
      if (b.fz <= 0 && b.atkT <= 0) {
        startBossAttack(b);
        b.atkT = Math.max(2.8, 4.8 - bi * 0.45);
      }
      const ac = b.g.userData.acoes;
      if (ac && ac.walk) {
        const andando = b.fz <= 0 && dd > 1.5; // mesma condição do movimento acima
        if (andando !== ac.andando) {
          ac.andando = andando;
          const [de, para] = andando ? [ac.idle, ac.walk] : [ac.walk, ac.idle];
          para.reset().setEffectiveWeight(1).play();
          de.crossFadeTo(para, 0.35, false);
        }
      }
      if (b.g.userData.mixer) b.g.userData.mixer.update(dt);
      b.g.position.y = 0.22 + Math.sin(time * 2.4) * 0.08;
      b.g.rotation.y += dt * (b.fz > 0 ? 0.15 : 0.35);
      b.aura.rotation.y -= dt * (b.fz > 0 ? 0.25 : 0.7);
      b.aura.rotation.z += dt * 0.18;
      b.aura.children.forEach((ring, k) => {
        ring.material.opacity = (b.fz > 0 ? 0.08 : 0.18) + Math.abs(Math.sin(time * (3 + k))) * 0.12;
      });
      b.signature.children.forEach((part, k) => {
        if (part.userData.visualPaper) {
          part.position.y = 2.8 + (k % 2) * 0.45 + Math.sin(time * 2.6 + k) * 0.12;
          part.rotation.z += dt * (k % 2 ? -0.32 : 0.32);
        }
        if (part.userData.dataCube) {
          part.rotation.x += dt * 0.35;
          part.rotation.y += dt * 0.6;
        }
      });
      b.disc.position.set(b.g.position.x, 0.08, b.g.position.z);
      b.disc.material.color.set(b.fz > 0 ? 0x2fe6ff : b.cfg.c);
      if (b.fz <= 0 && dd < b.cfg.r) {
        inside = true;
        bossIn = true;
      }
    }
    updateBossHazards(dt);
    const tune = routeTune();
    // A proximidade do Barão continua perigosa, mas não deve preencher o alerta quase instantaneamente.
    const bossAlertScale = bossIn ? boss?.cfg.model === "petroleo" ? 0.65 : 1.5 : 1;
    const routeAlert = inside && !grace ? 1.5 * bossAlertScale * tune.alertGain : -0.6 * tune.alertRecovery;
    alert_ = Math.max(0, Math.min(1, alert_ + routeAlert * dt));
    $("al").style.width = alert_ * 100 + "%";
    if (alert_ > 0.5 && alertAnt <= 0.5) {
      runStats.alerts++;
      buzz(34);
      flashFeedback("danger");
      triggerPlayerFx(0xff3b3b, 1.3);
      sfx("spot");
    } // cruzou o limite: sirene de aviso
    alertAnt = alert_;
    if (alert_ > 0.5 && Math.floor(time * 4) !== aLast) {
      aLast = Math.floor(time * 4);
      sfx("alarm");
    }
    if (alert_ >= 1) {
      if (!calm) shake = 1;
      end(false);
    }

    // hacking
    let near = null;
    towers.forEach((t) => {
      if (!t.done && Math.hypot(P.position.x - t.x, P.position.z - t.z) < 5.1) near = t;
    });
    towers.forEach((t) => {
      if (t === near) {
        t.p = Math.min(1, t.p + dt / 2.6);
        t.glitch = Math.max(t.glitch, 0.15);
      } else if (!t.done) t.p = Math.max(0, t.p - dt * 0.5);
    });
    $("hk").style.width = (near ? near.p * 100 : 0) + "%";
    hacking = !!near;
    if (near && lastHackTarget !== near) {
      playHackFeedback("connect");
      lastHackTarget = near;
      hackHoldTarget = null;
    } else if (!near) lastHackTarget = null;
    const errorActive = !!near && hackFailureTarget === near && performance.now() < hackFailureUntil;
    const heldCommit = !near && hackHoldTarget && performance.now() < hackHoldUntil ? hackHoldTarget : null;
    const displayTarget = near || heldCommit;
    updateHackPanel(displayTarget, errorActive, !!heldCommit);
    if (mini) {
      mini.left -= dt;
      $("mt").style.width = Math.max(0, (mini.left / LV[lvl].t) * 100) + "%";
      if (mini.left <= 0) {
        const t = mini.t;
        mini = null;
        $("mini").hidden = true;
        document.body.dataset.hackMini = "0";
        $("mini").style.removeProperty("top");
        hackFailureTarget = t;
        hackFailureUntil = performance.now() + 1150;
        playHackFeedback("error");
        t.p = 0.4;
        runStats.failedHacks++;
        alert_ = Math.min(0.98, alert_ + 0.3);
        note = "Falhou! Tente de novo.";
        noteT = 2;
      }
    }
    for (let i = pick.length - 1; i >= 0; i--) {
      const p = pick[i];
      p.s.position.y = 1.6 + Math.sin(time * 3 + i) * 0.3;
      if (Math.hypot(P.position.x - p.x, P.position.z - p.z) < 1.8) {
        S.remove(p.s);
        pick.splice(i, 1);
        getPick(p.t);
      }
    }
    glow.intensity = near ? 1.4 + (calm ? 0 : Math.sin(time * 30) * 0.4) : 0;
    // ÂNCORA: "pop" do notebook — a escala sobe rápido até 1 ao hackear e some ao parar
    lapEsc += ((hacking ? 1 : 0) - lapEsc) * Math.min(1, dt * 14);
    lapG.visible = hacking || lapEsc > 0.02;
    if (hacking && lapTela) desenharTela(dt);
    lapG.scale.setScalar(LAP_TAM * (calm ? (hacking ? 1 : 0.001) : Math.max(0.001, lapEsc)));
    lapG.position.set(LAP_POS[0], LAP_POS[1], LAP_POS[2]);
    lapG.rotation.y = LAP_ROT;
    lapLight.intensity = hacking ? 1.2 + (calm ? 0 : Math.sin(time * 24) * 0.35) : 0;
    if (near) {
      $("msg").textContent = mini ? "Digite a sequência de setas!" : "Hackeando " + near.n + "...";
      if (near.p >= 1 && !mini) startMini(near);
    } else if (cnt < 3 && !shake)
      $("msg").textContent = inside ? "Drone te viu! Saia da luz." : noteT > 0 ? note : "";
    updObjective();
    if (endT > 0) {
      endT -= dt;
      if (endT <= 0) end(true);
    }
  }
  if (state === "menu") animChar(dt, 0);
  if (state === "over" && model) {
    glow.intensity = 0;
    model.position.y = won ? Math.abs(Math.sin(time * 7)) * 0.5 : 0;
    model.rotation.x = won ? 0 : 0.3;
    model.rotation.y = won ? time * 4 : 0;
    if (bone) {
      bone.armP.rotation.z = won ? 2.6 : 0.08;
      bone.armN.rotation.z = won ? -2.6 : -0.08;
      bone.armP.rotation.x = bone.armN.rotation.x = won ? 0 : 0.3;
      bone.legP.rotation.x = won ? Math.sin(time * 14) * 0.5 : 0;
      bone.legN.rotation.x = won ? -Math.sin(time * 14) * 0.5 : 0;
      bone.foreP.rotation.x = bone.foreN.rotation.x = won ? -0.2 : 0;
      bone.shinP.rotation.x = bone.shinN.rotation.x = 0;
    }
  }
  rig.position.set(P.position.x, 0, P.position.z);
  const tx = P.position.x,
    tz = P.position.z;
  let camX = tx,
    camY = 14,
    camZ = tz + 14,
    lookX = tx,
    lookZ = tz - 2,
    lookY = 1;
  if (camFx) {
    camFx.t -= rawDt;
    const shot = cameraShot(camFx.kind, camFx.x, camFx.z);
    const k = Math.max(0, Math.min(1, camFx.t / camFx.duration));
    const ease = k * k * (3 - 2 * k);
    camX = shot.x * (1 - ease) + tx * ease;
    camY = shot.y * (1 - ease) + 14 * ease;
    camZ = shot.z * (1 - ease) + (tz + 14) * ease;
    lookX = camFx.x * (1 - ease) + tx * ease;
    lookZ = camFx.z * (1 - ease) + (tz - 2) * ease;
    lookY = shot.lookY * (1 - ease) + ease;
    if (camFx.t <= 0) camFx = null;
  }
  C.position.x += (camX - C.position.x) * 0.1;
  C.position.y += (camY - C.position.y) * 0.1;
  C.position.z += (camZ - C.position.z) * 0.1;
  if (shake > 0) {
    shake = Math.max(0, shake - dt * 1.5);
    C.position.x += (Math.random() - 0.5) * shake;
    C.position.y += (Math.random() - 0.5) * shake;
  }
  C.lookAt(lookX, lookY, lookZ);
  C.updateMatrixWorld();
  positionHackPanel();
  fxSystem.update(rawDt, {
    player: P,
    boss: boss ? boss.g : null,
    playing: state === "play",
    dodge: dodgeT > 0,
    ghost: ghostT > 0,
    alert: alert_,
    hacking,
    blackout: blackoutOn,
    phase: (PHASE_THEME[lvl] || PHASE_THEME[0]).key,
  });
  fxTick(dt);
  mapAcc += rawDt;
  if (mapAcc >= 0.05) { mapAcc = 0; drawMap(); }
  fxSystem.render();
}
C.position.set(0, 14, 36);
loop();

// ===== VAZAMENTOS COLETADOS =====
const DOCS = [
  "Planilha de propinas",
  "E-mails do conselho",
  "Contratos secretos",
  "Lista de espionados",
  "Relatório de evasão fiscal",
  "Memorando de demissões",
  "Log de câmeras",
  "Acordo com o governo",
];
function leaks() {
  try {
    return JSON.parse(ler("anarco_leaks") || "[]");
  } catch (e) {
    return [];
  }
}
function addLeak(corp) {
  const doc = DOCS[Math.floor(Math.random() * DOCS.length)];
  const L = leaks();
  L.unshift({
    c: corp,
    d: doc,
    n: lvl + 1,
    id: Math.random().toString(16).slice(2, 8).toUpperCase(),
    t: new Date().toLocaleString("pt-BR"),
  });
  guardar("anarco_leaks", JSON.stringify(L.slice(0, 60)));
  return doc;
}
// cartão "VAZAMENTO CAPTURADO" com a corporação e o documento
function leakCard(corp, doc) {
  $("lcc").textContent = corp;
  $("lcd").textContent = doc + " · publicado na rede";
  $("leakcard").hidden = false;
  clearTimeout(leakCard._t);
  leakCard._t = setTimeout(() => ($("leakcard").hidden = true), 3400);
}
function showLeaks() {
  const L = leaks();
  $("lkl").innerHTML = L.length
    ? L.map((l) => `<li><b>#${l.id}</b> ${l.d}<br><small>${l.c} · nível ${l.n} · ${l.t}</small></li>`).join(
        "",
      )
    : "<li>Nenhum vazamento ainda. Hackeie uma torre!</li>";
  $("lkc").textContent = L.length + " arquivo(s)";
  $("lk").hidden = false;
}
$("lb").onclick = showLeaks;

// ===== RANKING POR TEMPO =====
// ÂNCORA: tempo da corrida inteira (nível 1 até o chefão cair). Só conta com o jogo rodando:
// pausa e menu não contam. Derrota encerra a corrida; só vitórias entram no ranking (top 5).
const RK_MAX = 5;
let runT = 0,
  tmShown = "";
const fmtTempo = (seg) => {
  const total = Math.round(seg * 10) / 10; // arredonda ANTES de dividir (59,95 vira 01:00.0, não 00:60.0)
  const m = Math.floor(total / 60);
  return String(m).padStart(2, "0") + ":" + (total - m * 60).toFixed(1).padStart(4, "0");
};
function ranking() {
  try {
    const a = JSON.parse(ler("anarco_rank") || "[]");
    return Array.isArray(a) ? a.filter((x) => x && Number.isFinite(x.s)).sort((p, q) => p.s - q.s) : [];
  } catch (e) {
    return [];
  }
}
// guarda o tempo e devolve a posição (1 = recorde) ou 0 se ficou fora do top 5
function registrarTempo(seg) {
  const t = Math.round(seg * 10) / 10;
  const L = ranking();
  const pos = L.filter((x) => x.s <= t).length + 1; // empate fica atrás de quem fez primeiro
  if (pos > RK_MAX) return { pos: 0, t, L };
  L.splice(pos - 1, 0, { s: t, d: new Date().toLocaleDateString("pt-BR") });
  guardar("anarco_rank", JSON.stringify(L.slice(0, RK_MAX)));
  return { pos, t, L };
}
function showRank(destaque) {
  const L = ranking();
  $("rkl").innerHTML = L.length
    ? L.map(
        (r, i) =>
          `<li${i + 1 === destaque ? ' class="novo"' : ""}><b>#${i + 1}</b> ${fmtTempo(r.s)}<br><small>${r.d}</small></li>`,
      ).join("")
    : "<li>Nenhuma corrida completa ainda. Derrube as 3 corporações!</li>";
  $("rkc").textContent = L.length ? "Recorde: " + fmtTempo(L[0].s) : "";
  $("rk").hidden = false;
}
$("rb").onclick = () => showRank(0);
$("rkx").onclick = () => ($("rk").hidden = true);
$("rkz").onclick = () => {
  apagar("anarco_rank");
  showRank(0);
};
$("lkx").onclick = () => ($("lk").hidden = true);
$("lkz").onclick = () => {
  apagar("anarco_leaks");
  showLeaks();
};

// ===== TUTORIAL INTERATIVO =====
let tut = -1,
  tutT = 0,
  tutP0 = null,
  tutPk = 0;
const TUT = [
  "1/5 · Ande com WASD ou setas (joystick no celular).",
  "2/5 · Pegue um item brilhante — veja os pontos coloridos no minimapa.",
  "3/5 · Entre no círculo vermelho de uma torre e espere a barra HACK encher.",
  "4/5 · Digite a sequência de setas antes do tempo acabar.",
  "5/5 · Aperte ESPAÇO (ou o botão BREACH) para congelar drones por perto.",
  "Pronto! Fuja das luzes dos drones e derrube as outras torres.",
];
function tutShow() {
  $("tut").hidden = tut < 0;
  if (tut >= 0) $("tutx").textContent = TUT[tut];
  if (tut === 0) {
    tutP0 = P.position.clone();
    tutPk = pick.length;
  }
}
function tutNext() {
  tut++;
  tutT = 0;
  sfx("pick");
  tutShow();
}
function tutTick(dt) {
  if (tut < 0) return;
  if (lvl !== 0) {
    tut = -1;
    tutShow();
    return;
  }
  if (tut < 5) grace = 1; // sem alerta durante o tutorial
  tutT += dt;
  if (tut === 0 && P.position.distanceTo(tutP0) > 4) tutNext();
  else if (tut === 1 && pick.length < tutPk) tutNext();
  else if (tut === 2 && mini) tutNext();
  else if (tut === 3 && cnt >= 1) tutNext();
  else if (tut === 4 && bz > 0) tutNext();
  else if (tut === 5 && tutT > 4) {
    tut = -1;
    guardar("anarco_tut", "1");
    tutShow();
  }
}
$("tuts").onclick = () => {
  tut = -1;
  guardar("anarco_tut", "1");
  tutShow();
};

// ===== PRÓXIMO OBJETIVO =====
const arrow = new T.Mesh(
  new T.ConeGeometry(0.45, 1.2, 4).rotateX(Math.PI / 2),
  new T.MeshBasicMaterial({ color: 0xffe14a, transparent: true, opacity: 0.9, depthTest: false }),
);
arrow.renderOrder = 9;
S.add(arrow);
function updObjective() {
  let tg = null,
    label = "";
  if (boss) {
    tg = boss.g.position;
    label = "Derrube " + boss.cfg.n + " com BREACH";
  } else {
    let best = 1e9;
    towers.forEach((t) => {
      const d = Math.hypot(P.position.x - t.x, P.position.z - t.z);
      if (!t.done && d < best) {
        best = d;
        tg = { x: t.x, z: t.z };
        label = "Hackear " + t.n;
      }
    });
  }
  if (!tg) {
    arrow.visible = false;
    $("obj").dataset.state = "done";
    $("obj").textContent = cnt >= 3 ? "OBJETIVO ▸ fuga em andamento…" : "";
    return;
  }
  const dx = tg.x - P.position.x,
    dz = tg.z - P.position.z,
    d = Math.hypot(dx, dz);
  $("obj").dataset.state = boss ? "danger" : d < 5.5 ? "hack" : "target";
  $("obj").textContent = "OBJETIVO ▸ " + label + " · " + Math.round(d) + " m";
  const a = Math.atan2(dx, dz);
  arrow.position.set(P.position.x + Math.sin(a) * 2.2, 0.4, P.position.z + Math.cos(a) * 2.2);
  arrow.rotation.y = a;
  arrow.visible = d > 5.5;
}

// ===== PAUSA =====
function togglePause() {
  if (state === "play") {
    state = "pause";
    $("hackPanel").hidden = true;
    setHackStream(false);
    $("pz").hidden = false;
    $("pb").textContent = "▶";
  } else if (state === "pause") {
    state = "play";
    $("pz").hidden = true;
    $("pb").textContent = "⏸";
    clock.getDelta();
  }
}
addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (k === "p" || k === "escape") {
    e.preventDefault();
    togglePause();
  }
});
addEventListener("blur", () => {
  if (state === "play") togglePause();
});
$("pb").onclick = togglePause;
$("pzc").onclick = togglePause;
$("pzm").onclick = () => {
  $("pz").hidden = true;
  $("pb").textContent = "⏸";
  $("hackPanel").hidden = true;
  setHackStream(false);
  state = "menu";
  arrow.visible = false;
  $("obj").textContent = "";
  $("mini").hidden = true;
  mini = null;
  $("ov").style.display = "flex";
};


/* ÂNCORA: modo do HUD (lateral / compacto / mínimo / discreto) — o CSS lê body[data-hud]; a escolha fica no localStorage */
(function () {
  const sel = document.getElementById("hudMode");
  const validos = ["slim", "lateral", "compacto", "minimo", "discreto"];
  const salvo = ler("anarco_hud");
  const aplicar = (m) => {
    document.body.dataset.hud = m;
    if (sel) sel.value = m;
    syncHudClearance(); // reposiciona objetivo/rotas conforme a nova altura do painel
  };
  aplicar(validos.includes(salvo) ? salvo : "slim"); // padrão novo: trilho fino lateral
  if (sel) sel.onchange = () => { aplicar(sel.value); guardar("anarco_hud", sel.value); };
})();

/* ÂNCORA: registra o service worker (app instalável e offline). Só em http/https; falha em silêncio. */
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(() => {});

/* ÂNCORA: instalar como app (PWA) — botão "Instalar" no menu */
(function () {
  const btn = document.getElementById("inst");
  if (!btn) return;
  let pedido = null; // o navegador entrega o "evento de instalação"; guardamos para usar no clique
  const instalado = () => matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: fullscreen)").matches || navigator.standalone;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !instalado();
  addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // segura o aviso automático para mostrar só quando clicar
    pedido = e;
    btn.hidden = false;
  });
  addEventListener("appinstalled", () => { pedido = null; btn.hidden = true; });
  if (ios) btn.hidden = false; // iPhone não tem o evento; mostramos a dica manual
  btn.onclick = async () => {
    if (pedido) {
      pedido.prompt();
      await pedido.userChoice;
      pedido = null;
      btn.hidden = true;
    } else if (ios) {
      alert("No iPhone/iPad: toque em Compartilhar (□↑) e depois em \"Adicionar à Tela de Início\".");
    }
  };
})();

// Diagnóstico local: não é carregado em produção pública. Permite validar layouts
// e colisões sem alterar o fluxo normal do jogador ou depender de estado global.
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) || location.hostname.endsWith(".manus.computer")) {
  window.__ANARCO_PLAYTEST__ = {
    startLevel(index) {
      tut = -1;
      lvl = Math.max(0, Math.min(LV.length - 1, index | 0));
      reset(true);
      return this.inspect();
    },
    setLevel(index) {
      lvl = Math.max(0, Math.min(LV.length - 1, index | 0));
      // Apenas troca o layout para auditoria; não reinicia a partida. No núcleo,
      // aplicamos só o layout de rota para não iniciar carregamento de GLB.
      if (lvl < LV.length - 1) applyLevel();
      else {
        applyRouteLayout();
        routeGeometry.forEach((o) => {
          const oldIndex = solids.indexOf(o);
          if (oldIndex >= 0) solids.splice(oldIndex, 1);
          if (o.solid && o.mesh.visible) solids.push(o);
        });
      }
      return this.inspect();
    },
    inspect() {
      const theme = PHASE_THEME[lvl] || PHASE_THEME[0];
      return {
        level: lvl + 1,
        phase: theme.name,
        phaseKey: theme.key,
        state,
        player: { x: Math.round(P.position.x * 10) / 10, z: Math.round(P.position.z * 10) / 10 },
        alert: Math.round(alert_ * 100) / 100,
        blackout: !!blackoutOn,
        room: !!roomG.visible,
        towers: towers.map((t) => ({ name: t.n, x: Math.round(t.x * 10) / 10, z: Math.round(t.z * 10) / 10, done: !!t.done, progress: Math.round((t.p || 0) * 100) / 100 })),
        minigame: mini ? { mode: mini.mode, position: mini.pos, sequence: mini.seq.map((d) => DIRS[d]), remaining: Math.round(mini.left * 10) / 10 } : null,
        boss: boss ? { name: boss.cfg.n, model: boss.cfg.model, hp: Math.max(0, Math.round(boss.hp)), index: bi + 1 } : null,
        won,
        routeObjects: routeGeometry.map((o) => ({ kind: o.kind, shape: o.shape, x: o.x, z: o.z, visible: o.mesh.visible, solid: o.solid })),
        routeSolids: solids.filter((s) => routeGeometry.includes(s)).map((s) => ({ kind: s.kind, shape: s.shape, visible: s.mesh.visible })),
      };
    },
    collisionProbe(kind, distance = 0) {
      const target = routeGeometry.find((o) => o.kind === kind && o.mesh.visible && o.solid);
      if (!target) return { kind, blocked: false, reason: "sem objeto sólido visível" };
      P.position.set(target.x + distance, 0, target.z);
      const before = P.position.clone();
      collideBox(target);
      return { kind, blocked: P.position.distanceTo(before) > 0.001, x: P.position.x, z: P.position.z };
    },
    blackoutProbe() {
      const anterior = { lvl, blackoutClock, blackoutOn };
      lvl = Math.min(4, LV.length - 1);
      blackoutClock = 9.6;
      blackoutOn = !!LV[lvl].blackout && blackoutClock % 12 > 9.5;
      const ativo = blackoutOn;
      const visNormal = LV[lvl].vis;
      const visBlecaute = visNormal * (blackoutOn ? 0.6 : 1);
      lvl = anterior.lvl;
      blackoutClock = anterior.blackoutClock;
      blackoutOn = anterior.blackoutOn;
      return { ativo, visNormal, visBlecaute, fator: visBlecaute / visNormal };
    },
    primeBlackout() {
      lvl = Math.min(4, LV.length - 1);
      blackoutClock = 9.6;
      blackoutOn = false;
      document.body.classList.remove("blackout");
      return { level: lvl + 1, phase: (PHASE_THEME[lvl] || PHASE_THEME[0]).name };
    },
  };
}
