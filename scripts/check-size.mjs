// Enforces per-category budgets against the production output; text is measured gzip-compressed,
// fonts use their shipped bytes, and binary media/model assets use their transfer bytes.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const MB = 1024 * 1024
const BUDGET = {
  javascript: 1.25 * MB,
  css: 0.5 * MB,
  fonts: 0.25 * MB,
  audio: 3.25 * MB,
  models: 3.25 * MB,
  images: 0.75 * MB,
  other: 0.5 * MB,
  total: 8 * MB,
}
const walk = dir => readdirSync(dir).flatMap(name => {
  const path = join(dir, name)
  return statSync(path).isDirectory() ? walk(path) : [path]
})
const files = walk('dist').map(path => {
  const raw = readFileSync(path)
  const text = /\.(js|css|html|json|svg|txt)$/.test(path)
  return { path, size: raw.length, wire: text ? gzipSync(raw).length : raw.length }
})
const categories = {
  javascript: file => file.path.endsWith('.js'),
  css: file => file.path.endsWith('.css'),
  fonts: file => /\.(ttf|otf|woff|woff2)$/.test(file.path),
  audio: file => /\.(mp3|ogg|wav|m4a|aac)$/.test(file.path),
  models: file => /\.(glb|gltf|mdl|bin)$/.test(file.path),
  images: file => /\.(png|jpe?g|webp|gif|svg)$/.test(file.path),
}
const cost = (file, category) => category === 'fonts' ? file.size : file.wire
const sum = (predicate, category) => files.filter(predicate).reduce((total, file) => total + cost(file, category), 0)
const classified = Object.values(categories)
const actual = Object.fromEntries(Object.entries(categories).map(([name, predicate]) => [name, sum(predicate, name)]))
actual.other = sum(file => !classified.some(predicate => predicate(file)), 'other')
actual.total = sum(file => !file.path.endsWith('.txt'), 'total')
const mb = bytes => `${(bytes / MB).toFixed(2)} MB`
console.log(`bundle budgets (wire; fonts shipped): ${Object.entries(actual).map(([name, bytes]) => `${name} ${mb(bytes)}/${mb(BUDGET[name])}`).join(' | ')}`)
const over = Object.entries(BUDGET).filter(([name, limit]) => actual[name] > limit)
if (over.length) {
  for (const [name, limit] of over) console.error(`over budget: ${name} ${mb(actual[name])} > ${mb(limit)}`)
  process.exit(1)
}
console.log('size budgets: OK')
