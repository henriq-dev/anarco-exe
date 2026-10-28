# Análise da ANARCO.EXE v3.4 recebida

## Veredito

A v3.4 é compatível conceitualmente com a base atual, mas não deve substituir o projeto inteiro. Ela parece ser uma cópia do jogo atual com conteúdo adicional e sem o conjunto de testes, scripts, documentação e configuração do projeto gerenciado. O script recebido passa em verificação sintática (`node --check`), mas a própria documentação informa que `pnpm build` e `pnpm smoke` não foram executados nessa versão.

## O que já existe na nossa v3.3

- Estrutura modular HTML/CSS/JS e assets locais.
- Cinco fases, torres, drones, chefões, BREACH, EMP, VÍRUS e rotas.
- Notebook 3D local `laptop.bin` com fallback e textura local.
- Câmera cinematográfica de hack, torre e chefão.
- Destruição parcial dos props com partículas por tipo.
- Kit modular visual por fase.
- Progressão offline, skin CACHOS e recompensas NEON/GLITCH.
- Áudio por estado, PWA, service worker atualizado e auditoria de release.
- Testes Vitest, smoke específico, build e release candidate documentados.

## Novidades reais da v3.4

### 1. Sexta fase: Subestação Elétrica
A v3.4 adiciona uma fase entre o Esconderijo Data e o Núcleo MegaCorp. Ela tem tema azul elétrico, transformadores/cabos, rotas próprias, missão secundária do gerador, protocolo PULSO e um novo desafio de blecaute.

### 2. Mecânica BLECAUTE
A cada 12 segundos, a tela escurece por 2,5 segundos. Durante o período, o raio de visão dos drones cai para 60%. A ideia é boa e combina com a identidade do jogo, mas precisa de teste de jogabilidade e validação de acessibilidade. O CSS recebido desliga o filtro de escurecimento em `prefers-reduced-motion`, o que é adequado.

### 3. Áudio específico dos chefões
A v3.4 adiciona assinaturas sonoras diferentes para entrada, ataque e morte de cada chefão, além de uma camada grave/pulsante com LFO. É uma melhoria forte e deve ser integrada, mas precisa passar pelos testes de mute, áudio por gesto e redução de volume.

### 4. Correção importante no spawn de itens
A v3.4 corrige um risco real em `spawnPickups`: objetos de rota têm `w/d`, mas alguns não têm `r`; a expressão antiga podia gerar `NaN` e manter o laço de posicionamento indefinidamente. A correção calcula um raio a partir de largura/profundidade e limita tentativas a 400. Esta correção deve ser incorporada imediatamente à base atual.

### 5. Ajustes de progressão de fase
A v3.4 torna o total de níveis dinâmico (`LV.length`), adiciona `mode` de hack por fase, rota específica da nova arena e um cooldown de BREACH baseado na tabela de habilidades. Esses ajustes são bons, mas dependem da integração da sexta fase.

## Pontos de atenção e regressões

- O service worker recebido volta para `anarco-v3.3-fase6` e perde grande parte do pré-cache ampliado da nossa v3.3. Não copiar esse `sw.js`; manter a lista completa da nossa v3.3 e apenas adicionar os assets da nova fase.
- O ZIP não contém `package.json`, `pnpm-lock.yaml`, testes, scripts de smoke/build ou `TODO.md`. Não serve sozinho como substituto do projeto gerenciado.
- A v3.4 documenta que build e smoke não foram executados.
- A mudança de cinco para seis fases afeta HUD, briefings, rotas, balanceamento, ranking, testes e release. Não deve entrar sem atualizar todos esses pontos.
- O blecaute precisa ser testado com movimento reduzido, tela pequena e leitura de objetivo; o filtro visual não deve prejudicar a legibilidade.
- O áudio de chefão precisa respeitar mute e o limite de nós do Web Audio em aparelhos fracos.

## Classificação contra a lista do projeto

| Recurso | Situação | Ação |
|---|---|---|
| Notebook 3D | Já presente na v3.3 | Não duplicar |
| Fase 6 elétrica | Novo | Integrar como pacote separado |
| Blecaute | Novo | Integrar e balancear |
| Áudio de chefão | Novo | Integrar após teste do áudio atual |
| Correção do spawn de pickups | Bugfix importante | Integrar imediatamente |
| Rotas da fase 6 | Novo | Integrar junto com a fase |
| Missão do gerador | Novo | Integrar junto com a fase |
| Cache PWA específico | Parcial/regressivo | Reescrever sobre o cache v3.3 completo |
| Testes automatizados | Ausentes no ZIP | Preservar e ampliar os nossos |
| Documentação | Parcial | Incorporar apenas as conclusões úteis |

## Ordem segura recomendada

1. Incorporar o bugfix de `spawnPickups` e criar teste de regressão.
2. Incorporar áudio de chefão, mantendo mute e camadas atuais.
3. Integrar a sexta fase em dados, HUD, briefing, rotas, missão, kit visual e minimapa.
4. Adicionar o blecaute com testes de detecção, acessibilidade e balanceamento.
5. Atualizar service worker usando o pré-cache completo da v3.3.
6. Rodar 78+ testes, build, auditoria, smoke das seis fases e gerar novo ZIP.

## Conclusão

A v3.4 traz uma evolução válida, principalmente pela sexta fase, pelo blecaute, pelo áudio de chefões e pela correção do possível loop infinito dos pickups. A estratégia correta é fazer uma integração seletiva e testada, não substituir a v3.3 inteira.
