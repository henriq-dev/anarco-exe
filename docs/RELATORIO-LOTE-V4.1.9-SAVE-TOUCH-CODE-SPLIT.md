# v4.1.9 — migração de saves, alvos touch e code splitting

## O que mudou

### Saves ativos versionados

`src/anarco-save-migration.ts` introduz o envelope `anarco_save_v1` (schema 1) para as chaves persistentes usadas pelo runtime publicado. No primeiro boot, os valores antigos são copiados para o envelope sem apagar nem renomear as chaves legadas. O runtime e a preferência de qualidade FX passam pelo adaptador; gravações e remoções continuam espelhadas para as chaves antigas, mantendo compatibilidade com builds anteriores e rollback. O migrador tolera JSON corrompido, quota/storage bloqueado e não sobrescreve um envelope de versão futura desconhecida. Cinco testes cobrem migração, round-trip, compatibilidade, corrupção e indisponibilidade de storage. O projeto mantém alguns campos em chaves por recurso — esta release versiona e migra o conjunto atual, mas não muda tudo para o `SaveStore` do scaffold alternativo.

### Loader de chefes separado do bundle inicial

`GLTFLoader` e `MeshoptDecoder` agora ficam em `src/anarco-boss-loader.ts`, importado dinamicamente na primeira solicitação de GLB de chefe. O E2E confirma que o chunk não é requisitado no menu e que é requisitado ao carregar o primeiro chefe; as verificações existentes continuam confirmando Meshopt, rig, animação e pré-carregamento sequencial dos GLBs.

Na candidata anterior, o entry tinha 853.258 B raw e cerca de 219,98 kB gzip. A v4.1.9 gera um entry de 785.110 B e 200,79 kB gzip: redução aproximada de 68,1 kB raw / 19,2 kB gzip (**8,0% raw, 8,7% gzip**). O chunk adiado tem 70.788 B raw / 20,58 kB gzip; ele só é buscado ao carregar um chefe. Bloom e módulos de pós-processamento ainda fazem parte do grafo inicial; o item de divisão de bundle continua parcial.

### Alvos touch

Em `pointer: coarse`, habilidades, seletor de rota, pausa e áudio agora têm dimensão mínima de 44px, incluindo overrides compactos em paisagem e de HUD. O E2E testa ambos os conjuntos em Chromium emulado (390×844 retrato e 844×390 paisagem) e verifica que não aparece rolagem horizontal. Não é validação em aparelho físico nem substitui testes em diferentes sistemas/browser.

## Validação

`CHROMIUM_PATH=/usr/bin/chromium pnpm verify` passou na v4.1.9: typecheck, **95 testes em 17 arquivos**, build com budgets e relatório Brotli, smoke e E2E. O smoke encontrou **42 arquivos estáticos** e **7,12 MiB** no pacote. O E2E passou nos novos testes de migração, adiamento do chunk e dimensões touch, além dos fluxos anteriores.

O build continua emitindo o aviso Vite de `assets/dados/manifesto.js` sem `type="module"`; não impediu build, smoke ou E2E e o arquivo permanece servido à parte.

## Backlog após o lote

O contador informado passa de **11/20 para 13/20** ao concluir versionamento/migração de saves e alvos touch com teste de orientação. O split de bundle está parcialmente resolvido: loader GLTF/Meshopt foi diferido, Bloom ainda não. A configuração de gameplay compartilhada entre runtime e testes e a leitura local Brotli também são avanços parciais dos itens correspondentes.

Ainda faltam: completar a fonte única integrando ou eliminando a arquitetura alternativa em `src/game`/`src/engine`; dividir o Bloom do bundle inicial; decidir/integrar gamepad no runtime publicado (a implementação atual é de outro scaffold e não é plug-and-play); incluir antialias — além do limite de luzes já ajustado por preset FX — no orçamento adaptativo de qualidade; medir em PC e celular físicos; validar Brotli efetivo e Lighthouse após deploy; e avaliar compressão dos `.mdl`. A auditoria mostrou que `anarco.mdl` e `cachos.mdl` são buffers binários customizados, não GLB. Não alterá-los com scripts de GLB: prefira primeiro content-encoding no host e testes de integridade/visual antes de qualquer formato novo ou perda geométrica.

A validação de acessibilidade com NVDA, VoiceOver ou TalkBack também permanece pendente.
