// Teste de ponta a ponta (navegador real): clica em "Invadir", passa pelas 6 fases, usa as 3 habilidades,
// confere tecla presa e erros de console. Uso: pnpm build && pnpm e2e
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.webmanifest': 'application/manifest+json', '.ttf': 'font/ttf', '.woff2': 'font/woff2' }
const raiz = join(process.cwd(), 'dist')
// ÂNCORA: servidor estático mínimo — serve a pasta dist/ como a Vercel serviria
const servidor = createServer(async (req, res) => {
  const caminho = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '')
  try {
    const dados = await readFile(join(raiz, caminho === '/' ? 'index.html' : caminho))
    res.writeHead(200, { 'Content-Type': TIPOS[extname(caminho)] || 'application/octet-stream' })
    res.end(dados)
  } catch { res.writeHead(404); res.end('nao encontrado') }
})
await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok))
const url = `http://127.0.0.1:${servidor.address().port}/index.html`

const falhas = []
const confere = (cond, msg) => { console.log((cond ? 'OK   ' : 'FALHA') + ' · ' + msg); if (!cond) falhas.push(msg) }
const erros = []
const navegador = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] })
try {
  const pg = await (await navegador.newContext({ viewport: { width: 1100, height: 620 } })).newPage()
  pg.setDefaultTimeout(30000)
  pg.on('pageerror', (e) => erros.push('pageerror: ' + e.message))
  pg.on('console', (m) => m.type() === 'error' && erros.push('console: ' + m.text()))
  pg.on('response', (r) => r.status() >= 400 && erros.push('HTTP ' + r.status() + ' ' + r.url()))
  await pg.goto(url, { waitUntil: 'domcontentloaded' })
  await pg.waitForFunction(() => typeof startGame === 'function' && !!document.getElementById('st'), null, { timeout: 30000 })
  await pg.waitForTimeout(2000)

  // 1) botão real "Invadir" → terminal de introdução → jogo (cobre reset + spawnPickups)
  await pg.click('#st')
  await pg.waitForTimeout(800)
  await pg.mouse.click(550, 300) // clique encerra a introdução
  await pg.waitForFunction(() => state === 'play', null, { timeout: 30000 })
  confere(await pg.evaluate(() => pick.length === 3), 'Invadir → partida em "play" com 3 itens (sem travar)')

  // 2) as 6 fases (sem pular tutorial: usa o mesmo reset do jogo)
  const nomes = ['DISTRITO FINANCEIRO', 'ZONA INDUSTRIAL', 'CENTRO DE VIGILANCIA', 'ESCONDERIJO DATA', 'SUBESTACAO ELETRICA', 'NUCLEO MEGACORP']
  for (let i = 0; i < 6; i++) {
    const r = await pg.evaluate((n) => { tut = -1; tutShow(); lvl = n; reset(true); return { nome: document.getElementById('phaseName').textContent, lv: document.getElementById('lv').textContent, torres: towers.length, itens: pick.length, boss: !!boss } }, i)
    await pg.waitForTimeout(1500)
    confere(r.nome === nomes[i] && r.lv.endsWith('/6') && r.itens === 3 && r.boss === (i === 5), `fase ${i + 1}: ${r.nome} (${r.lv}) itens=${r.itens} chefão=${r.boss}`)
  }

  // 3) habilidades com os valores balanceados
  const h = await pg.evaluate(() => { tut = -1; lvl = 2; reset(true); routeMode = 'safe'; const d = drones[0]; P.position.set(d.position.x + 2, 0, d.position.z); empAttack(); const e = [empCd, d.fz]; d.fz = 0; virusAttack(); const v = [virusCd, d.fz]; d.fz = 0; breach(); return { e, v, b: [bz, d.fz] } })
  confere(h.e[0] === 8 && h.e[1] === 3.5, `EMP: recarga ${h.e[0]} s, trava ${h.e[1]} s (esperado 8 / 3,5)`)
  confere(h.v[0] === 10 && h.v[1] === 6, `VÍRUS: recarga ${h.v[0]} s, sequestro ${h.v[1]} s (esperado 10 / 6)`)
  confere(h.b[0] === 10 && h.b[1] === 4.5, `BREACH: recarga ${h.b[0]} s, trava ${h.b[1]} s (esperado 10 / 4,5)`)

  // 4) tecla presa: segura "d", a janela perde o foco, solta fora → não pode ficar presa
  await pg.evaluate(() => { keys.d = 1; window.dispatchEvent(new Event('blur')) })
  confere(await pg.evaluate(() => !keys.d), 'tecla "d" é solta quando a janela perde o foco')

  // 5) esquiva desloca o personagem
  const desloc = await pg.evaluate(async () => { tut = -1; lvl = 0; reset(true); dodgeCd = 0; dodgeT = 0; const x = P.position.x, z = P.position.z; dodge(); await new Promise((r) => setTimeout(r, 900)); return Math.hypot(P.position.x - x, P.position.z - z) })
  confere(desloc > 0.5, `esquiva desloca o personagem (${desloc.toFixed(2)} m)`)

  confere(erros.length === 0, 'nenhum erro de console / requisição' + (erros.length ? ': ' + erros.slice(0, 3).join(' | ') : ''))
} finally {
  await navegador.close()
  servidor.close()
}
if (falhas.length) { console.error('\n' + falhas.length + ' verificação(ões) falharam.'); process.exit(1) }
console.log('\nE2E: tudo certo.')
