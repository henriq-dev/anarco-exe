import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { AnarcoFxSystem } from './anarco-fx'

const legacy = window as typeof window & {
  THREE?: typeof THREE
  GLTFLoader?: typeof GLTFLoader
  BOSS_MODEL_URLS?: Record<string, string>
  ANARCO_FX?: { AnarcoFxSystem: typeof AnarcoFxSystem; modules: Record<string, unknown> }
  __ANARCO_FX_INSTANCE__?: AnarcoFxSystem
  __ANARCO_DEBUG__?: boolean
}

legacy.THREE = THREE
legacy.GLTFLoader = GLTFLoader
legacy.ANARCO_FX = {
  AnarcoFxSystem,
  modules: { EffectComposer, RenderPass, UnrealBloomPass, OutputPass },
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
document.body.appendChild(runtime)
