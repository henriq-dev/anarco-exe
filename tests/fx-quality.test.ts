import { describe, expect, it } from 'vitest'
import { FX_ADAPTIVE_WINDOW_FRAMES, FX_QUALITY_ORDER, FX_QUALITY_PRESETS, FX_SLOW_FRAME_RATIO, isSlowFxFrame, lowerQuality, resolveFxPixelRatio, shouldDegradeFxPerformance, type FxQuality } from '../src/anarco-fx'

describe('ANARCO.EXE adaptive FX quality', () => {
  it('keeps a stable low → medium → high order', () => {
    expect(FX_QUALITY_ORDER).toEqual(['low', 'medium', 'high'])
  })

  it('steps down one profile at a time without dropping below low', () => {
    expect(lowerQuality('high')).toBe('medium')
    expect(lowerQuality('medium')).toBe('low')
    expect(lowerQuality('low')).toBe('low')
  })

  it('keeps the expensive full bloom and dynamic shadows limited to high', () => {
    const profiles: FxQuality[] = ['low', 'medium', 'high']
    expect(profiles.map(quality => FX_QUALITY_PRESETS[quality].fxaa)).toEqual([false, true, true])
    expect(profiles.map(quality => FX_QUALITY_PRESETS[quality].fullBloom)).toEqual([false, false, true])
    expect(profiles.map(quality => FX_QUALITY_PRESETS[quality].shadows)).toEqual([false, false, true])
    expect(FX_QUALITY_PRESETS.low.particles).toBeLessThan(FX_QUALITY_PRESETS.medium.particles)
    expect(FX_QUALITY_PRESETS.medium.particles).toBeLessThan(FX_QUALITY_PRESETS.high.particles)
  })

  it('reacts to sustained slow frames in a shorter 60-frame window', () => {
    expect(FX_ADAPTIVE_WINDOW_FRAMES).toBe(60)
    expect(FX_SLOW_FRAME_RATIO).toBe(0.4)
    expect(isSlowFxFrame(0.022)).toBe(false)
    expect(isSlowFxFrame(0.022001)).toBe(true)
    expect(shouldDegradeFxPerformance(59, 59)).toBe(false)
    expect(shouldDegradeFxPerformance(60, 24)).toBe(false)
    expect(shouldDegradeFxPerformance(60, 25)).toBe(true)
  })

  it('keeps coarse-pointer DPR capped at 1.25 and desktop high at 2', () => {
    expect(resolveFxPixelRatio(3, FX_QUALITY_PRESETS.high.dpr, true)).toBe(1.25)
    expect(resolveFxPixelRatio(3, FX_QUALITY_PRESETS.medium.dpr, true)).toBe(1.25)
    expect(resolveFxPixelRatio(3, FX_QUALITY_PRESETS.high.dpr, false)).toBe(2)
  })

  it('keeps all dynamic lights disabled on low quality', () => {
    expect([FX_QUALITY_PRESETS.low.lights, FX_QUALITY_PRESETS.medium.lights, FX_QUALITY_PRESETS.high.lights]).toEqual([0, 4, 7])
  })
})
