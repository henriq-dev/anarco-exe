import { copyFileSync, cpSync, existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const source = resolve('assets')
const target = resolve('dist/assets')
const runtimeSource = resolve('script.js')
const runtimeTarget = resolve('dist/script.js')
if (!existsSync(source)) throw new Error('The registered game assets directory is missing; restore assets before building.')
if (!existsSync(runtimeSource)) throw new Error('The ANARCO.EXE runtime source is missing; refusing to build an incomplete game.')
mkdirSync(target, { recursive: true })
cpSync(source, target, { recursive: true, force: true })
copyFileSync(runtimeSource, runtimeTarget)
console.log('standalone runtime: copied the current source game to dist/script.js')
console.log('standalone assets: copied registered game files to dist/assets')
