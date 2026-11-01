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
  'assets/share/og.jpg',
  'assets/models/anarco.mdl',
  'assets/models/cachos.mdl',
  'assets/models/laptop.mdl',
  'assets/models/boss-banqueiro-animated.glb',
  'assets/models/boss-petroleo-rigged.glb',
  'assets/models/boss-ceo-rigged.glb',
  'assets/img/skins/capuz.png',
  'assets/img/skins/vanta.png',
  'assets/img/skins/cachos.png',
  'assets/audio/anarco-cyberpunk-ost.mp3',
  'assets/audio/hack-connect.mp3',
  'assets/audio/data-stream-loop.mp3',
  'assets/audio/hack-fail.mp3',
  'assets/audio/root-access.mp3',
]
for (const path of required) assert.ok(existsSync(join(root, path)), `required local game asset is missing: ${path}`)
const bossModels = [
  'assets/models/boss-banqueiro-animated.glb',
  'assets/models/boss-petroleo-rigged.glb',
  'assets/models/boss-ceo-rigged.glb',
]
for (const path of bossModels) {
  const file = join(root, path)
  const bytes = readFileSync(file)
  assert.ok(bytes.toString('ascii', 0, 4) === 'glTF' && bytes.readUInt32LE(4) === 2, `${path} must be a valid GLB v2`)
  let offset = 12, model
  while (offset + 8 <= bytes.length) {
    const length = bytes.readUInt32LE(offset)
    const type = bytes.toString('ascii', offset + 4, offset + 8)
    offset += 8
    if (type === 'JSON') { model = JSON.parse(bytes.subarray(offset, offset + length).toString('utf8').replace(/\0+$/g, '').trim()); break }
    offset += length
  }
  assert.ok(model, `${path} must contain a JSON chunk`)
  const extensions = new Set(model.extensionsRequired ?? [])
  for (const extension of ['EXT_meshopt_compression', 'EXT_texture_webp', 'KHR_mesh_quantization']) {
    assert.ok(extensions.has(extension), `${path} is missing ${extension}`)
  }
  assert.ok((model.skins ?? []).some(skin => skin.joints?.length > 0), `${path} must retain a skin rig`)
  assert.ok((model.images ?? []).length > 0 && model.images.every(image => image.mimeType === 'image/webp'), `${path} must retain its textures as WebP`)
  assert.ok(statSync(file).size < 1024 * 1024, `${path} should remain below 1 MiB after compression`)
}
const banqueiro = readFileSync(join(root, bossModels[0]))
let banqueiroJson, banqueiroOffset = 12
while (banqueiroOffset + 8 <= banqueiro.length) {
  const length = banqueiro.readUInt32LE(banqueiroOffset)
  const type = banqueiro.toString('ascii', banqueiroOffset + 4, banqueiroOffset + 8)
  banqueiroOffset += 8
  if (type === 'JSON') { banqueiroJson = JSON.parse(banqueiro.subarray(banqueiroOffset, banqueiroOffset + length).toString('utf8').replace(/\0+$/g, '').trim()); break }
  banqueiroOffset += length
}
assert.ok(['idle', 'walk'].every(name => banqueiroJson.animations?.some(animation => animation.name === name)), 'the banker GLB must keep idle and walk animations')
const runtime = readFileSync(join(root, 'script.js'), 'utf8')
const compactRuntime = runtime.replace(/\s+/g, '')
assert.ok(runtime.includes('new window.ANARCO_FX.AnarcoFxSystem'), 'dist/script.js is stale or is not the current ANARCO.EXE runtime')
assert.ok(runtime.includes('fxSystem.emit("breach"') && runtime.includes('fxSystem.dodge('), 'dist/script.js is missing v3.7 combat effects')
assert.ok(!runtime.includes('navigator.serviceWorker.register("sw.js")'), 'dist/script.js must not register a missing service worker')
assert.ok(compactRuntime.includes('functionupdateHackPanel(') && compactRuntime.includes('functionupdateHackFlow('), 'contextual hack HUD or animated data flow is missing')
assert.ok(runtime.includes('COMPROMETIDA') && runtime.includes('assets/audio/anarco-cyberpunk-ost.mp3'), 'surveillance takeover state or custom cyberpunk audio is missing')
assert.ok(html.includes('id="hackPanel"') && html.includes('id="hackProgressBar"'), 'contextual hack panel markup is missing')
assert.ok(html.includes('https://anarcoexe.vercel.app/assets/share/og.jpg') && html.includes('image/jpeg'), 'absolute JPEG social-image metadata is missing')
assert.ok(statSync(join(root, 'assets/share/og.jpg')).size < 200 * 1024, 'social JPEG should remain below 200 KiB')
assert.ok(!readdirSync(join(root, 'assets')).some(name => /^og-[^/]+\.(?:png|jpe?g)$/i.test(name)), 'Vite must not emit a duplicate hashed OG image')
assert.ok(!existsSync(join(root, 'fonts/ManusCC0SansCJKSC-Regular.woff2')), 'unused CJK font should not be copied into dist')
const serviceWorker = readFileSync(join(root, 'sw.js'), 'utf8')
assert.ok(!serviceWorker.includes('assets/audio/') && !serviceWorker.includes('assets/models/laptop.mdl'), 'large audio and laptop assets must not be precached')
assert.ok(serviceWorker.includes('status: 503') && serviceWorker.includes('cache.put(request, response.clone())'), 'lazy assets must be cached on successful use and fail safely offline')

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
console.log(`smoke: OK — ${files.length} static files, ${(total / 1048576).toFixed(2)} MiB, Meshopt/WebP boss GLBs and local UI assets present`)
console.log('smoke: browser/input/audio/layout acceptance was not performed')
