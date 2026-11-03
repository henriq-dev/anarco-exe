import https from 'node:https'
import { brotliDecompressSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

const args = process.argv.slice(2)
const originArgument = args[0] === '--' ? args[1] : args[0]
const origin = new URL(originArgument ?? 'https://anarcoexe.vercel.app')
if (origin.protocol !== 'https:' || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '/') {
  throw new Error('Informe somente uma origem HTTPS, por exemplo https://anarcoexe.vercel.app')
}
const models = ['anarco.mdl', 'cachos.mdl', 'laptop.mdl']
const sourceDir = new URL('../assets/models/', import.meta.url)

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function get(path, acceptEncoding) {
  return new Promise((resolve, reject) => {
    const request = https.get(new URL(path, origin), { headers: { 'Accept-Encoding': acceptEncoding } }, response => {
      const chunks = []
      let size = 0
      response.on('data', chunk => {
        size += chunk.length
        if (size > 8 * 1024 * 1024) request.destroy(new Error('Resposta excedeu o limite de 8 MiB'))
        else chunks.push(chunk)
      })
      response.on('end', () => resolve({
        status: response.statusCode,
        headers: response.headers,
        body: Buffer.concat(chunks),
      }))
      response.on('error', reject)
    })
    request.setTimeout(30_000, () => request.destroy(new Error('Timeout de 30 s ao consultar o host')))
    request.on('error', reject)
  })
}

const totals = { raw: 0, brotli: 0 }
for (const name of models) {
  const source = readFileSync(new URL(name, sourceDir))
  const identity = await get(`/assets/models/${name}`, 'identity')
  if (identity.status !== 200) throw new Error(`${name}: identity respondeu HTTP ${identity.status}`)
  const identityEncoding = String(identity.headers['content-encoding'] ?? 'identity').toLowerCase()
  if (identityEncoding !== 'identity') throw new Error(`${name}: fallback identity veio codificado como ${identityEncoding}`)
  if (!identity.body.equals(source)) throw new Error(`${name}: bytes sem compressão diferem da fonte (SHA-256 ${sha256(identity.body)})`)

  const encoded = await get(`/assets/models/${name}`, 'br')
  if (encoded.status !== 200) throw new Error(`${name}: Accept-Encoding br respondeu HTTP ${encoded.status}`)
  const contentEncoding = String(encoded.headers['content-encoding'] ?? '').toLowerCase()
  if (contentEncoding !== 'br') throw new Error(`${name}: o host não respondeu Content-Encoding: br (recebido: ${contentEncoding || 'ausente'})`)

  let decoded
  try { decoded = brotliDecompressSync(encoded.body) } catch (error) {
    throw new Error(`${name}: o corpo da resposta br não pôde ser descomprimido (${error.message})`)
  }
  if (!decoded.equals(source)) throw new Error(`${name}: corpo Brotli descomprimido difere da fonte (SHA-256 ${sha256(decoded)})`)

  totals.raw += source.length
  totals.brotli += encoded.body.length
  const vary = String(encoded.headers.vary ?? '')
  const varyNote = /accept-encoding/i.test(vary) ? 'Vary: Accept-Encoding presente' : 'aviso: Vary: Accept-Encoding não exposto na resposta'
  console.log(`OK ${name}: ${source.length} B → ${encoded.body.length} B br; bytes restaurados idênticos; ${varyNote}`)
}
const saved = totals.raw - totals.brotli
console.log(`OK entrega de modelos: ${totals.raw} B identity → ${totals.brotli} B br; economia ${saved} B (${(saved / totals.raw * 100).toFixed(1)}%)`)
