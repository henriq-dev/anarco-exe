# TODO — ANARCO.EXE 3D

## Pacote 1 — vertical slice de clareza

- [ ] Importar a base `anarco-exe-main` para o shell Three.js gerenciado, mantendo o backup recebido separado e preservando PWA/offline.
- [ ] Manter as cinco fases, torres, drones, minigame, chefões, base, ranking, vazamentos e skins em português brasileiro.
- [ ] Dar personalidade visual própria às cinco fases por iluminação, composição, cor e props.
- [ ] Exibir torres com estados pendente, objetivo, em hack, concluída e atingida pelo BREACH.
- [ ] Reforçar o feedback de início, execução, falha e conclusão do hack.
- [ ] Exibir estados visuais de drones em patrulha, suspeita, detecção, perseguição, congelamento e infecção pelo VÍRUS.
- [ ] Ampliar o minimapa com jogador/direção, torres, drones, itens e chefão, usando os estados de cada elemento.
- [ ] Adicionar briefings entre fases com objetivo, ameaça e recomendação.
- [ ] Exibir estatísticas completas no resultado da partida.

## Pacote 2 — profundidade de gameplay

- [ ] Manter funções diferentes para BREACH, EMP e VÍRUS, com custo, cooldown, telegraph e contra-jogada.
- [ ] Fazer a corrida ter risco/recompensa por ruído e segurança.
- [ ] Criar rotas rápida, protegida e técnica em arenas existentes.
- [ ] Adicionar objetivos secundários curtos com recompensas.
- [ ] Evoluir o hack com variações equilibradas, sem tornar a fase 4 injusta.
- [ ] Ajustar a dificuldade dos drones por fase com teste real.
- [ ] Criar resultado com perfil furtivo, agressivo ou equilibrado.

## Pacote 3 — arte e reação do mundo

- [ ] Criar kit modular reutilizável de parede, coluna, piso, rack, terminal, câmera, cabo, painel, cobertura e letreiro.
- [ ] Criar hierarquia de materiais: ciano tecnologia, magenta invasão, verde resistência, vermelho perigo e amarelo objetivo.
- [ ] Reforçar símbolos, grafites, adesivos e narrativa ambiental da resistência.
- [ ] Adicionar destruição visual simples de telas, caixas, cabos, painéis e portas.
- [ ] Adicionar iluminação e composição específicas para cada fase.
- [ ] Criar momentos curtos de câmera para hack, torre e chefão, respeitando movimento reduzido.
- [ ] Melhorar feedback visual de coleta, dano, corrida e hack da personagem.

## Pacote 4 — inimigos e chefões

- [ ] Diferenciar silhuetas dos três chefões em tamanho pequeno.
- [ ] Criar ataques especiais com telegraph visual e sonoro.
- [ ] Melhorar drones 3D com olho, hélices e estados reconhecíveis.
- [ ] Criar efeito visual de infecção pelo VÍRUS.
- [ ] Criar entradas e apresentações de chefão.

## Pacote 5 — áudio, mobile e conteúdo

- [ ] Adicionar camadas sonoras por estado do jogo.
- [ ] Adicionar vibração mobile opcional para hack, detecção, BREACH, vitória e derrota.
- [ ] Criar novas salas somente após validar o kit modular e o desempenho.
- [ ] Criar sistema de progressão/desbloqueios sem quebrar ranking.
- [ ] Validar FPS, sons, skins, dificuldade e offline em aparelho real.

## Entrega

- [ ] Rodar typecheck/build/testes/smoke existentes.
- [ ] Validar preview e capturas do pacote implementado.
- [ ] Preparar sharing metadata e favicon específico.
- [ ] Salvar checkpoint gerenciado com a versão parcial claramente identificada.
- [ ] Publicar somente mediante solicitação explícita.

## Checkpoint atual — Pacotes 1 e 2
- [x] Identidade visual por fase: nome, ameaça, paleta e leitura semântica no HUD.
- [x] Estados visuais das torres: pendente, objetivo, em hack e concluída.
- [x] Estados dos drones: patrulha, detecção, perseguição, congelamento e vírus.
- [x] Feedback e estatísticas: início/conclusão de hack, alertas, habilidades, itens e perfil final.
- [x] Missões secundárias: item destacado no minimapa, objetivo opcional e recompensa preservando o loop original.
- [x] Build Vite validado com `pnpm build`.

## Próximo pacote
- [ ] Variar o minigame de hack por fase sem tornar a fase 4 injusta.
- [ ] Criar briefings completos entre todas as fases com objetivo, ameaça e recomendação.
- [ ] Melhorar dano/destruição visual de telas, caixas, cabos, painéis e portas.
- [ ] Consolidar checkpoint remoto após validar preview e testes de interação.

## Pacote 3 — progresso
- [x] Protocolos de hack por fase: SETAS, RELE, PULSO, NUCLEO e CHEFAO, com regras visuais e sequências equilibradas.
- [x] Briefings entre fases com objetivo, ameaça e recomendação.
- [x] Manifesto `/manus-routes.json` validado com HTTP 200.
- [x] Testes Vitest: 78 testes em 11 arquivos aprovados.
- [x] Build final aprovado.
- [x] Preview carregado sem erros no console.
- [!] `pnpm smoke` bloqueado apenas porque o Playwright local não encontrou a distribuição Chrome; a validação equivalente no Preview gerenciado foi executada.

## Pacote 4 — drones 3D
- [x] Drones com corpo quadrado, olho emissivo e quatro hélices ciano.
- [x] Cor do olho, corpo e hélices acompanha patrulha, detecção, perseguição, congelamento e vírus.
- [x] Testes Vitest: 78/78 aprovados; build aprovado; preview sem erros de console.

## Pacote 5 — feedback de ações
- [x] Flash visual para hack, coleta e entrada em estado de perigo.
- [x] Pulso 3D no chão da personagem para hack, coleta e detecção.
- [x] Respeito a prefers-reduced-motion no feedback de tela.
- [x] Testes Vitest: 78/78 aprovados; build aprovado.
- [ ] Salvar este pacote no checkpoint remoto quando o vínculo canônico for reconciliado.

## Pacote 6 — destruição visual do cenário
- [x] Kit procedural de painel, caixa, cabo e porta adicionado ao cenário.
- [x] BREACH desativa o prop mais próximo dentro do raio de ação.
- [x] Prop desativado some, gera partículas, flash magenta e anel de impacto.
- [x] Props são restaurados ao reiniciar a fase.
- [x] Preview confirmou 17 props registrados e função de destruição disponível; console sem erros.
- [ ] Salvar este pacote no checkpoint remoto após reconciliação do vínculo canônico.

## Pacote 7 — chefões e telegraph
- [x] Aura procedural específica por cor para os três chefões.
- [x] Anéis de energia animados preservando as silhuetas dos modelos GLB.
- [x] Telegraph agora identifica chefão e ataque em andamento.
- [x] Acerto de hazard gera flash vermelho e pulso 3D de perigo.
- [x] Testes Vitest: 78/78 aprovados; build aprovado.
- [ ] Salvar pacotes 5–7 no checkpoint remoto após reconciliação canônica.

## Pacote 8 — infecção visual do VÍRUS
- [x] Drones recebem três anéis/tentáculos magenta quando infectados.
- [x] Infecção pulsa, gira e altera a leitura de cor das hélices e do olho.
- [x] Ativação do VÍRUS gera flash magenta, vibração opcional e pulso 3D.
- [x] Preview confirmou efeito disponível nos 5 drones e console sem novos erros.
- [ ] Avançar para silhuetas e ataques exclusivos dos três chefões.

# STATUS CONSOLIDADO — 2026-10-27

## Concluído no game
- [x] Base do `anarco-exe-main` incorporada ao shell Three.js gerenciado, com backup original preservado.
- [x] Cinco fases, torres, drones, hack, chefões, base, ranking, vazamentos, skins, PWA e assets locais preservados.
- [x] HUD por fase, estados de torre e estados de drone.
- [x] Minimap com jogador, torres, drones e itens; missão secundária e recompensas.
- [x] Briefings e estatísticas finais.
- [x] Protocolos de hack por fase.
- [x] Feedback visual de hack, coleta, perigo, dano e corrida.
- [x] Drones 3D com corpo quadrado, olho, hélices e infecção visual do VÍRUS.
- [x] Props destrutíveis: painéis, caixas, cabos e porta.
- [x] Chefões com aura colorida e telegraph de ataque.
- [x] Silhuetas procedurais exclusivas: selos/ombros do banqueiro, chaminés do petróleo e coroa/cage de dados do CEO.
- [x] Ataques exclusivos: muralha lateral do banqueiro, maré secundária do petróleo e núcleo zero do CEO.
- [x] Testes Vitest: 78/78; build Vite aprovado; preview sem novos erros de runtime.

## Parcial
- [~] Personalidade visual das cinco fases: HUD, cor e alguns props prontos; ainda faltam kits completos por fase.
- [~] BREACH, EMP e VÍRUS: funções distintas prontas; falta balanceamento fino de custo, cooldown e contra-jogada.
- [~] Rotas alternativas: cobertura e orientação prontas; faltam rotas rápida, protegida e técnica completas.
- [~] Chefões: aura, silhuetas e padrões próprios prontos; faltam entradas cinematográficas e áudio exclusivo.
- [~] Destruição: desativação funcional pronta; falta dano parcial, fumaça, faíscas específicas e estados quebrados.

## Ainda falta para concluir o projeto
- [ ] Criar rotas alternativas reais nas arenas existentes.
- [ ] Balancear drones, habilidades, corrida e dificuldade com testes de jogabilidade.
- [ ] Criar kits modulares e ambientação única para as cinco fases.
- [ ] Adicionar câmera curta de hack, torre e chefão com `prefers-reduced-motion`.
- [ ] Criar camadas de áudio para exploração, alerta, hack, perseguição e chefões.
- [ ] Criar entradas/apresentações dos chefões.
- [ ] Criar progressão e desbloqueios sem alterar o ranking.
- [ ] Testar FPS, som, PWA, offline e controles em aparelho móvel real.
- [ ] Reconciliar o vínculo canônico e salvar os Pacotes 5–8 no checkpoint remoto.
- [ ] Executar smoke test quando o Chrome do Playwright estiver disponível.
- [ ] Publicar somente após autorização explícita.

## Pacote 10 — rotas alternativas
- [x] Rota RÁPIDA: velocidade +18%, ruído e ganho de alerta aumentados; caminho ciano.
- [x] Rota PROTEGIDA: detecção e ganho de alerta reduzidos, recuperação maior e velocidade -8%; caminho verde.
- [x] Rota TÉCNICA: velocidade neutra, alerta controlado e cooldowns de EMP/VÍRUS reduzidos; caminho magenta.
- [x] Seleção por botões e teclas 1, 2 e 3.
- [x] HUD com rota ativa, bônus e risco.
- [x] Três linhas de caminho visuais no cenário.
- [x] Runtime confirmou troca para PROTEGIDA e atualização dos estados dos botões.

## Próxima etapa recomendada
- [ ] Balancear as rotas com percurso real até torres, cobertura e bloqueios por fase.
- [ ] Criar camadas de áudio por estado do jogo.

## Pacote 11 — balanceamento por fase e geometria de rotas
- [x] Tabela de balanceamento própria para as cinco fases.
- [x] RÁPIDA ajustada por fase com velocidade, ruído, ganho de alerta e recuperação próprios.
- [x] PROTEGIDA ajustada por fase com redução de detecção, recuperação e penalidade de velocidade próprias.
- [x] TÉCNICA ajustada por fase com alerta controlado e cooldown de EMP/VÍRUS próprio.
- [x] Coberturas verdes posicionadas por fase e incluídas na colisão.
- [x] Bloqueios vermelhos posicionados por fase para tornar a rota rápida uma escolha de exposição.
- [x] Atalhos técnicos magenta posicionados por fase como marcadores de acesso.
- [x] `applyLevel` reposiciona e registra os objetos a cada mudança de fase.
- [x] Typecheck, 78 testes Vitest e build aprovados.
- [ ] Testar percursos completos em todas as fases e ajustar pontos de bloqueio após playtest.

## Pacote 12 — playtest completo, áudio por estado e offline real
- [x] Playtest automatizado específico das cinco fases executado em Chromium.
- [x] Cada fase validada com seis objetos de rota, sendo quatro sólidos nos níveis 1–4.
- [x] Nível 5 validado sem bloqueios invisíveis: apenas atalhos técnicos ficam visíveis e nenhum objeto de rota sólido permanece ativo.
- [x] Probe de colisão confirmou bloqueio físico nas coberturas e barreiras visíveis dos níveis 1–4.
- [x] Troca de rota continua integrada ao HUD.
- [x] Camada Web Audio procedural para exploração, alerta, perseguição/chefão e assinatura da rota.
- [x] Transições de volume suaves e compatíveis com o botão de som/mute.
- [x] Assets locais, `script.js` e service worker copiados para o build de produção.
- [x] Cache PWA atualizado para a versão `anarco-v2.3-audio` com modelos principais.
- [x] Typecheck, testes Vitest e build aprovados.
- [ ] Reexecutar o smoke herdado do template somente após adaptar seus seletores ao ANARCO.EXE.

## Pacote 13 — validação automatizada e checkpoint v2.4
- [x] Smoke test reescrito para os seletores e runtime reais do ANARCO.EXE.
- [x] Validação automática de boot e hook de diagnóstico local.
- [x] Cinco fases, sólidos de rota e sondas de colisão validados no smoke.
- [x] Troca das rotas PROTEGIDA, TÉCNICA e RÁPIDA validada no HUD.
- [x] Inicialização do áudio por gesto validada.
- [x] Controles essenciais em viewport mobile validados.
- [x] `pnpm smoke` aprovado.
- [x] Checkpoint remoto v2.4 salvo no commit `50832e8`.
- [ ] Validar FPS, áudio e PWA em aparelho móvel físico.
- [ ] Implementar câmera curta de hack, torre e chefão.

## Pacote 14 — câmera cinematográfica e apresentações
- [x] Câmera curta de aproximação durante o minigame de hack.
- [x] Enquadramento breve da torre ao concluir o hack.
- [x] Entrada de chefão com aproximação e foco na silhueta.
- [x] Retorno suave à câmera normal após cada momento.
- [x] Movimento desativado automaticamente em `prefers-reduced-motion`.
- [x] Testes Vitest 78/78, build e smoke aprovados.
- [ ] Validar a percepção visual desses momentos em aparelho móvel físico.

## Pacote 15 — destruição parcial e estados quebrados
- [x] Primeiro BREACH danifica props sem removê-los.
- [x] Segundo BREACH desmonta e oculta o prop.
- [x] Props danificados recebem escala, inclinação e estado visual quebrado.
- [x] Faíscas/partículas e feedback de perigo diferenciam dano de destruição final.
- [x] Reinício restaura dano, escala, rotação e visibilidade.
- [x] Testes Vitest 78/78, build e smoke aprovados.
- [ ] Criar variações específicas de fumaça/faísca por tipo de prop.

## Pacote 16 — partículas específicas por tipo de prop
- [x] Material de partículas configurável por evento de destruição.
- [x] Painéis usam faíscas ciano.
- [x] Caixas usam fragmentos âmbar.
- [x] Cabos usam descarga magenta.
- [x] Portas usam impacto amarelo de alta força.
- [x] Props de base usam assinaturas verde/ciano próprias.
- [x] Dano parcial e destruição final usam contagens e forças diferentes.
- [x] Testes Vitest 78/78, build e smoke aprovados.
- [ ] Aplicar fumaça volumétrica leve apenas em dispositivos de maior desempenho.

## Pacote 17 — kit modular e ambientação procedural por fase
- [x] Grupo reutilizável de ambientação separado do cenário e das colisões.
- [x] Distrito Financeiro: blocos verticais com leitura de skyline corporativo.
- [x] Zona Industrial: tubos, chaminés e base de maquinário.
- [x] Centro de Vigilância: mastros e barras horizontais de monitoramento.
- [x] Esconderijo Data: módulos de rack/arquivo com iluminação verde.
- [x] Núcleo MegaCorp: pilares magenta e tubos de alta segurança.
- [x] Cores e emissões do kit seguem o tema de cada fase.
- [x] Kit é recriado apenas na troca de fase e não entra na colisão.
- [x] Testes Vitest 78/78, build e smoke aprovados.
- [ ] Otimizar geometrias compartilhadas após teste de FPS em aparelho físico.

## Pacote 18 — progressão e desbloqueios offline
- [x] Progressão persistida em `localStorage` sem depender de rede.
- [x] Vitória de campanha registrada separadamente do ranking.
- [x] Skin inicial CAPUZ permanece sempre disponível.
- [x] Skin CACHOS é desbloqueada após a primeira campanha concluída.
- [x] Seletor de skin mostra a quantidade desbloqueada.
- [x] Níveis continuam acessíveis e o ranking não é alterado pela progressão.
- [x] Compatibilidade com saves antigos preservada.
- [x] Testes Vitest 78/78, build e smoke aprovados.
- [ ] Adicionar mais recompensas cosméticas após validação mobile.

## Pacote 19 — validação PWA, mobile e acessibilidade
- [x] Smoke verifica `manifest.webmanifest`.
- [x] Smoke verifica disponibilidade do `sw.js`.
- [x] Smoke verifica a API de service worker.
- [x] Controles touch de joystick, BREACH e rotas validados.
- [x] Ciclo mobile executado após janela de aquecimento.
- [x] Pixel ratio touch reduzido para 1.25 como prioridade de desempenho.
- [x] Smoke mantém aviso honesto quando Chromium headless usa renderização de software.
- [ ] Confirmar FPS sustentado, áudio e instalação PWA em aparelho físico.

## Pacote 20 — recompensas cosméticas e revisão de acessibilidade
- [x] Recompensa NEON no HUD após 2 vitórias da campanha.
- [x] Recompensa GLITCH no HUD após 3 vitórias da campanha.
- [x] Recompensas persistem offline e não alteram gameplay ou ranking.
- [x] BREACH, EMP e VÍRUS receberam `aria-label` contextual.
- [x] Rotas rápida, protegida e técnica receberam rótulos acessíveis.
- [x] Mensagens de objetivo e estado foram convertidas em regiões `status` ao vivo.
- [x] Foco visível e redução de movimento revisados.
- [x] PWA, build, 78 testes e smoke aprovados.
- [ ] FPS, áudio e instalação PWA precisam de confirmação em dispositivo físico.

## Pacote 21 — auditoria final e release candidate
- [x] Auditoria determinística dos arquivos obrigatórios de release.
- [x] Manifest com identidade, start_url e display PWA verificado.
- [x] Service worker e assets Three.js/modelo locais verificados.
- [x] Ações principais e feedbacks acessíveis verificados estaticamente.
- [x] Build de produção aprovado.
- [x] 78 testes Vitest aprovados.
- [x] Smoke de cinco fases, PWA, rotas, áudio e mobile aprovado.
- [x] Release candidate v3.2 preparado.
- [ ] FPS/áudio/instalação PWA em dispositivo físico.
- [ ] Autorização explícita para publicação.

## Pacote 22 — offline release e aceite físico preparado
- [x] Service worker atualizado para `anarco-v3.3-release`.
- [x] Cache inclui dados, fontes, ícones, props, skins e modelos críticos.
- [x] Service worker público sincronizado com a raiz do projeto.
- [x] Build, auditoria de release e smoke aprovados.
- [x] Roteiro de teste físico criado em `TESTE-DISPOSITIVO.md`.
- [ ] Executar o roteiro em aparelho real.
- [ ] Autorizar publicação do release candidate.

## Pacote 23 — análise da ANARCO.EXE v3.4 recebida
- [x] ZIP recebido extraído em área temporária sem sobrescrever a v3.3.
- [x] Estrutura, assets, HTML, CSS, service worker e script comparados.
- [x] Sintaxe do `script.js` v3.4 verificada.
- [x] Notebook 3D confirmado como recurso já presente na v3.3.
- [x] Sexta fase, blecaute, áudio de chefões e correção de pickups identificados como novidades.
- [x] Regressão do service worker e ausência de testes no ZIP identificadas.
- [x] Ordem segura de integração registrada em `ANALISE-V34.md`.
- [ ] Integrar seletivamente a correção de pickups.
- [ ] Integrar seletivamente a sexta fase e o áudio de chefões após aprovação.

## Pacote 24 — junção seletiva v3.4: bugfix de pickups
- [x] Correção de raio para sólidos com `w/d` sem `r` integrada.
- [x] Limite de 400 tentativas evita loop infinito no spawn de pickups.
- [x] Auditoria de release passou a verificar a proteção do loop.
- [x] 78 testes Vitest aprovados.
- [x] Build, auditoria e smoke de cinco fases aprovados.
- [ ] Integrar áudio específico dos chefões.
- [ ] Integrar sexta fase Subestação Elétrica e BLECAUTE.

## Pacote 25 — junção seletiva v3.4: áudio de chefões
- [x] Assinatura sonora individual para entrada dos três chefões.
- [x] Assinatura sonora individual para ataques.
- [x] Assinatura sonora individual para derrota.
- [x] Camada grave e pulso LFO durante combate de chefão.
- [x] Exploração reduzida durante combate para reforçar o foco tático.
- [x] Mudo agora silencia efeitos e trilha ambiente.
- [x] 78 testes, build, auditoria e smoke aprovados.
- [ ] Integrar sexta fase Subestação Elétrica e BLECAUTE.

## Pacote 26 — junção seletiva v3.4: estrutura da sexta fase
- [x] Tema visual Subestação Elétrica adicionado.
- [x] Kit procedural de transformadores e cabos adicionado.
- [x] Layout de rotas rápida, protegida e técnica adicionado.
- [x] Missão secundária do gerador reserva adicionada.
- [x] Fase PULSO adicionada ao minigame.
- [x] HUD e briefings atualizados de 5 para 6 fases.
- [x] Núcleo MegaCorp deslocado para a sexta fase.
- [x] Smoke validou seis fases, rotas, colisões, PWA, áudio e mobile.
- [ ] Validar BLECAUTE com gameplay controlado.
- [ ] Atualizar e testar cache offline específico da fase 6.
