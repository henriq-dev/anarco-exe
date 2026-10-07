/* ==========================================================
   ANARCO.EXE 3D — lógica do jogo
   Ordem do arquivo: cena -> torres -> jogador -> drones -> entrada
   -> estado/níveis -> minigame -> itens -> chefão -> loop principal
   Dados pesados ficam em assets/dados/ (modelo, ícones, props, mural)
   ========================================================== */
const T = THREE,
  $ = (id) => document.getElementById(id);
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
const R = new T.WebGLRenderer({ antialias: true });
R.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.prepend(R.domElement);
const S = new T.Scene();
S.background = new T.Color(0x0a0818);
S.fog = new T.Fog(0x0a0818, 30, 90);
const C = new T.PerspectiveCamera(55, 1, 0.1, 220);
S.add(new T.HemisphereLight(0xffffff, 0x330a0a, 0.6));
const sun = new T.DirectionalLight(0xff6a5a, 0.5);
sun.position.set(-10, 30, 10);
S.add(sun);
function resize() {
  R.setSize(innerWidth, innerHeight);
  C.aspect = innerWidth / innerHeight;
  C.updateProjectionMatrix();
}
addEventListener("resize", resize);
resize();

const ground = new T.Mesh(new T.PlaneGeometry(90, 90), new T.MeshStandardMaterial({ color: 0x111114 }));
ground.rotation.x = -Math.PI / 2;
S.add(ground);
const grid = new T.GridHelper(90, 45, 0x6a2bd0, 0x1a1030);
grid.position.y = 0.02;
S.add(grid);

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
const sky = [];
for (let i = 0; i < 46; i++) {
  const a = rnd() * Math.PI * 2,
    r = 50 + rnd() * 25,
    h = 10 + rnd() * 34;
  const b = bld(5 + rnd() * 6, h, 5 + rnd() * 6, sk[i % 3]);
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

// towers
const TD = [
  { x: -20, z: -16, h: 22, n: "BancoUsura S.A." },
  { x: 22, z: -6, h: 28, n: "PetroNegra Ltda." },
  { x: 3, z: -30, h: 34, n: "Vigilância Total Corp." },
];
const towers = TD.map((d) => {
  d.lit = winTex(false);
  d.hot = winTex(true);
  d.mesh = bld(6, d.h, 6, d.lit);
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
  return d;
});

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
  return { x, z, w: 3, d: 3, rot: 0 };
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
  wob = 0;
try {
  const N = MODELO_INFO.n,
    F = MODELO_INFO.f;
  const bin = Uint8Array.from(atob(MODELO_B64), (c) => c.charCodeAt(0)).buffer;
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
  model = new T.Group();
  const B = {},
    mkb = (n, x, y, z, par) => {
      const b = new T.Bone();
      b.position.set(x - (par ? par.px : 0), y - (par ? par.py : 0), z - (par ? par.pz : 0));
      b.px = x;
      b.py = y;
      b.pz = z;
      if (par) par.add(b);
      B[n] = b;
      return b;
    };
  const hips = mkb("hips", 0, 0.9, 0),
    spine = mkb("spine", 0, 1.3, 0, hips);
  mkb("head", 0, 2.25, 0, spine);
  const aP = mkb("armP", 0.36, 2.05, 0, spine),
    aN = mkb("armN", -0.36, 2.05, 0, spine),
    lP = mkb("legP", 0.17, 0.9, 0, hips),
    lN = mkb("legN", -0.17, 0.9, 0, hips);
  mkb("foreP", 0.43, 1.55, 0, aP);
  mkb("foreN", -0.43, 1.55, 0, aN);
  mkb("shinP", 0.17, 0.48, 0, lP);
  mkb("shinN", -0.17, 0.48, 0, lN);
  const names = ["hips", "spine", "head", "armP", "armN", "legP", "legN", "foreP", "foreN", "shinP", "shinN"];
  const SG = [
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
  ];
  const si = new Uint16Array(N * 4),
    sw = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    const x = pf[i * 3],
      y = pf[i * 3 + 1],
      z = pf[i * 3 + 2];
    const ws = SG.map((s) => {
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
  const sm = new T.SkinnedMesh(
    g,
    new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0.05, skinning: true }),
  );
  sm.add(hips);
  hips.updateMatrixWorld(true);
  sm.bind(new T.Skeleton(names.map((n) => B[n])));
  sm.frustumCulled = false;
  model.add(sm);
  bone = B;
  P.remove(body, head, hood, e1, e2, lap);
  P.add(model);
} catch (err) {
  console.warn("modelo não carregou", err);
  model = null;
}
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
const lapLight = new T.PointLight(0x39ff88, 0, 7);
lapLight.position.set(0, 0.3, 1.5);
P.add(lapLight);
function animChar(dt, sp) {
  if (!model) return;
  const k = Math.min(1, sp / 9);
  wob += dt * (6 + k * 10);
  model.position.y = Math.abs(Math.sin(wob)) * 0.14 * k;
  const tx = 0.16 * k + (hacking ? 0.1 + Math.sin(time * 40) * 0.02 : 0);
  model.rotation.x += (tx - model.rotation.x) * Math.min(1, dt * 10);
  model.rotation.z = Math.sin(wob) * 0.07 * k + Math.sin(time * 1.6) * 0.01 * (1 - k);
  model.rotation.y = Math.sin(wob) * 0.12 * k;
  model.scale.y = 1 + Math.sin(time * 2.2) * 0.012 * (1 - k) + Math.abs(Math.sin(wob)) * 0.02 * k;
  if (bone) {
    const s = Math.sin(wob),
      idle = Math.sin(time * 1.6) * 0.04 * (1 - k),
      hk = hacking;
    bone.legP.rotation.x = s * 0.9 * k;
    bone.legN.rotation.x = -s * 0.9 * k;
    bone.armN.rotation.x = hk ? -0.9 + Math.sin(time * 38) * 0.07 : s * 0.7 * k + idle;
    bone.armP.rotation.x = hk ? -1 : -s * 0.18 * k;
    bone.armP.rotation.z = 0.08;
    bone.armN.rotation.z = -0.08;
    bone.shinP.rotation.x = Math.max(0, s) * 1.1 * k;
    bone.shinN.rotation.x = Math.max(0, -s) * 1.1 * k;
    bone.foreN.rotation.x = hk ? -0.35 + Math.sin(time * 38) * 0.05 : -0.5 * k - 0.3 * Math.max(0, s) * k;
    bone.foreP.rotation.x = hk ? -0.3 : -0.15 * k;
    bone.spine.rotation.y = -s * 0.18 * k;
    bone.head.rotation.y = s * 0.1 * k;
    bone.head.rotation.x = hk ? 0.12 : 0;
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
  g.add(mk(new T.SphereGeometry(0.6, 16, 12), 0x200000, 0xe0261c));
  const rg = new T.Mesh(new T.TorusGeometry(0.95, 0.07, 8, 24), new T.MeshBasicMaterial({ color: 0xffffff }));
  rg.rotation.x = Math.PI / 2;
  g.add(rg);
  g.rg = rg;
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
    new T.MeshBasicMaterial({ color: 0xe0261c, transparent: true, opacity: 0.1, depthWrite: false, side: T.DoubleSide }),
  );
  beam.position.y = 2.5;
  disc.add(beam);
  g.scale.setScalar(1.35);
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

// particles
const N = 400,
  pp = new Float32Array(N * 3).fill(-999),
  pv = Array.from({ length: N }, () => ({ v: new T.Vector3(), l: 0 }));
const pg = new T.BufferGeometry();
pg.setAttribute("position", new T.BufferAttribute(pp, 3));
S.add(
  new T.Points(pg, new T.PointsMaterial({ color: 0xff4a3d, size: 0.55, transparent: true, opacity: 0.95 })),
);
let pi = 0;
function burst(x, y, z) {
  for (let k = 0; k < 110; k++) {
    const j = pi++ % N;
    pp.set([x, y, z], j * 3);
    pv[j].v.set((Math.random() - 0.5) * 14, Math.random() * 12, (Math.random() - 0.5) * 14);
    pv[j].l = 1.4;
  }
}

// input
const keys = {};
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

// state
let state = "menu",
  cnt = 0,
  alert_ = 0,
  shake = 0,
  grace = 0,
  endT = 0;
const vel = new T.Vector3(),
  calm = matchMedia("(prefers-reduced-motion:reduce)").matches;
function reset(keep) {
  if (!keep) lvl = 0;
  mini = null;
  $("mini").hidden = true;
  emp = boost = 0;
  $("msg").textContent = "";
  applyLevel();
  spawnPickups();
  $("lv").textContent = "NÍVEL " + (lvl + 1) + "/5";
  won = false;
  if (model) model.rotation.set(0, 0, 0);
  cnt = 0;
  alert_ = 0;
  grace = 1.5;
  shake = 0;
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
    d.position.set(d.path[0][0], 5, d.path[0][1]);
  });
  $("cnt").textContent = LV[lvl].boss ? "—" : "0/3";
  state = "play";
  $("ov").style.display = "none";
}
function chooseEnd(k) {
  $("ch").hidden = true;
  $("st").hidden = false;
  localStorage.setItem("anarco_final", k);
  sfx(k === "caos" ? "win" : "pulse");
  if (k === "caos") {
    $("ot").innerHTML = "FINAL <span>CAOS</span>";
    $("od").textContent = "Você jogou tudo na rede. Bancos travam, a MegaCorp desaba e as ruas acendem. Ninguém manda mais — nem você. A verdade é de todos.";
  } else {
    $("ot").innerHTML = "FINAL <span>SOMBRIO</span>";
    $("od").textContent = "Você guardou os arquivos e mandou um recado ao CEO. Agora as corporações pagam e obedecem... a você. O capuz sem chefe virou o novo chefe.";
  }
  $("st").textContent = "Jogar de novo";
}
$("cCaos").onclick = () => chooseEnd("caos");
$("cSomb").onclick = () => chooseEnd("sombrio");
function end(win) {
  $("ch").hidden = true;
  $("st").hidden = false;
  state = "over";
  won = win;
  sfx(win ? "win" : "lose");
  mini = null;
  $("mini").hidden = true;
  $("msg").textContent = "";
  $("ot").innerHTML = win ? "A REDE É <span>LIVRE</span>" : "RASTRE<span>ADO</span>";
  $("od").textContent = win
    ? "As três corporações caíram e a verdade está solta. Nenhum chefe, nenhum servidor sagrado."
    : "Os drones te localizaram. Troque de proxy e tente de novo.";
  $("st").textContent = win ? "Jogar de novo" : "Tentar de novo";
  if (win) {
    $("ot").innerHTML = "A ESCOLHA É <span>SUA</span>";
    $("od").textContent = "Os arquivos das três corporações estão no seu laptop. Vazar tudo e libertar a rede — ou usar isso para chantagear quem manda?";
    $("ch").hidden = false;
    $("st").hidden = true;
  }
  $("ov").style.display = "flex";
}
function hackDone(t) {
  sfx("done");
  t.done = true;
  cnt++;
  $("cnt").textContent = cnt + "/3";
  t.mesh.material.emissiveMap = t.hot;
  t.mesh.material.needsUpdate = true;
  t.ring.material.color.set(0x39ff88);
  t.spr.visible = true;
  t.glitch = 1.2;
  t.wt = 0;
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
  const L = ["> conectando a rede anonima...", "> identidade: BRECH", "> hacker de periferia, 19 anos.", "> as corporacoes vigiam, lucram e mentem.", "> missao: invadir os servidores e vazar a verdade.", "> cuidado com os drones. correr faz barulho.", "> boa sorte. a escolha final sera sua."];
  const o = document.createElement("div");
  o.style.cssText = "position:fixed;inset:0;z-index:9999;background:#000;color:#39ff6a;font:18px 'Special Elite',monospace;padding:8vh 8vw;white-space:pre-wrap;cursor:pointer;line-height:1.6";
  document.body.appendChild(o);
  let i = 0, c = 0, fin = false, txt = "";
  const end = () => { if (fin) return; fin = true; clearInterval(t); o.remove(); done(); };
  const t = setInterval(() => {
    if (i >= L.length) { clearInterval(t); o.innerHTML = txt + "\n\n<b>[ clique ou aperte qualquer tecla ]</b>"; return; }
    txt += L[i][c++] || ""; if (c > L[i].length) { txt += "\n"; i++; c = 0; }
    o.textContent = txt + "█";
  }, 15);
  o.onclick = end;
  addEventListener("keydown", function k() { if (i >= L.length || fin) { removeEventListener("keydown", k); end(); } });
}
$("st").onclick = () => {
  tut = localStorage.getItem("anarco_tut") ? -1 : 0;
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
  reset();
  tutShow();
}
// níveis, minigame de sequência e itens
const LV = [
  { dr: 3, sp: 1, seq: 4, t: 7 },
  { dr: 4, sp: 1.15, seq: 5, t: 7 },
  { dr: 5, sp: 1.3, seq: 6, t: 7 },
  { dr: 5, sp: 1.35, seq: 7, t: 6, room: true },
  { dr: 2, sp: 1.1, seq: 5, t: 7, boss: true },
];
let lvl = 0,
  emp = 0,
  boost = 0,
  mini = null,
  note = "",
  noteT = 0;
const DIRS = ["←", "↑", "→", "↓"];
function drawMini() {
  $("seq").innerHTML = mini.seq
    .map((d, i) => `<span class="${i < mini.pos ? "ok" : i === mini.pos ? "cur" : ""}">${DIRS[d]}</span>`)
    .join("");
}
function startMini(t) {
  mini = {
    t,
    seq: Array.from({ length: LV[lvl].seq }, () => Math.floor(Math.random() * 4)),
    pos: 0,
    left: LV[lvl].t,
  };
  drawMini();
  $("mini").hidden = false;
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
      hackDone(t);
      return;
    }
  } else {
    sfx("bad");
    mini.pos = 0;
    alert_ = Math.min(0.98, alert_ + 0.2);
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
    let x, z;
    do {
      x = (Math.random() - 0.5) * 60;
      z = (Math.random() - 0.5) * 60;
    } while (!solids.every((s) => Math.hypot(x - s.x, z - s.z) > s.r + 2) || Math.hypot(x, z - 22) < 6);
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
});
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
    mc.fillStyle = t.done ? "#fff" : "#e0261c";
    mc.fillRect(X(t.x) - 4, Y(t.z) - 4, 8, 8);
  });
  pick.forEach((p) => {
    mc.fillStyle = p.t === "e" ? "#2fe6ff" : p.t === "k" ? "#ff3fd0" : "#39ff88";
    mc.beginPath();
    mc.arc(X(p.x), Y(p.z), 2.5, 0, 7);
    mc.fill();
  });
  drones.forEach((d, n) => {
    if (n >= LV[lvl].dr) return;
    mc.fillStyle = d.chase ? "#ff8a00" : "#ff4d4d";
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
  aLast = 0;
$("snd").onclick = () => {
  mute = !mute;
  $("snd").textContent = mute ? "🔇" : "🔊";
};
function sfx(n, i) {
  if (mute || !actx) return;
  const t = actx.currentTime;
  const tone = (f, d, ty = "square", v = 0.06, at = 0) => {
    const o = actx.createOscillator(),
      g = actx.createGain();
    o.type = ty;
    o.frequency.setValueAtTime(f, t + at);
    g.gain.setValueAtTime(v, t + at);
    g.gain.exponentialRampToValueAtTime(0.0001, t + at + d);
    o.connect(g);
    g.connect(actx.destination);
    o.start(t + at);
    o.stop(t + at + d);
  };
  if (n === "ok") tone(440 + i * 90, 0.1);
  else if (n === "bad") tone(110, 0.25, "sawtooth", 0.08);
  else if (n === "done") [523, 659, 784, 1047].forEach((f, k) => tone(f, 0.18, "square", 0.07, k * 0.09));
  else if (n === "pick") {
    tone(880, 0.08, "triangle", 0.08);
    tone(1320, 0.12, "triangle", 0.08, 0.07);
  } else if (n === "pulse") {
    tone(70, 0.5, "sine", 0.25);
    tone(140, 0.3, "triangle", 0.1, 0.02);
  } else if (n === "alarm") tone(300, 0.12, "sawtooth", 0.06);
  else if (n === "lose") [400, 300, 200, 120].forEach((f, k) => tone(f, 0.25, "sawtooth", 0.08, k * 0.15));
  else if (n === "win") [523, 659, 784, 1047, 1319].forEach((f, k) => tone(f, 0.2, "square", 0.07, k * 0.1));
}
function brief() {
  state = "brief";
  sfx("done");
  $("bfh").textContent = "ESCONDERIJO — NÍVEL " + (lvl + 2) + "/5";
  $("bft").textContent = [
    "Mais um drone na área e sequências maiores. Respire fundo e volte.",
    "Drones mais rápidos e o alerta não perdoa. Última invasão.",
    "Tomaram os servidores do seu próprio esconderijo. Retome a sala.",
    "Último alvo: a sede da MEGACORP e seus três chefões. Use o BREACH quando eles chegarem perto.",
  ][lvl];
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
// ESCONDERIJO: mesas, racks e caixas (obstáculo + cobertura)
const HIDE = [];
{
  const mTab = new T.MeshStandardMaterial({ color: 0x3a2a20, roughness: 0.8 }),
    mRack = new T.MeshStandardMaterial({ color: 0x18181d, emissive: 0x2fe6ff, emissiveIntensity: 0.12 }),
    mBox = new T.MeshStandardMaterial({ color: 0x6b5435, roughness: 1 }),
    edge = new T.LineBasicMaterial({ color: 0xff3fd0 });
  const add = (kind, x, z, w, h, d, rot) => {
    const g = new T.Group();
    if (kind === "mesa") {
      const top = new T.Mesh(new T.BoxGeometry(w, 0.2, d), mTab);
      top.position.y = h;
      g.add(top);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => {
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
      m.add(new T.LineSegments(new T.EdgesGeometry(m.geometry), kind === "rack" ? edge : new T.LineBasicMaterial({ color: 0x2a1f12 })));
      g.add(m);
      if (kind === "rack")
        for (let k = 0; k < 6; k++) {
          const led = new T.Mesh(new T.BoxGeometry(w * 0.7, 0.08, 0.05), new T.MeshBasicMaterial({ color: k % 2 ? 0x39ff88 : 0xff3fd0 }));
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
  const c = Math.cos(s.rot), n = Math.sin(s.rot);
  const dx = P.position.x - s.x, dz = P.position.z - s.z;
  const lx = dx * c - dz * n, lz = dx * n + dz * c; // espaço local do retângulo
  const hw = s.w / 2, hd = s.d / 2;
  const qx = Math.max(-hw, Math.min(hw, lx)), qz = Math.max(-hd, Math.min(hd, lz));
  const ox = lx - qx, oz = lz - qz, d = Math.hypot(ox, oz);
  let nx, nz;
  if (d >= pr) return;
  if (d > 1e-4) { nx = (ox / d) * pr + qx; nz = (oz / d) * pr + qz; }
  else {
    const px = hw - Math.abs(lx), pz = hd - Math.abs(lz);
    if (px < pz) { nx = Math.sign(lx || 1) * (hw + pr); nz = lz; }
    else { nx = lx; nz = Math.sign(lz || 1) * (hd + pr); }
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
    solids[i].x = t.x;
    solids[i].z = t.z;
  });
  drones.forEach((d, i) => {
    d.path = r ? ROOMP[i] : CITYP[i];
  });
  HIDE.forEach((o) => { o.x = r ? o.hx : 999; o.z = r ? o.hz : 999; });
  sky.forEach((m) => (m.visible = !r));
  sign.visible = !r;
  roomG.visible = r;
  ground.material.color.set(r ? 0x2b2a33 : 0x111114);
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
  drops = [];
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
const BOSS = [
  { n: "DIRETOR-BANQUEIRO", sp: 2.2, r: 5.5, s: 1, c: 0xe0261c },
  { n: "BARÃO DO PETRÓLEO", sp: 3.1, r: 6, s: 1.25, c: 0xff8a00 },
  { n: "CEO MEGACORP", sp: 3.8, r: 7, s: 1.6, c: 0xff3fd0 },
];
function spawnBoss(i) {
  const c = BOSS[i];
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
      new T.MeshBasicMaterial({ color: 0xffffff }),
    );
    rg.rotation.x = Math.PI / 2 + k * 0.5;
    g.add(rg);
  }
  g.scale.setScalar(c.s);
  g.position.set(0, 4.5, -26);
  const disc = new T.Mesh(
    new T.CircleGeometry(1, 40).rotateX(-Math.PI / 2),
    new T.MeshBasicMaterial({ color: c.c, transparent: true, opacity: 0.22, depthWrite: false }),
  );
  disc.scale.set(c.r, 1, c.r);
  disc.position.set(0, 0.08, -26);
  S.add(g, disc);
  boss = { g, disc, hp: 100, fz: 0, cfg: c };
  $("bn").textContent = "CHEFÃO " + (i + 1) + "/3 — " + c.n;
  $("bh").style.width = "100%";
}
function hitBoss(d) {
  if (!boss) return;
  boss.hp -= d;
  boss.fz = 3;
  burst(boss.g.position.x, boss.g.position.y, boss.g.position.z);
  if (!calm) shake = 0.5;
  if (boss.hp > 0) {
    $("bh").style.width = boss.hp + "%";
    note = "Chefão atingido!";
    noteT = 1.5;
    return;
  }
  sfx("win");
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
function breach() {
  if (state !== "play" || bz > 0 || mini) return;
  bz = LV[lvl].boss ? 6 : 10;
  rainT = 2.2;
  ringT = 0;
  castT = 0.6;
  ringM.position.x = P.position.x;
  ringM.position.z = P.position.z;
  sfx("done");
  if (!calm) shake = 0.3;
  const R = 16,
    near = (x, z) => Math.hypot(P.position.x - x, P.position.z - z) < R;
  drones.forEach((d, n) => {
    if (n < LV[lvl].dr && near(d.position.x, d.position.z)) d.fz = 4;
  });
  towers.forEach((t) => {
    if (!t.done && near(t.x, t.z)) t.p = Math.min(0.95, t.p + 0.4);
  });
  alert_ = Math.max(0, alert_ - 0.3);
  if (boss && near(boss.g.position.x, boss.g.position.z)) hitBoss(34);
  else if (boss) {
    note = "BREACH longe demais! Chegue a menos de 16.";
    noteT = 1.8;
  }
}
addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.key.toLowerCase() === "b") {
    e.preventDefault();
    breach();
  }
});
$("bz").onpointerdown = (e) => {
  e.preventDefault();
  breach();
};
function fxTick(dt) {
  if (state === "play" || state === "menu") bz = Math.max(0, bz - dt);
  if (castT > 0) castT -= dt;
  const cd = LV[lvl].boss ? 6 : 10;
  $("bz").style.background =
    bz > 0 ? `linear-gradient(90deg,#7a2b8e ${(1 - bz / cd) * 100}%,#141414 0)` : "#ff3fd0";
  $("bz").style.color = bz > 0 ? "#bbb" : "#141414";
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
  if (ringT >= 0) {
    ringT += dt;
    const s = 1 + ringT * 20;
    ringM.scale.set(s, 1, s);
    ringM.material.opacity = Math.max(0, 1 - ringT / 0.9);
    if (ringT > 0.9) ringT = -1;
  } else ringM.material.opacity = 0;
}
let slowT = 0;
const clock = new T.Clock();
let time = 0;
function loop() {
  requestAnimationFrame(loop);
  const rawDt = Math.min(clock.getDelta(), 0.05);
  if (state === "pause") { R.render(S, C); return; }
  const dt = slowT > 0 ? rawDt * 0.25 : rawDt; // câmera lenta de 0,2 s após um hack
  slowT = Math.max(0, slowT - rawDt);
  time += dt;
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
      t.mesh.position.x = t.x + (Math.random() - 0.5) * 0.5 * Math.min(1, t.glitch);
    } else t.mesh.position.x = t.x;
    t.spr.position.y = t.h + 5 + Math.sin(time * 2) * 0.5;
    // anel por estado: concluída (verde), hackeando (pulso rápido),
    // próximo objetivo (brilho forte), pendente (pulso lento)
    const dP = Math.hypot(P.position.x - t.x, P.position.z - t.z);
    if (t.done) {
      t.ring.material.color.set(0x39ff88);
      t.ring.material.opacity = 1;
      t.ring.scale.setScalar(1);
    } else if (dP < 5.1) {
      t.ring.material.color.set(0xe0261c);
      t.ring.material.opacity = 0.6 + Math.abs(Math.sin(time * 10)) * 0.4;
      t.ring.scale.setScalar(1 + Math.sin(time * 10) * 0.06);
    } else if (t === nextT) {
      t.ring.material.color.set(0xffe14a);
      t.ring.material.opacity = 0.75 + Math.sin(time * 4) * 0.25;
      t.ring.scale.setScalar(1.08 + Math.sin(time * 4) * 0.05);
    } else {
      t.ring.material.color.set(0xe0261c);
      t.ring.material.opacity = 0.55 + Math.sin(time * 2) * 0.15;
      t.ring.scale.setScalar(1);
    }
    if (t.pulse > 0) {
      t.pulse = Math.max(0, t.pulse - dt * 2.5);
      const k = 1 + Math.sin(t.pulse * Math.PI) * 0.25;
      t.mesh.scale.x = t.mesh.scale.z = k;
      t.mesh.material.emissiveIntensity = 0.9 + t.pulse * 2;
    }
  });
  for (let j = 0; j < N; j++) {
    const q = pv[j];
    if (q.l > 0) {
      q.l -= dt;
      q.v.y -= 18 * dt;
      pp[j * 3] += q.v.x * dt;
      pp[j * 3 + 1] += q.v.y * dt;
      pp[j * 3 + 2] += q.v.z * dt;
      if (q.l <= 0 || pp[j * 3 + 1] < 0) pp[j * 3 + 1] = -999;
    }
  }
  pg.attributes.position.needsUpdate = true;

  if (state === "play") tutTick(dt);
  if (state === "play") {
    emp = Math.max(0, emp - dt);
    boost = Math.max(0, boost - dt);
    noteT -= dt;
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
    const SP = (boost > 0 ? 13 : 9) * (running ? 1.55 : 1);
    if (running && grace <= 0) { const near = drones.some((d, n) => n < LV[lvl].dr && Math.hypot(P.position.x - d.position.x, P.position.z - d.position.z) < 10); if (near) { alert_ = Math.min(1, alert_ + dt * 0.35); if (noteT <= 0) { note = "Correndo faz barulho — drones ouviram!"; noteT = 0.4; } } }
    vel.x += (ix * SP - vel.x) * Math.min(1, dt * 10);
    vel.z += (iz * SP - vel.z) * Math.min(1, dt * 10);
    P.position.x = Math.max(-34, Math.min(34, P.position.x + vel.x * dt));
    P.position.z = Math.max(-34, Math.min(34, P.position.z + vel.z * dt));
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
    const sp = Math.hypot(vel.x, vel.z);
    // rotação suave: o personagem só vira quando está em movimento
    if (sp > 0.5) {
      const ta = Math.atan2(vel.x, vel.z);
      let da = ta - P.rotation.y;
      da = Math.atan2(Math.sin(da), Math.cos(da)); // caminho mais curto
      P.rotation.y += da * Math.min(1, dt * 12);
    }
    animChar(dt, sp);
    if (!model) P.position.y = Math.abs(Math.sin(time * 14)) * 0.15 * Math.min(1, sp / 9);
    sh.position.set(P.position.x, 0.04, P.position.z);

    // drones & alert
    let inside = false;
    const covered = !!LV[lvl].room && Math.hypot(vel.x, vel.z) < 3 &&
      HIDE.some((o) => Math.hypot(P.position.x - o.x, P.position.z - o.z) < o.r + 1.4);
    if (covered && !mini && noteT <= 0) { note = "Coberto — fique parado atrás do móvel."; noteT = 0.3; }
    grace = Math.max(0, grace - dt);
    drones.forEach((d, n) => {
      const on = n < LV[lvl].dr;
      d.visible = on;
      d.disc.visible = on;
      if (!on) return;
      const px = P.position.x - d.position.x,
        pz = P.position.z - d.position.z,
        pd = Math.hypot(px, pz);
      d.fz = Math.max(0, (d.fz || 0) - dt);
      const frz = emp > 0 || d.fz > 0;
      d.chase = alert_ > 0.35 && pd < 12 ? 1 : alert_ < 0.1 ? 0 : d.chase;
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
      const sees = !frz && pd < 3.4 && !covered;
      if (sees) inside = true;
      // vermelho patrulha · amarelo te viu · laranja perseguindo · ciano congelado
      const col = frz ? 0x2fe6ff : sees ? 0xffe14a : d.chase ? 0xff8a00 : 0xe0261c;
      d.disc.material.color.set(col);
      d.edge.material.color.set(col);
      d.beam.material.color.set(col);
      d.beam.material.opacity = sees ? 0.22 + Math.sin(time * 20) * 0.06 : 0.1;
      d.children[0].material.emissive.set(col);
    });
    bossIn = false;
    if (boss) {
      const b = boss,
        dx = P.position.x - b.g.position.x,
        dz = P.position.z - b.g.position.z,
        dd = Math.hypot(dx, dz);
      b.fz = Math.max(0, b.fz - dt);
      if (b.fz <= 0 && dd > 1.5) {
        b.g.position.x += (dx / dd) * b.cfg.sp * dt;
        b.g.position.z += (dz / dd) * b.cfg.sp * dt;
      }
      b.g.position.y = 4.5 + Math.sin(time * 2) * 0.4;
      b.g.rotation.y += dt;
      b.disc.position.set(b.g.position.x, 0.08, b.g.position.z);
      b.disc.material.color.set(b.fz > 0 ? 0x2fe6ff : b.cfg.c);
      if (b.fz <= 0 && dd < b.cfg.r) {
        inside = true;
        bossIn = true;
      }
    }
    alert_ = Math.max(0, Math.min(1, alert_ + (inside && !grace ? 1.5 * (bossIn ? 1.5 : 1) : -0.6) * dt));
    $("al").style.width = alert_ * 100 + "%";
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
    if (mini) {
      mini.left -= dt;
      $("mt").style.width = Math.max(0, (mini.left / LV[lvl].t) * 100) + "%";
      if (mini.left <= 0) {
        const t = mini.t;
        mini = null;
        $("mini").hidden = true;
        t.p = 0.4;
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
    glow.intensity = near ? 1.4 + Math.sin(time * 30) * 0.4 : 0;
    lapG.visible = hacking;
    lapLight.intensity = hacking ? 1.2 + Math.sin(time * 24) * 0.35 : 0;
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
  C.position.x += (tx - C.position.x) * 0.08;
  C.position.y += (14 - C.position.y) * 0.08;
  C.position.z += (tz + 14 - C.position.z) * 0.08;
  if (shake > 0) {
    shake = Math.max(0, shake - dt * 1.5);
    C.position.x += (Math.random() - 0.5) * shake;
    C.position.y += (Math.random() - 0.5) * shake;
  }
  C.lookAt(tx, 1, tz - 2);
  fxTick(dt);
  drawMap();
  R.render(S, C);
}
C.position.set(0, 14, 36);
loop();

// ===== VAZAMENTOS COLETADOS =====
const DOCS = ["Planilha de propinas", "E-mails do conselho", "Contratos secretos", "Lista de espionados",
  "Relatório de evasão fiscal", "Memorando de demissões", "Log de câmeras", "Acordo com o governo"];
function leaks() {
  try { return JSON.parse(localStorage.getItem("anarco_leaks") || "[]"); } catch (e) { return []; }
}
function addLeak(corp) {
  const doc = DOCS[Math.floor(Math.random() * DOCS.length)];
  const L = leaks();
  L.unshift({ c: corp, d: doc, n: lvl + 1,
    id: Math.random().toString(16).slice(2, 8).toUpperCase(), t: new Date().toLocaleString("pt-BR") });
  localStorage.setItem("anarco_leaks", JSON.stringify(L.slice(0, 60)));
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
    ? L.map((l) => `<li><b>#${l.id}</b> ${l.d}<br><small>${l.c} · nível ${l.n} · ${l.t}</small></li>`).join("")
    : "<li>Nenhum vazamento ainda. Hackeie uma torre!</li>";
  $("lkc").textContent = L.length + " arquivo(s)";
  $("lk").hidden = false;
}
$("lb").onclick = showLeaks;
$("lkx").onclick = () => ($("lk").hidden = true);
$("lkz").onclick = () => { localStorage.removeItem("anarco_leaks"); showLeaks(); };

// ===== TUTORIAL INTERATIVO =====
let tut = -1, tutT = 0, tutP0 = null, tutPk = 0;
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
  if (tut === 0) { tutP0 = P.position.clone(); tutPk = pick.length; }
}
function tutNext() { tut++; tutT = 0; sfx("pick"); tutShow(); }
function tutTick(dt) {
  if (tut < 0) return;
  if (lvl !== 0) { tut = -1; tutShow(); return; }
  if (tut < 5) grace = 1; // sem alerta durante o tutorial
  tutT += dt;
  if (tut === 0 && P.position.distanceTo(tutP0) > 4) tutNext();
  else if (tut === 1 && pick.length < tutPk) tutNext();
  else if (tut === 2 && mini) tutNext();
  else if (tut === 3 && cnt >= 1) tutNext();
  else if (tut === 4 && bz > 0) tutNext();
  else if (tut === 5 && tutT > 4) {
    tut = -1;
    localStorage.setItem("anarco_tut", "1");
    tutShow();
  }
}
$("tuts").onclick = () => { tut = -1; localStorage.setItem("anarco_tut", "1"); tutShow(); };

// ===== PRÓXIMO OBJETIVO =====
const arrow = new T.Mesh(
  new T.ConeGeometry(0.45, 1.2, 4).rotateX(Math.PI / 2),
  new T.MeshBasicMaterial({ color: 0xffe14a, transparent: true, opacity: 0.9, depthTest: false }),
);
arrow.renderOrder = 9;
S.add(arrow);
function updObjective() {
  let tg = null, label = "";
  if (boss) { tg = boss.g.position; label = "Derrube " + boss.cfg.n + " com BREACH"; }
  else {
    let best = 1e9;
    towers.forEach((t) => {
      const d = Math.hypot(P.position.x - t.x, P.position.z - t.z);
      if (!t.done && d < best) { best = d; tg = { x: t.x, z: t.z }; label = "Hackear " + t.n; }
    });
  }
  if (!tg) { arrow.visible = false; $("obj").textContent = cnt >= 3 ? "OBJETIVO ▸ fuga em andamento…" : ""; return; }
  const dx = tg.x - P.position.x, dz = tg.z - P.position.z, d = Math.hypot(dx, dz);
  $("obj").textContent = "OBJETIVO ▸ " + label + " · " + Math.round(d) + " m";
  const a = Math.atan2(dx, dz);
  arrow.position.set(P.position.x + Math.sin(a) * 2.2, 0.4, P.position.z + Math.cos(a) * 2.2);
  arrow.rotation.y = a;
  arrow.visible = d > 5.5;
}

// ===== PAUSA =====
function togglePause() {
  if (state === "play") { state = "pause"; $("pz").hidden = false; $("pb").textContent = "▶"; }
  else if (state === "pause") { state = "play"; $("pz").hidden = true; $("pb").textContent = "⏸"; clock.getDelta(); }
}
addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (k === "p" || k === "escape") { e.preventDefault(); togglePause(); }
});
addEventListener("blur", () => { if (state === "play") togglePause(); });
$("pb").onclick = togglePause;
$("pzc").onclick = togglePause;
$("pzm").onclick = () => {
  $("pz").hidden = true;
  $("pb").textContent = "⏸";
  state = "menu";
  arrow.visible = false;
  $("obj").textContent = "";
  $("mini").hidden = true;
  mini = null;
  $("ov").style.display = "flex";
};
