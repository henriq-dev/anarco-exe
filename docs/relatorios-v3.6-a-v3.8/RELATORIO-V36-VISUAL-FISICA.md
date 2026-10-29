# ANARCO.EXE — v3.6 Visual & Physics Upgrade

## Resumo

A v3.6 mantém o loop original de infiltração, hacking, coleta, drones e chefões, acrescentando uma camada de resposta física e apresentação visual mais forte. VANTA, Capuz, Cachos, EMP, VÍRUS, BREACH, modelos GLB dos chefões e progressão anterior foram preservados.

## Melhorias gráficas

O cenário agora possui poças neon refletivas de baixo custo, com materiais metálicos e brilho emissivo animado. As poças usam geometrias simples e materiais locais, sem dependência externa, e recebem uma pulsação sutil por fase para reforçar a sensação de chão molhado e profundidade. A atualização também preserva a névoa, skyline, grid, luzes e materiais emissivos existentes.

## Melhorias físicas e de controle

Foi adicionada a habilidade **ESQUIVA**, ativada pela tecla `C` ou pelo botão do HUD. Ela calcula a direção do teclado/toque ou usa a direção atual do personagem, aplica um impulso curto, passa pelo sistema existente de colisão contra torres, caixas e objetos sólidos, e oferece uma janela curta de invulnerabilidade. A esquiva possui recarga de aproximadamente 1,35 segundo, ajustada pela rota técnica.

Durante a esquiva, o jogador recebe feedback de flash, vibração, mensagem contextual e efeito luminoso. A janela evasiva também impede temporariamente a detecção dos drones e o dano de áreas telegráficas dos chefões. O movimento normal continua usando aceleração e desaceleração, e a esquiva não substitui o sprint com Shift.

## Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `script.js` | Poças neon, estado físico da esquiva, impulso, invulnerabilidade, integração com colisões, drones, hazards e HUD |
| `public/script.js` | Cópia sincronizada do runtime standalone |
| `index.html` | Botão `ESQUIVA · C` |
| `style.css` | Visual, recarga, brilho e posicionamento desktop/mobile da esquiva |
| `RELATORIO-V36-VISUAL-FISICA.md` | Este relatório |

## Validação

- `node --check script.js`: aprovado.
- `node --check public/script.js`: aprovado.
- `pnpm build`: aprovado.
- `pnpm test`: aprovado, 11 arquivos e 78 testes.
- `pnpm audit:release`: aprovado.
- Preview HTTP/browser: aprovado; o botão ESQUIVA aparece no HUD e VANTA continua selecionada.

O smoke test Playwright permanece condicionado à instalação do binário Chromium no ambiente; essa limitação não afetou o build, os testes, a auditoria ou a renderização observada no preview.

## Pacote

O pacote final incremental é `ANARCO.EXE-v3.6-VISUAL-FISICA-final-incremental.zip`. Ele contém código, estilos, scripts públicos, modelos 3D locais, skins, cópias públicas dos assets e este relatório. A publicação no GitHub/Vercel não foi executada automaticamente.
