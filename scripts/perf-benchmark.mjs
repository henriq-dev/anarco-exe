// Benchmark reproduzível da build de produção (não equivale a GPU física nem a telefone real).
// Uso: pnpm build && pnpm perf; sobrescrita: PERF_SECONDS=10 PERF_OUTPUT=... pnpm perf
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { chromium } from 'playwright'

const PORT = Number(process.env.PERF_PORT || 4176)
const URL = `http://127.0.0.1:${PORT}`
const DURATION = Math.max(3, Math.min(30, Number(process.env.PERF_SECONDS || 6)))
const OUTPUT = resolve(process.env.PERF_OUTPUT || 'docs/performance/latest-swiftshader.json')
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', 'dist'], { stdio: 'ignore' })
let browser

const waitForServer = async () => {
  const deadline = Date.now() + 10000
  while (Date.now() < deadline) {
    try { const response = await fetch(`${URL}/`); if (response.ok) return } catch { /* servidor ainda iniciando */ }
    await new Promise(resolve => setTimeout(resolve, 150))
  }
  throw new Error(`A build em dist/ não respondeu em ${URL}`)
}

const drawCallInit = () => {
  window.__anarcoDrawFrames = []
  window.__anarcoDrawCalls = 0
  const prototypes = [window.WebGLRenderingContext?.prototype, window.WebGL2RenderingContext?.prototype].filter(Boolean)
  for (const prototype of prototypes) {
    for (const name of ['drawArrays', 'drawElements', 'drawRangeElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
      const original = prototype[name]
      if (typeof original !== 'function' || original.__anarcoDrawHook) continue
      const wrapped = function (...args) { window.__anarcoDrawCalls += 1; return original.apply(this, args) }
      wrapped.__anarcoDrawHook = true
      prototype[name] = wrapped
    }
  }
  const requestFrame = window.requestAnimationFrame.bind(window)
  window.requestAnimationFrame = callback => requestFrame(timestamp => {
    window.__anarcoDrawCalls = 0
    callback(timestamp)
    window.__anarcoDrawFrames.push({ timestamp, calls: window.__anarcoDrawCalls })
    if (window.__anarcoDrawFrames.length > 1200) window.__anarcoDrawFrames.shift()
  })
}

const percentile = (values, quantile) => values.length ? values[Math.min(values.length - 1, Math.ceil((values.length - 1) * quantile))] : null
const summaryDrawCalls = frames => {
  const calls = frames.map(frame => frame.calls).sort((a, b) => a - b)
  const intervals = frames.slice(1).map((frame, index) => frame.timestamp - frames[index].timestamp).filter(value => value > 0 && value < 250).sort((a, b) => a - b)
  return {
    samples: calls.length,
    drawCalls: { p50: percentile(calls, 0.5), p95: percentile(calls, 0.95), min: percentile(calls, 0), max: percentile(calls, 1) },
    frameIntervalMs: { p50: percentile(intervals, 0.5), p95: percentile(intervals, 0.95) },
  }
}

async function prepareScene(page, quality = 'low') {
  await page.goto(`${URL}/?perf=1`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => !!window.__ANARCO_PLAYTEST__ && !!window.__ANARCO_PERF__, null, { timeout: 20000 })
  await page.evaluate(quality => {
    window.__ANARCO_PLAYTEST__.startLevel(0)
    const select = document.getElementById('fxQuality')
    select.value = quality
    select.dispatchEvent(new Event('change'))
    P.position.set(0, 0, 0)
    vel.set(0, 0, 0)
    C.position.set(0, 14, 36)
  }, quality)
  await page.waitForTimeout(2000)
}

async function measureDrawScenario(hideSkyline) {
  const context = await browser.newContext({ viewport: { width: 1000, height: 560 }, deviceScaleFactor: 1 })
  await context.addInitScript(drawCallInit)
  const page = await context.newPage()
  try {
    await prepareScene(page, 'low')
    if (hideSkyline) await page.evaluate(() => sky.forEach(object => { object.visible = false }))
    await page.waitForTimeout(250)
    const baseline = await page.evaluate(() => window.__anarcoDrawFrames.length)
    await page.waitForTimeout(3000)
    const draw = await page.evaluate(start => window.__anarcoDrawFrames.slice(start), baseline)
    return { scene: hideSkyline ? 'skyline-hidden-control' : 'skyline-visible', quality: 'low', level: 1, ...summaryDrawCalls(draw) }
  } finally { await context.close() }
}

async function measureDeviceProfile(label, contextOptions, quality) {
  const context = await browser.newContext(contextOptions)
  const page = await context.newPage()
  try {
    await prepareScene(page, quality)
    await page.evaluate(([scene, seconds]) => window.__ANARCO_PERF__.start(scene, seconds), [label, DURATION])
    await page.waitForFunction(() => !window.__ANARCO_PERF__.active, null, { timeout: (DURATION + 30) * 1000 })
    return await page.evaluate(() => window.__ANARCO_PERF__.report())
  } finally { await context.close() }
}

try {
  await waitForServer()
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
  })
  const drawVisible = await measureDrawScenario(false)
  const drawHidden = await measureDrawScenario(true)
  const desktopProfile = await measureDeviceProfile('desktop-emulated', { viewport: { width: 1000, height: 560 }, deviceScaleFactor: 1 }, 'high')
  const mobileProfile = await measureDeviceProfile('mobile-touch-emulated', {
    viewport: { width: 390, height: 844 }, screen: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  }, 'medium')
  const result = {
    benchmarkSchemaVersion: 1,
    capturedAt: new Date().toISOString(),
    environment: {
      browser: `Chromium ${browser.version()} via Playwright`,
      renderer: 'SwiftShader WebGL software rendering',
      physicalDevice: false,
      viewportComparison: 'desktop 1000×560 DPR 1; touch-emulated 390×844 DPR 2',
      warning: 'Métricas da sessão de software emulada; não são FPS de GPU física nem de telefone real. Para aparelhos, abra a build com ?perf=1 e exporte o JSON pelo painel local.',
    },
    skylineDrawCalls: {
      method: 'contagem dos comandos WebGL draw* por quadro em sessão fresca, mesma câmera e FX Baixa fixa; perfil separado da telemetria de frame time',
      visible: drawVisible,
      hiddenControl: drawHidden,
      savedAtMedian: drawVisible.drawCalls.p50 - drawHidden.drawCalls.p50,
      savedAtP95: drawVisible.drawCalls.p95 - drawHidden.drawCalls.p95,
    },
    frameProfiles: [desktopProfile, mobileProfile],
  }
  mkdirSync(dirname(OUTPUT), { recursive: true })
  writeFileSync(OUTPUT, JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify({
    file: OUTPUT,
    renderer: result.environment.renderer,
    skyline: { visibleP50: drawVisible.drawCalls.p50, hiddenP50: drawHidden.drawCalls.p50, savedP50: result.skylineDrawCalls.savedAtMedian, savedP95: result.skylineDrawCalls.savedAtP95 },
    frameProfiles: [desktopProfile, mobileProfile].map(profile => ({ scene: profile.capture.scene, samples: profile.capture.samples, averageFps: profile.frameCadence.averageFps, frameP95Ms: profile.frameCadence.frameIntervalMs.p95, updateP95Ms: profile.cpuTimeMs.updateAndGameLogic.p95, renderSubmitP95Ms: profile.cpuTimeMs.renderSubmission.p95, selectedQuality: profile.renderer.quality.selected, effectiveQuality: profile.renderer.quality.effective })),
  }, null, 2))
} finally {
  await browser?.close().catch(() => {})
  server.kill('SIGTERM')
}
