import { describe, expect, it } from 'vitest'
import { FX_QUALITY_ORDER, FX_QUALITY_PRESETS, lowerQuality, type FxQuality } from '../src/anarco-fx'

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
    expect(profiles.map(quality => FX_QUALITY_PRESETS[quality].fullBloom)).toEqual([false, false, true])
    expect(profiles.map(quality => FX_QUALITY_PRESETS[quality].shadows)).toEqual([false, false, true])
    expect(FX_QUALITY_PRESETS.low.particles).toBeLessThan(FX_QUALITY_PRESETS.medium.particles)
    expect(FX_QUALITY_PRESETS.medium.particles).toBeLessThan(FX_QUALITY_PRESETS.high.particles)
  })
})
