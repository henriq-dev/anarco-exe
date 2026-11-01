# ANARCO.EXE — Otimizações difíceis v4.1.0

Este adendo conclui a rodada de otimização do ANARCO.EXE v4.0.0. A estética terminal/hacker, a progressão, os controles, as fases e o fluxo do hack foram preservados. Nenhuma publicação externa foi executada.

## Checklist

- [x] **1. Reduzir as chamadas de desenho da cidade.** As 46 construções (aproximadamente 230 componentes geométricos) são agora lotes estáticos por material dentro de oito setores espaciais. Corpos continuam separados pelas três texturas de janelas; contornos e antenas ciano/magenta/verde compartilham geometria por material; coroas permanecem no material próprio. Os setores mantêm bounds independentes para o recorte da câmera; não foi criado um único bloco global.
- [~] **2. Evitar trabalho repetido no loop.** O objeto de estado enviado ao sistema FX é reutilizado em cada quadro, e a velocidade inicial das partículas deixa de alocar um `Vector3` temporário. A lista de partículas ativas e o índice espacial das colisões não foram introduzidos: o p95 medido de update+gameplay ficou abaixo de 1 ms nas duas emulações, e um índice extra para o volume atual de colisores não tem benefício demonstrado. A escolha evita aumentar risco/complexidade sem evidência de gargalo. `~` indica melhoria guiada por perfil com otimizações delicadas deliberadamente adiadas.
- [x] **3. Confirmar e remover código morto seguro da base Manus.** `src/main.ts`, `src/styles/main.css` e `src/engine/assets.ts` não tinham importadores externos; os três foram removidos, totalizando 33.210 bytes na árvore-fonte. Rapier passou a dependência de desenvolvimento/testes. Os módulos `src/game` e `src/engine` que ainda são referenciados pelos testes ou pelo Tweak de desenvolvimento foram mantidos. A auditoria confirmou que esses arquivos órfãos não compunham a build de produção; portanto, não se atribui a eles uma falsa redução de bundle.
- [~] **4. Medir tempos de quadro em PC e celular.** Foi adicionado painel local opt-in em `?perf=1`, com frame intervals, p50/p95/p99, tempos síncronos de update e submissão de render, transições de qualidade e exportação JSON. O coletor está num chunk dinâmico separado (2,70 KB gzip) e só é solicitado com a query. Baseline e pós-otimização foram medidos em Chromium/SwiftShader com viewport desktop e touch emulado. A medição é repetível; ainda falta executar em GPU de PC e em telefone físicos para obter resultados desses aparelhos. `~` indica essa limitação de hardware.

## Medição controlada da skyline

O benchmark cria sessões frescas com o mesmo nível/câmera e qualidade FX Baixa. Compara a cena normal com um controle que oculta somente os grupos da skyline. A contagem é feita nos comandos WebGL `draw*` por quadro; assim, o delta isola melhor as malhas da cidade do que o contador de uma única passagem do `renderer.info`.

| Métrica do delta skyline (visível − controle oculto) | Baseline | Pós-otimização | Redução |
|---|---:|---:|---:|
| Chamadas medianas (p50) | 30 | 13 | 56,7% |
| Chamadas de cauda (p95) | 40 | 11 | 72,5% |

As chamadas totais no p50 passaram de 159 visível / 129 oculto para 144 / 131. O delta, não a contagem total da cena, é a medida principal aqui. A contagem `renderer.info.memory.geometries` observada ao fim dos perfis caiu de 226 para 200 no desktop emulado (−11,5%) e de 130 para 117 no touch emulado (−10,0%).

## Perfil de frame time — ambiente de software

Foram usadas duas capturas de seis segundos no mesmo Chromium 156 com SwiftShader. Desktop: 1000 × 560, DPR 1, preset selecionado Alto, adaptado a Médio. Touch emulado: 390 × 844, DPR 2, preset selecionado Médio, adaptado a Baixo. O modo de cena e a qualidade inicial são iguais entre baseline e pós. SwiftShader é renderização WebGL por software: estes números servem para repetir a comparação no sandbox, não para prometer FPS em hardware físico.

| Perfil | Métrica | Baseline | Pós | Variação observada |
|---|---|---:|---:|---:|
| Desktop emulado | Cadência média | 9,97 FPS | 10,52 FPS | +5,5% |
| Desktop emulado | Intervalo de quadro p95 | 116,7 ms | 116,7 ms | sem mudança |
| Desktop emulado | Update + gameplay p95 | 0,9 ms | 0,7 ms | −22,2% |
| Desktop emulado | Submissão de render p95 | 3,7 ms | 2,5 ms | −32,4% |
| Touch emulado | Cadência média | 28,33 FPS | 36,94 FPS | +30,4% |
| Touch emulado | Intervalo de quadro p95 | 50,0 ms | 33,4 ms | −33,2% |
| Touch emulado | Update + gameplay p95 | 0,8 ms | 0,6 ms | −25,0% |
| Touch emulado | Submissão de render p95 | 1,9 ms | 1,7 ms | −10,5% |

As mudanças de frame cadence são observações deste ambiente headless e incluem a adaptação automática de qualidade; não se atribui todo o delta à skyline. O profiler separa tempo de update e tempo síncrono de submissão no main thread; este último **não** mede execução da GPU. Intervalos grandes/abas ocultas são descartados. UA, pointer e hardwareConcurrency não comprovam o modelo físico do dispositivo.

## Mudanças técnicas

- `script.js`: oito lotes espaciais da cidade com geometria estática mesclada por material; transforms e frustum culling independentes por setor.
- `src/anarco-fx.ts`: reutilização do vetor de velocidade da partícula; componentes direcionais calculados sem `new THREE.Vector3` transitório.
- Loop clássico: objeto `fxFrameState` criado uma vez e atualizado antes de cada `fxSystem.update`.
- `src/anarco-entry.ts` e novo `src/anarco-perf.ts`: ferramenta carregada dinamicamente apenas com `?perf=1`; sem envio de telemetria.
- Base: remoção dos três arquivos sem referências externas e Rapier classificado como ferramenta de desenvolvimento/testes.
- `scripts/perf-benchmark.mjs` / `pnpm perf`: benchmark de build de produção, salva um JSON com draw calls skyline visível/oculta e perfis desktop/touch emulados.

## Validação

- `pnpm build`: aprovado; TypeScript, Vite, minificação/cópia de runtime e verificação de tamanho.
- `pnpm test`: 13 arquivos, 83 testes aprovados.
- `pnpm smoke`: aprovado; 38 arquivos estáticos e 7,05 MiB em `dist/`.
- `CHROMIUM_PATH=/usr/bin/chromium pnpm e2e`: aprovado em desktop/touch emulado; gameplay, fases, bosses/rigs, áudio, terminal, hack, reflow, service worker e offline; sem erro de console/HTTP.
- Captura visual pós-merge revisada; as janelas, contornos neon, antenas, coroas e identidade visual do alvo permanecem visíveis.

## Evidências brutas

- [Baseline — SwiftShader, desktop e touch emulado](performance/baseline-swiftshader-2026-11-01.json)
- [Pós-otimização — SwiftShader, desktop e touch emulado](performance/post-difficult-swiftshader-2026-11-01.json)
- [Benchmark reproduzível](../scripts/perf-benchmark.mjs)

Para medir um aparelho real, abra o jogo, entre na partida, carregue a página com `?perf=1`, toque em **CAPTURAR 30 s** e depois em **BAIXAR JSON**. Esse arquivo pode ser usado para comparar o PC/celular real com futuras versões; não envia dados automaticamente.
