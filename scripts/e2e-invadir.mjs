// Se o Chromium do Playwright não estiver instalado: `pnpm exec playwright install chromium` (ou defina CHROMIUM_PATH).
// ÂNCORA: teste de ponta a ponta — abre o jogo de verdade, clica em "Invadir" e confere que a partida começa.
// Pega o erro que os testes de unidade não pegam (ex.: travamento ao gerar itens). Uso: pnpm build && pnpm e2e
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'

const PORT = 4175
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', 'dist'], { stdio: 'ignore' })
const falhas = []
const ok = (cond, msg) => { console.log((cond ? 'ok   ' : 'FALHA'), msg); if (!cond) falhas.push(msg) }
try {
  await new Promise((r) => setTimeout(r, 1200))
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] })
  const page = await (await browser.newContext({ viewport: { width: 1000, height: 560 } })).newPage()
  const erros = []
  page.on('pageerror', (e) => erros.push(String(e).slice(0, 160)))
  page.on('response', (r) => { if (r.status() >= 400) erros.push(`HTTP ${r.status()} ${r.url()}`) })
  await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#st', { state: 'visible', timeout: 30000 })
  await page.waitForTimeout(3000)
  await page.click('#st')
  await page.waitForTimeout(1500)
  await page.mouse.click(500, 300) // encerra o terminal de introdução
  await page.waitForFunction(() => state === 'play', null, { timeout: 30000 })
  ok(true, 'clicar em Invadir inicia a partida (estado "play", sem travar)')
  ok((await page.evaluate(() => pick.length)) === 3, 'os 3 itens foram gerados (spawnPickups terminou)')
  ok((await page.evaluate(() => towers.length)) === 3, 'as 3 torres existem')
  // as 6 fases carregam e o chefão só aparece na última
  for (let i = 0; i < 6; i++) {
    await page.evaluate((n) => { tut = -1; tutShow(); lvl = n; reset(true) }, i)
    await page.waitForTimeout(2500)
    const r = await page.evaluate(() => ({ s: state, lv: document.getElementById('lv').textContent, boss: !!boss, p: pick.length }))
    ok(r.s === 'play' && r.lv === `NÍVEL ${i + 1}/6` && r.p === 3 && r.boss === (i === 5), `fase ${i + 1}/6 carrega (${r.lv}, chefão: ${r.boss})`)
  }
  // teclas não ficam presas ao perder o foco
  await page.evaluate(() => { keys.w = 1; window.dispatchEvent(new Event('blur')) })
  ok((await page.evaluate(() => keys.w)) === 0, 'tecla solta ao perder o foco (blur)')
  ok(erros.length === 0, `nenhum erro no console/HTTP ${erros.length ? JSON.stringify(erros.slice(0, 3)) : ''}`)
  await browser.close()
} finally {
  server.kill()
}
if (falhas.length) { console.error(`\n${falhas.length} falha(s)`); process.exit(1) }
console.log('\ne2e: tudo certo')
