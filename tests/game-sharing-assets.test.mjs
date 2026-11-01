import { describe, expect, it } from 'vitest'
import { applyShareHtml, materializeShareSnapshot, verifyShareImage } from '../scripts/manus-game-sharing/metadata.mjs'

describe('Game sharing image assets', () => {
  it('accepts the optimized JPEG cover and retains PNG favicon support', () => {
    const materialized = materializeShareSnapshot(process.cwd(), { publicationOrigin: 'https://share.example' })
    expect(materialized.snapshot.assets.og).toMatchObject({ mime: 'image/jpeg', width: 1200, height: 630, sourcePath: 'assets/share/og.jpg' })
    expect(materialized.snapshot.assets.og.path).toMatch(/^share\/[a-f0-9]{64}\.jpg$/)
    expect(materialized.snapshot.assets.favicon.mime).toBe('image/png')
    expect(verifyShareImage(materialized.bytes.og, materialized.snapshot.assets.og)).toBe(materialized.bytes.og)
    expect(verifyShareImage(materialized.bytes.favicon, materialized.snapshot.assets.favicon)).toBe(materialized.bytes.favicon)

    const html = applyShareHtml('<!doctype html><html><head></head><body></body></html>', materialized.snapshot)
    expect(html).toContain('https://share.example/share/')
    expect(html).toContain('og:image:type" content="image/jpeg"')
  })
})
