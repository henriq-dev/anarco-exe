# Diagnóstico CI — v4.2.6

## Falha do smoke

O segundo log mostra que o overlay v4.2.5 resolveu o orçamento: fonts 0,05/0,25 MiB, models 2,78/3,25 MiB, images 0,32/0,75 MiB e total 6,29/8,00 MiB. A falha restante é no smoke, que exige que `manus-routes.json` não seja publicado.

O ZIP v4.2.5 enviado não contém `public/manus-routes.json`, mas a branch antiga do repositório ainda o contém. Ao sincronizar por sobreposição, o arquivo continua no checkout. O Vite copia conteúdo de `public/` para a raiz de `dist/`, então o smoke encontra `dist/manus-routes.json` e falha. O manifesto é sobras do scaffold e não é lido pelo runtime do jogo.

A v4.2.6 acrescenta `manus-routes.json` à lista que `scripts/prune-unused-build-assets.mjs` remove do artefato `dist`. Isso alinha o pruner à asserção que já existia em `scripts/smoke.mjs`. A limpeza não apaga `public/manus-routes.json` do repositório; remove-o somente do output publicado.

## Verificação

A correção foi aplicada em um clone local da branch pública `main`, mantendo o manifesto antigo e os demais arquivos retidos pela sobreposição. `pnpm verify` passou: 18 arquivos de teste, **97 testes**, build, orçamentos, smoke e E2E. O build ficou em 6,29/8,00 MiB no total e o smoke reportou 38 arquivos estáticos.

Uma execução anterior do E2E expirou uma vez na espera de 10 segundos pelo composer de Bloom; a repetição passou. Para reduzir flakiness no runner do GitHub Actions, o timeout dessa espera passou para 30 segundos. A verificação completa seguinte passou.

## Aplicação

Extraia o overlay v4.2.6 na raiz do repositório existente, preservando `.git`; depois execute `pnpm install --frozen-lockfile` e `pnpm verify`. O pacote de correção contém apenas os arquivos alterados/adicionados, sem o projeto inteiro.
