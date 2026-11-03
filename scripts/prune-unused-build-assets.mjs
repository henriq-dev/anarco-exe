import { existsSync, rmSync } from 'node:fs'
import { resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

// Known leftovers from overlaying this package onto an older repository. These
// files are not used by the active runtime; prune only the production artifact,
// never the source tree, so this remains safe and reversible.
export const UNUSED_BUILD_ASSETS = Object.freeze([
  'fonts/ManusCC0-Bold.ttf',
  'fonts/ManusCC0-LICENSE.txt',
  'fonts/ManusCC0-Medium.ttf',
  'fonts/ManusCC0-Regular.ttf',
  'fonts/ManusCC0SansCJKSC-Regular.woff2',
  'assets/models/anarco.bin',
  'assets/models/cachos.bin',
  'assets/models/laptop.bin',
  'assets/share/og.png',
])

export function pruneUnusedBuildAssets(outputRoot = resolve('dist')) {
  const root = resolve(outputRoot)
  const removed = []
  for (const relativePath of UNUSED_BUILD_ASSETS) {
    const target = resolve(root, relativePath)
    if (!target.startsWith(`${root}${sep}`)) throw new Error(`Unsafe build-asset path: ${relativePath}`)
    if (!existsSync(target)) continue
    rmSync(target)
    removed.push(relativePath)
  }
  return removed
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : ''
if (invokedPath && pathToFileURL(invokedPath).href === import.meta.url) {
  const removed = pruneUnusedBuildAssets()
  console.log(`unused overlay assets pruned from dist: ${removed.length ? removed.join(', ') : 'none found'}`)
}
