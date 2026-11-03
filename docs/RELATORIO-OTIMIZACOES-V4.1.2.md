# ANARCO.EXE — alterações de otimização v4.1.2

## Implementado

1. **Service Worker: cache best-effort.** A resposta da rede continua sendo entregue mesmo se abrir/gravar no Cache Storage falhar por quota ou outro erro. A tentativa de cache é aguardada e isolada em `try/catch` para preservar também o comportamento offline após a carga. A versão do cache mudou para `anarco-v4.1.2-cache-write-safe`.
2. **Descrições dinâmicas das rotas.** Texto e notificação são derivados dos multiplicadores atuais de velocidade, ruído, alerta, recuperação e cooldown. A descrição é atualizada ao trocar de rota e de fase; texto completo fica disponível em `title` e `aria-label` no HUD.
3. **Cobertura de regressão.** Dois testes simulam a falha de gravação por quota e a recuperação offline pelo cache. O E2E confere valores de rota em fases diferentes.
4. **Validação integrada.** `pnpm verify` encadeia typecheck, testes, build, smoke e E2E. O pacote e o README foram atualizados para v4.1.2.

## Verificação executada

`CHROMIUM_PATH=/usr/bin/chromium pnpm verify` passou: typecheck, **85 testes em 14 arquivos**, build, smoke (**38 arquivos estáticos; 7,05 MiB**) e E2E, incluindo uso dos cinco áudios offline e as seis fases.

No primeiro ensaio, sem indicar o Chromium do sistema, o Playwright não encontrou seu navegador empacotado. A repetição com `CHROMIUM_PATH` passou. Em máquina nova, instale Chromium para Playwright (`pnpm exec playwright install chromium`) ou informe o caminho do Chromium disponível.

## Não alterado neste lote

Não foram alterados DPR, antialias, cadência de render, política de cache HTTP imutável, preload, formato/compressão dos modelos ou migração dos saves. Essas mudanças dependem de medição real, validação de compatibilidade ou confirmação da plataforma de publicação. O benchmark local usa SwiftShader e não substitui PC/celular físicos.
