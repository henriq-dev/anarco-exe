# ANARCO.EXE — Teste em dispositivo físico

Este roteiro cobre as três validações que não podem ser comprovadas pelo Chromium headless.

## 1. Instalação PWA

1. Abra a URL do release em Chrome Android ou Safari iOS.
2. Aguarde o menu carregar e confirme que o botão **Instalar** aparece quando o navegador oferecer o prompt.
3. Instale o app pela opção do navegador: **Adicionar à tela inicial** ou **Instalar aplicativo**.
4. Abra o ícone instalado e confirme que o jogo inicia sem barra de endereço.
5. Feche o navegador, ative o modo avião e reabra o ícone.
6. Confirme que menu, personagem, fontes, briefing e primeira arena carregam offline.

## 2. FPS e toque

1. Teste em orientação retrato e paisagem.
2. Inicie uma partida e percorra as seis fases, incluindo a Subestação Elétrica.
3. Use joystick, CORRER, BREACH, EMP, VÍRUS e seletor de rotas.
4. Observe travamentos ao trocar de fase, abrir o minigame, ativar o BLECAUTE e entrar em chefões.
5. Registre o modelo do aparelho, sistema, navegador e se houve queda perceptível de frames.
6. Em aparelhos Android, use o painel de desempenho do navegador ou gravação de tela para estimar estabilidade; não usar apenas a sensação subjetiva como número exato.

## 3. Áudio e acessibilidade

1. Toque no botão de som e confirme que o áudio de exploração inicia após o gesto.
2. Entre em alerta, perseguição, hack e chefão; confirme transições de camada sem estalos excessivos.
3. Desative o som e confirme que as camadas param.
4. Ative **Reduzir movimento** no sistema e reabra o jogo.
5. Confirme que câmera cinematográfica, chuva e pulsações são reduzidas ou desativadas.
6. Use leitor de tela para verificar BREACH, EMP, VÍRUS, rotas, objetivo e mensagens de estado.

## Registro

- Aparelho/modelo:
- Sistema e versão:
- Navegador e versão:
- PWA instalado: sim / não
- Abriu em modo avião: sim / não
- FPS percebido: estável / quedas leves / quedas fortes
- Áudio: aprovado / falha
- Redução de movimento: aprovada / falha
- Observações:
