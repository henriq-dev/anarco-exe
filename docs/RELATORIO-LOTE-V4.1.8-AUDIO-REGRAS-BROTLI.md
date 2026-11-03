# Lote v4.1.8 — áudio, regras de gameplay e medição Brotli

## Alterações

**Trilha e efeitos curtos separados.** O runtime agora busca e decodifica primeiro os quatro efeitos curtos, após a interação que inicia o terminal. A trilha MP3 só é solicitada depois que o jogo chega a `play` ou `brief` e a promessa dos efeitos termina. Enquanto ela não chega — ou se falhar — a música procedural permanece como fallback. Mute/desmute, carregamento sob demanda e o fluxo offline continuam cobertos. O E2E confirma quatro efeitos no terminal, nenhuma solicitação da trilha nesse estado, carregamento da trilha após a partida começar e funcionamento offline quando os cinco arquivos já foram armazenados.

**Configuração de níveis e rotas compartilhada.** Os seis perfis de nível, os multiplicadores das três rotas por nível e os rótulos/cores agora vêm de `src/anarco-gameplay-config.ts`. `src/anarco-entry.ts` instala essa mesma referência antes de injetar `script.js`; testes unitários importam e fixam os valores e o E2E confirma a identidade das referências consumidas pelo runtime. Nenhum valor de balanceamento mudou. Isto é um avanço parcial do item “fonte única”: os módulos `src/game` e `src/engine` ainda pertencem a um scaffold com mecânicas diferentes e não foram mesclados ao runtime ativo.

**Estimativa local Brotli.** `scripts/check-brotli.mjs` calcula, em qualidade q5, tamanhos raw/gzip/Brotli dos arquivos textuais de `dist/`; o build e `pnpm brotli` executam a medição. Não é um gate de tamanho nem prova que o host/CDN entrega Brotli: headers e bytes de produção, além de Lighthouse, ainda requerem URL publicada.

## Validação

`CHROMIUM_PATH=/usr/bin/chromium pnpm verify` passou: typecheck; **90 testes em 16 arquivos**; build e budgets; smoke; e E2E Chromium. O smoke confirmou **41 arquivos estáticos** e **7,12 MiB** no pacote inspecionado. O E2E validou a ordem dos cinco arquivos de áudio, o funcionamento offline após aquecimento do cache, os valores compartilhados de configuração e os fluxos anteriores.

A medição local encontrou **15 assets textuais**, totalizando **1,04 MiB raw**, **0,28 MiB gzip** e **0,26 MiB Brotli q5** — redução estimada de **74,9%** sobre os bytes raw desses textos. Os maiores arquivos textuais incluem o bundle JS (853.258 B raw; 200.890 B Brotli), `script.js` (132.401 B; 43.440 B) e o CSS (58.589 B; 11.488 B). Isso não representa a resposta do deploy.

O Vite ainda emitiu o aviso já presente sobre `assets/dados/manifesto.js` não ser incorporado ao bundle por não ser `type="module"`; a build, o smoke e o E2E passaram, e o recurso continua sendo entregue como arquivo separado.

## Estado do backlog

A separação da trilha foi concluída e testada; a contagem passa de **10/20 para 11/20**. A centralização de regras avançou, mas fica **parcial** até definir a relação com o scaffold alternativo de `src/game`/`src/engine`. O componente local de medição Brotli também foi adicionado, mas o item de entrega continua **pendente** até validar `Content-Encoding` e Lighthouse em URL pública.

Continuam pendentes: completar a fonte única de verdade; dividir o bundle inicial; decidir/implementar gamepad no runtime publicado ou remover o módulo órfão; versionar e migrar saves; incorporar luzes/antialias ao orçamento adaptativo; medir em PC e celular reais; atingir alvos de toque próximos a 44 px e testar orientações; verificar Brotli/Lighthouse pós-deploy; e comprimir `anarco.mdl`/`cachos.mdl` após comparação visual e geométrica.
