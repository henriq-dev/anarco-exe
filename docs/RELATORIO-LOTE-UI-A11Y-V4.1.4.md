# ANARCO.EXE v4.1.4 — relatório do lote de UI, minimapa e acessibilidade

## Escopo

Lote iniciado após a aprovação do hotfix v4.1.3. As mudanças preservam regras e balanceamento do jogo; concentram-se em cadência do minimapa, mutações de DOM do HUD, navegação por teclado e segurança na exibição de dados locais.

## Mudanças

### Minimapa

- Redesenha no máximo a cada 100 ms (alvo de 10 Hz) durante o estado `play` e a cada 500 ms (alvo de 2 Hz) fora da partida.
- Redesenha imediatamente quando o estado muda, inclusive ao retomar da pausa; fica estático durante a pausa.
- A animação da placa 3D foi separada do desenho do minimapa, para que reduzir a cadência do mapa não altere esse efeito visual.

### Escritas do DOM e anúncios acessíveis

- `setTxt` compara com o `textContent` real, evitando depender de um cache interno que poderia ficar desatualizado. Foi adicionado `setAttr` para atributos discretos.
- Texto do estado dos drones, dica da missão secundária, cor correspondente, mensagens e estado do objetivo só são alterados quando mudam.
- As barras animadas de alerta, hack e minigame continuam suaves; não foram quantizadas nem limitadas.
- O objetivo visual mantém a distância atualizada, mas fica fora da árvore de anúncios. Uma região `status` separada anuncia apenas troca de alvo/estado, sem falar a distância a cada metro.

### Overlays e teclado

- Menu, pausa, vazamentos, ranking e terminal introdutório têm papel e nome de diálogo. O diálogo ativo recebe `aria-modal=true`; os demais e o conteúdo de jogo ao fundo ficam inertes.
- O foco vai para um controle adequado ao abrir, permanece dentro do diálogo por Tab/Shift+Tab e volta ao acionador ou a um controle de fallback ao fechar.
- Escape fecha vazamentos/ranking; na pausa, preserva a ação existente de retomar.
- Vazamentos e ranking ficam visualmente acima do menu; antes, seu `z-index` os deixava atrás do próprio menu.

### Dados locais exibidos como texto

Os registros de vazamentos e ranking persistem em `localStorage` e podem ser alterados no próprio aparelho. Suas listas deixaram de interpolar dados em `innerHTML`: os registros agora são criados como elementos e preenchidos por `textContent`. Isso impede que valores locais sejam interpretados como marcação executável e tolera dados de vazamentos malformados.

## Validação

`CHROMIUM_PATH=/usr/bin/chromium pnpm verify` passou integralmente:

- typecheck;
- **85 testes unitários em 14 arquivos**;
- build e verificação de tamanho;
- smoke com 38 arquivos estáticos (7,06 MiB);
- E2E em Chromium, incluindo abertura/fechamento dos diálogos, retorno e contenção de foco, Escape, valores HTML maliciosos em listas locais, mutações redundantes do HUD, minimapa durante pausa/retomada, progressão das fases, áudio e fluxo offline.

O E2E do minimapa confirmou redesenho durante o jogo, pausa sem redesenhos repetidos e atualização ao retomar. Na execução headless com SwiftShader foram observados 2 redesenhos instrumentados em 1,1 s; a baixa cadência decorre do ritmo real de frames desse ambiente por software, não é uma medição de aparelho. O limite de 100 ms é uma cadência máxima: em aparelhos lentos, o minimapa naturalmente atualiza no ritmo que o `requestAnimationFrame` permite.

## Limites e próximo passo

Não foram feitas medições em GPU física, PC ou celular real, nem uma avaliação formal com leitores de tela/axe. É recomendável validar visualmente o mapa em hardware real e testar VoiceOver/NVDA/TalkBack. O bundle final continua na faixa de 6,31 MiB transferidos; divisão de chunks, preload, Brotli e outros itens da lista inicial seguem fora deste lote.
