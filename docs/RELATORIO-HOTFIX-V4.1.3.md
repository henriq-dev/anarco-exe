# ANARCO.EXE — hotfix v4.1.3

## Bug corrigido

Uma revisão independente encontrou que a penalidade após errar a sequência do hack ainda lia `ROUTES[routeMode].alertGain`. Na v4.1.2, os multiplicadores-base foram removidos de `ROUTES` para evitar duplicação; assim, essa referência retornava `undefined`, e a soma podia deixar `alert_` como `NaN`.

O runtime agora usa `routeTune().alertGain`, a mesma configuração por rota e fase que o gameplay já usa para a penalidade. O E2E reproduz a entrada errada e confirma que o alerta permanece finito e aumenta exatamente conforme o multiplicador ativo.

## Testes e CI

Foi adicionado `.github/workflows/verify.yml`: em push, pull request ou execução manual, instala pnpm/dependências e Chromium do Playwright, depois executa `pnpm verify`.

A validação local completa passou: typecheck, **85 testes em 14 arquivos**, build, smoke (38 arquivos, 7,05 MiB) e E2E. O E2E inclui agora a penalidade do alerta, além do fluxo offline.

## Cache do Service Worker

A tentativa de gravar em segundo plano com `event.waitUntil` foi experimentada, mas o E2E offline falhou ao desligar a rede logo após carregar os recursos. Para preservar comportamento previsível, o código entregue aguarda a gravação, mas captura falhas de cache separadamente: quota/armazenamento cheio não invalida a resposta online.

A latência dessa espera em modelos/áudios grandes não foi medida; portanto, não foi adotada uma mudança que colocaria em risco a disponibilidade offline sem evidência e teste robusto.
