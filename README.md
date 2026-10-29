# ANARCO.EXE 3D — Breach Protocol (V3.8)

Atualização do jogo cyberpunk 3D enviado pelo usuário. A v3.7 preserva a jogabilidade, os controles, skins, modelos GLB, fases, progressão, áudio e efeitos herdados da v3.6 e acrescenta efeitos neon/combate e qualidade gráfica escalável. A v3.8 melhora a legibilidade e a responsividade do HUD e acrescenta detalhes ambientais leves às salas existentes.

## Desenvolvimento e build

```bash
pnpm install
PORT=3000 HOST=0.0.0.0 pnpm dev
pnpm typecheck
pnpm test
pnpm build
pnpm smoke       # depois do build: verifica a saída estática e os assets requeridos
```

`pnpm build` roda TypeScript, copia o runtime atual `script.js` e os assets, empacota `dist/` em formato portátil e aplica os limites de JavaScript/fontes. Para servir a exportação localmente, execute `python3 -m http.server 4173 --directory dist`. A pasta `dist/` pode ser publicada como site estático (por exemplo, em Vercel), sem backend. Não há publicação incluída neste pacote.

## Controles

No teclado: WASD/setas movimentam; Shift corre; Espaço ativa BREACH; E ativa EMP; Q ativa VÍRUS; R ativa NÓ FANTASMA da VANTA; C executa esquiva; Esc pausa. O HUD oferece os mesmos comandos por toque, joystick, botões e ações do minigame de hacking.

O menu permite selecionar qualidade baixa, média e alta. Baixa reduz partículas/luzes e omite bloom completo; média usa bloom seletivo leve; alta habilita bloom de pós-processamento e sombras dinâmicas. A resolução e os efeitos adaptam-se automaticamente quando a taxa de quadros cai. Preferência manual de qualidade fica salva localmente pelo navegador.

## Efeitos neon/combate (v3.7)

A camada `src/anarco-fx.ts` mantém partículas em um pool BufferGeometry, luzes temporárias reutilizáveis, rastros/duplicatas da esquiva, flashes/glitches breves, bloom completo opcional e qualidade adaptativa. `script.js` conserva eventos e autoridades da v3.6; seus chamados de VFX são cosméticos, separados da simulação e do solver de colisão.

As fases mantêm suas paletas magenta/azul, laranja, ciano, verde, azul elétrico e rosa/roxo. Diretor-Banqueiro, Barão do Petróleo e CEO MEGACORP recebem elementos visuais específicos. Modelos e arte de gameplay vêm do pacote do usuário; não são baixados nem gerados nesta atualização.

## HUD e salas (v3.8)

O HUD foi reorganizado para separar painel superior, objetivo, rota, avisos e controles de toque; inclui posicionamento responsivo conforme a altura observada do painel. Layout foi conferido em Chromium em 1280×720, 390×844, 320×568 e 667×375. O Esconderijo Data/Data Center recebeu detalhes ambientais geométricos leves, sem novos colliders ou alterações de rotas e hacking. A integração dos computadores 3D específicos aguarda os arquivos que o usuário pretende enviar.

## Tweak de desenvolvimento

No Preview do Vite o bridge Tweak existente registra os controles cosméticos em `src/game/tuning.ts`: qualidade FX, densidade de partículas, intensidade de luzes temporárias, glitches e bloom alto. Não são expostos parâmetros de movimento, dano, colisão ou recompensa. O painel/adaptador de desenvolvimento não entra no build de produção.

## Assets e compatibilidade

O runtime legado exige um servidor HTTP/HTTPS — não abra o HTML diretamente por `file://`. O Three.js e os passes de pós-processamento são importados das dependências locais. Os modelos GLB, buffers `.bin`, skins e arte social ficam em `assets/`; os arquivos registrados são recuperáveis pelo armazenamento do projeto, e `pnpm build` copia o conteúdo para `dist/assets/` para manter a exportação portátil. `public/assets/dados/manifesto.js` fornece fallbacks vetoriais locais para os caminhos ausentes do ZIP, sem downloads de mídia externa. O build utiliza `base: './'` para poder ser servido em raiz ou subdiretório.

## Teste e continuação

As verificações automatizadas (`pnpm typecheck`, `pnpm test`, build e smoke) e o playtest desta versão estão documentados em [`RELATORIO-CONTINUIDADE-V3.8.md`](RELATORIO-CONTINUIDADE-V3.8.md). Uma run anterior completou as três invasões do Distrito Financeiro e avançou para a Zona Industrial; na retomada posterior, uma rota exposta atingiu alerta máximo antes do primeiro hack. O ponto de retomada do nível 2/6 está agora pausado no spawn, após restauração pelo bridge local/dev-only — isso não valida progressão nova. Nenhum chefão foi alcançado nesta continuação. A aparência do Data Center ainda precisa ser inspecionada em sua fase, e touch/GPU física/áudio/performance em aparelhos reais seguem para aceite.
