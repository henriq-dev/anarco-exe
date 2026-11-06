# ANARCO.EXE 3D — Relatório da mescla v4.3.0

Entradas: **v4.2.6** (zip `anarco-exe-main`, branch `main`) e **v4.2.2** (minha linha, com FXAA). Antecessor comum: v4.2.0. A v4.2.1 da `main` já descendia da minha v4.2.1; a v4.2.2 (FXAA) nunca entrou nela.

## Ordem das atividades

| # | Nível | Atividade | Resultado |
|---|-------|-----------|-----------|
| 1 | Fácil | Base v4.2.6 + limpeza final + versão/cache | removidos 4 arquivos inertes e 9 sobras (via `limpar-sobras.mjs`); `package.json` 4.3.0; `sw.js` `VERSAO` = `anarco-v4.3.0-merge` |
| 2 | Médio | Portar o FXAA | `anarco-fx.ts`, `anarco-postprocessing.ts`, testes e bloco e2e; `anarco-fxaa.ts` (sem uso) removido |
| 3 | Difícil | Tutorial/rotas no celular deitado | `portraitControls` cobre celular deitado em `syncHudClearance`; `#routePicker` usa `--anarco-route-top`; HUD fino da v4.2.6 mantido |
| 4 | Verificação | `pnpm verify` + sondas + controle negativo | ver abaixo |

## Quem ganhou em cada ponto

| Ponto | Escolhido | Motivo |
|---|---|---|
| Limpeza do template, `prune-unused-build-assets`, verificação de produção, docs de status | v4.2.6 | mais completo; build publica só 6,29 MB |
| Save: chave legada vence o envelope | empate | comportamento idêntico; mantida a da v4.2.6 |
| HUD no celular deitado | **v4.2.6** | 8–9% da altura (minha: 13–20%) e leituras secundárias acessíveis a leitores de tela (`display:none` na minha as removia) |
| Tutorial vs barra de rotas | **v4.2.2** | em 667×375 o tutorial da v4.2.6 cobria as rotas |
| FXAA | **v4.2.2** | na v4.2.6 `anarco-fxaa.ts` não era importado por ninguém |
| Cache do service worker | **v4.2.2** | a v4.2.6 ainda dizia `v4.2.0` |
| Barra do chefão | v4.2.6 (validada) | cabe na mesma faixa, sem estouro (667 e 844) |

## Conceitos praticados

- **Merge a 3 vias** conceitual: comparar cada lado contra o ancestral comum para saber quem mudou o quê (`anarco-fx.ts` e `fx-quality.test.ts` eram idênticos à v4.2.0 na base, então trazer os meus não perdeu nada).
- **Acoplamento CSS ↔ JS:** a posição de objetivo, rotas e tutorial é derivada de uma medição em JS; consertar só o CSS não basta.
- **Acessibilidade:** esconder visualmente (clip) não é o mesmo que `display:none`; o primeiro mantém o texto na árvore de acessibilidade.
- **Controle negativo de teste:** um teste só vale se falha quando a correção é removida.
- **Dead code:** um arquivo exportado e nunca importado não implementa a funcionalidade.

## Verificação

- `pnpm verify` completo: typecheck, **99 testes** (18 arquivos), build, orçamentos (**6,29/8 MB**, fontes 0,05/0,25), smoke (38 arquivos), e2e.
- e2e novo: tutorial não cobre **a barra de rotas** em 844×390, 667×375 e 932×430. **Controle negativo:** sem a correção de JS, os 3 tamanhos falham; com ela, passam.
- e2e do FXAA: Baixa sem MSAA → sem FXAA; Média liga (Render + Output + FXAA); Baixa desliga e descarta o composer.
- Medido no navegador: HUD 8–9%, tutorial em 134–180 px abaixo das rotas, sem sobreposição com habilidades; barra do chefão na mesma faixa sem sobrepor os botões de som/pausa.

## Aplicando no repositório (o overlay NÃO apaga arquivos)

Se você copia este pacote por cima do checkout, apague estes arquivos que saíram:

```
.manus-starter-init.json   template.json   app.config.ts   bun.lock
src/anarco-fxaa.ts         limpar-sobras.mjs
public/fonts/ManusCC0-Bold.ttf  public/fonts/ManusCC0-Medium.ttf  public/fonts/ManusCC0-Regular.ttf
public/fonts/ManusCC0SansCJKSC-Regular.woff2  public/fonts/ManusCC0-LICENSE.txt
assets/models/anarco.bin  assets/models/cachos.bin  assets/models/laptop.bin
assets/share/og.png
```

Depois: `pnpm install --frozen-lockfile` e `pnpm verify` (defina `CHROMIUM_PATH` se o Playwright não achar o Chromium).

## Limites e pendências

- Custo do FXAA em GPU real **não medido** (SwiftShader roda em CPU); medir com `?perf=1` em celular.
- `credits.fonts` em `src/i18n/*.json` já foi corrigido pela v4.2.6 (Special Elite). Esse texto só aparece no scaffold, não no jogo publicado.
- O `src/main.ts` do scaffold ainda importa `scripts/manus-tuning` (por isso o diretório foi mantido).
- Continuam dependendo de você: medições em PC/celular/controle reais, Lighthouse após publicar a v4.3.0 e leitor de tela real. O `pnpm verify:production-models -- <URL>` da v4.2.6 roda depois do deploy.
