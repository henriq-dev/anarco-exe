# ANARCO.EXE v4.4.2 — DPR dinâmico (item 7 da auditoria) + checklist de teste real

Base: v4.4.1. Só muda a resolução interna ao trocar de monitor ou zoom.

## Ordem (Fácil)
1. `AnarcoFxSystem.checkDevicePixelRatio()` compara `devicePixelRatio` com o último aplicado e, se mudou, refaz `applyQuality()` + `resize()`.
2. `watchDevicePixelRatio()` assina `matchMedia('(resolution: Xdppx)')` (dispara quando o DPR sai de X) e se rearma com o novo valor.
3. O `loop` chama `checkDevicePixelRatio()` a cada quadro (uma comparação).

## Justificativa
O teste mostrou que o Chromium headless muda `devicePixelRatio` mas **não dispara** o evento da media query; por isso a checagem por quadro é a garantia e a media query é só a reação imediata onde existe. O teto de DPR por qualidade (`resolveFxPixelRatio`) continua valendo: baixa 1, média 1,35, alta 2 (1,25 no toque).

## Conceitos
`matchMedia` com `resolution`, evento `change` de uso único e rearmamento, polling barato como rede de segurança, emulação de DPR via CDP no teste.

## Testado
`pnpm verify` (32 testes, build, smoke, e2e). Novo e2e: DPR 1→2 muda o pixel ratio do renderer de 1 para 2 sem redimensionar a janela.

## Checklist para você (aparelho real)
1. Copiar por cima, `pnpm install --frozen-lockfile`, `pnpm verify`, deploy.
2. Celular deitado (com notch, se tiver): botões curtos, rotas, tutorial, safe-area.
3. `?perf=1` em PC, celular e controle: FPS e custo do FXAA.
4. Lighthouse + `pnpm verify:production-models -- <URL>` após o deploy.
5. Várias lutas de chefão e comparar `renderer.info.memory` (geometries/textures) antes e depois.
6. Áudio audível, gamepad físico, leitor de tela.
7. Arrastar a janela entre dois monitores de DPR diferentes (ou mudar o zoom) e ver a nitidez se ajustar.

Nada novo a apagar no repositório.
