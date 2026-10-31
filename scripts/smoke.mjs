// Static delivery smoke test: run `pnpm build` first. This checks the portable Vite output and
// local assets only; it does not claim browser, input, audio, layout, or device acceptance.
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve('dist')
assert.ok(existsSync(join(root, 'index.html')), 'dist/index.html is missing; run pnpm build first')
const html = readFileSync(join(root, 'index.html'), 'utf8')
for (const [needle, label] of [
  ['ANARCO.EXE 3D', 'game title'],
  ['fxQuality', 'quality selector'],
  ['screenFx', 'screen-effects layer'],
  ['manifest.webmanifest', 'PWA manifest'],
  ['bootScreen', 'game-specific loading screen'],
  ['og:image', 'Open Graph cover metadata'],
  ['assets/favicon-', 'game-specific favicon'],
]) assert.ok(html.includes(needle), `${label} is missing from the generated HTML`)

const required = [
  'script.js',
  'assets/dados/manifesto.js',
  'manifest.webmanifest',
  'manus-routes.json',
  'assets/share/favicon.svg',
  'assets/share/favicon.png',
  'assets/share/favicon-180.png',
  'assets/share/favicon-192.png',
  'assets/share/favicon-512.png',
  'assets/share/og.png',
  'assets/models/anarco.mdl',
  'assets/models/cachos.mdl',
  'assets/models/laptop.mdl',
  'assets/models/boss-banqueiro-animated.glb',
  'assets/models/boss-petroleo-rigged.glb',
  'assets/models/boss-ceo-rigged.glb',
  'assets/img/skins/capuz.png',
  'assets/img/skins/vanta.png',
  'assets/img/skins/cachos.png',
]
for (const path of required) assert.ok(existsSync(join(root, path)), `required local game asset is missing: ${path}`)
const runtime = readFileSync(join(root, 'script.js'), 'utf8')
assert.ok(runtime.includes('new window.ANARCO_FX.AnarcoFxSystem'), 'dist/script.js is stale or is not the current ANARCO.EXE runtime')
assert.ok(runtime.includes('fxSystem.emit("breach"') && runtime.includes('fxSystem.dodge('), 'dist/script.js is missing v3.7 combat effects')
assert.ok(!runtime.includes('navigator.serviceWorker.register("sw.js")'), 'dist/script.js must not register a missing service worker')

const routes = JSON.parse(readFileSync(join(root, 'manus-routes.json'), 'utf8'))
assert.deepEqual(routes.routes.map(route => route.path), ['/'], 'the route manifest must match the single-page game')

const walk = dir => readdirSync(dir).flatMap(name => {
  const path = join(dir, name)
  return statSync(path).isDirectory() ? walk(path) : [path]
})
const files = walk(root)
const js = files.filter(path => path.endsWith('.js'))
assert.ok(js.some(path => readFileSync(path, 'utf8').includes('AnarcoFxSystem')), 'the FX runtime is missing from the production bundle')
assert.ok(files.length > 10, 'production output is unexpectedly small')
const total = files.reduce((size, path) => size + statSync(path).size, 0)
console.log(`smoke: OK — ${files.length} static files, ${(total / 1048576).toFixed(2)} MiB, local game models and UI assets present`)
console.log('smoke: browser/input/audio/layout acceptance was not performed')
