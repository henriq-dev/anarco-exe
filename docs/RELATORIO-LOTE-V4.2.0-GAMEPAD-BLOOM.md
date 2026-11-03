# ANARCO.EXE v4.2.0 — gamepad, Bloom sob demanda e política de MSAA

## Resumo

Este lote conclui duas pendências implementáveis da lista: o split do pipeline Bloom do bundle inicial e suporte básico a gamepad no runtime publicado. Também alinha o MSAA com a preferência explícita de qualidade Baixa no boot, sem afirmar que ele pode ser adaptado no meio de uma sessão.

## Mudanças

### Bloom separado do bundle inicial

`src/anarco-postprocessing.ts` contém as importações de `EffectComposer`, `RenderPass`, `UnrealBloomPass` e `OutputPass`; `src/anarco-fx.ts` importa o módulo dinamicamente apenas quando a qualidade efetiva requer Bloom (Alta). `src/anarco-entry.ts` deixou de importar e exportar esses módulos no boot. Enquanto o chunk chega, a cena é desenhada sem composer; depois de carregar, cria-se o composer e solicita-se um quadro extra para que menus/pausa também atualizem. Se a importação falhar, o render direto continua e não há repetição do pedido por quadro. Se a qualidade cair enquanto a importação está pendente, os módulos ficam disponíveis, mas o composer só é criado quando Alta voltar a ser efetiva.

Medida da build: entry **767.160 B raw / 196,84 kB gzip**. Bloom foi emitido em chunk independente de **18.916 B raw / 4,55 kB gzip** e o carregador GLTF/Meshopt continua em chunk próprio (**70.789 B raw / 20,61 kB gzip**). E2E demonstra ausência da solicitação Bloom no menu com qualidade Média e uma única solicitação quando muda para Alta, seguida de criação do composer. Ao voltar para Média, o composer é descartado e o caminho de render direto continua ativo.

O padrão de qualidade Alta em dispositivos com mais de quatro núcleos continua sendo respeitado; assim, esses dispositivos solicitam o chunk após a primeira renderização que pede Bloom. O split adia código para Baixa/Média, mas não pretende impedir o download em usuários cuja qualidade selecionada é Alta.

### Gamepad no runtime publicado

O loop detecta `navigator.getGamepads` por feature detection e usa o primeiro controle conectado com `mapping === 'standard'`. Sem API, controle conectado ou mapeamento padrão, teclado e toque continuam funcionando. Analógico esquerdo move com deadzone, D-pad navega o foco de diálogos e fornece as direções do minigame, A confirma/aciona BREACH, B volta/retoma, Start pausa/retoma, X usa EMP, Y usa VÍRUS, LB esquiva, RB aciona NÓ VANTA e L3 segura corrida. Ações usam borda de pressionamento e não repetem enquanto o botão fica segurado. A navegação/ativação reutiliza o DOM e as funções já existentes.

O E2E usa um `navigator.getGamepads()` simulado em Chromium para testar foco de menu, confirmação do terminal, movimento analógico, acionamento único, pause/resume e conclusão de sequência do hack via D-pad. Isso valida o runtime e o mapeamento, mas não é compatibilidade certificada em um controle físico específico. Ainda é necessário teste manual com controles/browser reais.

### Antialias e adaptação gráfica

O MSAA é uma opção do contexto WebGL no instante em que o renderer é criado; o contexto atual não pode habilitá-lo ou desabilitá-lo depois. `script.js` agora desativa MSAA no início se há preferência salva explícita `Baixa`; a regra anterior para telas touch de alta densidade continua. Média/Alta em desktop preservam o comportamento anterior. A adaptação durante a partida continua reduzindo preset, efeitos e resolução; **ela não altera MSAA dinamicamente**. Para isso seria necessário substituir MSAA por um antialias pós-processado que permita ativação em tempo real, medir custo e validar aparência. Portanto, o item de orçamento adaptativo de luzes/antialias fica parcialmente atendido, não concluído.

## Verificação

`CHROMIUM_PATH=/usr/bin/chromium pnpm verify` passou para v4.2.0:

- Typecheck sem erros.
- **95 testes em 17 arquivos**.
- Build com budgets: JavaScript gzip de pacote 0,26 MB/1,25 MB; transferência estimada 6,36 MB/8 MB.
- Smoke: 43 arquivos estáticos, 7,13 MiB.
- E2E passou nos novos casos de gamepad, Bloom sob demanda e MSAA de startup, mais os fluxos existentes de save, fases, áudio, modelos, touch e offline.

O Vite mantém um aviso não fatal sobre `assets/dados/manifesto.js` sem `type="module"`; build, smoke e E2E passaram. Nenhum deploy foi feito.

## Estado restante

A contagem operacional passa de **13/20 para 15/20 itens concluídos**. Permanecem pendentes ou parciais:

1. Integrar a configuração central de gameplay também ao scaffold alternativo ou aposentar essa arquitetura deliberadamente; níveis/rotas do runtime ativo e testes já compartilham uma fonte.
2. Incluir antialias que possa ser alterado em runtime no orçamento adaptativo; a preferência Baixa agora pode optar por não criar MSAA no boot, mas a adaptação não consegue mudar o contexto existente.
3. Validar em um PC/celular físicos e com um gamepad real.
4. Conferir Brotli efetivo e Lighthouse após publicar em um host; o relatório local de compressão não representa os headers de produção.
5. Avaliar compressão dos modelos `anarco.mdl` e `cachos.mdl` no host. São formatos binários customizados; não se deve aplicar pipeline GLB nem alterar esses bytes sem projeto de formato/versionamento, testes de integridade e revisão visual.

Teste manual de acessibilidade com leitores de tela reais também continua pendente, fora do contador principal.
