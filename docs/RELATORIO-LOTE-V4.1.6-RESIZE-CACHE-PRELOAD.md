# ANARCO.EXE v4.1.6 — resize, cache, budgets e preloads

## O que mudou

### Quadro no resize em menu/pausa

O resize atualiza renderer, câmera e composer; quando `state` é `menu` ou `pause`, agenda um único `fxSystem.render()` no próximo `requestAnimationFrame`. Eventos que chegam antes desse quadro são coalescidos. Também há um quadro inicial depois de construir a cena, para que o primeiro menu não dependa de um resize para exibir o fundo. O loop segue sem render contínuo em menu/pausa e volta ao normal durante gameplay.

O E2E muda o viewport duas vezes em menu e, durante a pausa, alterna de paisagem (1000×560) para retrato (560×1000) e volta. Em cada mudança verifica exatamente um quadro e nenhum quadro extra durante a espera; a retomada do jogo continua coberta.

### Investigação do clique em Invadir/alerta

O E2E passou em três execuções consecutivas com o fluxo de Invadir e o cenário do alerta. Não reproduzi um travamento. O comportamento esperado é: o primeiro clique em **Invadir** abre o `introTerminal`, e `state` permanece em `menu`; a partida só inicia em `play` depois que a introdução é descartada por clique/tecla. O teste agora afirma essa transição explicitamente e depois verifica `play` e a penalidade finita do alerta.

Isso pode explicar um teste externo que espere `state === 'play'` imediatamente após clicar uma vez: ele está esperando a etapa errada se não dispensar o terminal. Sem o log e os passos exatos da tentativa que falhou, não dá para atribuir com certeza o episódio à infraestrutura do servidor; o fluxo do jogo não apresentou falha nas três execuções locais.

### Budgets por categoria na CI — item global 12

`scripts/check-size.mjs` aplica limites no `pnpm build`, que é chamado pela CI em `pnpm verify`. O smoke também verifica paths de preload e as regras de cache.

| Categoria | Atual | Limite | Medição |
|---|---:|---:|---|
| JavaScript | 0,26 MiB | 1,25 MiB | gzip |
| CSS | 0,01 MiB | 0,50 MiB | gzip |
| Fontes | 0,08 MiB | 0,25 MiB | bytes enviados |
| Áudio | 2,86 MiB | 3,25 MiB | bytes enviados |
| Modelos | 2,78 MiB | 3,25 MiB | bytes enviados |
| Imagens | 0,32 MiB | 0,75 MiB | transferência; SVG em gzip |
| Outros | 0,01 MiB | 0,50 MiB | transferência |
| Total | 6,31 MiB | 8,00 MiB | transferência, texto em gzip |

### Cache Vercel — item global 17

`vercel.json` faz o HTML revalidar (`max-age=0`), impede cache do Service Worker (`no-store`), dá um cache curto aos assets com nomes estáveis e usa `public, max-age=31536000, immutable` somente para arquivos Vite com hash de conteúdo no nome. O smoke verifica o JSON, as regras base e se os nomes hashados da build encontram uma regra immutable sem capturar `assets/dados/manifesto.js`.

Não houve deploy real na Vercel; a verificação local confirma a configuração e os padrões contra os arquivos gerados, mas não observa os headers servidos pela infraestrutura em produção.

### Preloads — item global 19

A fonte ManusCC0 Regular (já presente e creditada no projeto) agora é um fallback real da UI, com `font-display: swap`, e recebe `<link rel="preload" as="font" type="font/ttf" crossorigin>`. A entrada ES module recebe `rel="modulepreload"`, que é a forma apropriada para módulos: em produção o plugin injeta o URL hashado do bundle; em dev aponta para `src/anarco-entry.ts`. O smoke confirma que ambos os links antecedem/incluem arquivos existentes.

## Validação

`CHROMIUM_PATH=/usr/bin/chromium pnpm verify` passou: typecheck, **85 testes em 14 arquivos**, build, budgets por categoria, smoke e E2E. O smoke confirmou 38 arquivos (7,06 MiB). Além da passagem incluída em `verify`, rodei duas reexecuções consecutivas do E2E; as três confirmaram terminal introdutório, início de gameplay e teste do alerta.

O build mantém um aviso conhecido do Vite: `assets/dados/manifesto.js` é um script clássico sem `type="module"` e, intencionalmente, não entra no bundle. Isso não falhou no typecheck, build, smoke nem E2E.

## Numeração e estado do backlog

O relatório v4.1.5 foi corrigido: render em menu/pausa é o **item global 8**, não o 7. O item global 7 (separar a decodificação da trilha dos efeitos curtos) continua pendente.

A lista tem agora **10 de 20 itens concluídos**: 4, 8, 9, 10, 11, 12, 13, 15, 17 e 19. Restam 10: 1, 2, 3, 5, 6, 7, 14, 16, 18 e 20. Continuam pendentes o teste em PC/celular físicos, Lighthouse/Brotli e validação com leitores de tela reais.
