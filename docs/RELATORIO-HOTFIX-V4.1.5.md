# ANARCO.EXE v4.1.5 — hotfix de foco e renderização

## Escopo

Este lote corrige os dois problemas reportados na v4.1.4 e implementa o item global 8 da lista: suspender a renderização WebGL em menu e pausa. Regras de jogo, balanceamento e simulação durante gameplay não foram alterados.

## Correções

### Foco ao iniciar e retomar

O fechamento do menu de entrada e da pausa agora envia o foco ao canvas neutro do jogo, em vez de deixá-lo no botão Pausar. O canvas recebe `tabindex=-1`, nome acessível e indicador visual quando focado por teclado; não vira mais um controle que Enter ativa. O E2E confirma foco no canvas após iniciar e retomar e pressiona Enter para garantir que a partida não volte à pausa.

### Pontuação do objetivo

A mensagem acessível agora acrescenta pontuação terminal apenas se o texto já não terminar em sinal de pontuação. Isso preserva `Ltda.` no nome e evita produzir `Ltda..`. Há regressão E2E cobrindo o formato do objetivo normal e de chefe.

## Item 8 — render em menu e pausa

`fxSystem.render()` não é chamado no estado `menu` nem no bloco de pausa. O ciclo de gameplay volta a renderizar normalmente e a instrumentação E2E confirma que chamadas de render são retomadas em `play`. O minimapa continua parado durante a pausa.

Limite explícito: o callback `requestAnimationFrame` ainda é agendado, e a lógica leve existente de menu continua executando; este lote interrompe o render da cena 3D e os efeitos pós-processados, não suspende por completo o loop de CPU nem reduz esse callback a zero. O perfil recebe zero de tempo de render nesses estados.

## Validação

`CHROMIUM_PATH=/usr/bin/chromium pnpm verify` passou na v4.1.5: typecheck, **85 testes unitários em 14 arquivos**, build, smoke e E2E Chromium. O smoke conferiu 38 arquivos (7,06 MiB); o bundle continuou em cerca de 6,31 MiB transferidos. Os testes E2E instrumentaram chamadas de `fxSystem.render` em menu, terminal, gameplay e pausa; verificaram retomar, Enter no foco neutro e a pontuação do anúncio.

Não houve teste em PC/GPU ou celular físico, nem teste real com NVDA, VoiceOver ou TalkBack. A validação de acessibilidade continua automatizada; é recomendável uma rodada manual com leitores de tela. O item de medição em dispositivos reais continua dependente de execução por você.

## Estado do backlog

Com o item global 8 concluído, a contagem anterior passa de 6 para **7 de 20 concluídos**, restando 13 itens pendentes, incluindo as medições físicas. Os itens 1–3, 5–7, 12, 14 e 16–20 continuam pendentes nesta entrega. O bundle, Brotli/Lighthouse, preload, orçamentos por categoria, cache Vercel, alvos de toque, compressão dos modelos e gamepad seguem pendentes.
