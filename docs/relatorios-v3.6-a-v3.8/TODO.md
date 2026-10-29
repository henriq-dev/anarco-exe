# ANARCO.EXE v3.8 — TODO

Escopo aprovado: evoluir o jogo v3.6 enviado, mantendo o loop e os conteúdos existentes. Não publicar no GitHub/Vercel sem solicitação explícita.

## Preservar a jogabilidade e os recursos da v3.6 — implementado e smoke-playtestado em Chromium
- Manter o loop original de infiltração, hacking, coleta, drones e chefões; preservar VANTA, Capuz, Cachos, EMP, VÍRUS, BREACH, modelos GLB, skins e progressão anterior.
- Preservar poças neon, névoa, skyline, grid, luzes, materiais emissivos e a esquiva ESQUIVA na tecla C/botão HUD, com direção por teclado/toque ou direção atual, impulso curto, colisões, janela de invulnerabilidade e recarga aproximada de 1,35 s.
- Os efeitos cosméticos não alteram colisões, detecção, dano, recompensas, regras, controles, HUD ou resultado da simulação.

## Bloom seletivo e perfis de qualidade — implementado; seletor Baixa/Média/Alta verificado em Chromium
- Usar bloom seletivo de baixo custo como padrão; o bloom completo via EffectComposer/UnrealBloomPass é opcional e exclusivo do perfil alto.
- Oferecer qualidade baixa (sem bloom completo, poucas partículas, sem distorção de tela, sombras desligadas e efeitos simplificados), média (bloom seletivo, partículas moderadas, flashes, poças neon e distorção leve) e alta (EffectComposer/bloom completo, partículas avançadas, aberração cromática, sombras dinâmicas e efeitos especiais completos dos chefões).
- Integrar os efeitos ao ajuste dinâmico de resolução existente e reduzir qualidade automaticamente quando a taxa de quadros cair; manter compatibilidade com navegadores e celulares.

## Partículas avançadas e rastros da esquiva — implementado; renderização WebGL e esquiva verificadas em Chromium
- Implementar efeitos leves e reutilizáveis, preferindo THREE.Points/BufferGeometry para grandes conjuntos de partículas.
- Adicionar faíscas em colisões; fragmentos metálicos na destruição de caixas; partículas de código durante BREACH; fumaça digital dos ataques do Barão do Petróleo; moedas, documentos e dados ejetados dos chefões; rastros de esquiva; partículas ciano ao ativar NÓ FANTASMA; magenta em VÍRUS; descarga elétrica em EMP; fragmentos na derrota de chefão; poeira, fumaça e brasas na fase industrial; pixels ao neutralizar drones.
- Permitir propriedades visuais de velocidade, gravidade, tempo de vida, escala/rotação, cores de início/fim, transparência progressiva, atração/repulsão e colisão simplificada com o chão quando aplicável.
- Dar à esquiva da VANTA duplicatas transparentes por alguns frames, linha azul de impulso, distorção circular inicial, partículas no chão, pequena deformação cromática ao terminar e sincronização com o feedback já existente.

## Distorção/glitch e iluminação temporária — implementado; partida WebGL aberta em Chromium
- Adicionar efeitos breves (menos de um segundo quando apropriado): glitch no BREACH; distorção horizontal quando alerta >70%; aberração cromática em ataques fortes; tremor na entrada dos chefões; scanlines durante hacking; interferência no blecaute; vinheta vermelha em perigo; distorção ciano no NÓ FANTASMA.
- Adicionar luzes temporárias para esquiva azul, EMP verde, VÍRUS magenta, zonas de ataque vermelhas, flashes direcionais nas explosões, Barão laranja/fumaça, Diretor-Banqueiro branco/azul e CEO rosa/roxo; reutilizar luzes por pool para não criar/destruir objetos a cada ataque.

## Identidade visual por fase e chefão — implementado; identidade e gameplay renderizados em Preview
- Distrito Financeiro: magenta, azul e alto contraste.
- Zona Industrial: laranja, fumaça, poeira/carvão e brasas.
- Centro de Vigilância: ciano, scanlines e câmeras.
- Esconderijo Data: verde, baixa luz e partículas de código.
- Subestação Elétrica: azul intenso e flashes elétricos.
- Núcleo Megacorp: rosa/roxo e bloom mais forte.
- Diretor-Banqueiro: papéis e contratos voando, selos vermelhos, linhas retas de dados, paredes holográficas e estilhaços brancos/vermelhos.
- Barão do Petróleo: fumaça preta, fogo/brasas, poças e ondas de petróleo, explosões laranja e distorção de calor.
- CEO MEGACORP: cubos de dados, grades holográficas, glitch magenta, raios de energia, fragmentos digitais e colapso de tela no ataque final.

## Entrega standalone do jogo e relatório — build/playtest e checkpoint interno concluídos; sem deploy público
- Entregar pacote atualizado do jogo baseado no ZIP enviado, incluindo código e assets necessários, compatível com navegador/mobile e publicação standalone na Vercel.
- Incluir relatório de alterações e registrar validações executadas/resultados.
- Não publicar ou fazer push para GitHub/Vercel sem solicitação explícita; produzir arquivos entregáveis locais e usar o fluxo de checkpoint da plataforma sem confundir checkpoint com publicação, se suportado.
- Não gerar, buscar ou substituir modelos, personagens, skins ou áudio; usar exclusivamente o pacote v3.6 e materiais fornecidos.

## Evidências e ressalvas
- Typecheck passou; Vitest passou com 12 arquivos/79 testes; `node --check` passou para runtime e scripts de empacotamento/verificação.
- Build e smoke estático passaram: `dist/` contém 36 arquivos/18,69 MiB. O smoke verifica que o runtime distribuído inclui v3.7, evitando a cópia legada em conflito.
- Playtest Chromium headless em Preview dev e produção: HTTP 200, WebGL iniciado, menu e tutorial atravessados, contador avançando, teclas de movimento/esquiva e habilidades acionadas, três perfis FX aplicados; nenhuma exceção, erro de console, requisição falha ou resposta HTTP de erro.
- Captura do playtest: `/home/ubuntu/Downloads/ANARCO.EXE-v3.7-playtest.png`. O teste usou WebGL via SwiftShader e áudio silenciado; touch, GPU física, áudio audível e desempenho mobile seguem para aceite real.
- Corrigido o sombreamento do runtime: `public/script.js` antigo removido; o build copia o `script.js` fonte v3.7 para `dist/script.js`. Removido registro do `sw.js` inexistente, eliminando erro MIME; o manifesto PWA permanece.
- Relatório técnico: `RELATORIO-V3.7-NEON-EFFECTS.md`. Nenhuma publicação/deploy foi feita.

## Nova etapa — melhorar o HUD e a clareza visual (implementada e responsivamente testada)
- Reorganizado o HUD em áreas de leitura com contraste e hierarquia para objetivo, fase, tempo, torres, alerta, habilidades e rota; preservados os IDs/eventos usados pelo runtime, menu, pausa, tutoriais e avisos de chefão.
- Separados o painel superior e o objetivo; habilidades/corrida reunidas em dock tátil responsivo, com minimapa, joystick, seletor de rota e alvo sem sobreposição nos tamanhos verificados.
- Verificados no Chromium desktop, retrato e paisagem, incluindo 1280×720, 390×844, 320×568 e 667×375; imagens de referência salvas em Downloads. Aceite em aparelhos físicos ainda pendente.

## Nova etapa — melhorar a apresentação das salas (ambiente ajustado; validação ampla pendente)
- Acrescentados detalhes geométricos leves e reutilizáveis para dar identidade espacial ao Esconderijo Data/Data Center; o nível foi carregado no diagnóstico isolado e confirmou `room=true`, mas a inspeção visual completa durante a campanha segue pendente.
- Os modelos de computadores 3D específicos serão integrados depois que o usuário os enviar. Não foram gerados nem buscados modelos, personagens, skins ou áudio; os detalhes existentes são cosméticos e não acrescentam sólidos/colisões.

## Nova etapa — playtest das fases 3–5 e patch de balanceamento do Barão (parcial; não aprovar campanha)
- Run anterior com controles reais no Preview: concluídos os três hacks do Distrito Financeiro (PetroNegra Ltda., BancoUsura S.A. e Vigilância Total Corp.); observada a transição normal para a Zona Industrial.
- Nova tentativa de campanha normal: o Preview iniciou novamente no nível 1 (o progresso não estava salvo). A aproximação à PetroNegra terminou em alerta máximo antes do primeiro hack; portanto esta tentativa não chegou à Zona Industrial.
- Fases 3–5: carregadas uma a uma pelo helper dev-only `startLevel`, com movimento curto por WASD. Centro de Vigilância (3/6) e Esconderijo Data (4/6) permaneceram em `play`; a sala Data foi identificada. Na Subestação Elétrica (5/6), o blecaute foi ativado pelo helper de diagnóstico. **São smoke-tests isolados, não progressão ou conclusão da campanha.**
- Patch do Barão no `script.js`: velocidade de perseguição `3.1 → 2.7` (~13% menor); janelas de telegráfico `1.15/0.8/0.55 s → 1.45/1.2/0.95 s`; multiplicador do alerta por proximidade `1.5 → 0.65` apenas para o Barão (~57% menor). HP, dano, cooldowns e raios das zonas não mudaram.
- Teste isolado após o patch: VÍRUS `100 → 88` e BREACH `88 → 54`; `VAZAMENTO TÓXICO` foi esquivado lateralmente e resolvido sem aumentar alerta (0). O aviso `CHAMINÉ DE FOGO` apareceu a 21 m; a run foi pausada antes de resolver esse segundo telegráfico. **Barão não derrotado; ajuste preliminar, ainda sem aprovação do balanceamento.**
- CEO MEGACORP segue sem teste. A arena final e o Barão foram iniciados com ferramentas dev-only e não comprovam chegada pela campanha.
- O Preview atual está pausado no encontro isolado do Barão (54% HP; telegráfico CHAMINÉ DE FOGO; distância indicada de 21 m). Permanecem pendentes a campanha normal, objetivos restantes, fases 2–5 completas em campanha, avaliação final do Barão/possível retuning, CEO e final da campanha. Não declarar conclusão.
- Captura do teste ajustado: `evidence/ANARCO.EXE-v3.8-barao-tuned-telegraph-pause.webp`; capturas históricas do teste anterior: `evidence/ANARCO.EXE-v3.8-barao-telegraph.webp`, `evidence/ANARCO.EXE-v3.8-barao-gameover.webp` e `evidence/ANARCO.EXE-v3.8-playtest-paused.png`.
