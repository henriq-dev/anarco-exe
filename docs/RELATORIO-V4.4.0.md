# ANARCO.EXE 3D — Relatório v4.4.0 (um só jogo no repositório)

Base: v4.3.1. Motivo: análise apontou (1) peso do pacote e (2) um segundo jogo não usado que confunde a manutenção. Conferi os números antes de agir.

## Ordem das atividades

| # | Nível | Atividade | Resultado |
|---|-------|-----------|-----------|
| 1 | Fácil | Mapear dependências do scaffold e o peso do pacote | nenhum arquivo ativo importa o scaffold; 10 testes o exercitam; `docs/capturas` = 4,45 MB |
| 2 | Médio | Remover o scaffold, seus testes e a dependência de física | `tsc` ok; 31 testes do jogo ativo passam |
| 3 | Médio | Enxugar o pacote | capturas PNG → WebP sem perda: 4,45 → 2,93 MB, **pixels idênticos** |
| 4 | Difícil | Provar que o jogo publicado não mudou | `dist` byte a byte igual ao da v4.3.1, exceto `sw.js` |

## Conferência dos números da análise

- "7 mil linhas": o scaffold tinha **~3,7 mil** (`src/game` 1.536 · `engine` 817 · `ui` 662 · `styles` 420 · `i18n` 150 · `main.ts` 158); só game + engine somam ~2,4 mil. O risco de editar o arquivo errado era real mesmo assim.
- "12 MB": o ZIP tinha 11,5 MB = 6 MB de `assets/` (o jogo) + 6 MB de `docs/` (4,4 MB só de capturas). O que o jogador baixa é o `dist` de 6,29 MB, igual nas duas versões.
- "Textos em inglês e chinês": existiam **só no scaffold** (`src/i18n`); `script.js` não tem nenhum código de idioma.

## Removido

- `src/game/`, `src/engine/`, `src/ui/`, `src/i18n/`, `src/styles/`, `src/main.ts`, `scripts/manus-tuning/`
- Testes: `game-tutorial`, `i18n`, `input`, `level`, `loop`, `player-jump`, `rules`, `save`, `tuning`, `ui-input` (67 testes). Atenção: `tests/save.test.ts` testava o save do **scaffold**; o save do jogo ativo continua coberto por `anarco-save-migration.test.ts`.
- Dependência `@dimforge/rapier3d-compat` (física do scaffold). O lockfile ainda cita o rapier 0.12 como dependência **indireta** de outro pacote; isso não é nosso.
- `docs/capturas/*.png` → `*.webp` (sem perda), links dos relatórios atualizados e conferidos (nenhum quebrado).

## Conceitos praticados

- **Análise de dependências antes de apagar** (`grep` de importações em código, scripts, config e CI).
- **Prova de não-regressão por checksum:** em vez de "parece igual", comparei o SHA-256 de cada arquivo do `dist`.
- **Compressão sem perda** verificada pixel a pixel (`numpy.array_equal`).
- **Dívida técnica:** código morto é custo de manutenção (risco de editar o arquivo errado), não de execução.

## Verificação

`pnpm verify` completo: typecheck, **31 testes** (7 arquivos), build, orçamentos **6,29/8 MB**, smoke (38 arquivos), e2e "tudo certo". `dist` com 38 arquivos, 7.336 KB nas duas versões.

## Aplicando no repositório (o pacote não apaga arquivos)

```
src/game/  src/engine/  src/ui/  src/i18n/  src/styles/  src/main.ts  scripts/manus-tuning/
tests/game-tutorial.test.ts  tests/i18n.test.ts  tests/input.test.ts  tests/level.test.ts  tests/loop.test.ts
tests/player-jump.test.ts  tests/rules.test.ts  tests/save.test.ts  tests/tuning.test.ts  tests/ui-input.test.ts
docs/capturas/*.png        (substituídos pelos .webp)
```

Mais as sobras já listadas no relatório da v4.3.1. Depois: `pnpm install --frozen-lockfile` e `pnpm verify`.

## Em aberto

Só o que depende de você: medições em PC, celular e controle reais (`?perf=1`), Lighthouse e `pnpm verify:production-models -- <URL>` após publicar, e teste com leitor de tela real. O custo do FXAA em GPU real continua não medido.
