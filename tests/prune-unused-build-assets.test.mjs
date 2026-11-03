import { afterEach, describe, expect, it } from 'vitest'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { pruneUnusedBuildAssets, UNUSED_BUILD_ASSETS } from '../scripts/prune-unused-build-assets.mjs'

let temporaryRoot

afterEach(() => {
  if (temporaryRoot) rmSync(temporaryRoot, { recursive: true, force: true })
  temporaryRoot = undefined
})

describe('production artifact pruning', () => {
  it('removes only the known stale overlay assets from the output directory', () => {
    temporaryRoot = mkdtempSync(join(tmpdir(), 'anarco-prune-'))
    for (const relativePath of UNUSED_BUILD_ASSETS) {
      const file = join(temporaryRoot, relativePath)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, 'stale')
    }
    const activeModel = join(temporaryRoot, 'assets/models/anarco.mdl')
    const activeCover = join(temporaryRoot, 'assets/share/og.jpg')
    mkdirSync(dirname(activeModel), { recursive: true })
    mkdirSync(dirname(activeCover), { recursive: true })
    writeFileSync(activeModel, 'active model')
    writeFileSync(activeCover, 'active cover')

    expect(pruneUnusedBuildAssets(temporaryRoot)).toEqual([...UNUSED_BUILD_ASSETS])
    for (const relativePath of UNUSED_BUILD_ASSETS) expect(existsSync(join(temporaryRoot, relativePath))).toBe(false)
    expect(readFileSync(activeModel, 'utf8')).toBe('active model')
    expect(readFileSync(activeCover, 'utf8')).toBe('active cover')
  })

  it('is safe to rerun when the stale assets are already absent', () => {
    temporaryRoot = mkdtempSync(join(tmpdir(), 'anarco-prune-'))
    expect(pruneUnusedBuildAssets(temporaryRoot)).toEqual([])
    expect(pruneUnusedBuildAssets(temporaryRoot)).toEqual([])
  })
})
