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
  ok(await page.locator('#codeRainMode').inputValue() === 'on', 'chuva de códigos fica ativada por padrão no desktop')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.selectOption('#codeRainMode', 'on')
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
  await page.evaluate(() => { tut = -1; tutShow(); lvl = 0; reset(true); breach() })
  await page.waitForFunction(() => {
    const canvas = document.getElementById('rain'), data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
    for (let i = 3; i < data.length; i += 32) if (data[i] > 0) return rainT > 0
    return false
  }, null, { timeout: 1800 })
  const chuvaDesktop = await page.evaluate(() => {
    const canvas = document.getElementById('rain'), ctx = canvas.getContext('2d'), data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    let pixels = 0
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) pixels++
    return { active: rainT > 0, display: getComputedStyle(canvas).display, pixels, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches }
  })
  ok(chuvaDesktop.active && chuvaDesktop.display !== 'none' && chuvaDesktop.pixels > 0 && chuvaDesktop.reduced, `chuva de códigos aparece ao usar BREACH no PC mesmo com movimento reduzido (${chuvaDesktop.pixels} pixels)`)
  await page.screenshot({ path: '/tmp/anarco-breach-desktop.png' })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  // HUD de hack: conexão contextual, progresso, erro glitchado, root e trilha carregada.
  await page.evaluate(() => {
    tut = -1; tutShow(); lvl = 0; reset(true); alert_ = 0; grace = 120;
    drones.forEach(d => d.position.set(90, 5, 90));
    const t = towers[2]; P.position.set(t.x + 4.75, 0, t.z + 0.2); vel.set(0, 0, 0); t.p = 0;
  })
  await page.waitForFunction(() => !document.getElementById('hackPanel').hidden && document.getElementById('hackState').textContent === 'CONEXÃO ESTABELECIDA', null, { timeout: 10000 })
  ok(true, 'núcleo da Vigilância abre HUD contextual de conexão')
  await page.waitForFunction(() => Number(document.getElementById('hackPercent').textContent.replace('%', '')) > 20, null, { timeout: 5000 })
  ok(await page.evaluate(() => document.getElementById('hackPanel').dataset.state === 'extract'), 'extração inicia e preenche a barra')
  await page.waitForFunction(() => !!mini, null, { timeout: 10000 })
  ok(await page.evaluate(() => document.getElementById('hackState').textContent === 'ACESSO ROOT'), 'barra completa e começa a autenticação root')
  const audioReady = await page.waitForFunction(() => customAudioBuffers.music && customAudioBuffers.connect && customAudioBuffers.stream && customAudioBuffers.error && customAudioBuffers.root, null, { timeout: 15000 }).then(() => true).catch(() => false)
  ok(audioReady, 'trilha e quatro efeitos originais são decodificados localmente')
  await page.evaluate(() => miniKey((mini.seq[mini.pos] + 1) % 4))
  await page.waitForFunction(() => document.getElementById('hackPanel').dataset.state === 'error', null, { timeout: 3000 })
  const erroVisual = await page.evaluate(() => ({ state: document.getElementById('hackPanel').dataset.state, color: getComputedStyle(document.getElementById('hackPanel')).borderLeftColor, particle: hackFlowMaterial.color.getHexString() }))
  ok(erroVisual.state === 'error' && erroVisual.color === 'rgb(255, 63, 208)' && erroVisual.particle === 'ff3fd0', 'sequência incorreta aciona glitch magenta no HUD e no fluxo de dados')
  await page.evaluate(() => { let n = 0; while (mini && n++ < 10) miniKey(mini.seq[mini.pos]) })
  await page.waitForFunction(() => document.getElementById('hackPanel').dataset.state === 'committed', null, { timeout: 5000 })
  ok(await page.evaluate(() => document.getElementById('hackState').textContent === 'VIGILÂNCIA TOTAL // COMPROMETIDA'), 'sequência validada concede root e compromete a Vigilância Total')
  await page.screenshot({ path: '/tmp/anarco-hack-desktop.png' })

  // O mesmo fluxo em viewport touch: HUD compacto acima do minigame e fora dos botões inferiores.
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, screen: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const mobilePage = await mobileContext.newPage()
  mobilePage.on('pageerror', e => erros.push('mobile pageerror: ' + String(e).slice(0, 160)))
  await mobilePage.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'domcontentloaded' })
  await mobilePage.waitForSelector('#st', { state: 'visible', timeout: 30000 })
  await mobilePage.click('#st')
  await mobilePage.waitForTimeout(1500)
  await mobilePage.mouse.click(195, 300)
  await mobilePage.waitForFunction(() => state === 'play', null, { timeout: 30000 })
  await mobilePage.evaluate(() => {
    tut = -1; tutShow(); const t = towers[2]; drones.forEach(d => d.position.set(90, 5, 90));
    P.position.set(t.x + 4.75, 0, t.z + 0.2); vel.set(0, 0, 0); t.p = 0.995; grace = 120;
  })
  await mobilePage.waitForFunction(() => !!mini && !document.getElementById('hackPanel').hidden, null, { timeout: 10000 })
  const layoutTouch = await mobilePage.evaluate(() => {
    const rect = id => { const r = document.getElementById(id).getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height } }
    return { panel: rect('hackPanel'), mini: rect('mini'), actions: rect('touchActions'), routeDisplay: getComputedStyle(document.getElementById('routePicker')).display }
  })
  ok(layoutTouch.panel.left >= 0 && layoutTouch.panel.right <= 390 && layoutTouch.panel.bottom <= layoutTouch.mini.top + 2, 'layout touch mantém o HUD compacto acima do minigame e dentro da largura do telefone')
  ok(layoutTouch.mini.bottom <= layoutTouch.actions.top + 3 && layoutTouch.routeDisplay === 'none', 'minigame e botões touch não se sobrepõem; seletor de rota abre espaço temporário')
  await mobilePage.screenshot({ path: '/tmp/anarco-hack-mobile.png' })
  await mobileContext.close()

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
