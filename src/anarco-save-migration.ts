export const VERSIONED_SAVE_KEY = 'anarco_save_v1'
export const CURRENT_SAVE_SCHEMA_VERSION = 1

export const LEGACY_SAVE_KEYS = [
  'anarco_progress',
  'anarco_skin',
  'anarco_code_rain_mode',
  'anarco_final',
  'anarco_tut',
  'anarco_leaks',
  'anarco_rank',
  'anarco_hud',
  'anarco_fx_quality',
] as const

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

type SaveEnvelope = { version: 1; values: Record<string, string> }

function browserStorage(): StorageLike | undefined {
  try { return globalThis.localStorage } catch { return undefined }
}

function validEnvelope(value: unknown): value is SaveEnvelope {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const envelope = value as Record<string, unknown>
  if (envelope.version !== CURRENT_SAVE_SCHEMA_VERSION || !envelope.values || typeof envelope.values !== 'object' || Array.isArray(envelope.values)) return false
  return Object.values(envelope.values as Record<string, unknown>).every(item => typeof item === 'string')
}

/**
 * Version 1 snapshots the game's existing per-feature keys without deleting or renaming them.
 * Legacy keys are still mirrored on writes, so returning to an older build does not lose progress.
 */
export class VersionedSaveStorage {
  private readonly storage: StorageLike | undefined
  private readonly values: Record<string, string>
  private readonly readOnlyFutureSchema: boolean

  constructor(storage: StorageLike | undefined = browserStorage()) {
    this.storage = storage
    let envelopeRaw: string | null = null
    try { envelopeRaw = storage?.getItem(VERSIONED_SAVE_KEY) ?? null } catch { /* use legacy values */ }
    let parsed: unknown
    try { parsed = envelopeRaw ? JSON.parse(envelopeRaw) : null } catch { parsed = null }

    if (validEnvelope(parsed)) {
      this.values = { ...parsed.values }
      this.readOnlyFutureSchema = false
      return
    }

    const version = parsed && typeof parsed === 'object' && 'version' in parsed ? Number((parsed as { version?: unknown }).version) : 0
    this.readOnlyFutureSchema = Number.isFinite(version) && version > CURRENT_SAVE_SCHEMA_VERSION
    this.values = {}
    for (const key of LEGACY_SAVE_KEYS) {
      try {
        const value = storage?.getItem(key)
        if (value !== null && value !== undefined) this.values[key] = value
      } catch { /* inaccessible key is left untouched */ }
    }
    if (!this.readOnlyFutureSchema) this.persistEnvelope()
  }

  getItem(key: string): string | null {
    if (Object.prototype.hasOwnProperty.call(this.values, key)) return this.values[key]
    try { return this.storage?.getItem(key) ?? null } catch { return null }
  }

  setItem(key: string, value: string): void {
    const text = String(value)
    this.values[key] = text
    if (!this.readOnlyFutureSchema) this.persistEnvelope()
    try { this.storage?.setItem(key, text) } catch { /* retain in memory when storage is unavailable */ }
  }

  removeItem(key: string): void {
    delete this.values[key]
    if (!this.readOnlyFutureSchema) this.persistEnvelope()
    try { this.storage?.removeItem(key) } catch { /* retain in memory when storage is unavailable */ }
  }

  private persistEnvelope(): void {
    try { this.storage?.setItem(VERSIONED_SAVE_KEY, JSON.stringify({ version: CURRENT_SAVE_SCHEMA_VERSION, values: this.values })) } catch { /* memory/legacy mirrors remain usable */ }
  }
}

export function createVersionedSaveStorage(storage?: StorageLike): VersionedSaveStorage {
  return new VersionedSaveStorage(storage)
}
