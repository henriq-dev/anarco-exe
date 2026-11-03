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
  const context = await browser.newContext({ viewport: { width: 1000, height: 560 } })
  await context.addInitScript(() => {
    localStorage.setItem('anarco_fx_quality', 'medium')
    const pad = { id: 'ANARCO E2E Standard Pad', index: 0, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), timestamp: 0 }
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [pad] })
    window.__testPad = pad
  })
  const page = await context.newPage()
  const lazyAssetRequests = []
  const jsChunkRequests = []
  const bloomChunkRequests = []
  page.on('request', request => {
    const pathname = new URL(request.url()).pathname
    if (/\/assets\/(?:audio\/[^/]+\.mp3|models\/(?:laptop\.mdl|boss-[^/]+\.glb))$/i.test(pathname)) lazyAssetRequests.push(pathname)
    if (/\/assets\/[^/]+\.js$/i.test(pathname)) jsChunkRequests.push(pathname)
    if (/\/assets\/[^/]*postprocessing[^/]*\.js$/i.test(pathname)) bloomChunkRequests.push(pathname)
  })
  const erros = []
  page.on('pageerror', (e) => erros.push(String(e).slice(0, 160)))
  page.on('response', (r) => { if (r.status() >= 400) erros.push(`HTTP ${r.status()} ${r.url()}`) })
  await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#st', { state: 'visible', timeout: 30000 })
  await page.waitForFunction(() => document.activeElement.id === 'st' && document.getElementById('ov').getAttribute('aria-modal') === 'true', null, { timeout: 10000 })
  const setPadButton = (index, pressed) => page.evaluate(({ index, pressed }) => {
    const button = window.__testPad.buttons[index]
    button.pressed = pressed; button.value = pressed ? 1 : 0
  }, { index, pressed })
  await setPadButton(13, true)
  await page.waitForFunction(() => document.activeElement.id !== 'st', null, { timeout: 3000 })
  await setPadButton(13, false)
  const menuMovedFocus = await page.evaluate(() => document.activeElement.id)
  await setPadButton(12, true)
  await page.waitForFunction(() => document.activeElement.id === 'st', null, { timeout: 3000 })
  await setPadButton(12, false)
  const menuRestoredFocus = await page.evaluate(() => document.activeElement.id)
  ok(menuMovedFocus !== 'st' && menuRestoredFocus === 'st', 'D-pad navega o foco do menu do controle padrão')
  await page.waitForTimeout(3000)
  const specialEliteFont = await page.evaluate(async () => {
    const faces = await document.fonts.load('16px "Special Elite"', 'ANARCO áéíóú çãõ')
    const fontUrls = performance.getEntriesByType('resource').map(entry => entry.name).filter(url => new URL(url).pathname.endsWith('/fonts/SpecialElite-Latin.woff2'))
    return { family: getComputedStyle(document.body).fontFamily, loaded: faces.length > 0 && faces.every(face => face.status === 'loaded'), fontUrls }
  })
  ok(specialEliteFont.family.startsWith('"Special Elite"') && specialEliteFont.loaded && specialEliteFont.fontUrls.length > 0 && specialEliteFont.fontUrls.every(url => new URL(url).origin === `http://localhost:${PORT}`), 'Special Elite WOFF2 local é carregada e usada pela interface')
  const sharedRules = await page.evaluate(() => ({ levels: LV === ANARCO_GAMEPLAY_CONFIG.levels, routes: ROUTES === ANARCO_GAMEPLAY_CONFIG.routes, balance: ROUTE_BALANCE === ANARCO_GAMEPLAY_CONFIG.routeBalance, count: LV.length }))
  ok(sharedRules.levels && sharedRules.routes && sharedRules.balance && sharedRules.count === 6, 'runtime usa a mesma configuração de níveis e rotas coberta pelos testes')
  const saveMigration = await page.evaluate(() => ({ version: JSON.parse(localStorage.getItem('anarco_save_v1') || 'null')?.version, bridge: typeof ANARCO_SAVE_STORAGE?.getItem === 'function', legacySkinReadable: ANARCO_SAVE_STORAGE?.getItem('anarco_skin') === localStorage.getItem('anarco_skin') }))
  ok(saveMigration.version === 1 && saveMigration.bridge && saveMigration.legacySkinReadable, 'saves antigos migram para schema v1 e permanecem compatíveis com as chaves legadas')
  const startupAntialias = await page.evaluate(() => R.getContext().getContextAttributes()?.antialias)
  ok(startupAntialias === true, 'qualidade média inicia MSAA no desktop; o preset Baixa pode dispensá-lo antes da criação do contexto')
  ok(!jsChunkRequests.some(pathname => pathname.includes('anarco-boss-loader')), 'chunk do loader GLTF/Meshopt não é transferido no menu inicial')
  ok(bloomChunkRequests.length === 0, 'qualidade média mantém o chunk de Bloom fora das transferências iniciais')
  await page.evaluate(() => { fxSystem.setQuality('high', false); fxSystem.render() })
  await page.waitForFunction(() => !!fxSystem.composer, null, { timeout: 30000 })
  ok(bloomChunkRequests.length === 1, 'qualidade alta carrega o chunk de Bloom sob demanda e cria o composer')
  await page.evaluate(() => fxSystem.setQuality('medium', false))
  ok(await page.evaluate(() => !fxSystem.composer && document.body.dataset.fxQuality === 'medium'), 'reduzir para média descarta Bloom e preserva renderização direta')
  ok(lazyAssetRequests.length === 0, 'menu inicial não baixa MP3s, notebook ou modelos de chefão')
  await page.evaluate(() => {
    window.__webglRenderProbe = { count: 0, original: fxSystem.render }
    fxSystem.render = function (...args) { window.__webglRenderProbe.count++; return window.__webglRenderProbe.original.apply(this, args) }
  })
  await page.waitForTimeout(250)
  const menuRenderCount = await page.evaluate(() => window.__webglRenderProbe.count)
  ok(menuRenderCount === 0, 'menu mantém WebGL parado após a instrumentação')
  await page.setViewportSize({ width: 1000, height: 600 })
  await page.waitForFunction((before) => window.__webglRenderProbe.count === before + 1, menuRenderCount, { timeout: 5000 })
  const menuResizeOne = await page.evaluate(() => window.__webglRenderProbe.count)
  await page.waitForTimeout(120)
  const menuResizeStable = await page.evaluate(() => window.__webglRenderProbe.count)
  await page.setViewportSize({ width: 1000, height: 560 })
  await page.waitForFunction((before) => window.__webglRenderProbe.count === before + 1, menuResizeStable, { timeout: 5000 })
  const menuRenderBaseline = await page.evaluate(() => window.__webglRenderProbe.count)
  ok(menuResizeOne === menuRenderCount + 1 && menuResizeStable === menuResizeOne && menuRenderBaseline === menuResizeStable + 1, 'resize no menu produz um quadro por mudança e continua suspenso depois')
  const initialDialog = await page.evaluate(() => ({ role: document.getElementById('ov').getAttribute('role'), modal: document.getElementById('ov').getAttribute('aria-modal'), label: document.getElementById('ov').getAttribute('aria-labelledby'), focus: document.activeElement.id, hudInert: document.getElementById('hud').inert, objectiveHidden: document.getElementById('obj').getAttribute('aria-hidden'), objectiveRole: document.getElementById('objAnnounce').getAttribute('role'), objectiveLive: document.getElementById('objAnnounce').getAttribute('aria-live') }))
  ok(initialDialog.role === 'dialog' && initialDialog.modal === 'true' && initialDialog.label === 'ot' && initialDialog.focus === 'st' && initialDialog.hudInert && initialDialog.objectiveHidden === 'true' && initialDialog.objectiveRole === 'status' && initialDialog.objectiveLive === 'polite', 'menu e objetivo têm semântica acessível, foco inicial e conteúdo de fundo inerte')
  const previousLeaks = await page.evaluate(() => {
    const previous = ANARCO_SAVE_STORAGE.getItem('anarco_leaks')
    ANARCO_SAVE_STORAGE.setItem('anarco_leaks', JSON.stringify([{ id: '<img src=x onerror="window.__leakXss=1">', d: '<img src=x onerror="window.__leakXss=1">', c: 'Teste', n: 1, t: 'hoje' }]))
    return previous
  })
  await page.click('#lb')
  const leakDialog = await page.evaluate(() => ({ role: document.getElementById('lk').getAttribute('role'), modal: document.getElementById('lk').getAttribute('aria-modal'), active: document.activeElement.id, menuInert: document.getElementById('ov').inert, z: Number(getComputedStyle(document.getElementById('lk')).zIndex), menuZ: Number(getComputedStyle(document.getElementById('ov')).zIndex), img: !!document.querySelector('#lkl img'), literal: document.getElementById('lkl').textContent.includes('<img') }))
  ok(leakDialog.role === 'dialog' && leakDialog.modal === 'true' && leakDialog.active === 'lkx' && leakDialog.menuInert && leakDialog.z > leakDialog.menuZ && !leakDialog.img && leakDialog.literal, 'vazamentos abre como diálogo superior, recebe foco e trata valores locais como texto')
  await page.keyboard.press('Shift+Tab')
  const trappedLeakFocus = await page.evaluate(() => document.activeElement.id)
  await page.keyboard.press('Escape')
  const leakClosed = await page.evaluate(() => ({ hidden: document.getElementById('lk').hidden, focus: document.activeElement.id, menuModal: document.getElementById('ov').getAttribute('aria-modal') }))
  ok(trappedLeakFocus === 'lkz' && leakClosed.hidden && leakClosed.focus === 'lb' && leakClosed.menuModal === 'true', 'Escape fecha a lista, mantém o foco contido e o devolve ao acionador')
  await page.evaluate((previous) => previous === null ? ANARCO_SAVE_STORAGE.removeItem('anarco_leaks') : ANARCO_SAVE_STORAGE.setItem('anarco_leaks', previous), previousLeaks)
  const previousRank = await page.evaluate(() => {
    const previous = ANARCO_SAVE_STORAGE.getItem('anarco_rank')
    ANARCO_SAVE_STORAGE.setItem('anarco_rank', JSON.stringify([{ s: 12.3, d: '<img src=x onerror="window.__rankXss=1">' }]))
    return previous
  })
  await page.click('#rb')
  const rankDialog = await page.evaluate(() => ({ modal: document.getElementById('rk').getAttribute('aria-modal'), active: document.activeElement.id, img: !!document.querySelector('#rkl img'), literal: document.getElementById('rkl').textContent.includes('<img') }))
  await page.click('#rkx')
  const rankClosed = await page.evaluate(() => ({ hidden: document.getElementById('rk').hidden, focus: document.activeElement.id }))
  ok(rankDialog.modal === 'true' && rankDialog.active === 'rkx' && !rankDialog.img && rankDialog.literal && rankClosed.hidden && rankClosed.focus === 'rb', 'ranking também usa texto seguro e devolve foco ao fechar')
  await page.evaluate((previous) => previous === null ? ANARCO_SAVE_STORAGE.removeItem('anarco_rank') : ANARCO_SAVE_STORAGE.setItem('anarco_rank', previous), previousRank)
  ok(await page.locator('#codeRainMode').inputValue() === 'on', 'chuva de códigos fica ativada por padrão no desktop')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.selectOption('#codeRainMode', 'on')
  await page.evaluate(() => document.getElementById('st').focus())
  await setPadButton(0, true)
  await page.waitForSelector('#introTerminal', { state: 'visible', timeout: 5000 })
  await setPadButton(0, false)
  const invadeTransition = await page.evaluate(() => ({ state, terminal: !!document.getElementById('introTerminal') }))
  ok(invadeTransition.state === 'menu' && invadeTransition.terminal, 'Invadir abre primeiro o terminal introdutório; a partida ainda não iniciou')
  await page.waitForFunction(() => document.getElementById('introTerminal')?.querySelectorAll('pre')[1]?.textContent.startsWith('>'), null, { timeout: 8000 })
  await page.waitForFunction(() => ['connect', 'stream', 'error', 'root'].every(key => !!customAudioBuffers[key]), null, { timeout: 15000 })
  const terminalAudio = await page.evaluate(() => ({ musicLoaded: !!customAudioBuffers.music, musicRequested: customMusicRequested }))
  const audioRequestPaths = [...new Set(lazyAssetRequests.filter(pathname => pathname.includes('/assets/audio/')))]
  ok(audioRequestPaths.length === 4 && !terminalAudio.musicLoaded && !terminalAudio.musicRequested && !lazyAssetRequests.some(pathname => pathname.endsWith('/anarco-cyberpunk-ost.mp3')), 'os quatro efeitos curtos carregam após Invadir e a trilha continua adiada no terminal')
  const roteiro = await page.evaluate(async () => await (await fetch('/script.js')).text())
  const roteiroCompacto = roteiro.replace(/\s+/g, '')
  const arteTerminal = await page.evaluate(() => document.body.lastElementChild?.querySelector('pre')?.textContent || '')
  ok(arteTerminal.split('\n').length >= 16 && arteTerminal.includes('ANARCO.EXE') && arteTerminal.includes('CAPUZ') && roteiro.includes('03:17:09 // DISTRITO FINANCEIRO') && roteiro.includes('a cidade dorme.') && roteiro.includes('BREACH // INICIANDO') && roteiroCompacto.includes('Math.floor(elapsed/5)') && roteiroCompacto.includes('},24);'), 'a arte ASCII maior CAPUZ/ANARCO aparece no topo e a narração rápida inicia antes da partida')
  await page.screenshot({ path: '/tmp/anarco-intro-desktop.png' })
  const audioDoTerminal = await page.evaluate(() => ({ state: actx?.state, master: audioLayers?.master?.gain.value, muted: mute, role: document.getElementById('introTerminal')?.getAttribute('role'), modal: document.getElementById('introTerminal')?.getAttribute('aria-modal'), focus: document.activeElement.id, renders: window.__webglRenderProbe.count }))
  ok(audioDoTerminal.role === 'dialog' && audioDoTerminal.modal === 'true' && audioDoTerminal.focus === 'introTerminal', 'terminal introdutório anuncia papel modal e recebe o foco')
  ok(audioDoTerminal.renders === menuRenderBaseline, 'terminal introdutório não renderiza WebGL fora dos quadros de resize')
  ok(audioDoTerminal.state === 'running' && audioDoTerminal.master > 0.1 && !audioDoTerminal.muted && roteiro.includes('sfx("ready")') && roteiro.includes('sfx("terminal"') && roteiroCompacto.includes('elseif(n==="terminal")'), 'bip/cliques do terminal soam pelo mixer ativo e respeitam o mute')
  await page.waitForTimeout(1500)
  await setPadButton(0, true) // A confirma o terminal e inicia
  await page.waitForFunction(() => state === 'play', null, { timeout: 30000 })
  await setPadButton(0, false)
  ok(true, 'A do controle confirma o terminal e inicia a partida (estado "play", sem travar)')
  const gamepadMovement = await page.evaluate(async () => {
    P.position.set(0, 0, 0); vel.set(0, 0, 0); window.__testPad.axes[0] = 1
    await new Promise(resolve => setTimeout(resolve, 250))
    const moved = P.position.x
    window.__testPad.axes[0] = 0
    return moved
  })
  ok(gamepadMovement > 0.2, 'stick analógico do gamepad move o personagem no runtime publicado')
  await page.evaluate(() => { window.__gamepadBreachCount = 0; const original = breach; breach = function () { window.__gamepadBreachCount++; return original() } })
  await setPadButton(0, true)
  await page.waitForTimeout(240)
  await setPadButton(0, false)
  ok(await page.evaluate(() => window.__gamepadBreachCount) === 1, 'botão A aciona BREACH uma vez por pressionamento, sem repetir enquanto segurado')
  await setPadButton(9, true)
  await page.waitForFunction(() => state === 'pause', null, { timeout: 5000 })
  await setPadButton(9, false)
  await setPadButton(1, true)
  await page.waitForFunction(() => state === 'play', null, { timeout: 5000 })
  await setPadButton(1, false)
  ok(true, 'Start pausa e B retoma a partida pelo controle')
  const musicReadyAfterStart = await page.waitForFunction(() => !!customAudioBuffers.music, null, { timeout: 20000 }).then(() => true).catch(() => false)
  const fullAudioRequestPaths = [...new Set(lazyAssetRequests.filter(pathname => pathname.includes('/assets/audio/')))]
  ok(musicReadyAfterStart && fullAudioRequestPaths.length === 5 && fullAudioRequestPaths.some(pathname => pathname.endsWith('/anarco-cyberpunk-ost.mp3')), 'trilha só é solicitada após a partida ativa e depois dos quatro efeitos curtos')
  const startFocus = await page.evaluate(() => ({ id: document.activeElement.id, role: document.activeElement.getAttribute('role') }))
  ok(startFocus.id === 'gameCanvas' && startFocus.role === 'img', 'após iniciar, foco vai ao canvas neutro e não ao botão Pausar')
  await page.waitForTimeout(120)
  const renderInPlay = await page.evaluate(() => window.__webglRenderProbe.count)
  ok(renderInPlay > 0, 'a renderização WebGL retoma durante a partida')
  await page.evaluate(() => {
    window.__mapProbe = { times: [], original: drawMap }
    drawMap = function () { window.__mapProbe.times.push(performance.now()); window.__mapProbe.original() }
  })
  await page.waitForTimeout(1100)
  const mapPlayStats = await page.evaluate(() => {
    const times = window.__mapProbe.times
    return { count: times.length, minGap: times.length > 1 ? Math.min(...times.slice(1).map((time, index) => time - times[index])) : Infinity }
  })
  ok(mapPlayStats.count >= 1 && mapPlayStats.count <= 16 && mapPlayStats.minGap >= 65, `minimapa redesenha durante jogo com intervalo de throttling (10 Hz alvo; ${mapPlayStats.count} desenhos)`)
  await page.click('#pb')
  const pauseDialog = await page.evaluate(() => ({ modal: document.getElementById('pz').getAttribute('aria-modal'), focus: document.activeElement.id, hudInert: document.getElementById('hud').inert }))
  const webglAtPause = await page.evaluate(() => window.__webglRenderProbe.count)
  await page.setViewportSize({ width: 560, height: 1000 })
  await page.waitForFunction((before) => window.__webglRenderProbe.count === before + 1, webglAtPause, { timeout: 5000 })
  const pauseResizeOne = await page.evaluate(() => window.__webglRenderProbe.count)
  await page.setViewportSize({ width: 1000, height: 560 })
  await page.waitForFunction((before) => window.__webglRenderProbe.count === before + 1, pauseResizeOne, { timeout: 5000 })
  const pauseResizeTwo = await page.evaluate(() => window.__webglRenderProbe.count)
  const redundantHudMutations = await page.evaluate(async () => {
    let count = 0
    const observer = new MutationObserver(records => { count += records.length })
    const droneState = document.getElementById('drstate'), sideRead = document.getElementById('sideRead')
    observer.observe(droneState, { childList: true, characterData: true, subtree: true })
    observer.observe(sideRead, { attributes: true, attributeFilter: ['title'] })
    for (let i = 0; i < 100; i++) {
      setTxt(droneState, droneState.textContent)
      setAttr(sideRead, 'title', sideRead.getAttribute('title'))
    }
    await new Promise(resolve => setTimeout(resolve, 0))
    observer.disconnect()
    return count
  })
  ok(redundantHudMutations === 0, 'setters do HUD evitam escritas idênticas em texto e atributos')
  const mapAtPause = await page.evaluate(() => window.__mapProbe.times.length)
  await page.waitForTimeout(350)
  const mapWhilePaused = await page.evaluate(() => window.__mapProbe.times.length)
  const webglWhilePaused = await page.evaluate(() => window.__webglRenderProbe.count)
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => state === 'play' && document.getElementById('pz').hidden, null, { timeout: 3000 })
  await page.waitForTimeout(160)
  const resumedProbe = await page.evaluate(() => {
    const result = { count: window.__mapProbe.times.length, focus: document.activeElement.id }
    drawMap = window.__mapProbe.original
    delete window.__mapProbe
    fxSystem.render = window.__webglRenderProbe.original
    delete window.__webglRenderProbe
    return result
  })
  await page.keyboard.press('Enter')
  const enterSafe = await page.evaluate(() => state === 'play' && document.getElementById('pz').hidden && document.activeElement.id === 'gameCanvas')
  ok(pauseDialog.modal === 'true' && pauseDialog.focus === 'pzc' && pauseDialog.hudInert && mapWhilePaused <= mapAtPause + 1 && pauseResizeOne === webglAtPause + 1 && pauseResizeTwo === pauseResizeOne + 1 && webglWhilePaused === pauseResizeTwo && resumedProbe.count > mapWhilePaused && resumedProbe.focus === 'gameCanvas' && enterSafe, 'pausa suspende WebGL e minimapa, renderiza só um quadro por resize e Enter não reaciona Pausar ao retomar')
  const routeDescriptions = await page.evaluate(() => {
    const previousLevel = lvl, previousRoute = routeMode
    const samples = {}
    for (const [level, mode] of [[0, 'fast'], [5, 'fast'], [0, 'tech']]) {
      lvl = level; routeMode = mode; renderRoute()
      samples[`${level}:${mode}`] = document.getElementById('routeText').textContent
    }
    lvl = previousLevel; routeMode = previousRoute; renderRoute()
    return samples
  })
  ok(routeDescriptions['0:fast'].includes('vel. +18%') && routeDescriptions['5:fast'].includes('vel. +10%') && routeDescriptions['0:tech'].includes('cooldown −18%'), 'descrições das rotas refletem os multiplicadores reais por fase')
  const objectivePunctuation = await page.evaluate(() => ({ target: formatObjectiveAnnouncement('Hackear PetroNegra Ltda.', 'target', false), boss: formatObjectiveAnnouncement('Derrube PetroNegra Ltda.', 'danger', true) }))
  ok(objectivePunctuation.target === 'Próximo objetivo: Hackear PetroNegra Ltda.' && objectivePunctuation.boss === 'Objetivo do chefão: Derrube PetroNegra Ltda.', 'anúncio do objetivo mantém um único ponto após nomes jurídicos já pontuados')
  const restrictedSkill = await page.evaluate(() => {
    const feedback = [], originalFeedback = playHackFeedback, originalSkin = skinAtual
    playHackFeedback = kind => feedback.push(kind)
    skinAtual = 'capuz'; lastGhostDeniedAt = -Infinity
    const button = document.getElementById('gx')
    for (let i = 0; i < 2; i++) button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }))
    const result = { feedback, message: note }
    playHackFeedback = originalFeedback; skinAtual = originalSkin
    return result
  })
  ok(restrictedSkill.feedback.length === 1 && restrictedSkill.feedback[0] === 'error' && restrictedSkill.message.includes('selecione a operadora VANTA'), 'habilidade restrita de VANTA toca falha uma vez e preserva a orientação para trocar operador')
  ok((await page.evaluate(() => pick.length)) === 3, 'os 3 itens foram gerados (spawnPickups terminou)')
  ok((await page.evaluate(() => towers.length)) === 3, 'as 3 torres existem')
  // as 6 fases carregam e o chefão só aparece na última
  for (let i = 0; i < 6; i++) {
    await page.evaluate((n) => { tut = -1; tutShow(); lvl = n; reset(true) }, i)
    await page.waitForTimeout(2500)
    const r = await page.evaluate(() => ({ s: state, lv: document.getElementById('lv').textContent, boss: !!boss, p: pick.length }))
    ok(r.s === 'play' && r.lv === `NÍVEL ${i + 1}/6` && r.p === 3 && r.boss === (i === 5), `fase ${i + 1}/6 carrega (${r.lv}, chefão: ${r.boss})`)
  }
  await page.waitForFunction(() => boss?.cfg?.model === 'banqueiro' && !!boss.g.userData.art, null, { timeout: 15000 })
  ok(jsChunkRequests.filter(pathname => pathname.includes('anarco-boss-loader')).length === 1, 'chunk GLTF/Meshopt é transferido sob demanda ao carregar o primeiro chefe')
  const bossOne = await page.evaluate(() => {
    let rig = false
    boss.g.userData.art.traverse(node => { if (node.isSkinnedMesh) rig = true })
    return { model: boss.cfg.model, rig, animated: !!boss.g.userData.mixer, next: bossModelPreload?.index }
  })
  ok(bossOne.model === 'banqueiro' && bossOne.rig && bossOne.animated && bossOne.next === 1, 'Banqueiro Meshopt/WebP carrega o rig animado e mantém apenas o próximo pré-carregado')
  const firstBossLoads = new Set(lazyAssetRequests.filter(pathname => pathname.includes('/assets/models/boss-')))
  ok(firstBossLoads.has('/assets/models/boss-banqueiro-animated.glb') && firstBossLoads.has('/assets/models/boss-petroleo-rigged.glb') && !firstBossLoads.has('/assets/models/boss-ceo-rigged.glb'), 'antes de vencer o primeiro, apenas Banqueiro e próximo chefe foram solicitados')
  await page.evaluate(() => { if (boss?.g?.parent) boss.g.parent.remove(boss.g); boss = null; spawnBoss(1) })
  await page.waitForFunction(() => boss?.cfg?.model === 'petroleo' && !!boss.g.userData.art && !!boss.g.userData.mixer, null, { timeout: 15000 })
  ok(await page.evaluate(() => bossModelPreload?.index === 2) && lazyAssetRequests.some(pathname => pathname.endsWith('/boss-ceo-rigged.glb')), 'após o primeiro chefe, o Petróleo usa o rig e o CEO passa a ser o único próximo')
  await page.evaluate(() => { if (boss?.g?.parent) boss.g.parent.remove(boss.g); boss = null; spawnBoss(2) })
  await page.waitForFunction(() => boss?.cfg?.model === 'ceo' && !!boss.g.userData.art && !!boss.g.userData.mixer, null, { timeout: 15000 })
  ok(await page.evaluate(() => { let rig = false; boss.g.userData.art.traverse(node => { if (node.isSkinnedMesh) rig = true }); return rig }), 'CEO também carrega o GLB comprimido com rig e animação')
  await page.evaluate(() => { if (boss?.g?.parent) boss.g.parent.remove(boss.g); boss = null })
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
  ok(!lazyAssetRequests.some(pathname => pathname.endsWith('/laptop.mdl')), 'notebook permanece adiado até a aproximação do primeiro hack')
  await page.evaluate(() => {
    tut = -1; tutShow(); lvl = 0; reset(true); alert_ = 0; grace = 120;
    drones.forEach(d => d.position.set(90, 5, 90));
    const t = towers[2]; P.position.set(t.x + 4.75, 0, t.z + 0.2); vel.set(0, 0, 0); t.p = 0;
  })
  await page.waitForFunction(() => !document.getElementById('hackPanel').hidden && document.getElementById('hackState').textContent === 'CONEXÃO ESTABELECIDA', null, { timeout: 10000 })
  ok(true, 'núcleo da Vigilância abre HUD contextual de conexão')
  await page.waitForFunction(() => lapModelReady, null, { timeout: 10000 })
  ok(lazyAssetRequests.filter(pathname => pathname.endsWith('/laptop.mdl')).length === 1, 'notebook é buscado uma vez no primeiro hack e substitui o placeholder')
  await page.waitForFunction(() => Number(document.getElementById('hackPercent').textContent.replace('%', '')) > 20, null, { timeout: 5000 })
  ok(await page.evaluate(() => document.getElementById('hackPanel').dataset.state === 'extract'), 'extração inicia e preenche a barra')
  // ÂNCORA: o hack completo leva ~22 s; 10 s era pouco e dava falso erro
  await page.waitForFunction(() => !!mini, null, { timeout: 45000 })
  ok(await page.evaluate(() => document.getElementById('hackState').textContent === 'ACESSO ROOT'), 'barra completa e começa a autenticação root')
  const audioReady = await page.waitForFunction(() => customAudioBuffers.music && customAudioBuffers.connect && customAudioBuffers.stream && customAudioBuffers.error && customAudioBuffers.root, null, { timeout: 15000 }).then(() => true).catch(() => false)
  ok(audioReady, 'trilha e quatro efeitos originais são decodificados localmente')
  const hackErrorAlert = await page.evaluate(() => {
    const before = alert_, gain = routeTune().alertGain
    miniKey((mini.seq[mini.pos] + 1) % 4)
    return { before, gain, after: alert_ }
  })
  await page.waitForFunction(() => document.getElementById('hackPanel').dataset.state === 'error', null, { timeout: 3000 })
  const expectedAlert = Math.min(0.98, hackErrorAlert.before + 0.2 * hackErrorAlert.gain)
  ok(Number.isFinite(hackErrorAlert.after) && hackErrorAlert.after > hackErrorAlert.before && Math.abs(hackErrorAlert.after - expectedAlert) < 1e-9, 'erro de hack aplica uma penalidade de alerta finita')
  const erroVisual = await page.evaluate(() => ({ state: document.getElementById('hackPanel').dataset.state, color: getComputedStyle(document.getElementById('hackPanel')).borderLeftColor, particle: hackFlowMaterial.color.getHexString() }))
  ok(erroVisual.state === 'error' && erroVisual.color === 'rgb(255, 63, 208)' && erroVisual.particle === 'ff3fd0', 'sequência incorreta aciona glitch magenta no HUD e no fluxo de dados')
  const hackSequence = await page.evaluate(() => [...mini.seq])
  const hackPadButtons = [14, 12, 15, 13]
  for (const direction of hackSequence) {
    await setPadButton(hackPadButtons[direction], true)
    await page.waitForTimeout(70)
    await setPadButton(hackPadButtons[direction], false)
    await page.waitForTimeout(70)
  }
  await page.waitForFunction(() => document.getElementById('hackPanel').dataset.state === 'committed', null, { timeout: 5000 })
  ok(await page.evaluate(() => document.getElementById('hackState').textContent === 'VIGILÂNCIA TOTAL // COMPROMETIDA'), 'D-pad reproduz sequência correta, concede root e compromete a Vigilância Total')
  await page.screenshot({ path: '/tmp/anarco-hack-desktop.png' })

  // O mesmo fluxo em viewport touch: HUD compacto acima do minigame e fora dos botões inferiores.
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, screen: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' })
  const mobilePage = await mobileContext.newPage()
  let blockedLaptopAttempts = 0
  await mobilePage.route('**/assets/models/laptop.mdl', route => route.abort())
  mobilePage.on('request', request => { if (new URL(request.url()).pathname.endsWith('/laptop.mdl')) blockedLaptopAttempts++ })
  mobilePage.on('pageerror', e => erros.push('mobile pageerror: ' + String(e).slice(0, 160)))
  await mobilePage.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'domcontentloaded' })
  await mobilePage.waitForSelector('#st', { state: 'visible', timeout: 30000 })
  await mobilePage.click('#st')
  await mobilePage.waitForFunction(() => document.body.lastElementChild?.querySelectorAll('pre')[1]?.textContent.includes('OPERAÇÃO BREACH'), null, { timeout: 8000 })
  const arteMobile = await mobilePage.evaluate(() => {
    const overlay = document.body.lastElementChild, art = overlay.querySelector('pre'), shell = art.parentElement
    return { lines: art.textContent.split('\n').length, clipped: art.scrollWidth > shell.clientWidth, pageWidth: document.documentElement.scrollWidth, viewport: innerWidth }
  })
  ok(arteMobile.lines >= 16 && !arteMobile.clipped && arteMobile.pageWidth === arteMobile.viewport, 'emblema ASCII maior completo e sem rolagem horizontal no celular')
  await mobilePage.screenshot({ path: '/tmp/anarco-intro-mobile.png' })
  await mobilePage.mouse.click(195, 300)
  await mobilePage.waitForFunction(() => state === 'play', null, { timeout: 30000 })
  const touchTargetsPortrait = await mobilePage.evaluate(() => {
    const height = selector => [...document.querySelectorAll(selector)].filter(el => getComputedStyle(el).display !== 'none').map(el => Math.round(el.getBoundingClientRect().height))
    return { actions: height('#touchActions button'), routes: height('#routePicker button'), hud: height('#hudActions button') }
  })
  ok([...touchTargetsPortrait.actions, ...touchTargetsPortrait.routes, ...touchTargetsPortrait.hud].every(height => height >= 44), 'alvos touch visíveis têm pelo menos 44px em retrato')
  await mobilePage.setViewportSize({ width: 844, height: 390 })
  const touchTargetsLandscape = await mobilePage.evaluate(() => {
    const height = selector => [...document.querySelectorAll(selector)].filter(el => getComputedStyle(el).display !== 'none').map(el => Math.round(el.getBoundingClientRect().height))
    return { actions: height('#touchActions button'), routes: height('#routePicker button'), hud: height('#hudActions button'), pageWidth: document.documentElement.scrollWidth }
  })
  ok([...touchTargetsLandscape.actions, ...touchTargetsLandscape.routes, ...touchTargetsLandscape.hud].every(height => height >= 44) && touchTargetsLandscape.pageWidth === 844, 'alvos touch mantêm 44px em paisagem sem rolagem horizontal')
  // v4.2.1: celular deitado — HUD enxuto e tutorial fora dos botões de habilidade (regressão do HUD de ~40% da altura).
  for (const [width, height] of [[844, 390], [667, 375], [932, 430]]) {
    await mobilePage.setViewportSize({ width, height })
    await mobilePage.evaluate(() => { tut = 0; tutShow() })
    await mobilePage.waitForFunction(() => !document.getElementById('tut').hidden, null, { timeout: 5000 })
    await mobilePage.waitForTimeout(400)
    const landscapeHud = await mobilePage.evaluate(() => {
      const rect = id => { const r = document.getElementById(id).getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom } }
      const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
      const tut = rect('tut'), hud = rect('hud')
      const skills = ['bz', 'hx', 'vx'].map(id => [id, rect(id)])
      return {
        hudRatio: hud.bottom / innerHeight, tutBelowHud: tut.top >= hud.bottom, tutInside: tut.left >= 0 && tut.right <= innerWidth && tut.bottom <= innerHeight,
        coveredSkills: skills.filter(([, r]) => hit(tut, r)).map(([id]) => id),
        objClear: !hit(rect('obj'), tut), pageWidth: document.documentElement.scrollWidth, viewport: innerWidth,
        readoutsStillAnnounced: ['drread', 'sideRead', 'routeRead'].every(id => document.getElementById(id).getBoundingClientRect().width <= 2 && getComputedStyle(document.getElementById(id)).display !== 'none'),
      }
    })
    ok(landscapeHud.hudRatio <= 0.15 && landscapeHud.tutBelowHud && landscapeHud.tutInside && landscapeHud.coveredSkills.length === 0 && landscapeHud.objClear && landscapeHud.pageWidth === landscapeHud.viewport,
      `HUD enxuto (${(landscapeHud.hudRatio * 100).toFixed(0)}% da altura) e tutorial sem cobrir BREACH/EMP/VÍRUS em ${width}×${height}`)
    ok(landscapeHud.readoutsStillAnnounced, `leituras secundárias do HUD continuam acessíveis a leitores de tela em ${width}×${height}`)
  }
  await mobilePage.evaluate(() => { tut = -1; tutShow() })
  await mobilePage.setViewportSize({ width: 390, height: 844 })
  await mobilePage.evaluate(() => {
    tut = -1; tutShow(); const t = towers[2]; drones.forEach(d => d.position.set(90, 5, 90));
    P.position.set(t.x + 4.75, 0, t.z + 0.2); vel.set(0, 0, 0); t.p = 0.995; grace = 120;
  })
  await mobilePage.waitForFunction(() => !!mini && !document.getElementById('hackPanel').hidden, null, { timeout: 10000 })
  await mobilePage.waitForFunction(() => !lapModelLoad && !lapModelReady, null, { timeout: 5000 })
  const laptopFallback = await mobilePage.evaluate(() => ({ ready: lapModelReady, placeholder: lapG.children.length >= 2, playing: !!mini }))
  ok(blockedLaptopAttempts === 1 && !laptopFallback.ready && laptopFallback.placeholder && laptopFallback.playing, 'se o modelo do notebook falha, o placeholder permanece e o hack continua sem bloqueio')
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
  const swControlReady = await page.waitForFunction(() => !!navigator.serviceWorker?.controller, null, { timeout: 10000 }).then(() => true).catch(() => false)
  ok(swControlReady, 'service worker controla a sessão para cache offline')
  if (swControlReady) {
    const offlinePage = await context.newPage()
    try {
      await offlinePage.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'domcontentloaded' })
      await offlinePage.waitForSelector('#st', { state: 'visible', timeout: 30000 })
      await offlinePage.waitForFunction(() => !!navigator.serviceWorker?.controller, null, { timeout: 10000 })
      await context.setOffline(true)
      await offlinePage.reload({ waitUntil: 'domcontentloaded' })
      await offlinePage.waitForSelector('#st', { state: 'visible', timeout: 15000 })
      await offlinePage.click('#st')
      await offlinePage.waitForFunction(() => ['connect', 'stream', 'error', 'root'].every(key => !!customAudioBuffers[key]), null, { timeout: 20000 })
      await offlinePage.mouse.click(500, 300)
      await offlinePage.waitForFunction(() => state === 'play', null, { timeout: 15000 })
      const cachedAudio = await offlinePage.waitForFunction(() => !!customAudioBuffers.music, null, { timeout: 20000 }).then(() => true).catch(() => false)
      ok(cachedAudio, 'jogo, quatro efeitos e trilha previamente carregados funcionam offline após iniciar')
    } catch (error) {
      ok(false, `shell/áudio offline após primeira carga: ${String(error).slice(0, 140)}`)
    } finally {
      await context.setOffline(false)
      await offlinePage.close()
    }
  }
  ok(erros.length === 0, `nenhum erro no console/HTTP ${erros.length ? JSON.stringify(erros.slice(0, 3)) : ''}`)
  await browser.close()
} finally {
  server.kill()
}
if (falhas.length) { console.error(`\n${falhas.length} falha(s)`); process.exit(1) }
console.log('\ne2e: tudo certo')
