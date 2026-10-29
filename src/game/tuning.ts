import { CONFIG, DEFAULT_CONFIG } from './config'

type Control = {
  id: string
  type: 'number'
  category: string
  label: string
  description: string
  unit: string
  default: number
  min: number
  max: number
  step: number
  applyMode: 'LIVE'
  integrity: 'COSMETIC'
}
type Binding = { control: Control; read(): number; write(value: number): void }

const descriptions = [
  { key: 'quality', label: 'FX quality profile', description: '0 = low, 1 = medium, 2 = high. Changes cosmetic graphics only.', min: 0, max: 2, step: 1, unit: '0–2' },
  { key: 'particleDensity', label: 'Particle density', description: 'Scales the reusable particle pool without changing gameplay.', min: 0.3, max: 1.5, step: 0.1, unit: '×' },
  { key: 'lightIntensity', label: 'Temporary light intensity', description: 'Scales pooled cosmetic flashes and boss-attack lights.', min: 0, max: 1.5, step: 0.1, unit: '×' },
  { key: 'glitchIntensity', label: 'Screen glitch intensity', description: 'Scales brief cosmetic overlays; 0 disables screen FX.', min: 0, max: 1.5, step: 0.1, unit: '×' },
  { key: 'bloomStrength', label: 'High-profile bloom strength', description: 'Affects the full bloom pass only when the high quality profile is active.', min: 0.2, max: 1.5, step: 0.1, unit: '×' },
] as const

const bindings: Binding[] = descriptions.map(definition => {
  const key = definition.key
  const control: Control = Object.freeze({
    id: `fx.${key}`,
    type: 'number',
    category: 'Visual FX',
    label: definition.label,
    description: definition.description,
    unit: definition.unit,
    default: DEFAULT_CONFIG.fx[key],
    min: definition.min,
    max: definition.max,
    step: definition.step,
    applyMode: 'LIVE',
    integrity: 'COSMETIC',
  })
  return {
    control,
    read: () => CONFIG.fx[key],
    write: value => {
      CONFIG.fx[key] = value
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('anarco:fx-tweak', { detail: { id: control.id, value } }))
    },
  }
})

const byId = new Map(bindings.map(binding => [binding.control.id, binding]))
let requested: Record<string, number> = Object.fromEntries(bindings.map(({ control }) => [control.id, control.default]))

export const tuning = {
  get unranked(): boolean { return false },
  controls: Object.freeze(bindings.map(binding => binding.control)),
  read() {
    return {
      requested: { ...requested },
      active: Object.fromEntries(bindings.map(binding => [binding.control.id, binding.read()])),
    }
  },
  apply(patch: unknown): void {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('Invalid patch')
    const entries = Object.entries(patch)
    if (entries.length > bindings.length) throw new Error('Invalid patch')
    for (const [id, value] of entries) {
      const control = byId.get(id)?.control
      if (!control || typeof value !== 'number' || !Number.isFinite(value) || value < control.min || value > control.max) throw new Error('Invalid value')
      const steps = (value - control.min) / control.step
      if (Math.abs(steps - Math.round(steps)) > 1e-7) throw new Error('Invalid increment')
    }
    requested = { ...requested, ...patch } as Record<string, number>
    for (const [id, value] of entries) byId.get(id)!.write(value as number)
  },
  // Retained for compatibility with the scaffold's inactive game modules. ANARCO.EXE FX apply live.
  activate(_boundary: 'jump' | 'dash' | 'run'): void {},
}
