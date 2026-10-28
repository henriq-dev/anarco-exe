# ANARCO.EXE 3D — Release Candidate v3.4

## Estado

O núcleo técnico do jogo está pronto para aceite final. A versão preserva as cinco fases originais, adiciona a Subestação Elétrica como fase 5 e desloca o Núcleo MegaCorp para a fase 6.

## Recursos incluídos

- Cinco fases originais preservadas.
- Subestação Elétrica com identidade visual própria.
- Rotas rápida, protegida e técnica em seis fases.
- Missão do gerador reserva.
- Protocolo de hack PULSO.
- BLECAUTE com ciclo de 12 segundos e janela de 2,5 segundos.
- Visão dos drones reduzida para 60% durante o BLECAUTE.
- Áudio individual de entrada, ataque e derrota dos chefões.
- Camadas de exploração, alerta, perseguição e combate.
- Skins Capuz e Cachos.
- PWA offline com cache versionado `anarco-v3.4-merge3`.
- Smoke test de seis fases, colisões, rotas, PWA, áudio e mobile.
- Acessibilidade, `prefers-reduced-motion` e controles touch.

## Validação automatizada

- 78 testes unitários e de integração: aprovados.
- Typecheck e build Vite: aprovados.
- Auditoria de release: aprovada.
- Smoke de seis fases: aprovado.
- Playtest real do BLECAUTE no loop: aprovado.
- ZIP íntegro: verificado com `unzip -t`.

O aviso de FPS headless não é considerado falha: a confirmação numérica de desempenho depende de aparelho físico.

## Aceite físico pendente

1. Instalar o PWA em Android ou iOS.
2. Reabrir em modo avião.
3. Percorrer as seis fases em retrato e paisagem.
4. Usar o BLECAUTE e o protocolo PULSO.
5. Confirmar FPS, áudio, mute e redução de movimento.
6. Conferir controles touch e leitor de tela.

O roteiro detalhado está em `TESTE-DISPOSITIVO.md`.

## Publicação

A publicação ainda não foi executada. Este pacote é um release candidate e aguarda o aceite físico e a autorização explícita para publicar.

## Checkpoint

`d91140b — test: validar blecaute no loop real`
