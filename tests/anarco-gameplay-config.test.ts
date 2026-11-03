import { describe, expect, it } from 'vitest'
import { ANARCO_GAMEPLAY_CONFIG } from '../src/anarco-gameplay-config'

const { levels, routeBalance, routes } = ANARCO_GAMEPLAY_CONFIG

describe('ANARCO.EXE gameplay configuration', () => {
  it('keeps the six published level definitions unchanged', () => {
    expect(levels).toEqual([
      { dr: 3, sp: 1, seq: 4, t: 7, vis: 3.4 },
      { dr: 4, sp: 1.15, seq: 5, t: 7, vis: 3.6 },
      { dr: 5, sp: 1.3, seq: 6, t: 7, vis: 3.8 },
      { dr: 5, sp: 1.35, seq: 7, t: 6, vis: 4.0, room: true },
      { dr: 5, sp: 1.4, seq: 6, t: 7, vis: 4.2, mode: 2, blackout: true },
      { dr: 2, sp: 1.1, seq: 5, t: 7, vis: 3.6, boss: true, mode: 4 },
    ])
  })

  it('keeps each level route factor and all three route identities unchanged', () => {
    expect(routeBalance).toEqual([
      { fast: { speed: 1.18, noise: 1.35, alertGain: 1.35, alertRecovery: 0.9, cd: 1 }, safe: { speed: 0.92, noise: 0.65, alertGain: 0.65, alertRecovery: 1.25, cd: 1 }, tech: { speed: 1, noise: 0.9, alertGain: 0.82, alertRecovery: 1, cd: 0.82 } },
      { fast: { speed: 1.24, noise: 1.42, alertGain: 1.42, alertRecovery: 0.88, cd: 1 }, safe: { speed: 0.9, noise: 0.6, alertGain: 0.6, alertRecovery: 1.3, cd: 1 }, tech: { speed: 0.98, noise: 0.84, alertGain: 0.78, alertRecovery: 1.04, cd: 0.8 } },
      { fast: { speed: 1.2, noise: 1.55, alertGain: 1.5, alertRecovery: 0.82, cd: 1 }, safe: { speed: 0.88, noise: 0.55, alertGain: 0.55, alertRecovery: 1.38, cd: 1 }, tech: { speed: 1, noise: 0.8, alertGain: 0.75, alertRecovery: 1.08, cd: 0.78 } },
      { fast: { speed: 1.15, noise: 1.65, alertGain: 1.6, alertRecovery: 0.8, cd: 1 }, safe: { speed: 0.86, noise: 0.5, alertGain: 0.5, alertRecovery: 1.45, cd: 1 }, tech: { speed: 0.96, noise: 0.76, alertGain: 0.7, alertRecovery: 1.1, cd: 0.75 } },
      { fast: { speed: 1.12, noise: 1.7, alertGain: 1.65, alertRecovery: 0.78, cd: 1 }, safe: { speed: 0.88, noise: 0.54, alertGain: 0.54, alertRecovery: 1.4, cd: 1 }, tech: { speed: 0.95, noise: 0.74, alertGain: 0.69, alertRecovery: 1.1, cd: 0.73 } },
      { fast: { speed: 1.1, noise: 1.72, alertGain: 1.72, alertRecovery: 0.76, cd: 1 }, safe: { speed: 0.9, noise: 0.58, alertGain: 0.58, alertRecovery: 1.32, cd: 1 }, tech: { speed: 0.94, noise: 0.72, alertGain: 0.68, alertRecovery: 1.12, cd: 0.72 } },
    ])
    expect(routes).toEqual({
      fast: { label: 'RÁPIDA', color: '#2fe6ff' },
      safe: { label: 'PROTEGIDA', color: '#39ff88' },
      tech: { label: 'TÉCNICA', color: '#ff3fd0' },
    })
  })

  it('freezes the shared tables so runtime consumers cannot silently mutate balance', () => {
    expect(Object.isFrozen(ANARCO_GAMEPLAY_CONFIG)).toBe(true)
    expect(Object.isFrozen(levels)).toBe(true)
    expect(Object.isFrozen(levels[0])).toBe(true)
    expect(Object.isFrozen(routeBalance[0].fast)).toBe(true)
    expect(Object.isFrozen(routes.tech)).toBe(true)
  })
})
