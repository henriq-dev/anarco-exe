import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { transform } from 'esbuild'

const source = resolve('assets')
const target = resolve('dist/assets')
const runtimeSource = resolve('script.js')
const runtimeTarget = resolve('dist/script.js')
if (!existsSync(source)) throw new Error('The registered game assets directory is missing; restore assets before building.')
if (!existsSync(runtimeSource)) throw new Error('The ANARCO.EXE runtime source is missing; refusing to build an incomplete game.')
mkdirSync(target, { recursive: true })
cpSync(source, target, { recursive: true, force: true })
const { code, warnings } = await transform(readFileSync(runtimeSource, 'utf8'), {
  loader: 'js',
  target: 'es2022',
  minifySyntax: true,
  minifyWhitespace: true,
  // The classic runtime exposes lexical bindings used by the existing browser E2E harness.
  minifyIdentifiers: false,
  legalComments: 'none',
})
for (const warning of warnings) console.warn('[esbuild]', warning.text)
writeFileSync(runtimeTarget, code + '\n')
console.log(`standalone runtime: esbuild minified to ${Buffer.byteLength(code)} bytes (global names preserved)`)
console.log('standalone assets: copied registered game files to dist/assets')
