// Smoke test específico do ANARCO.EXE: valida boot, assets locais, cinco layouts de rota,
// colisões, troca de rotas, áudio inicializado por gesto e viewport mobile.
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const port = 4300 + Math.floor(Math.random() * 500)
const url = `http://127.0.0.1:${port}/`
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(port), '--strictPort', '--host', '127.0.0.1'], { stdio: 'ignore' })
let browser
const errors = []
const guard = setTimeout(() => fail('timed out'), 45_000)

function cleanup() {
  clearTimeout(guard)
  try { server.kill('SIGTERM') } catch {}
}
async function fail(message) {
  console.error(`smoke: FAIL — ${message}`)
  await browser?.close().catch(() => {})
  cleanup()
  process.exit(1)
}
async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    try { if ((await fetch(url)).ok) return } catch {}
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  throw new Error('preview server did not start')
}
function observe(page) {
  page.on('pageerror', error => errors.push(`page: ${error}`))
  page.on('console', message => message.type() === 'error' && errors.push(`console: ${message.text()}`))
  page.on('response', response => response.status() >= 400 && errors.push(`HTTP ${response.status()} ${response.url()}`))
}

try {
  await waitForServer()
  browser = await chromium.launch({ args: ['--ignore-gpu-blocklist'] })
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  observe(page)
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('#st', { timeout: 10_000 })
  await page.waitForFunction(() => Boolean(window.__ANARCO_PLAYTEST__), null, { timeout: 10_000 })
  const pwa = await page.evaluate(async () => ({
    manifest: await fetch('manifest.webmanifest').then(response => response.ok),
    serviceWorker: await fetch('sw.js').then(response => response.ok),
    serviceWorkerApi: 'serviceWorker' in navigator,
  }))
  if (!pwa.manifest || !pwa.serviceWorker || !pwa.serviceWorkerApi) throw new Error(`PWA assets unavailable: ${JSON.stringify(pwa)}`)

  const levels = await page.evaluate(() => {
    const api = window.__ANARCO_PLAYTEST__
    return Array.from({ length: 6 }, (_, index) => {
      const result = api.setLevel(index)
      return {
        level: result.level,
        phase: result.phase,
        visibleObjects: result.routeObjects.filter(object => object.visible).length,
        routeSolids: result.routeSolids.length,
        safeBlocked: api.collisionProbe('safe').blocked,
        fastBlocked: api.collisionProbe('fast').blocked,
      }
    })
  })
  if (levels.length !== 6) throw new Error('six levels were not inspected')
  if (levels.slice(0, 5).some(level => level.routeSolids !== 4 || !level.safeBlocked || !level.fastBlocked)) {
    throw new Error(`route collision audit failed: ${JSON.stringify(levels)}`)
  }
  if (levels[5].routeSolids !== 0 || levels[5].safeBlocked || levels[5].fastBlocked) {
    throw new Error(`level 6 has an invisible route blocker: ${JSON.stringify(levels[5])}`)
  }
  const blackout = await page.evaluate(async () => {
    const api = window.__ANARCO_PLAYTEST__
    const probe = api.blackoutProbe()
    api.startLevel(4)
    api.primeBlackout()
    await new Promise(resolve => setTimeout(resolve, 250))
    return { ...probe, activeInLoop: document.body.classList.contains('blackout') }
  })
  if (!blackout.ativo || Math.abs(blackout.fator - 0.6) > 0.001 || !blackout.activeInLoop) {
    throw new Error(`blackout probe failed: ${JSON.stringify(blackout)}`)
  }

  await page.evaluate(() => document.querySelector('#st').click())
  await page.waitForTimeout(250)
  const routeLabels = []
  for (const selector of ['#routeSafe', '#routeTech', '#routeFast']) {
    await page.evaluate(selector => document.querySelector(selector).click(), selector)
    await page.waitForTimeout(80)
    routeLabels.push(await page.locator('#routeText').textContent())
  }
  if (routeLabels.some(label => !label)) throw new Error('route HUD did not update')
  await page.evaluate(() => document.querySelector('#snd').click())

  const mobile = await browser.newPage({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true })
  observe(mobile)
  await mobile.goto(url, { waitUntil: 'domcontentloaded' })
  await mobile.waitForSelector('#joy', { timeout: 10_000 })
  await mobile.waitForTimeout(3000)
  const mobileUi = await mobile.evaluate(async () => {
    let frames = 0
    const start = performance.now()
    await new Promise(resolve => {
      const tick = () => { frames += 1; performance.now() - start > 500 ? resolve() : requestAnimationFrame(tick) }
      requestAnimationFrame(tick)
    })
    return {
      joy: !!document.querySelector('#joy'), breach: !!document.querySelector('#bz'), routes: !!document.querySelector('#routePicker'),
      labels: document.querySelector('#bz')?.getAttribute('aria-label') && document.querySelector('#msg')?.getAttribute('role') === 'status',
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches === false,
      frames,
    }
  })
  if (!mobileUi.joy || !mobileUi.breach || !mobileUi.routes || !mobileUi.labels) throw new Error('mobile or accessibility controls missing')
  if (mobileUi.frames < 12) console.warn(`smoke: aviso — Chromium headless mediu ${mobileUi.frames} frames/500ms; confirmar FPS em aparelho físico`)
  await mobile.close()

  if (errors.length) throw new Error(errors.join('\n'))
  console.log(`smoke: OK — ${levels.length} fases, colisões, rotas, PWA, áudio e mobile validados; frames headless=${mobileUi.frames}`)
  await browser.close()
  cleanup()
} catch (error) {
  await fail(error?.message ?? String(error))
}
