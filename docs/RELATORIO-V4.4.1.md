# ANARCO.EXE v4.4.1 — Correções da auditoria (bugs, fluxo e responsividade)

Base: v4.4.0. Regras de jogo, visual e textos de desktop **não mudaram**.

## Ranking de dificuldade e ordem de execução

| Nível | # | Item | Onde |
|---|---|---|---|
| Fácil | 9 | Save `"null"`/array não quebra o boot | `script.js` (progression) |
| Fácil | 13 | Pausa silencia osciladores e música | `syncAudioLayers`, `playMusicTick` |
| Fácil | 11 | Joystick solta em blur/hidden/pausa/reset/`lostpointercapture` | `jend`, `soltarTeclas` |
| Fácil | 12 | Aba oculta pausa a partida | `visibilitychange` |
| Fácil | R2–R4 | Intro com safe-area; modais com `dvh`+notch; `max(180px, …)` nas larguras | `script.js`, `style.css` |
| Fácil | R1 | Rótulos curtos nos botões de ação no toque | `rot()` em `script.js` |
| Médio | 3 | `endT` zerado no reset (vitória instantânea) | `cancelTransitions` |
| Médio | 4 | `end()` idempotente + `startMini`/vitória só em `play` | `end`, loop |
| Médio | 7 | Menu/reset/end limpam ataques do chefão | `reset`, `pzm`, `end` |
| Médio | R5 | `syncHudClearance` mede os controles de baixo; tutorial recolhe se sobra < 120 px | `--anarco-bottom-clear`, `data-low-space` |
| Médio | 10 | Multi-abas: não sobrescreve o envelope de outra aba | `refreshFromStorage()` + evento `storage` |
| Difícil | 1, 2 | Transições como estado: handle + `runId`, cancelamento, pendência na pausa | `scheduleTransition` |
| Difícil | 5, 6, 8 | `disposeObject3D`, `destroyHazard`, `destroyBoss`, dispose de GLTF descartado | `script.js` |

## Conceitos praticados
Ciclo de vida de timers (handle + identificador de partida contra "timer fantasma"); máquina de estados (`play`/`pause`/`brief`/`over`) e transição pendente; idempotência; memória de GPU no Three.js (`dispose` de geometria, material e textura; `AnimationMixer.uncacheRoot`); eventos `blur`, `visibilitychange`, `lostpointercapture`, `storage`; `env(safe-area-inset-*)`, `dvh`, `max()`/`clamp()`; medição de layout com `getBoundingClientRect`.

## Justificativa da lógica
- **`runId` + `clearTimeout`**: cancelar é o que impede; o `runId` é a segunda trava caso um timer escape. Durante a pausa o timer não é perdido: vira `pendingAdvance` e roda ao despausar (era o travamento da fase).
- **Estado `brief`**: o briefing usa `state = "brief"`, então o avanço da fase aceita `play` ou `brief`; foi detectado pelo teste e2e e corrigido.
- **`end()` idempotente**: `if (state === "over") return` impede que vitória e derrota no mesmo quadro se sobrescrevam.
- **Dispose só do que é por ataque/chefão**: materiais e geometrias compartilhados da cena não são tocados.
- **Multi-abas**: antes de gravar, o envelope é relido e as chaves da outra aba entram na memória; o evento `storage` mescla o progresso (vitórias = maior valor, skins = união).

## Testado
- `pnpm test`: 32 testes (novo: multi-abas). `pnpm build`: orçamentos 6,29/8 MB, nenhum relaxado.
- e2e (Chromium/SwiftShader), novos: save `"null"`; pausa na transição; reset cancela timer e zera `endT`; `end()` idempotente; dispose de 3 geometrias + 3 materiais do ataque e da malha do chefão; menu limpa ataques; joystick zera em blur; aba oculta pausa; 568×320 e 640×360 com rótulos curtos, sem corte, sem rolagem horizontal e sem sobreposição entre objetivo/rotas/ações/joystick. Os testes antigos (844×390, 667×375, 932×430) seguem passando.

## Não testado / não feito
- **Item 7 do canvas** (ouvir `matchMedia('(resolution)')` ao trocar de monitor/zoom e reduzir resolução em tela pequena): não implementado; o DPR já é recalculado no resize pelo módulo de FX.
- Perfil com notch real (safe-area simulada) não foi simulado no e2e; o CSS usa `env()` mas só foi verificado sem notch.
- Vazamento de GPU medido só por contagem de chamadas `dispose`, não por `renderer.info` com GPU real.
- Toque real, áudio audível, gamepad físico e leitor de tela continuam sem teste em aparelho.
- Pacote não apaga arquivos: nada novo a apagar nesta versão.
