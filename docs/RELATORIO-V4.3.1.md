# ANARCO.EXE 3D — Relatório v4.3.1 (pacote fiel ao README)

Origem: análise externa da v4.3.0 com 3 problemas. Cada um foi conferido contra o ZIP entregue.

## Conferência dos achados

| # | Achado | Veredito | O que foi feito |
|---|--------|----------|-----------------|
| 1 | README diz que as sobras do Manus foram apagadas, mas estão no ZIP | **Procedente** | Removidos de fato (lista abaixo) |
| 2 | `limpar-sobras.mjs` citado no README e ausente | **Procedente (menor)** | O script foi executado e descartado de propósito (ele mesmo pede isso), mas o README o citava como se acompanhasse o pacote; texto corrigido |
| 3 | Dois jogos ao mesmo tempo (`script.js` ativo × `src/game` + `src/engine` sem uso), README deixa pendente | **Procedente, já decidido** | Decisão registrada em `docs/STATUS-OTIMIZACOES-V4.2.3.md` (mantido isolado) agora é citada no README; **não apaguei** o scaffold |

Dois números do texto analisado não batem com o ZIP: `assets.lock.json` tem **4** links (todos `files.manuscdn.com`), não 12; e há **18** arquivos de teste (99 testes na v4.3.0), não 14. O total de 163 arquivos estava correto.

## Por que o achado 1 aconteceu

A v4.3.0 foi montada sobre o ZIP da branch `main`. Copiar um pacote por cima de um checkout **não apaga arquivos**, então o README (herdado da v4.2.1, que de fato removia essas sobras) descrevia uma limpeza que o `main` nunca recebeu. Na v4.3.0 eu removi só 4 arquivos inertes e deixei o resto; devia ter conferido o README contra a árvore.

## Ordem das atividades

| # | Nível | Atividade |
|---|-------|-----------|
| 1 | Fácil | Contar arquivos e testes; listar sobras presentes |
| 2 | Médio | Mapear quem referencia cada sobra (grep em `src`, `scripts`, `tests`, config e CI) |
| 3 | Difícil | Remover o que nada usa, manter o que ainda é importado, reescrever o README e provar com `pnpm verify` |

## Removido

`game-sharing.json` · `assets.lock.json` · `public/manus-routes.json` · `scripts/manus-game-assets/` · `scripts/manus-game-sharing/` · `scripts/__manus__/` · `scripts/manus-tuning/vite.mjs`, `vite.d.mts`, `identity.mjs` · `tests/game-sharing-assets.test.mjs`

## Mantido de propósito

- `scripts/manus-tuning/adapter.js` e `adapter.d.ts`: importados por `src/main.ts` (entrada do scaffold; `tsc` precisa do `.d.ts`). Saem junto com o scaffold, se um dia ele for removido.
- `src/main.ts`, `src/engine/assets.ts`, `src/styles/main.css`: só referenciam a si mesmos e fazem parte do scaffold que a decisão do item 3 manda não apagar.
- `prune-unused-build-assets` e as asserções do `smoke`: continuam impedindo a publicação de `manus-routes.json` e das fontes ManusCC0 se reaparecerem num checkout antigo.

## Conceitos praticados

- **Consistência documentação ↔ código:** um README é uma afirmação testável; conferi cada frase de "removido" contra a árvore.
- **Análise de dependências antes de apagar:** `grep` por quem importa cada arquivo (ex.: `identity.mjs` só era usado por `vite.mjs`, então saiu junto).
- **Sobreposição ≠ sincronização:** copiar um ZIP sobre um repositório não propaga remoções.

## Verificação

`pnpm verify` completo: typecheck, **98 testes** (17 arquivos; menos 1 teste, o do metadado de compartilhamento que o README já dava como removido), build, orçamentos 6,29/8 MB, smoke (38 arquivos) e e2e. `dist/` sem nenhuma sobra do Manus.

## Aplicando no repositório

Apague no GitHub Desktop (o pacote não apaga por si):

```
.manus-starter-init.json  template.json  app.config.ts  bun.lock
game-sharing.json  assets.lock.json  public/manus-routes.json
scripts/manus-game-assets/  scripts/manus-game-sharing/  scripts/__manus__/
scripts/manus-tuning/vite.mjs  scripts/manus-tuning/vite.d.mts  scripts/manus-tuning/identity.mjs
tests/game-sharing-assets.test.mjs
src/anarco-fxaa.ts  limpar-sobras.mjs
public/fonts/ManusCC0-Bold.ttf  public/fonts/ManusCC0-Medium.ttf  public/fonts/ManusCC0-Regular.ttf
public/fonts/ManusCC0SansCJKSC-Regular.woff2  public/fonts/ManusCC0-LICENSE.txt
assets/models/anarco.bin  assets/models/cachos.bin  assets/models/laptop.bin  assets/share/og.png
```

Depois: `pnpm install --frozen-lockfile` e `pnpm verify`.

## Em aberto (decisão sua)

Remover o scaffold `src/game` + `src/engine` (~7 mil linhas, com testes, mais `src/main.ts`, `src/engine/assets.ts`, `src/styles/main.css` e `scripts/manus-tuning/adapter.*`). Não é cópia do jogo: é outro protótipo (plataforma). Se for aposentado, a ponte `src/game/tuning.ts` precisa ser migrada ou descartada antes, como diz o documento de status.
