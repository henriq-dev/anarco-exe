import { copyFileSync, mkdtempSync, readFileSync, renameSync, rmSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const modelsDir = resolve(root, 'assets/models')
const cli = resolve(root, 'node_modules/.bin', process.platform === 'win32' ? 'gltf-transform.cmd' : 'gltf-transform')
const models = [
  'boss-banqueiro-animated.glb',
  'boss-petroleo-rigged.glb',
  'boss-ceo-rigged.glb',
]

function readGlbJson(path) {
  const bytes = readFileSync(path)
  if (bytes.toString('ascii', 0, 4) !== 'glTF' || bytes.readUInt32LE(4) !== 2) {
    throw new Error(`${path} não é GLB v2 válido`)
  }
  let offset = 12
  while (offset + 8 <= bytes.length) {
    const length = bytes.readUInt32LE(offset)
    const type = bytes.toString('ascii', offset + 4, offset + 8)
    offset += 8
    const chunk = bytes.subarray(offset, offset + length)
    offset += length
    if (type === 'JSON') return JSON.parse(chunk.toString('utf8').replace(/\0+$/g, '').trim())
  }
  throw new Error(`${path} não contém chunk JSON`)
}

function signature(json) {
  return JSON.stringify({
    nodes: json.nodes?.length ?? 0,
    meshes: json.meshes?.length ?? 0,
    skins: (json.skins ?? []).map(skin => skin.joints?.length ?? 0),
    animations: (json.animations ?? []).map(animation => ({
      name: animation.name ?? '',
      channels: animation.channels?.length ?? 0,
      samplers: animation.samplers?.length ?? 0,
    })),
    imageCount: json.images?.length ?? 0,
  })
}

function run(args) {
  const result = spawnSync(cli, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`gltf-transform ${args[0]} terminou com status ${result.status}`)
}

const stageRoot = mkdtempSync(join(modelsDir, '.boss-optimization-'))
const staged = []
try {
  for (const filename of models) {
    const input = join(modelsDir, filename)
    const original = readGlbJson(input)
    const alreadyOptimized = (original.extensionsRequired ?? []).includes('EXT_meshopt_compression')
      && (original.extensionsRequired ?? []).includes('EXT_texture_webp')
      && (original.images ?? []).length > 0
      && (original.images ?? []).every(image => image.mimeType === 'image/webp')
    if (alreadyOptimized) {
      console.log(`${filename}: já está otimizado; sem alteração`)
      continue
    }

    const stem = filename.replace(/\.glb$/i, '')
    const normalWebp = join(stageRoot, `${stem}-normal-lossless.glb`)
    const colorWebp = join(stageRoot, `${stem}-color-webp.glb`)
    const ormWebp = join(stageRoot, `${stem}-orm-webp.glb`)
    const optimized = join(stageRoot, `${stem}-meshopt.glb`)

    // O mapa normal é sem perdas; cor/ORM ficam em WebP de alta qualidade.
    // Meshopt vem por último para preservar EXT_meshopt_compression no GLB final.
    run(['webp', input, normalWebp, '--lossless', '--pattern', '*Normal*'])
    run(['webp', normalWebp, colorWebp, '--quality', '88', '--pattern', '*Color*'])
    run(['webp', colorWebp, ormWebp, '--quality', '88', '--pattern', '*ORM*'])
    run(['meshopt', ormWebp, optimized, '--level', 'medium', '--quantize-weight', '12'])

    const output = readGlbJson(optimized)
    const required = new Set(output.extensionsRequired ?? [])
    for (const extension of ['EXT_meshopt_compression', 'EXT_texture_webp', 'KHR_mesh_quantization']) {
      if (!required.has(extension)) throw new Error(`${filename}: extensão requerida ${extension} ausente`)
    }
    if (signature(original) !== signature(output)) {
      throw new Error(`${filename}: estrutura de nodes, meshes, rig, animações ou texturas mudou`)
    }
    const before = statSync(input).size
    const after = statSync(optimized).size
    if (after >= before * 0.8) throw new Error(`${filename}: redução abaixo de 20% (${before} → ${after} bytes)`)
    staged.push({ input, optimized, backup: join(stageRoot, `${stem}-original.glb`), before, after })
  }

  const committed = []
  try {
    for (const item of staged) {
      copyFileSync(item.input, item.backup)
      renameSync(item.optimized, item.input)
      committed.push(item)
    }
  } catch (error) {
    for (const item of committed) copyFileSync(item.backup, item.input)
    throw error
  }

  if (staged.length) {
    const before = staged.reduce((sum, item) => sum + item.before, 0)
    const after = staged.reduce((sum, item) => sum + item.after, 0)
    for (const item of staged) console.log(`${item.input.split('/').at(-1)}: ${item.before} → ${item.after} bytes`)
    console.log(`GLBs: ${before} → ${after} bytes; economia ${(before - after)} bytes (${((1 - after / before) * 100).toFixed(1)}%)`)
  }
} finally {
  rmSync(stageRoot, { recursive: true, force: true })
}
