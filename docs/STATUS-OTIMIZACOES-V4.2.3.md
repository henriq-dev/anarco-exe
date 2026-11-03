# Status das pendências — ANARCO.EXE v4.2.3

## Decisões e verificações concluídas

**Item 3 — scaffold `src/game` e `src/engine`: mantido isolado.** A campanha cyberpunk publicada roda no `script.js`; o scaffold alternativo implementa outro jogo, de plataforma com ilhas procedurais, física e progressão próprias. Os módulos e seus testes continuam úteis para esse protótipo. Integrá-los seria substituir ou reescrever uma arquitetura diferente, não centralizar regras duplicadas. A ponte de ajuste FX em `src/game/tuning.ts` continua disponível somente no modo de desenvolvimento. Não apagar nem fundir esses módulos nesta revisão; se o protótipo for aposentado no futuro, migrar primeiro essa ponte e então remover sua suíte em lote.

**Item 6 — compressão HTTP dos `.mdl`: verificada no domínio publicado.** Em 2026-11-03, `https://anarcoexe.vercel.app` respondeu aos três modelos com `Content-Encoding: br` quando o cliente anunciou Brotli. Descomprimir os corpos produziu exatamente os hashes-fonte da v4.2.2, e a solicitação `Accept-Encoding: identity` devolveu os bytes originais. Nos dois modelos de skin, a transferência medida caiu de 995.736 B para 816.139 B (179.597 B; 18,0%); incluindo o notebook, caiu de 1.223.376 B para 990.545 B (232.831 B; 19,0%). A verificação é repetível com `pnpm verify:production-models -- https://anarcoexe.vercel.app` depois de publicar esta cópia. Não adicionamos sidecars ou mudamos o formato: o host já entrega a representação comprimida e a resposta mantém o conteúdo binário esperado pelo runtime. O relatório de entrega registra se `Vary: Accept-Encoding` é exposto.

A documentação atual da Vercel descreve compressão negociada pelo CDN e uma allowlist de MIME types que não menciona `application/octet-stream` [1]. A equipe Vercel já recomendou em sua comunidade rewrites condicionais para sidecars `.br`, com `Content-Encoding` apenas no destino comprimido e `Vary: Accept-Encoding` [2]. A observação direta no domínio é evidência do comportamento atual daquele deploy, não uma garantia para um novo deploy. Por isso, execute o script de verificação novamente após publicar esta versão.

## Bloqueios que exigem acesso externo ou hardware

**Item 7 — medições em PC, celular e controle físicos: pendente.** E2E e emulação não equivalem a GPU, touch e gamepad reais. Após o deploy, abra a página com `?perf=1`, capture 30 segundos e baixe um JSON no PC e no telefone. Teste também o controle físico padrão e guarde modelo do aparelho, sistema, navegador, resolução/DPR, perfil gráfico e os JSONs. O painel é opt-in e não envia telemetria automaticamente. O procedimento detalhado está em `TESTE-REAL-HARDWARE-E-ACESSIBILIDADE-V4.2.3.md`.

**Item 8 — Lighthouse da release em produção: pendente para esta cópia.** O domínio já existe e respondeu em Chromium, mas o código publicado não foi identificado como esta árvore local: o hash do entry JavaScript observado no domínio difere do build local. Também não há CLI Vercel autenticada nem remoto Git nesta área de trabalho, e o conector Vercel da sessão está desabilitado. Assim, não foi feito deploy nem se apresenta o Lighthouse do deploy existente como resultado da v4.2.3. É necessário habilitar o acesso ao projeto Vercel, publicar a versão e então rodar Lighthouse e a checagem Brotli acima.

**Item 9 — leitores de tela físicos: pendente.** A suíte verifica nomes, papéis, foco e alguns anúncios, mas não substitui NVDA, VoiceOver ou TalkBack reais. Seguir o roteiro manual anexo em cada plataforma disponível e registrar navegador, leitor/voz e problemas encontrados.

## Referências

[1]: https://vercel.com/docs/how-vercel-cdn-works/compression "Vercel CDN Compression"
[2]: https://community.vercel.com/t/breaking-change-pre-compressed-assets-re-compressed-at-the-edge/18744 "Vercel Community sobre entrega de sidecars Brotli"
