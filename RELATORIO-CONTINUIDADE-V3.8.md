# ANARCO.EXE v3.8 — Relatório de continuação

**Data:** 28 de outubro de 2026  
**Estado:** melhorias v3.8 implementadas; campanha retomada parcialmente e pausada no início do nível 2. As fases 3–6 e os chefões seguem pendentes.
**Projeto:** ANARCO.EXE — Three.js/Vite, Preview local na porta 3000.

## O que foi feito

### HUD e clareza visual

- Reorganizei o painel superior em áreas de leitura para fase, tempo, objetivos, alerta, estado dos drones, missão secundária e rota ativa.
- Separei o objetivo do HUD e fiz seu posicionamento acompanhar a altura observada do painel, evitando que o texto cubra indicadores ou a cena.
- Agrupei BREACH, EMP, VÍRUS, NÓ FANTASMA, esquiva e corrida em um dock de toque responsivo; preservei IDs, listeners e regras dos controles existentes.
- Ajustei o modo desktop, retrato e paisagem, incluindo larguras pequenas e movimento reduzido. Os testes de layout em Chromium cobriram 1280×720, 390×844, 320×568 e 667×375, sem sobreposição detectada entre HUD/objetivo, minimapa, joystick, seletor de rota e botões.

### Salas e ambiente

- Ampliei a ambientação geométrica do Esconderijo Data/Data Center com detalhes estáticos leves de corredor, travessas/painéis e guias visuais de piso/servidores.
- As alterações são cosméticas: não adicionam colliders, não deslocam as rotas e não alteram hacking, objetivos ou lógica de inimigos.
- Não foram gerados nem buscados modelos, skins, personagens ou áudio. **Os modelos de computadores 3D enviados pelo usuário ainda não chegaram e não estão incluídos.** A inspeção visual completa do Data Center permanece pendente porque a sessão foi pausada antes dessa fase.

## Validação e sessão de gameplay

- `pnpm typecheck`: passou.
- `pnpm test`: **12 arquivos, 79 testes passaram**.
- `node --check script.js`, dos scripts de empacotamento e do smoke: passaram.
- `pnpm build`: passou. O build incluiu o runtime atual em `dist/script.js` e restaurou e copiou os assets registrados.
- `pnpm smoke`: passou — 36 arquivos estáticos, aproximadamente 18,70 MiB, com os modelos e assets locais presentes. O smoke é estático; não substitui a validação de navegador.
- **Gameplay com controles reais no Preview (run anterior):** com a VANTA, completei as invasões de PetroNegra Ltda., BancoUsura S.A. e Vigilância Total Corp. no Distrito Financeiro, resolvendo os minigames de hacking. O alerta estava em 0 ao concluir a fase. Observei o briefing/transição normal para a Zona Industrial.
- **Retomada após este marco:** uma nova aproximação à PetroNegra pelo corredor exposto terminou em alerta máximo antes do primeiro hack (0/3) e game over. O botão `Tentar de novo` reiniciou a campanha desde o começo. Para preservar o ponto de retomada anterior, restaurei o nível 2 no spawn `(0, 22)` com o bridge de diagnóstico **local/dev-only** e pausei pela interface do jogo. A partida está agora pausada nesse ponto restaurado, com alerta 0; essa restauração não é evidência de progressão adicional. A primeira run e sua captura estão em [`evidence/ANARCO.EXE-v3.8-playtest-paused.png`](evidence/ANARCO.EXE-v3.8-playtest-paused.png).
- **Observação de balanceamento:** a rota protegida e o uso oportuno de habilidades permitiram a run anterior do Distrito Financeiro; na tentativa posterior, o corredor exposto levou ao limite de alerta antes do hacking. Não alterei o balanceamento nem o fluxo de retry nesta etapa.

## O que não foi validado ainda

- Esta sessão **não passou do começo do nível 2**. As fases seguintes, o interior do Data Center em jogo e a campanha até o final não foram testados.
- Nenhum dos chefões — Diretor-Banqueiro, Barão do Petróleo ou CEO MEGACORP — foi alcançado, enfrentado ou derrotado nesta sessão. Não considero a progressão nem os chefões aprovados.
- Os tamanhos de tela foram verificados em Chromium, mas controles de toque em aparelho, GPU física, áudio audível e desempenho em dispositivos móveis ainda precisam de aceite em hardware real.

## Como continuar

1. Reabra o [Preview pausado do ANARCO.EXE](https://3000-if1f68dbmthb730007q7a-043e74a0.us5.manus.computer/) e retome pelo botão `▶`.
2. Continue os três objetivos da Zona Industrial; siga pela transição normal e registre fase e objetivos antes de avançar.
3. Inspecione visualmente o Esconderijo Data/Data Center ao chegar à fase correspondente.
4. Teste as fases seguintes e os chefões, anotando entradas, telegráficos, ataques, dano, transições e condições de conclusão; pause novamente e salve o estado observado.
5. Quando o usuário enviar os modelos 3D dos computadores, validar formato/orientação/escala, otimizar carregamento e colisões, integrar aos ambientes pertinentes e repetir build, smoke e playtest da sala.

**Publicação:** nenhum deploy público para Vercel/GitHub foi feito nesta etapa.
