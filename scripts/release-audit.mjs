import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const required = [
  'index.html', 'style.css', 'script.js', 'sw.js', 'manifest.webmanifest',
  'public/script.js', 'public/sw.js', 'public/assets/lib/three.min.js',
  'public/assets/models/anarco.bin', 'dist/index.html', 'dist/sw.js',
]
const missing = required.filter(file => !fs.existsSync(path.join(root, file)))
if (missing.length) throw new Error(`release files missing: ${missing.join(', ')}`)

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
const gameScript = fs.readFileSync(path.join(root, 'script.js'), 'utf8')
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'))
const checks = {
  manifestIdentity: Boolean(manifest.name && manifest.short_name && manifest.start_url),
  offlineDisplay: ['standalone', 'fullscreen', 'minimal-ui'].includes(manifest.display),
  accessibleActions: ['bz', 'hx', 'vx', 'routeFast', 'routeSafe', 'routeTech'].every(id => html.includes(`id="${id}"`) && html.includes(`aria-label`)),
  liveFeedback: html.includes('id="msg" role="status"') && html.includes('id="obj" role="status"'),
  reducedMotion: fs.readFileSync(path.join(root, 'style.css'), 'utf8').includes('prefers-reduced-motion'),
  localThree: fs.existsSync(path.join(root, 'public/assets/lib/three.min.js')),
  localModel: fs.existsSync(path.join(root, 'public/assets/models/anarco.bin')),
  pickupLoopGuard: gameScript.includes('tentativas < 400') && gameScript.includes('Number.isFinite(s.r)'),
}
const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name)
if (failed.length) throw new Error(`release checks failed: ${failed.join(', ')}`)
console.log(`release-audit: OK — ${required.length} arquivos, PWA offline, acessibilidade e assets locais verificados`)
