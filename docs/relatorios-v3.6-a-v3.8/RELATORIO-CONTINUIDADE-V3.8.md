# ANARCO.EXE v3.8 — Relatório de continuidade

**Atualização:** 28 de outubro de 2026 (ET)
**Estado:** patch preliminar de balanceamento implementado; validações automatizadas concluídas; campanha e luta do Barão ainda incompletas.
**Projeto:** ANARCO.EXE — Three.js/Vite, Preview local na porta 3000.

## O que foi feito nesta continuação

### Balanceamento preliminar do Barão do Petróleo

A dificuldade que motivou o ajuste veio de um teste anterior em que o Barão chegou a 2% de vida e a run terminou em alerta máximo antes do golpe final. Foi aplicada uma intervenção localizada em `script.js`, sem alterar dano, HP, cooldowns ou o raio das zonas:

- Velocidade de perseguição: `3.1 → 2.7` (aproximadamente 13% mais lenta).
- Janelas de telegráfico dos três ataques: `1.15/0.8/0.55 s → 1.45/1.2/0.95 s` (`+0.30/+0.40/+0.40 s`).
- Multiplicador de acúmulo de alerta por proximidade do chefão: `1.5 → 0.65`, apenas para o Barão (redução de aproximadamente 57% nessa contribuição específica).

O restante do comportamento dos três chefões e os parâmetros de combate do Barão foram preservados. Este é um ajuste de teste, não uma aprovação definitiva do balanceamento.

### Teste isolado do Barão

- A arena 6/6 foi iniciada localmente pelo helper dev-only e o encontro do Barão foi selecionado para inspeção isolada. Isso não representa chegada normal ao Núcleo Megacorp nem avanço salvo da campanha.
- Em combate com controles e habilidades do jogo: VÍRUS reduziu a vida de `100 → 88`; BREACH reduziu de `88 → 54`.
- Reagi ao aviso `VAZAMENTO TÓXICO` com movimento lateral e ESQUIVA. A janela encerrou sem dano registrado no chefão, com alerta em `0`.
- Depois surgiu `CHAMINÉ DE FOGO`. A partida foi pausada com o HUD indicando chefão `2/3`, Barão a `54%` de vida, distância `21 m` e alerta `0`. O segundo aviso ainda não havia sido resolvido ao parar.
- **O Barão não foi derrotado nesta nova tentativa.** O resultado é promissor quanto à leitura dos avisos e à pressão de proximidade, mas ainda é necessário retestar uma luta completa antes de declarar que o ajuste permite vencê-lo.

Captura do Preview pausado com o segundo telegráfico: [`evidence/ANARCO.EXE-v3.8-barao-tuned-telegraph-pause.webp`](evidence/ANARCO.EXE-v3.8-barao-tuned-telegraph-pause.webp). O teste anterior, sem este patch, terminou a 2% de vida; suas imagens históricas estão em [`evidence/`](evidence/).

### Fases 3–5 — smoke-tests isolados

As fases foram abertas uma a uma com `startLevel` do bridge local/dev-only. Em cada uma houve uma ação breve de movimento por WASD e inspeção do estado; não foram concluídos os objetivos da fase nem realizadas transições normais:

- **3/6 — Centro de Vigilância:** abriu em `play`, movimento observado e alerta `0`.
- **4/6 — Esconderijo Data:** abriu em `play`, movimento observado e sala identificada como ativa (`room=true`). A vistoria visual completa do interior segue pendente.
- **5/6 — Subestação Elétrica:** abriu em `play`, movimento observado e blecaute confirmado com o helper diagnóstico `primeBlackout`; alerta `0` no registro da inspeção.

**Esses checks confirmam somente carregamento e resposta básica em sessões isoladas. Não são teste de campanha, conclusão de objetivos ou validação completa de combate.**

### Retomada normal da campanha

- Uma run anterior, com controles no Preview, concluiu as três invasões do Distrito Financeiro e exibiu a transição normal para a Zona Industrial.
- Na retomada atual, o progresso não estava salvo e o Preview iniciou no nível 1. A nova aproximação à PetroNegra terminou em alerta máximo antes do primeiro hack; portanto, essa run não alcançou as fases 3–5.
- A Zona Industrial já teve uma tentativa diagnóstica separada em que PetroNegra foi hackeada, mas as outras duas torres não foram concluídas. Não há registro de transição normal da campanha a partir dessa tentativa.

## Validação automatizada após o patch

- `pnpm typecheck`: passou.
- `pnpm test`: **12 arquivos e 79 testes passaram**.
- `node --check script.js`: passou.
- `pnpm build`: passou; gerou o runtime distribuível e copiou os assets locais.
- `pnpm smoke`: passou — 36 arquivos estáticos, aproximadamente 18,70 MiB, modelos e assets locais presentes.
- O smoke é estático e os checks por fase são isolados; nenhum deles prova campanha completa nem vitória contra chefões.

## O que continua pendente

1. Retomar a campanha normal desde o início disponível, concluir os objetivos sem usar o harness para declarar progressão e confirmar a passagem pelos níveis 2–5.
2. Fazer uma inspeção visual completa do interior do Data Center em uma run de campanha. A integração dos computadores 3D continua aguardando os arquivos que o usuário pretende enviar.
3. Repetir a luta completa do Barão com este patch, observando cooldowns, zonas, alerta e vida até a derrota. Ajustar novamente — somente se o playtest ainda indicar necessidade — antes de aprovar o balanceamento.
4. Derrotar o Barão e o CEO pela ordem normal, validar os efeitos e ataques dos três chefões e confirmar a tela/condição de vitória final.
5. Obter aceite em hardware real para controles de toque, GPU, áudio audível e desempenho mobile.

## Assets e publicação

Nenhum modelo, personagem, skin ou áudio novo foi gerado ou buscado. Não foi feito deploy público para Vercel ou GitHub. O código atualizado, os assets existentes e as capturas de evidência permanecem no projeto local para o pacote/checkpoint de continuação.
