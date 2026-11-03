import { describe, expect, it } from 'vitest'
import { CURRENT_SAVE_SCHEMA_VERSION, LEGACY_SAVE_KEYS, VERSIONED_SAVE_KEY, VersionedSaveStorage, type StorageLike } from '../src/anarco-save-migration'

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  const storage: StorageLike = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
    removeItem: key => { values.delete(key) },
  }
  return { storage, values }
}

describe('active legacy save migration', () => {
  it('snapshots existing per-feature keys into schema v1 without deleting legacy data', () => {
    const { storage, values } = memoryStorage({
      anarco_progress: '{"wins":2,"skins":["capuz","vanta"]}',
      anarco_skin: 'vanta',
      anarco_rank: '[{"s":62.4,"d":"01/11/2026"}]',
      anarco_fx_quality: 'medium',
    })
    const migrated = new VersionedSaveStorage(storage)
    const envelope = JSON.parse(values.get(VERSIONED_SAVE_KEY)!)
    expect(envelope.version).toBe(CURRENT_SAVE_SCHEMA_VERSION)
    expect(envelope.values.anarco_progress).toBe(values.get('anarco_progress'))
    expect(migrated.getItem('anarco_skin')).toBe('vanta')
    expect(migrated.getItem('anarco_rank')).toBe(values.get('anarco_rank'))
    expect(values.get('anarco_fx_quality')).toBe('medium')
    expect(LEGACY_SAVE_KEYS).toContain('anarco_progress')
  })

  it('keeps saves readable to older builds by mirroring updates and deletes to legacy keys', () => {
    const { storage, values } = memoryStorage({ anarco_tut: '1' })
    const migrated = new VersionedSaveStorage(storage)
    migrated.setItem('anarco_hud', 'compacto')
    expect(migrated.getItem('anarco_hud')).toBe('compacto')
    expect(values.get('anarco_hud')).toBe('compacto')
    expect(JSON.parse(values.get(VERSIONED_SAVE_KEY)!).values.anarco_hud).toBe('compacto')
    migrated.removeItem('anarco_tut')
    expect(values.has('anarco_tut')).toBe(false)
    expect(JSON.parse(values.get(VERSIONED_SAVE_KEY)!).values).not.toHaveProperty('anarco_tut')
  })

  it('uses a valid v1 record on subsequent boots instead of re-importing stale legacy data', () => {
    const { storage, values } = memoryStorage({ anarco_skin: 'capuz' })
    const first = new VersionedSaveStorage(storage)
    first.setItem('anarco_skin', 'vanta')
    values.set('anarco_skin', 'capuz')
    const second = new VersionedSaveStorage(storage)
    expect(second.getItem('anarco_skin')).toBe('vanta')
  })

  it('recovers a corrupt container from legacy keys without throwing', () => {
    const { storage } = memoryStorage({ [VERSIONED_SAVE_KEY]: '{broken', anarco_progress: '{"wins":3}' })
    expect(new VersionedSaveStorage(storage).getItem('anarco_progress')).toBe('{"wins":3}')
  })

  it('keeps working in memory when local storage is blocked', () => {
    const denied: StorageLike = {
      getItem: () => { throw new Error('denied') },
      setItem: () => { throw new Error('quota') },
      removeItem: () => { throw new Error('denied') },
    }
    const migrated = new VersionedSaveStorage(denied)
    expect(() => migrated.setItem('anarco_skin', 'vanta')).not.toThrow()
    expect(migrated.getItem('anarco_skin')).toBe('vanta')
    expect(() => migrated.removeItem('anarco_skin')).not.toThrow()
    expect(migrated.getItem('anarco_skin')).toBeNull()
  })
})
