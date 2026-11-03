// Local estimate for deployable text assets only; it does not verify CDN headers or production encoding.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve, relative, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'

const TEXT_EXTENSIONS = new Set(['.css', '.html', '.htm', '.js', '.mjs', '.cjs', '.json', '.map', '.svg', '.txt', '.xml', '.webmanifest'])
const QUALITY = 5

export function isTextAsset(path) {
  return TEXT_EXTENSIONS.has(extname(path).toLowerCase())
}

export function measureCompression(input) {
  const bytes = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return {
    raw: bytes.length,
    gzip: gzipSync(bytes).length,
    brotli: brotliCompressSync(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: QUALITY } }).length,
  }
}

function walk(dir) {
  return readdirSync(dir).sort().flatMap(name => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

export function collectTextMetrics(root = resolve('dist')) {
  if (!existsSync(root)) throw new Error(`build directory not found: ${root}`)
  const files = walk(root)
    .filter(isTextAsset)
    .map(path => ({ path: relative(root, path).split('\\').join('/'), ...measureCompression(readFileSync(path)) }))
  const totals = files.reduce((sum, file) => ({ raw: sum.raw + file.raw, gzip: sum.gzip + file.gzip, brotli: sum.brotli + file.brotli }), { raw: 0, gzip: 0, brotli: 0 })
  return { files, totals }
}

function formatMiB(bytes) { return `${(bytes / 1024 / 1024).toFixed(2)} MiB` }

export function reportBrotli(root = resolve('dist')) {
  const { files, totals } = collectTextMetrics(root)
  if (!files.length) throw new Error(`no text assets found in ${root}`)
  console.log(`local text compression estimate (Brotli q${QUALITY}; not a hosting/CDN check): ${files.length} files | raw ${formatMiB(totals.raw)} | gzip ${formatMiB(totals.gzip)} | Brotli ${formatMiB(totals.brotli)} | Brotli saving ${((1 - totals.brotli / totals.raw) * 100).toFixed(1)}%`)
  for (const file of [...files].sort((a, b) => b.raw - a.raw).slice(0, 5)) {
    console.log(`  ${file.path}: ${file.raw} B raw → ${file.brotli} B Brotli`)
  }
  return { files, totals }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) reportBrotli()
