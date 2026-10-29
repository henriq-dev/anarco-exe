import { afterEach, describe, expect, it } from 'vitest'
import { CONFIG, DEFAULT_CONFIG } from '../src/game/config'
import { tuning } from '../src/game/tuning'

const defaults = Object.fromEntries(tuning.controls.map(control => [control.id, control.default]))

afterEach(() => {
  tuning.apply(defaults)
})

describe('ANARCO.EXE preview tuning', () => {
  it('exposes only live cosmetic controls with real FX consumers', () => {
    expect(tuning.controls.map(control => control.id)).toEqual([
      'fx.quality', 'fx.particleDensity', 'fx.lightIntensity', 'fx.glitchIntensity', 'fx.bloomStrength',
    ])
    expect(tuning.controls.every(control => control.applyMode === 'LIVE' && control.integrity === 'COSMETIC')).toBe(true)
  })

  it('validates a complete patch before committing and keeps source defaults immutable', () => {
    const before = tuning.read()
    for (const patch of [
      { 'fx.quality': 2, 'fx.bloomStrength': 99 },
      { 'fx.quality': 1.5 },
      { 'fx.particleDensity': '0.8' },
      { 'fx.glitchIntensity': Infinity },
      { unknown: 1 },
    ]) {
      expect(() => tuning.apply(patch)).toThrow()
      expect(tuning.read()).toEqual(before)
    }
    tuning.apply({ 'fx.quality': 2, 'fx.particleDensity': 1.2 })
    expect(CONFIG.fx.quality).toBe(2)
    expect(CONFIG.fx.particleDensity).toBe(1.2)
    expect(DEFAULT_CONFIG.fx.quality).toBe(1)
    expect(DEFAULT_CONFIG.fx.particleDensity).toBe(1)
  })

  it('keeps cosmetic Tweak changes out of ranked gameplay eligibility', () => {
    tuning.apply({ 'fx.quality': 0, 'fx.glitchIntensity': 0.5 })
    expect(tuning.unranked).toBe(false)
    tuning.activate('run')
    expect(tuning.unranked).toBe(false)
  })

  it('dispatches live cosmetic edits to the real FX runtime consumer', () => {
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
    const dispatched: CustomEvent[] = []
    Object.defineProperty(globalThis, 'window', { configurable: true, value: {
      dispatchEvent(event: Event) { dispatched.push(event as CustomEvent); return true },
    } })
    try {
      tuning.apply({ 'fx.glitchIntensity': 0.6 })
    } finally {
      if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow)
      else Reflect.deleteProperty(globalThis, 'window')
    }
    expect(dispatched).toHaveLength(1)
    expect(dispatched[0].type).toBe('anarco:fx-tweak')
    expect(dispatched[0].detail).toEqual({ id: 'fx.glitchIntensity', value: 0.6 })
  })
})
