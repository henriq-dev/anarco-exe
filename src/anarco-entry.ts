import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { AnarcoFxSystem } from './anarco-fx'
import { ANARCO_GAMEPLAY_CONFIG, type AnarcoGameplayConfig } from './anarco-gameplay-config'
import { createVersionedSaveStorage, type VersionedSaveStorage } from './anarco-save-migration'
import type { AnarcoPerfCaptureFactory } from './anarco-perf'

class DeferredMeshoptGLTFLoader {
  constructor(private readonly manager?: THREE.LoadingManager) {}

  loadAsync(url: string): Promise<unknown> {
    return import('./anarco-boss-loader').then(({ loadBossGltf }) => loadBossGltf(url, this.manager))
  }
}

const legacy = window as typeof window & {
  THREE?: typeof THREE
  GLTFLoader?: new (manager?: THREE.LoadingManager) => { loadAsync(url: string): Promise<unknown> }
  BOSS_MODEL_URLS?: Record<string, string>
  ANARCO_FX?: { AnarcoFxSystem: typeof AnarcoFxSystem; modules: { mergeGeometries: typeof mergeGeometries } }
  __ANARCO_FX_INSTANCE__?: AnarcoFxSystem
  __ANARCO_DEBUG__?: boolean
  __ANARCO_PERF_FACTORY__?: AnarcoPerfCaptureFactory
  ANARCO_GAMEPLAY_CONFIG?: AnarcoGameplayConfig
  ANARCO_SAVE_STORAGE?: VersionedSaveStorage
}

legacy.ANARCO_GAMEPLAY_CONFIG = ANARCO_GAMEPLAY_CONFIG
legacy.ANARCO_SAVE_STORAGE = createVersionedSaveStorage()
legacy.THREE = THREE
legacy.GLTFLoader = DeferredMeshoptGLTFLoader
legacy.ANARCO_FX = {
  AnarcoFxSystem,
  modules: { mergeGeometries },
}
legacy.__ANARCO_DEBUG__ = import.meta.env.DEV
legacy.BOSS_MODEL_URLS = {
  banqueiro: new URL('assets/models/boss-banqueiro-animated.glb', document.baseURI).toString(),
  petroleo: new URL('assets/models/boss-petroleo-rigged.glb', document.baseURI).toString(),
  ceo: new URL('assets/models/boss-ceo-rigged.glb', document.baseURI).toString(),
}

const bootScreen = document.getElementById('bootScreen') as HTMLDivElement | null
const bootStatus = document.getElementById('bootStatus')
const bootRetry = document.getElementById('bootRetry')
let bootFailed = false
function failBoot(message: string): void {
  bootFailed = true
  if (bootStatus) bootStatus.textContent = message
  bootScreen?.setAttribute('role', 'alert')
  bootScreen?.setAttribute('aria-live', 'assertive')
  bootRetry?.removeAttribute('hidden')
}
bootRetry?.addEventListener('click', () => window.location.reload())
window.addEventListener('error', () => {
  if (bootScreen && !bootScreen.hidden) failBoot('O jogo encontrou um erro ao iniciar. Tente novamente.')
})
window.addEventListener('unhandledrejection', () => {
  if (bootScreen && !bootScreen.hidden) failBoot('Um recurso não respondeu. Verifique a conexão e tente novamente.')
})

const runtime = document.createElement('script')
runtime.src = new URL('script.js', document.baseURI).toString()
runtime.async = false
runtime.onerror = () => {
  failBoot('Não foi possível carregar o runtime local. Recarregue a página e tente novamente.')
}
runtime.onload = () => {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (!bootFailed && bootScreen) bootScreen.hidden = true
  }))
  if (!import.meta.env.DEV) return
  void (async () => {
    const [{ registerGameTuning }, { tuning }] = await Promise.all([
      import('../scripts/manus-tuning/adapter.js'),
      import('./game/tuning'),
    ])
    const fx = legacy.__ANARCO_FX_INSTANCE__
    if (fx) tuning.apply({ 'fx.quality': ['low', 'medium', 'high'].indexOf(fx.selectedQuality) })
    await registerGameTuning(tuning)
  })().catch(error => console.error('ANARCO.EXE Tweak registration failed', error))
}

async function bootRuntime(): Promise<void> {
  if (new URLSearchParams(location.search).get('perf') === '1') {
    try {
      const { createAnarcoPerfCapture } = await import('./anarco-perf')
      legacy.__ANARCO_PERF_FACTORY__ = createAnarcoPerfCapture
    } catch (error) {
      console.warn('ANARCO.EXE performance capture could not be loaded; continuing without it.', error)
    }
  }
  document.body.appendChild(runtime)
}

void bootRuntime()
