// ANARCO.EXE — remove as sobras de versões antigas que estouram o budget do build.
// Uso: copie este arquivo para a RAIZ do repositório (onde está o package.json) e rode:  node limpar-sobras.mjs
// Depois abra o GitHub Desktop: os arquivos aparecem como removidos. Faça commit e push. Pode apagar este script em seguida.
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

if (!existsSync('package.json') || !existsSync('index.html')) {
  console.error('Rode este script na raiz do repositório (onde ficam package.json e index.html).')
  process.exit(1)
}

const removidos = []
const mantidos = []
const apagar = (caminho, motivo) => { rmSync(resolve(caminho)); removidos.push(`${caminho}  (${motivo})`) }

// 1) Fontes do template antigo (a interface usa Special Elite)
for (const f of ['ManusCC0-Bold.ttf', 'ManusCC0-Medium.ttf', 'ManusCC0-Regular.ttf', 'ManusCC0SansCJKSC-Regular.woff2', 'ManusCC0-LICENSE.txt']) {
  const p = `public/fonts/${f}`
  if (existsSync(p)) apagar(p, 'fonte do template antigo, não usada')
}

// 2) Cópias .bin dos modelos — só apaga se forem idênticas ao .mdl (o jogo carrega o .mdl)
for (const nome of ['anarco', 'cachos', 'laptop']) {
  const bin = `assets/models/${nome}.bin`, mdl = `assets/models/${nome}.mdl`
  if (!existsSync(bin)) continue
  if (existsSync(mdl) && readFileSync(bin).equals(readFileSync(mdl))) apagar(bin, `cópia idêntica de ${nome}.mdl`)
  else mantidos.push(`${bin}  (NÃO é cópia idêntica do .mdl — mantido por segurança)`)
}

// 3) Capa antiga — o jogo usa og.jpg
if (existsSync('assets/share/og.png') && existsSync('assets/share/og.jpg')) apagar('assets/share/og.png', 'capa antiga; o HTML usa og.jpg')

console.log(removidos.length ? `Removidos (${removidos.length}):\n  ` + removidos.join('\n  ') : 'Nenhuma sobra encontrada.')
if (mantidos.length) console.log('\nMantidos:\n  ' + mantidos.join('\n  '))
