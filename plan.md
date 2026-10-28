# Plano de implementação — ANARCO.EXE 3D

## Objetivo

Evoluir a base standalone atual para um game Three.js cyberpunk completo, preservando cinco fases, hack, torres, drones, BREACH, EMP, VÍRUS, chefões, base da resistência, ranking, vazamentos, skins, PWA e funcionamento offline.

## Direção de design

### Estilos considerados

- **Cyberpunk glitch documental** — probabilidade 0,06.
- **Resistência industrial neon** — probabilidade 0,05.
- **Terminal corporativo brutalista** — probabilidade 0,04.

### Estilo escolhido: Cyberpunk glitch documental

**Movimento de design:** uma experiência de infiltração em arena vista de cima, misturando terminal quebrado, propaganda corporativa e improviso da resistência.

**Princípios:** leitura imediata dos estados; cada cor tem função; cenário conta a história; efeitos são resposta a ações, não decoração; desempenho mobile é requisito visual.

**Filosofia de cor:** ciano representa tecnologia e informação; vermelho representa ameaça e controle corporativo; magenta representa invasão e instabilidade; verde representa resistência e segurança; amarelo representa objetivo e atenção.

**Paradigma de layout:** HUD assimétrico de terminal, objetivos centralizados apenas quando necessários, minimapa como instrumento tático e arena aberta com rotas alternativas.

**Elementos de assinatura:** anéis de torre por estado, setas e símbolos da resistência, glitches e telas que reagem ao progresso.

**Interação:** cada ação deve confirmar ao jogador o que mudou: torre, hack, drone, habilidade ou objetivo.

**Animação:** pulsos curtos para estados importantes, transições suaves para movimento e câmera, redução respeitada por `prefers-reduced-motion`.

**Tipografia:** Anton para marca e títulos; Special Elite/monoespaçada para terminal, HUD e mensagens.

**Essência:** infiltração cyberpunk de resistência para quem quer derrubar corporações usando leitura de ambiente, hacking e risco calculado.

**Voz:** direta, rebelde, curta e operacional. Exemplos: “A rede abriu. Agora desapareça.” e “Sem chefe. Sem servidor sagrado.”

**Marca:** wordmark `ANARCO.EXE` com bloco vermelho no `.EXE`, moldura de terminal e símbolo de anarquia como sinal recorrente.

**Cor proprietária:** magenta glitch `#ff3fd0`, usado somente em invasão, instabilidade e momentos de ruptura.

## Arquitetura

- `index.html`: shell do jogo, HUD, overlays, briefing, resultado e controles.
- `style.css`: sistema visual, responsividade, acessibilidade e estados.
- `script.js`: cena Three.js, movimento, colisão, torres, drones, hack, habilidades, chefões, progressão e áudio.
- `public/assets/`: imagens, fontes, modelos, bibliotecas e dados locais do jogo.
- `manifest.webmanifest` e `sw.js`: instalação e cache offline.
- `game-sharing.json`: título, descrição, favicon e preview para compartilhamento.
- `src/`: starter gerenciado preservado para compatibilidade do projeto e verificações do Webdev.

## Ordem de implementação

### Pacote 1 — clareza e vertical slice

Importar a base atual e consolidar: identidade visual por fase; estados de torre; feedback de hack; estados de drones; minimapa com leitura tática; briefings entre fases; tela de resultado com estatísticas; objetivo com seta e distância.

### Pacote 2 — profundidade de gameplay

Diferenciar BREACH, EMP e VÍRUS; corrida como risco/recompensa; rotas rápida, protegida e técnica; objetivos secundários; recompensas; variações equilibradas do hack.

### Pacote 3 — arte e reação do mundo

Kit modular de cenário; símbolos e grafites; destruição simples de telas, caixas, cabos, painéis e portas; iluminação por fase; câmera de eventos; feedback de coleta, dano e habilidades.

### Pacote 4 — inimigos e chefões

Silhuetas únicas; estados mais legíveis; ataques com telegraph; drones 3D mais reconhecíveis; efeitos de VÍRUS; apresentações de chefão.

### Pacote 5 — conteúdo e polimento

Novas salas, objetivos secundários completos, progressão/desbloqueios, novas skins quando autorizadas, áudio por estado, vibração mobile e validação em aparelhos reais.

## Critérios de preservação

O jogo deve continuar em português brasileiro, offline-first, com assets locais/fallback, acessível com movimento reduzido, compatível com desktop e toque, sem serviços online novos e sem substituir a identidade da protagonista.
