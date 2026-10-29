# ANARCO.EXE 3D — Relatório de ajustes

Base: pasta `anarco/` enviada por você (já separada em index.html, style.css e script.js).

## Ordem executada (do que foi pedido)
| # | Nível | Ajuste | Onde |
|---|-------|--------|------|
| 0 | Médio | Caixas da cidade somem no esconderijo (fase 4) e colisão roda em 2 passadas | `script.js` (crates, applyLevel, laço de colisão) |
| 1 | Fácil | Armazenamento seguro: `guardar`, `ler`, `apagar` no lugar de `localStorage` direto | `script.js` (topo e 7 usos) |
| 2 | Fácil | Publicação: descrição, favicon (.ico/.svg), ícone 180 px, preview 1200x630, tags og/twitter | `index.html`, `favicon.ico`, `assets/img/` |
| 3 | Fácil | Acessibilidade: respeita "Reduzir movimento" (CSS + JS, atualiza ao vivo) | `style.css`, `script.js` |
| 4 | Médio | Botão CORRER no celular (segurar = Shift), só em telas de toque | `index.html`, `style.css`, `script.js` |
| 5 | Médio | Drones mudam de cor por estado: **já existia** (verificado em 4 estados); o piscar do feixe agora respeita "Reduzir movimento" | `script.js` |
| 6 | Médio | Feedback ao concluir o hack: **já existia** (som, partículas, onda, pulso, tremor, câmera lenta 0,2 s, cartão); o crescimento de 25% da torre agora respeita "Reduzir movimento" | `script.js` |
| A | Difícil | Imagens em Base64 viram arquivos reais (6 ícones, 5 props, mural); manifesto de caminhos; aviso ao abrir por duplo clique | `assets/img/`, `assets/dados/manifesto.js`, `index.html`, `script.js`, `style.css` |
| B | Difícil | Modelo 3D deixa de ser Base64: `assets/models/anarco.bin` carregado por `fetch` (assíncrono, com plano B) | `assets/models/`, `script.js` (`carregarModelo`), `index.html` |
| C | Difícil | Ranking por tempo: cronômetro no HUD, top 5 só de vitórias, botão Ranking, aviso de recorde na tela final | `script.js` (`fmtTempo`, `registrarTempo`, `showRank`, `loop`), `index.html`, `style.css` |
| D | Fácil | 5 sons novos sintetizados por código: clique de botão, sirene ao ser visto, golpe no chefão, congelar drones no BREACH e fanfarra de recorde | `script.js` (`sfx`, `sweep`, `noise`) |
| E | Fácil | Publicação: `og:url`, `og:image` e `twitter:image` com o endereço `https://anarcoexe.vercel.app/` | `index.html` |
| F | Médio | Feedback do BREACH: aviso do que foi atingido, contagem regressiva no botão, som e brilho quando fica pronto, aviso mais alto no toque | `script.js` (`breach`, `fxTick`, `sfx`), `style.css` |
| G | Médio | Dificuldade dos drones: raio de visão cresce por fase (3,4 / 3,6 / 3,8 / 4,0 m; chefão 3,6 m), definido em `LV`; disco e cone acompanham | `script.js` (`LV`, laço dos drones) |
| H | Difícil | Otimização para celular: menos pixels e sem antialias no toque, resolução dinâmica, chuva de código que só desenha quando há chuva | `script.js` (`R`, `pixelRatio`, `ajustarResolucao`, `fxTick`) |
| I | Fácil/Médio/Difícil | Ajuste do personagem 3D: 15% maior (Fácil), contorno neon + realce (Médio), animação de corrida diferente da de andar (Difícil) | `script.js` (`CHAR_ESCALA`, `RIM_FORCA`, `carregarModelo`, `animChar`) |
| J | Fácil/Médio/Difícil | Nova skin "Cachos" a partir do seu .glb do Meshy: redução de 1,67 milhão para 45 mil triângulos (Fácil), pintura por regiões (Médio), esqueleto de 11 ossos, carregador com várias skins e botão no menu com escolha guardada (Difícil) | `assets/models/cachos.bin`, `assets/img/skins/`, `script.js` (`SKINS`, `carregarModelo`, `rotuloSkin`), `index.html`, `style.css` |

## Conceitos praticados
- Colisão iterativa (várias passadas resolvem obstáculos encostados) e estado por nível.
- `try/catch` e funções utilitárias para falhas do ambiente (armazenamento bloqueado).
- Metadados HTML: `meta description`, `theme-color`, Open Graph, favicon e `apple-touch-icon`.
- Media query `prefers-reduced-motion` e `matchMedia(...).addEventListener("change")`.
- `fetch` + `arrayBuffer()`, funções `async/await`, validação do tamanho do binário e plano B quando o carregamento falha.
- Extração de Base64 para arquivos (decodificação de data URLs), manifesto de assets e detecção de `file://`.
- Pointer Events (`setPointerCapture`), media query `(pointer: coarse)` e toque simulado por CDP nos testes.
- `Date`/`performance.now()` para tempo real, `Array.sort`, `JSON.parse/stringify` com validação, `padStart`/`toFixed` para formatar mm:ss.d.
- Media query de largura (`max-width: 600px`) para reposicionar elementos fixos quando o HUD quebra em linhas.
- Web Audio API: `OscillatorNode`, `GainNode`, rampas exponenciais (`exponentialRampToValueAtTime`), `AudioBufferSourceNode` com ruído e `BiquadFilterNode` passa-baixa; política de autoplay (áudio só nasce após gesto do usuário); delegação de eventos (`document.addEventListener("click")`).
- Contadores dentro de `forEach`, detecção de transição (valor anterior x atual, `bzAntes`), reinício de animação CSS (`classList.remove` + `offsetWidth` + `add`) e `@keyframes`.
- Simulação por computador: trajetórias dos drones em passo fixo, busca no espaço e no tempo (BFS com dilatação binária de um disco) e bisseção para achar a maior margem de segurança.
- `matchMedia("(pointer: coarse)")` para detectar toque, `devicePixelRatio`, `setPixelRatio`, MSAA (antialias), resolução dinâmica por janela de quadros, `clearRect` x `destination-out` e `renderer.info` para medir chamadas de desenho e triângulos.
- Escala de malha (`scale` no `SkinnedMesh`), shader customizado com `onBeforeCompile` (efeito Fresnel/rim light, produto escalar entre normal e direção da câmera), material emissivo e interpolação por fator (`r`) para misturar animações.
- Simplificação de malha (colapso de arestas por erro quadrático), normalização de modelo (escala, origem, orientação), cor por vértice por regiões (elipsoide da cabeça, faixas de altura, máscaras), carregador orientado a dados (objeto `SKINS`), `async` com "pedido mais recente vence" (evita corrida entre cliques) e liberação de memória (`dispose`) ao trocar de modelo.

## Justificativa da lógica
- **Caixas:** as da cidade usavam as mesmas posições na fase 4 e invadiam as mesas. Movê-las para x/z = 999 reaproveita o padrão que o projeto já usava (`HIDE`).
- **Armazenamento:** a leitura do tutorial estava dentro do clique de "Invadir"; com o navegador bloqueando o armazenamento, o jogo nem começava. Agora só deixa de lembrar tutorial, finais e vazamentos.
- **Acessibilidade:** o JS já respeitava a preferência na tremida de câmera. Entraram também a chuva de código, o tremor das torres, o piscar das luzes (3,8 a 4,8 vezes por segundo) e o pulso rápido do anel. No CSS, animações e transições ficam quase instantâneas e o canvas da chuva some.

- **Drones:** o disco, a borda, o feixe e o olho já mudavam de cor (vermelho patrulha, laranja perseguindo, amarelo viu você, ciano congelado). Não havia o que construir; só o piscar do feixe (3 vezes por segundo) ficava de fora da regra de movimento reduzido.
- **Feedback do hack:** `hackDone` já tocava o som, soltava partículas, abria a onda, pulsava a torre, tremia, abria o cartão de vazamento e aplicava câmera lenta de 0,2 s (`slowT`). Em modo reduzido a torre agora só brilha, sem crescer; o brilho é único (não repetido), então fica como confirmação visual.
- **Imagens sem Base64:** os nomes `ICON`, `PR` e `SCENE` foram mantidos num pequeno `manifesto.js`, então o código do jogo não mudou. O mural era idêntico (mesmo hash) ao `fundo-briefing.jpg`; ficou um arquivo só. Texturas WebGL não carregam de `file://`, por isso o aviso "abra por um servidor".
- **Modelo sem Base64:** o bloco síncrono que decodificava o Base64 virou `async function carregarModelo()`. Tudo que usa `model` já checava `if (!model)`, então o boneco simples aparece por instantes e o personagem entra quando o arquivo chega. O tamanho do `.bin` é conferido (n*6 + f*6 + n*3) antes de usar; se falhar (por exemplo em `file://`), cai no plano B sem quebrar o jogo. O `.bin` gerado é idêntico (hash) ao `anarco.bin` do build React original.
- **Correr no celular:** o jogo só lia a tecla Shift, então quem joga no toque nunca corria. O botão liga `keys.shift` pelo mesmo caminho do teclado, sem duplicar a lógica de velocidade, ruído e alerta. `setPointerCapture` mantém o botão ativo mesmo se o dedo escorregar.
- **Ranking por tempo:** o cronômetro soma o tempo REAL do quadro (`performance.now`), não o `dt` do jogo, que é limitado a 0,05 s e câmera lenta; assim o relógio não atrasa. Só conta com `state === "play"` e o chefão em pé (`endT` = 0); pausa, menu e a queda do chefão não contam. O quadro é limitado a 1 s para uma aba escondida não somar minutos. Só vitórias entram, top 5 em `localStorage` (`anarco_rank`); empate fica atrás do mais antigo. `fmtTempo` arredonda ANTES de dividir (59,95 s vira 01:00.0, nunca 00:60.0). Dados corrompidos ou armazenamento bloqueado caem em lista vazia.
- **HUD no celular:** o objetivo ficava em `top:64px` e cobria TORRES/TEMPO quando o HUD quebrava em linhas; em telas até 600 px ele desce para 150 px.
- **Sons por código:** nenhum arquivo de áudio, então o peso do jogo não muda e o deploy continua simples. `sweep` desliza a frequência (sirene, zap), `noise` gera ruído aleatório que some aos poucos e passa por um filtro passa-baixa para soar como impacto. Todos os sons passam por `sfx`, que já respeita o botão de som (`mute`). O clique usa delegação: um único ouvinte no `document` cobre todos os botões, inclusive os criados depois. Esse primeiro clique também cria o `AudioContext`, porque o navegador só libera áudio após um gesto. A sirene `spot` toca uma vez quando o alerta cruza 50% (`alertAnt` guarda o valor do quadro anterior); depois disso segue o `alarm` repetido de sempre.
- **Feedback do BREACH:** o jogo já tinha barra de recarga, anel, chuva de código, tremor e som; faltava o jogador saber se o golpe valeu a pena. `breach()` agora conta drones congelados e torres ajudadas e mostra, por exemplo, "2 drones congelados · 1 torre +40%" ou "nada ao alcance (raio 16)" (recarga desperdiçada). O botão mostra os segundos restantes e, quando a recarga zera, toca um som suave e brilha por 0,7 s. O aviso só dispara na transição de `bz > 0` para 0 e só em jogo (pausa e menu não avisam). O brilho é CSS, então o modo de movimento reduzido já o encurta. No toque o `#msg` sobe para não ficar atrás de CORRER, BREACH e minimapa.
- **Dificuldade dos drones:** medi antes de mexer. (1) O raio de visão era fixo (3,4 m) nas 5 fases; só mudavam quantidade e velocidade. (2) Em toda torre existe um ponto de hack que nenhum drone vê (janela de 900 s, o limite da simulação), então o hack nunca é injusto. (3) No espaço aberto, quem espera o drone se afastar chega a qualquer torre com mais de 13 m de folga; por isso a furtividade quase não escalava da fase 1 para a 3. Como não há como medir "graça" sem jogador de verdade, fiz um ajuste pequeno e reversível: o raio de visão sobe 0,2 m por fase (3,4 -> 4,0 m, +38% de área na fase 4). Os valores ficam num só lugar (`vis` em `LV`). Re-simulei com raios ainda maiores (3,7 / 4,0 / 4,3): todas as torres continuam hackeáveis (pior caso: fase 4 com janela segura de 17 s contra 6,2 s exigidos).
- **Limites do que medi:** a simulação ignora prédios e caixas (otimista para o jogador) e a perseguição; o tempo por tecla do hack é uma estimativa (0,45 s/tecla + 0,5 s). A sequência da fase 4 deixa só 0,86 s por tecla (7 teclas em 6 s), o ponto mais apertado do jogo; não mexi, mas é o primeiro candidato se a fase 4 parecer injusta.
- **Otimização para celular:** medi antes (celular simulado, densidade 3): o canvas 3D tinha 780x1560 px (1,2 milhão de pixels) com antialias; a cena faz só 9 chamadas de desenho, e dos 50.046 triângulos quase tudo é o personagem; o canvas 2D da chuva fazia um preenchimento de tela cheia em TODO quadro, mesmo sem chuva. Mudanças: (1) no toque o `pixelRatio` passa de 2 para 1,5 (43% menos pixels) e o antialias é desligado quando a tela já é densa (DPR >= 2), onde as bordas serrilhadas quase não aparecem; no PC nada muda; (2) resolução dinâmica: se mais da metade de 90 quadros passa de 25 ms (abaixo de 40 FPS), o `pixelRatio` cai 0,25 (mínimo 0,75) e nunca sobe de volta, para não oscilar; pausa, menu e retorno de aba escondida não contam; (3) a chuva só desenha enquanto há chuva ou rastro (1,5 s), depois limpa o canvas uma vez e para. O HUD é HTML, então continua nítido em qualquer resolução.
- **O que não fiz:** reduzir o modelo de 50 mil triângulos (um LOD) exigiria regerar o `anarco.bin` e mexer na animação; é o próximo passo se o seu celular ainda engasgar. Desligar o antialias só vale para telas densas; um celular DPR 1,5 mantém o antialias.
- **Personagem maior:** a escala vai no `SkinnedMesh` (`CHAR_ESCALA = 1.15`), não no grupo, porque `animChar` mexe na escala do grupo todo quadro. A colisão usa um raio fixo, então só o visual cresce. Como a escala é em torno da origem, os pés ficam no chão (altura 2,81 -> 3,23 m, pés em -0,01).
- **Contorno neon:** o personagem é quase todo preto sobre chão escuro. `mat.emissive` (0x0a0614) levanta de leve as sombras; `onBeforeCompile` troca a linha final do fragment shader do Three.js r128 para somar uma cor nas bordas (pouca luz onde a superfície está de frente para a câmera, muita onde está de lado), rosa de um lado e ciano do outro. O primeiro teste com emissivo forte lavou as cores; baixei e o contorno faz o trabalho. `RIM_FORCA = 0` desliga o contorno.
- **Corrida:** `k = min(1, sp/9)` parava em 1, então correr (14) animava igual a andar (9). Criei `r = clamp((sp-9)/5, 0, 1)`: andando r = 0 (nada muda); correndo r = 1: passos 37% mais rápidos, pernas e braços 30-40% mais amplos, cotovelos dobrados, quique maior e inclinação de 0,16 para 0,30 rad. O boost de energia (13) já mostra r = 0,8.
- **Skin Cachos:** o .glb tinha 836 mil vértices e 1,67 milhão de triângulos, sem cor, textura, esqueleto nem animação. Reduzi para 45 mil triângulos e 22.351 vértices (mesmo peso do personagem atual, 471 KB), escalei para 2,81 de altura com os pés em y=0 e de frente para +z, como o boneco original. A pintura é por regiões, medidas no próprio modelo: pele (rosto, pescoço, braços abaixo da manga), cabelo marrom-escuro com sombreamento por profundidade (por dentro mais escuro) e poucos cachos com reflexo roxo, olhos, sobrancelhas, lábios e bochechas, camiseta escura com barra ciano nas mangas, calça cargo, cinto, botas com sola rosa. Descartei um emblema rosa no peito: a malha da camiseta é pouco detalhada, então o desenho virava um borrão.
- **Esqueleto:** o corpo é "chibi" (cabeça e cabelo ~45% da altura, braços curtos), então medi os pontos do próprio modelo (quadril em 0,95, ombros em 1,52, cotovelos em 1,06, joelhos em 0,48, pescoço em 1,75) e montei os mesmos 11 ossos e cápsulas de peso do boneco atual. Assim `animChar` (andar, correr, hackear, BREACH) funciona sem mudança. A cápsula da cabeça é larga (raio 0,5) para o cabelo inteiro virar junto.
- **Várias skins:** `carregarModelo(id)` lê tudo de `SKINS[id]` (arquivo, vértices, triângulos, escala, ossos e pesos). O corpo novo é montado inteiro antes de trocar o antigo, e o antigo é descartado da memória. Um contador de pedidos (`pedidoSkin`) garante que cliques rápidos não deixem dois corpos na cena. Se o arquivo falhar, o botão volta sozinho à skin que está de fato na tela.
- **Escala por skin:** Capuz 1,15 (como já aprovado) e Cachos 1,05, porque a cabeça grande já ocupa muito espaço na câmera de cima.

## Como criar mais uma skin (passo a passo)
1. Reduza o .glb para ~45 mil triângulos (limite do formato: 65.535 vértices) e normalize: altura 2,81, pés em y=0, de frente para +z, centro em x=0.
2. Pinte por regiões com `pintar-cachos.py` (use como modelo: ajuste as medidas e as cores) e grave o `.bin` (Int16 posições/10000, Uint16 índices, Uint8 cores).
3. Em `SKINS`, copie uma entrada e troque `nome`, `arq`, `n`, `f`, `escala`, `ossos` e `SG` com as medidas do corpo novo.
4. Gere a miniatura em `assets/img/skins/<id>.png`. O botão do menu já percorre todas as skins da lista.

## Testes (navegador de teste, renderização por software)
- Fase 4: 0 falhas em 20 mil pontos sorteados (antes: 65, penetração de até 0,4). Fases 1, 2, 3 e 5: 0 falhas. Sala 100% alcançável e 3 torres acessíveis.
- Armazenamento bloqueado: antes o jogo não iniciava e dava erro; agora inicia sem erro. Armazenamento normal: vazamentos e tutorial persistem após recarregar.
- `<head>`: todas as tags presentes, 6 arquivos referenciados existem, sem 404.
- Correr no celular (toque real simulado): botão `none` no desktop e `block` no celular; velocidade andando 8,86, segurando o botão 13,87 e soltando 9,08 (esperado 9 / 13,95 / 9).
- Drones (testado nos 4 estados, disco e olho): `0xe0261c` / `0xff8a00` / `0xffe14a` / `0x2fe6ff`. Variação do feixe ao ver o jogador: 0,116 em modo normal e 0,000 em modo reduzido.
- Hack concluído (normal / reduzido): contador 0 -> 1, câmera lenta 0,2 s -> 0; escala máx da torre 1,249 / 1,000; brilho máx 2,84 nos dois; tremor 0,24 / 0; tremida de câmera 0,7 / 0.
- Regressão final: colisão 0 falhas nos 5 níveis, sala 100% alcançável, pausa, armazenamento bloqueado e movimento reduzido sem erros.
- Etapa A: os 6 ícones extraídos são idênticos (hash) ao Base64 original; com servidor, HUD, texturas dos ícones, 10 sprites de props e mural carregam (16 imagens baixadas, 0 respostas 4xx/5xx, 0 erros). Em `file://` o aviso aparece e fecha ao clicar. Peso da pasta: 2248 KB -> 2088 KB (`assets/dados`: 1016 -> 692 KB).
- Etapa B: com servidor, 24.953 vértices, 50.000 triângulos, esqueleto de 11 ossos e animação de corrida iguais ao Base64; `anarco.bin` baixado, 0 respostas 4xx e 0 erros. Em `file://`: plano B ativo, aviso visível, jogo roda sem erro. Pasta: 2088 KB -> 1924 KB; `assets/dados` agora só tem o manifesto.
- Etapa C: top 5, empate, recorde, armazenamento corrompido/bloqueado, derrota não registra, persistência após recarregar e modal com destaque, tudo OK, 0 erros. Precisão do relógio contra o tempo real: -0,2% (janela leve) e +4% (janela pesada, ~3 FPS no teste por software); pausa e chefão caído: diferença 0,00 s. Antes eu tinha limitado o quadro a 0,25 s e o relógio perdia 36% em FPS muito baixo; corrigido para 1 s. Capturas do modal e do HUD no celular conferidas.
- Etapa D: antes do 1º clique não há áudio e depois dele o contexto fica `running`; cada som novo cria os nós esperados (tick 1, spot 2, boss 1+ruído, freeze 1+ruído, record 4) e os 8 antigos seguem iguais; no modo mudo, 0 nós criados; BREACH em jogo dispara o som de congelar; 0 erros. Não dá para "ouvir" no teste: a qualidade e o volume ficam para você avaliar no fone/caixa.
- Etapa F (modo normal e reduzido, `fxTick` chamado à mão para ser determinístico): 2 drones + 1 torre -> "2 drones congelados · 1 torre +40%" (drones congelados, torre 0,4, alerta -0,3); 1 drone -> "1 drone congelado"; sem alvo -> "nada ao alcance"; contagem 10s/3s/2s/1s -> "BREACH · Espaço"; som de pronto 1 vez (não repete); pausa e menu não avisam nem contam; animação 0,7 s normal e ~0 em modo reduzido; 0 erros. No celular (390x780) o botão cabe (129x38 px) e o aviso ficou acima de CORRER.
- Etapa G (jogo real, 1 drone parado): jogador 0,3 m fora do raio -> alerta 0; 0,3 m dentro -> alerta sobe, nas 5 fases; escala do disco = raio/3,4 em cada fase (1,000 / 1,059 / 1,118 / 1,176 / 1,059); 0 erros. Captura da fase 4 conferida.
- Etapa H: configuração (celular DPR 3: pixelRatio 1,5, antialias off, canvas 585x1170; celular DPR 1,5: antialias on; PC DPR 1 e DPR 2: igual a antes); chuva: 0 preenchimentos em 2,5 s parado, desenha durante o BREACH, depois 0 chamadas e 0 pixels visíveis; resolução dinâmica (determinística): 100 FPS não cai, aba escondida e pausa ignoradas, 33% de quadros lentos não cai, lento sustentado 1,5 -> 1,25 -> 1 -> 0,75 e para no piso; canvas 292x585 com CSS 390x780; 0 erros. Capturas a 1,5 e a 0,75 conferidas.
- Etapa I: altura 3,23 e pés em -0,01; escala 1,15 só no SkinnedMesh; shader sem erro (0 console.error); andando igual ao anterior (perna 0,9, braço 0,7, canela 1,1); correndo perna 1,17, braço 0,98, canela 1,43, cotovelos -1,29/-0,64, quique 0,209; energia (13) perna 1,12; inclinação parado 0 / andando 0,16 / correndo 0,299; cadência 16 -> 21,9 rad/s; corrida real com Shift: velocidade 13,9, inclinação 0,29; menu e fim de jogo sem erros. Capturas conferidas (antes/depois e andar x correr).
- Etapa J: redução 1.672.382 -> 45.000 triângulos; .bin com tamanho exato (22351*6 + 45000*6 + 22351*3 = 471.159 bytes); corpo novo com 11 ossos; animações conferidas por imagem em parado, andar, correr e hackear (malha sem esticar); menu: rótulo e miniatura corretos, troca em ~1,5 s no navegador de teste (software), guarda em `anarco_skin`, persiste ao recarregar, valor inválido cai em Capuz, 5 cliques rápidos terminam com 1 corpo e vértices coerentes, `cachos.bin` com 404 mantém a skin antiga e o botão volta sozinho, armazenamento bloqueado funciona; partida completa no celular simulado (hack, BREACH, fim de jogo, ranking) com 0 erros; botão cabe na tela de 390 px.
- Movimento reduzido: chuva 2,2 -> 0, tremor da torre 0,247 -> 0, animação do cartão 0,25 s -> ~0, canvas da chuva `block` -> `none`. A preferência muda ao vivo, sem recarregar.

## Publicação
`og:url`, `og:image` e `twitter:image` já apontam para `https://anarcoexe.vercel.app/` (endereço completo, como WhatsApp e outros apps exigem). Se o domínio mudar, troque esses três. Depois do deploy, confira o preview colando o link no WhatsApp ou num depurador de compartilhamento; os apps guardam cache, então pode demorar a atualizar.

## Não testado
As cores da skin Cachos no seu celular (a luz neon da cena muda o tom: a pele fica esverdeada perto da luz ciano e durante o hack), o tempo de troca de skin em celular fraco (calcula 22 mil x 11 pesos) e volume e timbre dos sons (só verifiquei que disparam), **FPS em celular e GPU reais** (o teste usa renderização por software, então só medi configuração e custo relativo, não o FPS final) e a dificuldade dos drones (medida, não jogada) (só renderização por software no teste), e o piscar das luzes em modo reduzido foi verificado só pelo código.

## O que ainda falta
- Médio: nenhum item pendente.
- O bloco Difícil (Base64, ranking e sons) está concluído.
- Tudo o que estava na lista foi feito. Próximo candidato, só se o celular ainda engasgar: LOD do modelo 3D.
- Dificuldade: só medi, não joguei. Se a fase 2, 3 ou 4 parecer fácil ou injusta, mude `vis` em `LV` (um número por fase).


## Item K — Notebook 3D do usuário (Difícil)

**O que mudou:** o notebook de duas caixas que aparece na frente do personagem ao hackear foi trocado pelo modelo 3D do Henriq (`assets/models/laptop.bin` + textura `assets/img/props/laptop.webp`). Funciona nas duas skins. Ao começar o hack ele "salta" (escala 0 → 1 em ~0,2 s) e some ao parar; com "Reduzir movimento" ele só aparece/some. A luz verde (`lapLight`) continua.

**Ordem:** (1) Fácil: ler o OBJ/MTL e a textura 4096²; (2) Médio: separar a malha em *ilhas de textura* (118 pedaços com UV contínuo); (3) Difícil: decimar cada ilha sozinha (50.000 → 12.447 triângulos) e recalcular o UV de cada vértice novo a partir do ponto mais próximo da mesma ilha; (4) Médio: gravar `.bin` (Int16 posição, Uint16 UV, Uint16 índice = 147.612 bytes) e textura 1024² WebP (~60 KB); (5) Fácil: carregar no jogo com `fetch` + `TextureLoader`, com plano B (notebook de caixas se falhar).

**Conceitos:** BufferGeometry manual, UV e `flipY`, `emissiveMap` (a tela brilha), componentes conexos, decimação de malha, interpolação exponencial (`lapEsc += (alvo - lapEsc) * k`), carregamento assíncrono com fallback.

**Justificativa:** decimar a malha inteira misturava as ilhas (teclado aparecia na tela). Decimar por ilha mantém o UV coerente. Peso total ~207 KB contra ~16 MB do original.


## Item L — Notebook com a arte do Kali (Difícil)

**O que mudou:** o notebook do item K (textura neon) foi trocado pela malha limpa `white_mesh_1.glb` (20.000 triângulos, com teclado e dobradiças reais) texturizada com as suas artes: corpo verde-oliva, tela com o terminal Kali (`root@kali-anarc`, hydra, `[SUCCESS]`), teclado, adesivos SYS DOWN / NO CTRL e o símbolo da anarquia. `white_mesh_3.glb` não foi usada: ela traz duas cópias do notebook em poses diferentes e uma placa solta, não tampa e base separadas.

**Ordem:** (1) Fácil: ler a malha e descobrir a orientação (tampa em z<0 virada para +z; teclado em y baixo); (2) Médio: separar *tampa* e *teclado* por posição (distância ao plano da tampa), porque as normais da malha são ruidosas e deixavam manchas; (3) Difícil: projeção planar de cada região em um atlas 1024² (tampa em cima, teclado embaixo, faixa de cor oliva para o resto); (4) Médio: gravar `laptop.bin` (10.764 vértices, 20.000 triângulos, 227.640 bytes) e `laptop.webp` (~46 KB); (5) Fácil: ajustar `LAP_N/LAP_F` no `script.js` e testar nas duas skins.

**Conceitos:** projeção planar de UV, atlas de textura, `flipY` do Three.js (o visualizador de teste estava com `flipY` desligado e parecia que a textura estava de cabeça para baixo), classificação de faces por distância a um plano, vértices duplicados por região.

**Limite:** o notebook continua sendo uma peça só (aberto); para a tampa abrir de verdade seria preciso o modelo com tampa e base separadas. As manchas escuras nas dobradiças são pequenas e quase invisíveis no tamanho do jogo.

## Item M — Notebook virado para o boneco (Fácil)

**O que mudou:** no item L o notebook ficava com a tela para a câmera, parecendo que o personagem estava apresentando o computador. Agora `lapG.rotation.y = Math.PI` gira a peça meia-volta: a tela fica virada para o boneco, o teclado fica perto das mãos e a câmera enxerga as costas da tampa. Posição `(0, 1.08, 0.72)` e braços/antebraços dobrados no teclado (`animChar`, ramo `hk`) com cabeça baixa olhando a tela.

**Conceito:** rotação de um `Group` em torno do eixo Y; o modelo é pensado de frente para +z, e a cena do hack pede a tampa de costas para quem olha de fora.

**Teste:** capturas das duas skins por três câmeras (a do jogo, lateral e frontal) mostram o personagem digitando, sem erros no console.

## Item N — 6ª fase: Subestação Elétrica (Difícil)

**O que mudou:** nova fase entre o Esconderijo e o Núcleo MegaCorp (agora o jogo tem 6 fases, o chefão fica na 6ª). Tema azul-elétrico, kit visual (transformadores e cabos), layout de rotas próprio, balanceamento de rotas, missão secundária (USB: religue o gerador reserva), briefing "NÍVEL 5/6" e HUD "x/6". Mecânica nova: **BLECAUTE** — a cada 12 s, por 2,5 s, a tela escurece e o raio de visão dos drones cai para 60%. O hack da fase usa o protocolo PULSO e o chefão passou a usar o protocolo CHEFÃO (`mode: 4`).

**Ordem (Fácil → Difícil):** (1) Fácil: textos "x/5" → "x/6" e HUD com `LV.length`; borda azul do HUD e cache do service worker (`anarco-v3.3-fase6`); (2) Médio: entradas novas nas tabelas indexadas por fase (`PHASE_THEME`, `ROUTE_LAYOUTS`, `ROUTE_BALANCE`, `SIDE_MISSIONS`, briefing) e o kit visual; (3) Difícil: a entrada `LV` com `mode` próprio e o relógio do BLECAUTE dentro do loop dos drones.

**Conceitos:** tabelas de dados indexadas (o jogo é guiado por dados, não por `if`), `??` (nullish coalescing) para `mode` opcional, relógio acumulado com `%` (resto da divisão) para ciclos, `classList.toggle`, `prefers-reduced-motion`.

**Lógica do blecaute:** `blackoutClock += dt` a cada quadro; `blackoutClock % 12 > 9.5` vale verdadeiro só no último 2,5 s do ciclo. O raio efetivo `visR = vis × (blecaute ? 0.6 : 1)` é usado tanto no teste de detecção (`sees`) quanto no tamanho do disco vermelho, então o que o jogador vê é o que vale.

**Justificativa:** reaproveitei as torres e rotas de patrulha da cidade (já validadas), então a nova fase não cria risco de torre inalcançável; a dificuldade vem do blecaute (janela de oportunidade) e não de mais drones inalcançáveis.

**Teste (navegador real, 0 erros no console):** as 6 fases carregam com nome, HUD x/6, 3 torres, 3 itens; chefão só na 6ª; blecaute liga em 9,5 s (nota na tela, disco 0,74×), desliga em 12 s e nunca liga nas outras fases; hack da fase 5 = modo PULSO (6 setas), da 6 = CHEFÃO; `spawnPickups` ×20 em cada fase sem travar. `scripts/smoke.mjs` ajustado para exigir 6 fases (não executei `pnpm build`/smoke aqui).

## Item O — Balanceamento de BREACH / EMP / VÍRUS (Médio)

**Problema:** o EMP (recarga 7 s, trava 4,5 s) era melhor que o BREACH em quase tudo e travava os drones por mais tempo; no chefão, o dano por segundo era BREACH 5,7 · EMP 2,6 · VÍRUS 1,2, então só valia apertar BREACH.

**O que mudou:** os números ficaram numa tabela única `SKILLS` (antes eram "números mágicos" soltos em 3 funções). Valores novos:

| Habilidade | Recarga | Alcance | Efeito | Contra o chefão |
|---|---|---|---|---|
| BREACH | 10 s (7 s no chefão, era 6) | 16 | trava 4,5 s (era 4) · torre +40% · alerta −0,2 (era −0,3) | 34 |
| EMP | 8 s (era 7) | 12 | trava 3,5 s (era 4,5) · alerta −0,25 (era −0,35) | 20 (era 18) |
| VÍRUS | 10 s | 18 (20 no chefão) | sequestra drone 6 s | 20 (era 12) |

Dano por segundo no chefão agora: BREACH 4,9 · EMP 2,5 · VÍRUS 2,0. Cada uma tem um papel: BREACH é o golpe grande e raro; EMP é a trava curta e frequente (disponibilidade ~44% em vez de 64%); VÍRUS é a ferramenta precisa. O contra-jogo é a recarga e o alerta que cada uso deixa de limpar.

**Conceitos:** tabela de configuração (objeto) em vez de constantes espalhadas, separação entre dados e lógica, balanceamento por "dano por segundo" (dano ÷ recarga).

**Teste (navegador, 0 erros):** com a rota PROTEGIDA, EMP → recarga 8 e trava 3,5; VÍRUS → recarga 10 e sequestro 6; BREACH → recarga 10 e trava 4,5. No chefão: BREACH 34 de dano (recarga 7), EMP 20, VÍRUS 20. Os números são ponto de partida: falta você jogar para sentir.

## Item P — Áudio exclusivo dos chefões (Médio)

**O que mudou:** (1) **Trilha de chefão:** quando há um chefão vivo, a música de exploração cai para 30% e entram duas camadas novas: um grave contínuo e um pulso rítmico. Cada chefão tem a sua assinatura (tabela `BOSS_SND`): Banqueiro = onda quadrada, 2 batidas/s (marcha seca); Barão do Petróleo = serra, 2,7/s (grave sujo); CEO = serra dissonante, 3,6/s (rápido). (2) **Sons por chefão:** `bossIn` (aparecer), `bossAtk` (cada ataque) e `bossDie` (derrota), todos com timbre derivado da nota-base do chefão. (3) **Bug corrigido:** o botão 🔇 só calava os efeitos; a música ambiente continuava. Agora ele zera o volume geral (`master`) e volta ao desmutar.

**Ordem:** (1) Fácil: corrigir o mudo (1 linha de rampa de volume); (2) Médio: sons `bossIn/bossAtk/bossDie` usando as funções `tone`, `sweep` e `noise` que já existiam; (3) Difícil: trilha em camadas com LFO.

**Conceitos:** Web Audio API (`OscillatorNode`, `GainNode`), LFO (um oscilador lento ligado ao ganho de outro cria o pulso rítmico), `setTargetAtTime` (transição suave de volume, sem estalo), tabelas de dados por índice, chave de estado (`audioStateShown`) para só mexer no áudio quando algo muda.

**Lógica do pulso:** o ganho do `bossPulse` fica em metade do nível e o LFO soma ±metade a ele, então o volume oscila entre 0 e o máximo na frequência do LFO (o "tempo" do chefão). Trocar o `tempo` muda a velocidade da batida sem recriar nenhum nó.

**Teste (navegador, 0 erros):** contexto de áudio ativo; na fase normal as camadas do chefão ficam em 0; com chefão 0/1/2 o grave sobe para 0,05 com notas 65/55/49 Hz e tempos 2/2,7/3,6; exploração cai de 0,044 para 0,013; `bossIn`, `bossAtk` e `bossDie` são disparados com o índice certo; mudo leva o master a 0 e desmutar volta a 0,9. **Limite:** não consigo ouvir daqui, então se o timbre ficou agradável só você sabe. Os valores de `BOSS_SND` e `bossLevel` são fáceis de ajustar.

## Item Q — Mescla v3.9: nossa linha + projeto v3.8 (Difícil)

**O que mudou:** a v3.8 (enviada por você) virou a base, porque ela nasceu da nossa linha: já continha a correção do travamento em "Invadir", a 6ª fase e o blecaute. Sobre ela reaplicamos o que ainda faltava e tornamos o projeto publicável no GitHub/Vercel sem a Manus.

**Ordem (Fácil → Difícil):** (1) Fácil: `.gitignore` (não bloqueia mais skins e modelos), `package.json` (nome, versão 3.9.0, scripts); (2) Médio: `build` sem restauração de assets da Manus (`tsc → vite build → copiar assets → checar tamanho`), `sw.js` novo com registro no `script.js` (app instalável e offline), organização de `docs/`; (3) Difícil: reaplicar a tabela `SKILLS` (balanceamento de BREACH/EMP/VÍRUS) no `script.js` da v3.8, que tinha linhas extras de efeitos nas mesmas funções.

**Conceitos:** build de produção com Vite, `.gitignore` (o que o Git não guarda), service worker "rede primeiro, cache de reserva", tabela de configuração `SKILLS`, diferença entre dependência de desenvolvimento e arquivo publicado.

**Justificativa:** o `.gitignore` original ignorava as skins e os `.glb` (eram restaurados do armazenamento da Manus), e o `build` tentava baixá-los em `/manus-storage` — isso quebraria na Vercel. Colocar os ~18 MB dentro do repositório é simples e seguro (limite do GitHub: 100 MB por arquivo).

**Teste (pasta limpa, sem Manus):** `pnpm install --frozen-lockfile`, `pnpm typecheck` e `pnpm test` (79 testes) passaram; `pnpm build` gerou `dist/` de 18 MB. No Chromium (WebGL por software), servindo a `dist/`: clique em Invadir + terminal de introdução → jogo em `play` com 3 itens; as 6 fases carregam com HUD "x/6" e 3 torres; chefão só na 6ª; habilidades com os valores balanceados (EMP 8 s/3,5 s · VÍRUS 10 s/6 s · BREACH 10 s/4,5 s); esquiva desloca o personagem (2 m); service worker ativo e a página abre **offline**; 0 erros no console. `pnpm smoke` também passou (34 arquivos, 17,5 MiB), rodando a partir do zip extraído numa pasta nova. **Limites:** não testei toque/GPU/áudio audível, e o Barão ainda não foi vencido em luta completa.
