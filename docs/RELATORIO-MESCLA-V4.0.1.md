# ANARCO.EXE 3D — Relatório da mescla v4.0.1

**Resultado:** nossa v3.9.9 (HUD "Trilho fino", Vite + TypeScript, `.mdl`) + o pacote v4.0.0 recebido (Vigilância Total, trilha e efeitos sonoros, introdução em terminal, chuva de código, menu horizontal) em um único projeto.
**Validação:** 79 testes, build, smoke e e2e passam (e2e: "tudo certo"). Capturas em `docs/capturas/v4.0.1-*.png`.

## 1. Como a mescla foi feita (e por quê)
A v4.0.0 foi construída em cima da nossa v3.9.9 (já trazia o HUD "Trilho fino"). Por isso usei **mescla de 3 vias**: base = nossa v3.9.9 entregue; lado A = o que mudamos depois (menu largo); lado B = a v4.0.0.
- `script.js`, `sw.js`, `smoke.mjs`, `e2e-invadir.mjs`, `package.json`, `README.md`: só a v4 mexeu → entram inteiros.
- `style.css` e `index.html`: os dois lados mexeram → mescla pelo git. O conflito era o **menu**: a v4 já trouxe um menu horizontal próprio, com modo de resultados separado (`data-mode="results"`) e a chuva de código. Ficamos com o da v4, porque ele já se integra ao restante do jogo, e descartamos o meu rascunho (que quebrava o modo de resultados). "Nossa versão prevalece" aqui significa: manter o que funciona melhor e consertar o que falta.
- `assets/audio/*.mp3` (trilha + 4 efeitos), docs e capturas da v4: copiados.

## 2. O que foi corrigido (ranking Fácil → Difícil, na ordem executada)
| # | Nível | Correção | Por quê |
|---|---|---|---|
| 1 | Fácil | Versão 4.0.1 e cache do service worker `anarco-v4.0.1-menu-largo` | Sem trocar o nome do cache, quem já instalou o PWA continuaria com o menu antigo. |
| 2 | Fácil | `#ov div` → `#ov > div` | A regra antiga atingia **todas** as divs dentro do menu (relatório, botões), dando fundo de papel e rotação onde não devia. A v4 já tinha remendado isso em 3 blocos "Correção…". |
| 3 | Fácil | Seletor de HUD com o mesmo visual dos outros dois seletores | Estava com o cinza padrão do navegador. |
| 4 | Fácil | Textos de ajuda do menu somem em telas baixas (< 760 px de altura) | O menu passava da tela em 1366×680. |
| 5 | Médio | Caixas de opção com a altura do conteúdo | A primeira caixa esticava e deixava espaço vazio. |
| 6 | Médio | Briefing da fase sobe para o topo, sem fundo, sem capturar cliques | Embaixo ele cobria os botões ESQUIVA/NÓ/VÍRUS/EMP e o seletor de rota. |
| 7 | Médio | Ranking, Vazamentos e Pausa no mesmo visual neon do menu | Estavam no estilo "papel" antigo, fora do tema. |
| 8 | Difícil | Teste e2e: espera do minigame de 10 s → 45 s | O hack completo leva ~22 s; o teste dava falso erro mesmo na v4.0.0 original. O jogo estava certo, o teste é que estava apertado. |

## 3. Conceitos praticados
Mescla de 3 vias (`git merge-file`: base, nosso, deles), especificidade e cascata de CSS (`#ov div` vs `#ov > div`), CSS Grid com `grid-template-areas` e modo por atributo (`data-mode`), `@media` por altura além de largura, `pointer-events: none` para painéis informativos, versionamento do cache do service worker, testes e2e determinísticos (tempo de espera deve refletir o tempo real do jogo).

## 4. O que NÃO foi verificado
- Aparelhos reais (toque, FPS, áudio): testei em Chromium headless, em 4 tamanhos de tela (1366×680, 1000×640, 390×780, 780×360).
- Em celular deitado (altura ~360 px) o menu rola dentro do cartão; não cabe inteiro, por limite físico de altura.
- As músicas e os efeitos da v4 foram só conferidos quanto a carregar e decodificar, não quanto a gosto ou volume.

## 5. Observação para o deploy
A pasta `dist/` não vai no zip. Rode `pnpm install` e `pnpm build`; a Vercel faz isso sozinha (Framework Vite, saída `dist`). O peso do `dist` é ~14,4 MiB.
