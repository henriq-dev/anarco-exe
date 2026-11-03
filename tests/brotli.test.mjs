import { describe, expect, it } from 'vitest'
import { isTextAsset, measureCompression } from '../scripts/check-brotli.mjs'

describe('local Brotli estimate', () => {
  it('classifies text build assets and excludes binary media', () => {
    for (const path of ['index.html', 'assets/app.js', 'assets/app.css', 'manifest.webmanifest', 'assets/icon.svg']) expect(isTextAsset(path)).toBe(true)
    for (const path of ['assets/font.woff2', 'assets/sound.mp3', 'assets/mesh.glb', 'assets/photo.png']) expect(isTextAsset(path)).toBe(false)
  })

  it('reports deterministic raw, gzip and Brotli byte counts', () => {
    const input = Buffer.from('<main>ANARCO.EXE</main>\n'.repeat(200))
    const first = measureCompression(input)
    const second = measureCompression(input)
    expect(first).toEqual(second)
    expect(first.raw).toBe(input.length)
    expect(first.gzip).toBeGreaterThan(0)
    expect(first.brotli).toBeGreaterThan(0)
    expect(first.brotli).toBeLessThan(first.raw)
  })
})
