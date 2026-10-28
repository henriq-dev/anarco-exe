import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

export type FxQuality = 'low' | 'medium' | 'high'
export const FX_QUALITY_ORDER: FxQuality[] = ['low', 'medium', 'high']

export function lowerQuality(value: FxQuality): FxQuality {
  return FX_QUALITY_ORDER[Math.max(0, FX_QUALITY_ORDER.indexOf(value) - 1)]
}

export const FX_QUALITY_PRESETS: Record<FxQuality, { particles: number; dpr: number; lights: number; fullBloom: boolean; shadows: boolean }> = {
  low: { particles: 100, dpr: 1, lights: 0, fullBloom: false, shadows: false },
  medium: { particles: 280, dpr: 1.35, lights: 4, fullBloom: false, shadows: false },
  high: { particles: 520, dpr: 2, lights: 7, fullBloom: true, shadows: true },
}

export interface FxFrameState {
  player?: THREE.Object3D
  boss?: THREE.Object3D | null
  playing?: boolean
  dodge?: boolean
  ghost?: boolean
  alert?: number
  hacking?: boolean
  blackout?: boolean
  phase?: string
}

type ParticleSlot = {
  active: boolean
  age: number
  life: number
  size: number
  gravity: number
  drag: number
  attraction: number
  repulsion: number
  bounce: number
  spin: number
  phase: number
  position: THREE.Vector3
  velocity: THREE.Vector3
  start: THREE.Color
  end: THREE.Color
}

type Echo = { node: THREE.Group; age: number; life: number; materials: THREE.Material[] }
type TimedLight = { light: THREE.PointLight; remaining: number; duration: number; peak: number }

const MAX_PARTICLES = 520
const SCREEN_FX_KINDS = new Set(['breach', 'emp', 'virus', 'dodge', 'ghost', 'alert', 'blackout', 'hack', 'boss', 'chromatic', 'industrial', 'collapse'])
const EVENT_STYLE: Record<string, { start: string; end: string; count: number; force: number; gravity: number; size: number; attraction?: number; repulsion?: number; bounce?: number }> = {
  emp: { start: '#7dffad', end: '#2fe6ff', count: 56, force: 8, gravity: -1.5, size: 0.9, repulsion: 0.8 },
  virus: { start: '#ff3fd0', end: '#8b42ff', count: 42, force: 6, gravity: -0.8, size: 0.75, attraction: 0.25 },
  breach: { start: '#efffff', end: '#2fe6ff', count: 66, force: 10, gravity: -2.5, size: 0.72, bounce: 0.18 },
  dodge: { start: '#b9ffff', end: '#347cff', count: 26, force: 5, gravity: -3, size: 0.58, bounce: 0.12 },
  ghost: { start: '#8affff', end: '#347cff', count: 34, force: 4.5, gravity: 0.4, size: 0.62, attraction: 0.5 },
  metal: { start: '#fff2d8', end: '#ff8a48', count: 24, force: 7, gravity: -12, size: 0.6, bounce: 0.24 },
  drone: { start: '#c6fbff', end: '#2fe6ff', count: 28, force: 6, gravity: -4, size: 0.62 },
  industrial: { start: '#ffb65e', end: '#632a18', count: 38, force: 3.8, gravity: 1.5, size: 0.82, bounce: 0.08 },
  code: { start: '#b9ffce', end: '#39ff88', count: 35, force: 4.2, gravity: 1.3, size: 0.66, attraction: 0.6 },
  paper: { start: '#fff8e8', end: '#ff3b52', count: 42, force: 7.2, gravity: -4.2, size: 0.74, bounce: 0.2 },
  oil: { start: '#ff9c30', end: '#171018', count: 52, force: 6.5, gravity: -1.3, size: 0.92, repulsion: 0.25 },
  data: { start: '#ff9bea', end: '#b738ff', count: 58, force: 7.4, gravity: -1, size: 0.68, attraction: 0.65 },
  boss: { start: '#fff1fa', end: '#ff3fd0', count: 100, force: 12, gravity: -7.5, size: 0.96, bounce: 0.18 },
  pickup: { start: '#f6ffe9', end: '#39ff88', count: 22, force: 4.6, gravity: -5, size: 0.6 },
  impact: { start: '#fff2de', end: '#ff4a3d', count: 22, force: 8, gravity: -8, size: 0.64, bounce: 0.16 },
}

function makeRadialTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(64, 64, 1, 64, 64, 63)
  gradient.addColorStop(0, 'rgba(255,255,255,0.72)')
  gradient.addColorStop(0.22, 'rgba(255,255,255,0.34)')
  gradient.addColorStop(0.62, 'rgba(255,255,255,0.08)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export class AnarcoFxSystem {
  private readonly positions = new Float32Array(MAX_PARTICLES * 3)
  private readonly colors = new Float32Array(MAX_PARTICLES * 3)
  private readonly alphas = new Float32Array(MAX_PARTICLES)
  private readonly sizes = new Float32Array(MAX_PARTICLES)
  private readonly slots: ParticleSlot[] = Array.from({ length: MAX_PARTICLES }, () => ({
    active: false, age: 0, life: 0, size: 0, gravity: 0, drag: 0, attraction: 0, repulsion: 0,
    bounce: 0, spin: 0, phase: 0, position: new THREE.Vector3(), velocity: new THREE.Vector3(),
    start: new THREE.Color(), end: new THREE.Color(),
  }))
  private cursor = 0
  private activeParticleLimit = MAX_PARTICLES
  private player?: THREE.Object3D
  private boss?: THREE.Object3D | null
  private phase = 'finance'
  private quality: FxQuality = 'medium'
  private adaptiveLoss = 0
  private resolutionScale = 1
  private particleDensity = 1
  private lightIntensity = 1
  private glitchIntensity = 1
  private bloomStrength = 1
  private frameCount = 0
  private slowFrames = 0
  private composer?: EffectComposer
  private bloom?: UnrealBloomPass
  private readonly lights: TimedLight[] = []
  private readonly echoes: Echo[] = []
  private echoDodgeWasActive = false
  private readonly screenFx: HTMLDivElement
  private readonly qualitySelect: HTMLSelectElement | null
  private readonly qualityStatus: HTMLElement | null
  private readonly glowTexture: THREE.CanvasTexture
  private readonly playerGlow: THREE.Sprite
  private readonly bossGlow: THREE.Sprite
  private flashTimer = 0
  private highAlert = false
  private hacking = false
  private blackout = false
  private lastIndustrialParticle = 0
  private lastCodeParticle = 0
  private readonly tmpColor = new THREE.Color()
  private readonly tmpDirection = new THREE.Vector3()
  private readonly geometry: THREE.BufferGeometry
  private readonly particlePoints: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>
  private readonly material: THREE.ShaderMaterial

  constructor(private readonly renderer: THREE.WebGLRenderer, private readonly scene: THREE.Scene, private readonly camera: THREE.PerspectiveCamera) {
    this.positions.fill(0)
    this.colors.fill(0)
    this.alphas.fill(0)
    this.sizes.fill(0)
    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage))
    this.geometry.setAttribute('aColor', new THREE.BufferAttribute(this.colors, 3).setUsage(THREE.DynamicDrawUsage))
    this.geometry.setAttribute('aAlpha', new THREE.BufferAttribute(this.alphas, 1).setUsage(THREE.DynamicDrawUsage))
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1).setUsage(THREE.DynamicDrawUsage))
    this.geometry.setDrawRange(0, MAX_PARTICLES)
    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      uniforms: { uPixelRatio: { value: renderer.getPixelRatio() } },
      vertexShader: `
        attribute vec3 aColor;
        attribute float aAlpha;
        attribute float aSize;
        uniform float uPixelRatio;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = aColor;
          vAlpha = aAlpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = clamp(aSize * uPixelRatio * 120.0 / max(2.0, -mvPosition.z), 0.0, 18.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          float edge = 1.0 - smoothstep(0.08, 0.5, d);
          gl_FragColor = vec4(vColor, vAlpha * edge);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    })
    this.particlePoints = new THREE.Points(this.geometry, this.material)
    this.particlePoints.frustumCulled = false
    this.particlePoints.renderOrder = 7
    this.scene.add(this.particlePoints)

    this.glowTexture = makeRadialTexture()
    this.playerGlow = this.makeGlowSprite('#53f6ff', 6.5)
    this.bossGlow = this.makeGlowSprite('#ff3fd0', 10)
    this.scene.add(this.playerGlow, this.bossGlow)
    for (let i = 0; i < 7; i += 1) {
      const light = new THREE.PointLight(0xffffff, 0, 12, 2)
      light.castShadow = false
      light.visible = false
      this.scene.add(light)
      this.lights.push({ light, remaining: 0, duration: 0, peak: 0 })
    }

    this.screenFx = document.getElementById('screenFx') as HTMLDivElement ?? document.createElement('div')
    this.screenFx.id = 'screenFx'
    this.screenFx.setAttribute('aria-hidden', 'true')
    if (!this.screenFx.isConnected) document.body.appendChild(this.screenFx)
    this.qualitySelect = document.getElementById('fxQuality') as HTMLSelectElement | null
    this.qualityStatus = document.getElementById('fxQualityStatus')
    this.quality = this.readSavedQuality()
    if (this.qualitySelect) {
      this.qualitySelect.value = this.quality
      this.qualitySelect.addEventListener('change', () => {
        const value = this.qualitySelect?.value
        if (value === 'low' || value === 'medium' || value === 'high') this.setQuality(value)
      })
    }
    this.applyQuality()
    window.addEventListener('anarco:fx-tweak', event => {
      const detail = (event as CustomEvent<{ id?: string; value?: number }>).detail
      if (detail?.id && typeof detail.value === 'number') this.applyTweak(detail.id, detail.value)
    })
  }

  get selectedQuality(): FxQuality { return this.quality }
  get effectiveQuality(): FxQuality { return FX_QUALITY_ORDER[Math.max(0, FX_QUALITY_ORDER.indexOf(this.quality) - this.adaptiveLoss)] }

  private readSavedQuality(): FxQuality {
    try {
      const saved = localStorage.getItem('anarco_fx_quality')
      if (saved === 'low' || saved === 'medium' || saved === 'high') return saved
    } catch { /* private browsing: use device hints */ }
    const coarse = matchMedia('(pointer: coarse)').matches
    const cores = navigator.hardwareConcurrency ?? 4
    return coarse || cores <= 4 ? 'medium' : 'high'
  }

  private makeGlowSprite(color: THREE.ColorRepresentation, size: number): THREE.Sprite {
    const material = new THREE.SpriteMaterial({ map: this.glowTexture, color, transparent: true, opacity: 0.34, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })
    const sprite = new THREE.Sprite(material)
    sprite.scale.set(size, size, 1)
    sprite.visible = false
    sprite.renderOrder = 6
    return sprite
  }

  setPlayer(player: THREE.Object3D): void { this.player = player }
  setPhase(phase: string): void { this.phase = phase }

  setQuality(quality: FxQuality, persist = true): void {
    this.quality = quality
    this.adaptiveLoss = 0
    this.resolutionScale = 1
    if (persist) try { localStorage.setItem('anarco_fx_quality', quality) } catch { /* keep session setting */ }
    this.applyQuality()
  }

  private applyTweak(id: string, value: number): void {
    if (id === 'fx.quality') {
      const quality = FX_QUALITY_ORDER[Math.round(value)]
      if (quality) this.setQuality(quality, false)
    } else if (id === 'fx.particleDensity') this.particleDensity = Math.max(0.3, Math.min(1.5, value))
    else if (id === 'fx.lightIntensity') this.lightIntensity = Math.max(0, Math.min(1.5, value))
    else if (id === 'fx.glitchIntensity') this.glitchIntensity = Math.max(0, Math.min(1.5, value))
    else if (id === 'fx.bloomStrength') {
      this.bloomStrength = Math.max(0.2, Math.min(1.5, value))
      if (this.bloom) this.bloom.strength = 0.58 * this.bloomStrength
    }
  }

  private applyQuality(): void {
    const effective = this.effectiveQuality
    const preset = FX_QUALITY_PRESETS[effective]
    const coarse = matchMedia('(pointer: coarse)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, coarse ? Math.min(preset.dpr, 1.25) : preset.dpr) * this.resolutionScale
    this.renderer.setPixelRatio(Math.max(0.75, dpr))
    this.renderer.setSize(window.innerWidth, window.innerHeight, false)
    this.material.uniforms.uPixelRatio.value = this.renderer.getPixelRatio()
    this.activeParticleLimit = preset.particles
    for (let i = this.activeParticleLimit; i < MAX_PARTICLES; i += 1) {
      this.slots[i].active = false
      this.alphas[i] = 0
      this.sizes[i] = 0
    }
    this.renderer.shadowMap.enabled = preset.shadows
    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = preset.shadows
        object.receiveShadow = preset.shadows
      }
      if (object instanceof THREE.DirectionalLight && object.userData.anarcoKeyLight) {
        object.castShadow = preset.shadows
        if (preset.shadows) object.shadow.mapSize.set(512, 512)
      }
    })
    this.playerGlow.visible = effective !== 'low'
    this.bossGlow.visible = effective !== 'low'
    this.lights.forEach((entry, index) => {
      if (index >= preset.lights) {
        entry.remaining = 0
        entry.light.intensity = 0
        entry.light.visible = false
      }
    })
    this.composer?.dispose()
    this.composer = undefined
    this.bloom = undefined
    if (this.qualitySelect) this.qualitySelect.value = this.quality
    document.body.dataset.fxQuality = effective
    document.body.dataset.fxBaseQuality = this.quality
    const label = effective === this.quality ? this.labelQuality(effective) : `${this.labelQuality(this.quality)} → ${this.labelQuality(effective)} · AUTO`
    if (this.qualityStatus) this.qualityStatus.textContent = `FX · ${label}`
  }

  private labelQuality(quality: FxQuality): string {
    return quality === 'low' ? 'BAIXA' : quality === 'medium' ? 'MÉDIA' : 'ALTA'
  }

  resize(): void {
    const width = window.innerWidth
    const height = window.innerHeight
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    if (this.composer) {
      this.composer.setPixelRatio(this.renderer.getPixelRatio())
      this.composer.setSize(width, height)
    }
  }

  private ensureComposer(): EffectComposer | undefined {
    if (!FX_QUALITY_PRESETS[this.effectiveQuality].fullBloom) return undefined
    if (this.composer) return this.composer
    this.composer = new EffectComposer(this.renderer)
    this.composer.setPixelRatio(this.renderer.getPixelRatio())
    this.composer.setSize(window.innerWidth, window.innerHeight)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    this.bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.58 * this.bloomStrength, 0.42, 0.82)
    this.composer.addPass(this.bloom)
    this.composer.addPass(new OutputPass())
    return this.composer
  }

  render(): void {
    const composer = this.ensureComposer()
    if (composer) composer.render()
    else this.renderer.render(this.scene, this.camera)
  }

  samplePerformance(frameSeconds: number, playing: boolean): void {
    if (!playing || frameSeconds >= 1) return
    this.frameCount += 1
    if (frameSeconds > 0.025) this.slowFrames += 1
    if (this.frameCount < 90) return
    if (this.slowFrames / this.frameCount > 0.5) {
      const previous = this.effectiveQuality
      if (this.adaptiveLoss < FX_QUALITY_ORDER.indexOf(this.quality)) this.adaptiveLoss += 1
      else this.resolutionScale = Math.max(0.75, this.resolutionScale - 0.15)
      if (this.effectiveQuality !== previous || this.resolutionScale < 1) this.applyQuality()
    }
    this.frameCount = 0
    this.slowFrames = 0
  }

  private configureSlot(slot: ParticleSlot, position: THREE.Vector3, start: THREE.ColorRepresentation, end: THREE.ColorRepresentation, options: { life?: number; size?: number; force?: number; gravity?: number; drag?: number; attraction?: number; repulsion?: number; bounce?: number }): void {
    const horizontal = Math.random() * Math.PI * 2
    const up = Math.random() * 2 - 0.35
    const direction = new THREE.Vector3(Math.cos(horizontal), up, Math.sin(horizontal)).normalize()
    const force = options.force ?? 6
    slot.active = true
    slot.age = 0
    slot.life = options.life ?? 0.45 + Math.random() * 0.75
    slot.size = options.size ?? 0.7
    slot.gravity = options.gravity ?? -5
    slot.drag = options.drag ?? 1.4
    slot.attraction = options.attraction ?? 0
    slot.repulsion = options.repulsion ?? 0
    slot.bounce = options.bounce ?? 0
    slot.spin = (Math.random() - 0.5) * 10
    slot.phase = Math.random() * Math.PI * 2
    slot.position.copy(position)
    slot.velocity.copy(direction).multiplyScalar(force * (0.45 + Math.random() * 0.7))
    slot.start.set(start)
    slot.end.set(end)
  }

  burstAt(position: THREE.Vector3, color: THREE.ColorRepresentation = '#ff4a3d', count = 28, force = 7): void {
    const base = new THREE.Color(color)
    const end = base.clone().multiplyScalar(0.34)
    const density = (this.effectiveQuality === 'low' ? 0.34 : this.effectiveQuality === 'medium' ? 0.68 : 1) * this.particleDensity
    this.emitParticles(position, Math.min(Math.max(3, Math.round(count * density)), this.activeParticleLimit), { start: base, end, force, gravity: -8, size: 0.65 })
  }

  emit(kind: string, position: THREE.Vector3, countScale = 1): void {
    const preset = EVENT_STYLE[kind] ?? EVENT_STYLE.impact
    const cap = this.effectiveQuality === 'low' ? 0.38 : this.effectiveQuality === 'medium' ? 0.72 : 1
    const count = Math.min(this.activeParticleLimit, Math.max(3, Math.round(preset.count * cap * countScale * this.particleDensity)))
    this.emitParticles(position, count, { start: preset.start, end: preset.end, force: preset.force, gravity: preset.gravity, size: preset.size, attraction: preset.attraction, repulsion: preset.repulsion, bounce: preset.bounce })
  }

  private emitParticles(position: THREE.Vector3, count: number, options: { start: THREE.ColorRepresentation; end: THREE.ColorRepresentation; force?: number; gravity?: number; size?: number; attraction?: number; repulsion?: number; bounce?: number }): void {
    for (let i = 0; i < count; i += 1) {
      const slot = this.slots[this.cursor]
      this.cursor = (this.cursor + 1) % this.activeParticleLimit
      this.configureSlot(slot, position, options.start, options.end, options)
    }
  }

  lightAt(position: THREE.Vector3, color: THREE.ColorRepresentation, intensity = 2.2, duration = 0.28, distance = 12): void {
    const limit = FX_QUALITY_PRESETS[this.effectiveQuality].lights
    if (limit <= 0) return
    let entry = this.lights.slice(0, limit).find(item => item.remaining <= 0)
    if (!entry) entry = this.lights.slice(0, limit).reduce((oldest, item) => item.remaining < oldest.remaining ? item : oldest)
    entry.remaining = duration
    entry.duration = duration
    entry.peak = intensity * this.lightIntensity
    entry.light.position.copy(position)
    entry.light.color.set(color)
    entry.light.distance = distance
    entry.light.intensity = entry.peak
    entry.light.visible = true
  }

  flash(kind: string, durationMs = 420): void {
    if (!SCREEN_FX_KINDS.has(kind) || this.effectiveQuality === 'low' || this.glitchIntensity <= 0 || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    this.screenFx.dataset.kind = kind
    this.screenFx.style.setProperty('--fx-strength', String(Math.min(1, this.glitchIntensity)))
    const visibleDuration = Math.min(850, Math.max(120, durationMs * this.glitchIntensity))
    this.screenFx.style.animationDuration = `${visibleDuration}ms`
    this.screenFx.classList.remove('active')
    void this.screenFx.offsetWidth
    this.screenFx.classList.add('active')
    window.clearTimeout(this.flashTimer)
    this.flashTimer = window.setTimeout(() => this.screenFx.classList.remove('active'), visibleDuration)
  }

  dodge(player: THREE.Object3D, dx: number, dz: number, vanta: boolean): void {
    const position = player.position.clone()
    this.emit('dodge', position, 0.85)
    this.lightAt(position.clone().add(new THREE.Vector3(0, 1.4, 0)), '#53f6ff', 2.7, 0.24, 10)
    this.flash('dodge', 250)
    if (!vanta) return
    const count = this.effectiveQuality === 'high' ? 2 : 1
    for (let i = 0; i < count; i += 1) {
      const clone = player.clone(true) as THREE.Group
      const materials: THREE.Material[] = []
      clone.traverse(object => {
        const mesh = object as THREE.Mesh
        if (!mesh.material) return
        const copy = (material: THREE.Material): THREE.Material => {
          const cloned = material.clone()
          cloned.transparent = true
          cloned.opacity = 0.32
          cloned.depthWrite = false
          if ('blending' in cloned) cloned.blending = THREE.AdditiveBlending
          if ('color' in cloned && (cloned as THREE.MeshBasicMaterial).color) (cloned as THREE.MeshBasicMaterial).color.lerp(new THREE.Color('#53f6ff'), 0.38)
          if ('emissive' in cloned && (cloned as THREE.MeshStandardMaterial).emissive) (cloned as THREE.MeshStandardMaterial).emissive.set('#53f6ff')
          materials.push(cloned)
          return cloned
        }
        mesh.material = Array.isArray(mesh.material) ? mesh.material.map(copy) : copy(mesh.material)
      })
      clone.position.copy(position).add(new THREE.Vector3(-dx * (0.48 + i * 0.62), 0, -dz * (0.48 + i * 0.62)))
      clone.rotation.copy(player.rotation)
      clone.scale.copy(player.scale)
      clone.renderOrder = 8
      clone.traverse(object => { object.renderOrder = 8 })
      this.scene.add(clone)
      this.echoes.push({ node: clone, age: 0, life: 0.42 + i * 0.04, materials })
    }
  }

  bossEvent(model: string, position: THREE.Vector3, defeat = false): void {
    const kind = model === 'banqueiro' ? 'paper' : model === 'petroleo' ? 'oil' : 'data'
    this.emit(defeat ? 'boss' : kind, position, defeat ? 1.35 : 0.92)
    if (model === 'petroleo') this.emit('industrial', position.clone().add(new THREE.Vector3(0, 0.35, 0)), defeat ? 1.25 : 0.82)
    this.lightAt(position.clone().add(new THREE.Vector3(0, 2, 0)), model === 'banqueiro' ? '#efffff' : model === 'petroleo' ? '#ff8a24' : '#ff3fd0', defeat ? 5 : 3.4, defeat ? 0.55 : 0.32, 18)
    this.flash(defeat && model === 'ceo' ? 'collapse' : defeat ? 'boss' : model === 'petroleo' ? 'industrial' : 'boss', defeat ? 620 : 380)
  }

  update(dt: number, state: FxFrameState): void {
    this.player = state.player ?? this.player
    this.boss = state.boss
    if (state.phase) this.phase = state.phase
    const quality = this.effectiveQuality
    const playerPosition = this.player?.position

    if (playerPosition && quality !== 'low') {
      this.playerGlow.position.set(playerPosition.x, 1.45, playerPosition.z)
      this.playerGlow.material.color.set(state.ghost ? '#53f6ff' : this.phase === 'industrial' ? '#ff9a3b' : this.phase === 'hideout' ? '#39ff88' : '#ff3fd0')
      this.playerGlow.material.opacity = state.dodge ? 0.58 : 0.28
      this.playerGlow.visible = true
    } else this.playerGlow.visible = false
    if (this.boss && quality !== 'low') {
      this.bossGlow.position.set(this.boss.position.x, this.boss.position.y + 2.1, this.boss.position.z)
      this.bossGlow.visible = true
    } else this.bossGlow.visible = false

    this.highAlert = this.observeToggle(Boolean((state.alert ?? 0) >= 0.7), this.highAlert, () => {
      this.flash('alert', 360)
      if (playerPosition) this.lightAt(playerPosition.clone().add(new THREE.Vector3(0, 1.2, 0)), '#ff3048', 1.8, 0.24, 8)
    })
    this.hacking = this.observeToggle(Boolean(state.hacking), this.hacking, () => this.flash('hack', 260))
    this.blackout = this.observeToggle(Boolean(state.blackout), this.blackout, () => this.flash('blackout', 420))
    if (state.ghost && quality !== 'low') this.playerGlow.material.opacity = 0.48

    if (state.playing && this.phase === 'industrial' && quality !== 'low') {
      this.lastIndustrialParticle += dt
      if (this.lastIndustrialParticle > 0.48 && playerPosition) {
        this.lastIndustrialParticle = 0
        const at = playerPosition.clone().add(new THREE.Vector3((Math.random() - 0.5) * 11, 0.1, (Math.random() - 0.5) * 11))
        this.emit('industrial', at, 0.24)
      }
    }
    if (state.playing && this.phase === 'hideout' && state.hacking && playerPosition && quality !== 'low') {
      this.lastCodeParticle += dt
      if (this.lastCodeParticle > 0.2) {
        this.lastCodeParticle = 0
        this.emit('code', playerPosition.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.6, 0.8 + Math.random() * 2, (Math.random() - 0.5) * 1.6)), 0.16)
      }
    }

    const pos = this.geometry.getAttribute('position') as THREE.BufferAttribute
    const color = this.geometry.getAttribute('aColor') as THREE.BufferAttribute
    const alpha = this.geometry.getAttribute('aAlpha') as THREE.BufferAttribute
    const size = this.geometry.getAttribute('aSize') as THREE.BufferAttribute
    for (let i = 0; i < this.activeParticleLimit; i += 1) {
      const particle = this.slots[i]
      if (!particle.active) { this.alphas[i] = 0; this.sizes[i] = 0; continue }
      particle.age += dt
      if (particle.age >= particle.life) {
        particle.active = false
        this.alphas[i] = 0
        this.sizes[i] = 0
        continue
      }
      particle.velocity.y += particle.gravity * dt
      if (playerPosition && particle.attraction !== 0) {
        this.tmpDirection.subVectors(playerPosition, particle.position)
        const distance = this.tmpDirection.length()
        if (distance > 0.001 && distance < 15) particle.velocity.addScaledVector(this.tmpDirection.multiplyScalar(1 / distance), particle.attraction * dt)
      }
      if (playerPosition && particle.repulsion !== 0) {
        this.tmpDirection.subVectors(particle.position, playerPosition)
        const distance = this.tmpDirection.length()
        if (distance > 0.001 && distance < 4) particle.velocity.addScaledVector(this.tmpDirection.multiplyScalar(1 / distance), particle.repulsion * dt)
      }
      particle.velocity.multiplyScalar(Math.max(0, 1 - particle.drag * dt))
      particle.position.addScaledVector(particle.velocity, dt)
      if (particle.position.y < 0) {
        if (particle.bounce > 0 && particle.velocity.y < -0.7) {
          particle.position.y = 0
          particle.velocity.y = Math.abs(particle.velocity.y) * particle.bounce
          particle.bounce = 0
        } else {
          particle.position.y = 0
          particle.velocity.y = 0
          particle.gravity = 0
        }
      }
      const t = particle.age / particle.life
      this.tmpColor.copy(particle.start).lerp(particle.end, t)
      this.positions[i * 3] = particle.position.x
      this.positions[i * 3 + 1] = particle.position.y
      this.positions[i * 3 + 2] = particle.position.z
      this.colors[i * 3] = this.tmpColor.r
      this.colors[i * 3 + 1] = this.tmpColor.g
      this.colors[i * 3 + 2] = this.tmpColor.b
      this.alphas[i] = (1 - t) * (1 - t) * 0.92
      this.sizes[i] = particle.size * (0.88 + Math.sin(particle.age * particle.spin + particle.phase) * 0.12)
    }
    pos.needsUpdate = true
    color.needsUpdate = true
    alpha.needsUpdate = true
    size.needsUpdate = true

    for (const item of this.lights) {
      if (item.remaining <= 0) continue
      item.remaining = Math.max(0, item.remaining - dt)
      const ratio = item.duration > 0 ? item.remaining / item.duration : 0
      item.light.intensity = item.peak * ratio * ratio
      item.light.visible = item.remaining > 0.005
    }
    for (let i = this.echoes.length - 1; i >= 0; i -= 1) {
      const echo = this.echoes[i]
      echo.age += dt
      const opacity = Math.max(0, 0.32 * (1 - echo.age / echo.life))
      for (const material of echo.materials) material.opacity = opacity
      if (echo.age < echo.life) continue
      this.scene.remove(echo.node)
      for (const material of echo.materials) material.dispose()
      this.echoes.splice(i, 1)
    }
    if (this.echoDodgeWasActive && !state.dodge) this.flash('chromatic', 180)
    this.echoDodgeWasActive = Boolean(state.dodge)
  }

  private observeToggle(current: boolean, previous: boolean, onEnter: () => void): boolean {
    if (current && !previous) onEnter()
    return current
  }
}
