import type { AnarcoFxSystem } from './anarco-fx'

export type AnarcoPerfCaptureFactory = (fxSystem: AnarcoFxSystem) => {
  frame: (timestamp: number, updateMs: number, renderMs: number) => void
}

type PerfApi = {
  start: (scene?: string, durationSeconds?: number) => { scene: string; durationSeconds: number; started: true }
  setScene: (scene: string) => string
  report: () => Record<string, unknown>
  download: () => void
  readonly active: boolean
}

type QualitySnapshot = {
  selected: string
  effective: string
  resolutionScale: number
  pixelRatio: number
}

declare global {
  interface Window { __ANARCO_PERF__?: PerfApi }
}

export function createAnarcoPerfCapture(fxSystem: AnarcoFxSystem): ReturnType<AnarcoPerfCaptureFactory> {
  const CAPACITY = 18000
  const intervals = new Float32Array(CAPACITY)
  const updateTimes = new Float32Array(CAPACITY)
  const renderTimes = new Float32Array(CAPACITY)
  let writeIndex = 0
  let sampleCount = 0
  let totalSamples = 0
  let previousTimestamp: number | null = null
  let captureStart = 0
  let captureEnd = 0
  let targetSeconds = 30
  let captureActive = false
  let hasCapture = false
  let sceneName = 'não definido'
  let excludedIntervals = 0
  let backgroundGaps = 0
  let intervalTotal = 0
  let over16 = 0
  let over22 = 0
  let over33 = 0
  let over50 = 0
  let qualityTransitions: Array<{ offsetMs: number } & QualitySnapshot> = []
  let sceneTransitions: Array<{ offsetMs: number; scene: string }> = []
  let statusNode: HTMLElement | null = null

  const sortedValues = (buffer: Float32Array): number[] => {
    const values = new Array<number>(sampleCount)
    const first = (writeIndex - sampleCount + CAPACITY) % CAPACITY
    for (let i = 0; i < sampleCount; i += 1) values[i] = buffer[(first + i) % CAPACITY]
    return values.sort((a, b) => a - b)
  }
  const percentile = (values: number[], quantile: number): number | null => values.length
    ? +values[Math.min(values.length - 1, Math.ceil((values.length - 1) * quantile))].toFixed(2)
    : null
  const summary = (values: number[]) => values.length ? {
    p50: percentile(values, 0.5), p95: percentile(values, 0.95), p99: percentile(values, 0.99),
    average: +(values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2),
    max: +values[values.length - 1].toFixed(2),
  } : { p50: null, p95: null, p99: null, average: null, max: null }
  const updateStatus = () => {
    if (statusNode) statusNode.textContent = captureActive ? `CAPTURANDO // ${sampleCount} quadros` : `PRONTO // ${sampleCount} quadros`
  }
  const currentQuality = (): QualitySnapshot => {
    const metrics = fxSystem.getDiagnostics()
    return {
      selected: metrics.quality.selected,
      effective: metrics.quality.effective,
      resolutionScale: metrics.quality.resolutionScale,
      pixelRatio: metrics.pixelRatio,
    }
  }
  const recordQuality = () => {
    if (!captureActive) return
    const quality = currentQuality()
    const last = qualityTransitions[qualityTransitions.length - 1]
    if (!last || last.selected !== quality.selected || last.effective !== quality.effective || last.resolutionScale !== quality.resolutionScale || last.pixelRatio !== quality.pixelRatio) {
      qualityTransitions.push({ offsetMs: +(performance.now() - captureStart).toFixed(1), ...quality })
    }
  }
  const qualityObserver = new MutationObserver(recordQuality)
  qualityObserver.observe(document.body, { attributes: true, attributeFilter: ['data-fx-quality', 'data-fx-base-quality'] })

  const start = (scene = 'manual', durationSeconds = 30) => {
    intervals.fill(0)
    updateTimes.fill(0)
    renderTimes.fill(0)
    writeIndex = 0
    sampleCount = 0
    totalSamples = 0
    excludedIntervals = 0
    backgroundGaps = 0
    intervalTotal = 0
    over16 = over22 = over33 = over50 = 0
    qualityTransitions = []
    sceneTransitions = []
    previousTimestamp = null
    sceneName = String(scene).slice(0, 60)
    targetSeconds = Math.max(3, Math.min(300, Number(durationSeconds) || 30))
    captureStart = performance.now()
    captureEnd = captureStart + targetSeconds * 1000
    captureActive = true
    hasCapture = true
    sceneTransitions.push({ offsetMs: 0, scene: sceneName })
    qualityTransitions.push({ offsetMs: 0, ...currentQuality() })
    updateStatus()
    return { scene: sceneName, durationSeconds: targetSeconds, started: true as const }
  }
  const setScene = (scene: string) => {
    sceneName = String(scene).slice(0, 60)
    if (captureActive) sceneTransitions.push({ offsetMs: +(performance.now() - captureStart).toFixed(1), scene: sceneName })
    return sceneName
  }
  const recordFrame = (timestamp: number, updateMs: number, renderMs: number) => {
    if (!captureActive || !Number.isFinite(timestamp)) return
    if (timestamp >= captureEnd) {
      captureActive = false
      updateStatus()
      return
    }
    if (previousTimestamp !== null) {
      const interval = timestamp - previousTimestamp
      if (document.hidden || interval <= 0 || interval >= 250) {
        excludedIntervals += 1
        if (interval >= 250) backgroundGaps += 1
      } else {
        intervals[writeIndex] = interval
        updateTimes[writeIndex] = updateMs
        renderTimes[writeIndex] = renderMs
        writeIndex = (writeIndex + 1) % CAPACITY
        sampleCount = Math.min(CAPACITY, sampleCount + 1)
        totalSamples += 1
        intervalTotal += interval
        if (interval > 16.7) over16 += 1
        if (interval > 22) over22 += 1
        if (interval > 33.3) over33 += 1
        if (interval > 50) over50 += 1
      }
    }
    previousTimestamp = timestamp
  }
  const report = () => {
    const frameValues = sortedValues(intervals)
    const updateValues = sortedValues(updateTimes)
    const renderValues = sortedValues(renderTimes)
    const diagnostics = fxSystem.getDiagnostics()
    const nav = navigator as Navigator & {
      userAgentData?: { platform: string; mobile: boolean; brands: Array<{ brand: string; version: string }> }
      deviceMemory?: number
    }
    const uaData = nav.userAgentData ? { platform: nav.userAgentData.platform, mobile: nav.userAgentData.mobile, brands: nav.userAgentData.brands } : null
    return {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      capture: {
        scene: sceneName,
        targetSeconds,
        actualSeconds: hasCapture ? +Math.min(targetSeconds, (performance.now() - captureStart) / 1000).toFixed(2) : 0,
        samples: sampleCount,
        totalSamples,
        overwrittenSamples: Math.max(0, totalSamples - sampleCount),
        activeFrameTimeMs: +intervalTotal.toFixed(1),
        excludedIntervals,
        backgroundGaps,
        complete: hasCapture && !captureActive && performance.now() >= captureEnd,
      },
      frameCadence: {
        averageFps: intervalTotal > 0 ? +(totalSamples * 1000 / intervalTotal).toFixed(2) : null,
        frameIntervalMs: summary(frameValues),
        slowFrames: { over16_7ms: over16, over22ms: over22, over33_3ms: over33, over50ms: over50 },
      },
      cpuTimeMs: {
        updateAndGameLogic: summary(updateValues),
        renderSubmission: summary(renderValues),
        note: 'Tempo síncrono no main thread; renderSubmission não é tempo de GPU.',
      },
      device: {
        userAgent: nav.userAgent,
        userAgentData: uaData,
        viewport: { width: innerWidth, height: innerHeight, devicePixelRatio, screenWidth: screen.width, screenHeight: screen.height, screenPixelDepth: screen.pixelDepth },
        pointerCoarse: matchMedia('(pointer: coarse)').matches,
        maxTouchPoints: nav.maxTouchPoints || 0,
        hardwareConcurrency: nav.hardwareConcurrency || null,
        deviceMemoryGiB: nav.deviceMemory || null,
      },
      renderer: {
        ...diagnostics,
        qualityLabel: document.getElementById('fxQualityStatus')?.textContent || null,
        bodyQuality: { selected: document.body.dataset.fxBaseQuality || null, effective: document.body.dataset.fxQuality || null },
      },
      qualityTransitions,
      sceneTransitions,
      limitations: [
        'Cadência RAF não prova FPS de GPU.',
        'A captura descarta abas ocultas e intervalos de 250 ms ou mais.',
        'UA, pointer e hardwareConcurrency são indícios do dispositivo, não prova de modelo físico.',
      ],
    }
  }
  const download = () => {
    const blob = new Blob([JSON.stringify(report(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `anarco-perf-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  window.__ANARCO_PERF__ = { start, setScene, report, download, get active() { return captureActive } }
  const style = document.createElement('style')
  style.textContent = '#anarcoPerfPanel{position:fixed;z-index:2147483000;top:calc(8px + env(safe-area-inset-top));right:8px;width:min(236px,calc(100vw - 16px));padding:10px;background:rgba(3,10,15,.94);border:1px solid #2fe6ff;box-shadow:0 0 18px #2fe6ff45;color:#b9ffff;font:11px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.04em}#anarcoPerfPanel strong{display:block;color:#39ff88;font-size:11px;margin-bottom:4px}#anarcoPerfPanel small{display:block;color:#94a8b6;margin-bottom:8px}#anarcoPerfPanel button{width:100%;min-height:36px;margin-top:5px;border:1px solid #2fe6ff;background:#07171c;color:#b9ffff;font:inherit;font-weight:700;touch-action:manipulation}#anarcoPerfPanel button:active{background:#10333a}#anarcoPerfPanel [data-status]{display:block;margin-top:6px;color:#39ff88}'
  document.head.appendChild(style)
  const panel = document.createElement('section')
  panel.id = 'anarcoPerfPanel'
  panel.setAttribute('aria-label', 'Medição local de desempenho')
  panel.innerHTML = '<strong>PERF // TELEMETRIA LOCAL</strong><small>Opt-in · sem envio de dados</small><button type="button" data-start>CAPTURAR 30 s</button><button type="button" data-export>BAIXAR JSON</button><span data-status aria-live="polite">PRONTO // 0 quadros</span>'
  document.body.appendChild(panel)
  statusNode = panel.querySelector('[data-status]')
  panel.querySelector('[data-start]')?.addEventListener('click', () => start('manual', 30))
  panel.querySelector('[data-export]')?.addEventListener('click', download)
  window.setInterval(updateStatus, 500)

  return { frame: recordFrame }
}
