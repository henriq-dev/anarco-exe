# Estado das otimizações — ANARCO.EXE v4.2.0

## Validação desta revisão

Typecheck, 95 testes unitários, build, budgets de tamanho e smoke passaram. A primeira execução de `pnpm verify` parou apenas no E2E porque o Chromium empacotado pelo Playwright não estava instalado. Repeti o E2E com `CHROMIUM_PATH=/usr/bin/chromium pnpm e2e`; todos os cenários passaram, incluindo controles, seis fases, bosses, áudio/offline, foco, render, saves e layouts touch. Assim, os componentes da verificação passaram, mas o comando literal `pnpm verify` não concluiu sem essa variável de ambiente neste sandbox.

## Resultado desta continuação

A inspeção confirmou que a configuração `src/anarco-gameplay-config.ts` é a fonte de níveis e rotas do runtime cyberpunk ativo e dos testes correspondentes. `src/game/` e `src/engine/` formam um scaffold separado de plataforma procedural em ilhas, usado por seus próprios testes e ferramentas de prototipagem. Não contêm uma cópia equivalente das regras de infiltração. Fundir essas arquiteturas agora exigiria substituir ou reescrever um sistema distinto, não apenas remover duplicação; para preservar compatibilidade, ficam isolados e documentados como scaffold.

Os dois modelos `.mdl` foram medidos com Brotli q5, sem alterar os arquivos de origem. `anarco.mdl` passou de 524.577 para 356.631 bytes (−32,0%) e `cachos.mdl` de 471.159 para 353.426 bytes (−25,0%). O conjunto passaria de 995.736 para 710.057 bytes, economizando 285.679 bytes (−28,7%). A descompressão local e a resposta HTTP de teste com `Content-Encoding: br` devolveram bytes idênticos aos originais. SHA-256 originais: `dbf2ce518b241438f095da818e9704ff5f51436ca5e935006575a8031786bdeb` e `3d2ee27300bfe286d4ee967df94cec3c9dc6aeb23d90f480e3ddf014ba204a8b`.

Os `.mdl` são servidos como dados binários. A documentação do Vercel informa que a compressão automática cobre uma lista específica de MIME types; tipos genéricos usados por esse formato não aparecem nela. A plataforma negocia compressão via `Accept-Encoding`, mas isso não comprova que os modelos sejam comprimidos automaticamente [1]. A equipe do Vercel descreveu uma alternativa com sidecars `.br`, rewrites condicionais e `Content-Encoding` [2]. Como ainda não há preview/deploy deste projeto para testar headers, negociação, cache e compatibilidade entre navegadores, esta versão não troca URLs nem adiciona sidecars ou regras de rewrite.

## Pendências operacionais, da mais difícil à mais fácil

1. **Unificação da arquitetura — muito difícil.** A fonte de verdade das regras do jogo ativo já está centralizada. A parte restante é decidir se o scaffold de ilhas será mantido como protótipo isolado ou removido/substituído. Não existe uma fusão mecânica segura que mantenha os dois jogos e os testes atuais sem definir previamente esse escopo.
2. **Antialiasing dinâmico — difícil.** O MSAA é uma configuração fixa do contexto WebGL. A alternativa é um passe pós-processado como FXAA, com fallback para renderização atual e medição de custo/qualidade em diferentes dispositivos. Não foi introduzido sem benchmark para evitar regressão de nitidez ou desempenho.
3. **Validação de desempenho em aparelhos reais — média, bloqueada por hardware.** Abrir o jogo com `?perf=1`, capturar 30 segundos em um PC e em um celular e guardar os JSONs permitirá comparar GPU, resolução e frame time reais. SwiftShader e emulação Chromium não substituem essas medições.
4. **Brotli e Lighthouse em produção — média, bloqueada por publicação.** Requer uma URL publicada para verificar `Content-Encoding`, cache e execução do Lighthouse. A estimativa Brotli do build não é evidência de resposta do CDN.
5. **Entrega comprimida dos `.mdl` — média.** A compressão sem perdas foi validada localmente e os ganhos são mensuráveis. Falta aplicar uma estratégia de entrega compatível com o host, validar os headers no preview e garantir fallback sem `br`; só então a troca deve ser promovida.

**Acessibilidade manual:** leitores de tela reais (NVDA, VoiceOver e TalkBack) ainda não foram verificados. A semântica e o fluxo de foco passaram por verificações automatizadas, mas isso não substitui a avaliação manual assistiva.

## Referências

[1]: https://vercel.com/docs/how-vercel-cdn-works/compression "Vercel CDN Compression"
[2]: https://vercel.com/community/t/breaking-change-pre-compressed-assets-re-compressed-at-the-edge/18744 "Discussão Vercel sobre assets pré-comprimidos e rewrites"
