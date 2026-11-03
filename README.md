# ANARCO.EXE 3D — Breach Protocol (v4.2.0)

Jogo 3D de infiltração cyberpunk. O jogo roda no `script.js` (JavaScript clássico, com comentários **ÂNCORA**); o TypeScript fica nos módulos de entrada, efeitos, configuração e ferramentas.

## v4.2.0 — gamepad e Bloom sob demanda

O runtime publicado agora detecta gamepads de mapeamento `standard`, sem exigir controle conectado e preservando teclado/touch. Analógico esquerdo move; A confirma/usa BREACH; B volta ou pausa/retoma; Start pausa/retoma; X ativa EMP; Y ativa VÍRUS; LB esquiva; RB ativa o nó VANTA; L3 corre. O D-pad navega os diálogos e insere as direções do minigame BREACH. A validação E2E usa um controle simulado em Chromium, não é homologação em controle físico.

`EffectComposer`, `RenderPass`, `UnrealBloomPass` e `OutputPass` saíram do chunk inicial e são carregados sob demanda quando a qualidade efetiva é Alta. Qualidade Baixa/Média pode iniciar e jogar sem baixar o chunk de Bloom; em Alta, a cena é renderizada diretamente enquanto o chunk carrega e depois recebe Bloom. Se o chunk falhar, o jogo continua sem Bloom. A qualidade padrão e os presets não mudaram.

O antialias MSAA só pode ser escolhido na criação do contexto WebGL: Alta/Média preservam o comportamento anterior, baixa explícita inicia sem MSAA e dispositivos touch de alta densidade também ficam sem MSAA. **O MSAA não é desligado dinamicamente** quando a qualidade adaptativa rebaixa o preset; para essa economia durante a sessão seria necessário adotar um antialias pós-processado que possa ser habilitado/desabilitado sem recriar o contexto.

## v4.1.9 — save, code splitting e controles touch

Um registro `anarco_save_v1` agora versiona os saves ativos. Na primeira abertura, copia sem apagar as chaves antigas; novas gravações são mantidas no envelope v1 e espelhadas para as chaves anteriores para compatibilidade/rollback. O runtime legado e as preferências FX usam o adaptador. O migrador lida com storage bloqueado em memória e não sobrescreve um envelope de versão futura desconhecida.

O GLTFLoader/Meshopt saiu do bundle inicial e foi para um chunk carregado sob demanda quando o primeiro modelo de chefe é pedido. Na v4.1.9 o entry tinha cerca de 785 KB raw/201 KB gzip; na v4.2.0 passou a aproximadamente 767 KB raw/197 KB gzip, e tanto o loader de chefe como o pipeline de Bloom são carregados apenas quando usados.

Em dispositivos com ponteiro touch, botões de habilidades, seletor de rota, pausa e áudio têm alvos de pelo menos 44px; o E2E valida retrato e paisagem sem rolagem horizontal em Chromium emulado. Isso não substitui testes com aparelhos físicos.

## v4.1.8 — áudio, regras e Brotli

Os quatro efeitos curtos são buscados e decodificados após a primeira interação. A trilha MP3 só é solicitada depois que a partida entra em `play`/`brief` e os efeitos curtos terminam; até a trilha ficar pronta, a música procedural serve de fallback. O E2E verifica essa ordem, o início da trilha e o funcionamento offline depois que os cinco arquivos foram armazenados.

Os níveis e multiplicadores das rotas usados pelo runtime ativo agora vêm de `src/anarco-gameplay-config.ts`, que os testes unitários também importam. Os valores de balanceamento não mudaram. Isso é um passo de centralização do runtime ativo; os módulos `src/game`/`src/engine` ainda descrevem uma arquitetura scaffold diferente e não foram fundidos nesta versão.

O build registra tamanhos locais gzip e Brotli (q5) dos assets textuais. É uma estimativa da build, não comprova `Content-Encoding` no CDN; a verificação de produção e o Lighthouse continuam dependendo de URL publicada.

## Hotfix v4.1.7 — fonte Special Elite

A v4.1.6 havia colocado ManusCC0 na pilha ativa, alterando a identidade monoespaçada da interface. A v4.1.7 restaura a pilha `"Special Elite", "Courier New", monospace` e inclui o arquivo real Special Elite em WOFF2, servido localmente e pré-carregado.

O arquivo veio do Google Fonts; licença Apache 2.0 e aviso de atribuição acompanham o asset em `public/fonts/`. O preload ManusCC0 foi substituído pelo preload da fonte correta; o `modulepreload` do script continua ativo.

## v4.1.6 — resize pausado e entrega

Um redimensionamento no menu ou na pausa agora coalesce eventos e desenha um único quadro WebGL, preservando a cena após girar o celular ou alterar a janela. O E2E mede que não há quadros extras até a partida retomar.

O build aplica budgets por categoria e a CI os executa via `pnpm verify`: JS gzip ≤ 1,25 MiB; CSS gzip ≤ 0,50 MiB; fontes ≤ 0,25 MiB; áudio ≤ 3,25 MiB; modelos ≤ 3,25 MiB; imagens ≤ 0,75 MiB; outros ≤ 0,50 MiB; transferência total ≤ 8 MiB. Fontes e arquivos binários são medidos como enviados; textos são medidos em gzip.

O `vercel.json` revalida HTML, não armazena o Service Worker, usa cache curto para assets de nome estável e `immutable` por um ano só nos bundles/imagens hashados. A v4.1.6 deixou o `modulepreload` da entrada JavaScript e o preload de fonte, mas ativou ManusCC0 por engano; a v4.1.7 substitui a fonte pelo arquivo Special Elite real e licenciado.

O primeiro clique em **Invadir** abre o terminal narrativo; a partida só entra em `play` quando esse terminal é fechado por clique ou tecla, conforme a introdução termina. Um teste que espere `play` logo após o primeiro clique precisa também descartar o terminal.

O relatório da v4.1.5 também foi corrigido: render em menu/pausa é o item global **8** (não 7). O split inicial do loader/Bloom e a integração de gamepad no runtime publicado estão concluídos. A contagem operacional fica em **15/20 concluídos**; fonte única da arquitetura e antialias adaptativo continuam parciais. Medição em hardware real, leitor de tela físico, Lighthouse/Brotli de produção e compressão HTTP dos modelos `.mdl` continuam pendentes.

## Hotfix v4.1.5 — foco seguro e render em pausa

Ao iniciar ou retomar, o foco vai para o canvas neutro, não para o botão Pausar; assim, pressionar Enter não pausa a partida por ativar acidentalmente esse botão. O canvas tem nome acessível e indicador de foco visível. O anúncio do objetivo evita duplicar o ponto quando o nome da torre já termina em pontuação.

As chamadas WebGL de render são suspensas nos estados de menu e pausa e retomadas na partida. O callback de `requestAnimationFrame` continua agendado para a lógica existente; portanto, este hotfix interrompe o render da cena 3D, não é uma suspensão completa do loop de CPU.

Os testes de acessibilidade cobrem semântica e fluxo de foco de forma automatizada. Ainda não houve validação com leitores de tela reais como NVDA, VoiceOver ou TalkBack.

## Lote v4.1.4 — minimapa, HUD e acessibilidade

O minimapa redesenha no máximo a cada 100 ms durante a partida e a cada 500 ms fora dela, refrescando imediatamente quando o estado muda e congelando com a pausa. O limite efetivo depende da taxa de quadros do aparelho; a medição em Chromium headless não representa FPS de GPU física.

Os rótulos discretos do HUD agora só alteram o DOM quando o valor realmente muda. A distância visual do objetivo continua atualizada, enquanto um anúncio acessível separado é emitido apenas quando muda o alvo/estado, evitando anúncios por metro.

Menu, pausa, vazamentos, ranking e terminal introdutório passaram a ter nomes de diálogo, foco inicial e retorno, contenção de Tab, Escape nas listas e conteúdo de fundo inerte. Os painéis de vazamentos/ranking ficam acima do menu. Dados persistidos nessas listas são montados como texto seguro, não como HTML.

## Rodar no computador

```bash
pnpm install
pnpm dev          # http://localhost:3000 (ou a porta que o Vite mostrar)
pnpm test         # 17 arquivos / 95 testes
pnpm build        # gera dist/ (typecheck + Vite + assets + budgets por categoria)
pnpm smoke        # depois do build: confere os arquivos e modelos da dist/
pnpm e2e          # gameplay, modelos, áudio/offline, desktop e celular (Chromium)
pnpm verify       # typecheck, testes, build, smoke e E2E em sequência
pnpm perf         # depois do build: benchmark SwiftShader e salva JSON em docs/performance/
```

`pnpm perf` mede draw calls com skyline visível/oculta e perfis desktop/touch emulados. SwiftShader é renderização WebGL por software, não FPS de GPU física. Para medir seu PC ou telefone, abra a partida com `?perf=1`, toque em **CAPTURAR 30 s** e depois em **BAIXAR JSON**; a captura fica no dispositivo e não envia telemetria.

Opcional: `pnpm compress:bosses` repete a compressão dos três GLBs dos chefes. O pipeline usa glTF Transform/Meshopt, preserva e valida rigs/animações e não substitui os arquivos se a checagem falhar.

`pnpm build` gera a build de produção em `dist/`. Para abri-la: `python3 -m http.server 4173 --directory dist` e acessar `http://localhost:4173`.
Não abra o `index.html` da raiz com duplo clique nem com Live Server: ele é o código-fonte (chama `src/anarco-entry.ts`, TypeScript) e só funciona via `pnpm dev` ou depois do `pnpm build` (use a pasta `dist/`).

No Windows (PowerShell), se o `npm` reclamar de scripts desabilitados: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. É preciso ter o Node.js LTS (nodejs.org) e depois `npm install -g pnpm`.

## Subir no GitHub e publicar na Vercel

1. Crie uma branch de backup do repositório atual (ex.: `backup-v3.4`).
2. Na `main`, troque os arquivos pelos deste pacote (não mexa na pasta `.git`) e faça commit + push.
3. Na Vercel (Settings → Build & Development):
   - Framework Preset: **Vite**
   - Build Command: `pnpm build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`
4. Plano B: rode `pnpm build` no seu computador e publique só a pasta `dist/`.

Os assets do jogo estão incluídos no projeto. Os três modelos de chefes usam texturas WebP e geometria Meshopt; o `assets.lock.json` referencia as cópias verificadas do CDN para restaurar os arquivos binários.

## Controles

WASD/setas movem · Shift corre · Espaço = BREACH · E = EMP · Q = VÍRUS · R = NÓ FANTASMA (VANTA) · C = ESQUIVA · Esc pausa.

## Upgrade v4.0.0 — Vigilância Total

A torre Vigilância Total Corp. agora tem blindagem modular, antena de datacenter e placa identificadora. Ao entrar no raio de hack, um uplink ciano contextual mostra conexão, extração, autenticação root e comprometimento; o fluxo de partículas acompanha o progresso e glitcha em magenta quando a sequência falha. Em telas touch, a interface compacta fica acima do minigame sem bloquear os controles. A chuva de códigos do BREACH fica ativa por padrão no desktop, inclusive com movimento reduzido; no menu, escolha Ativa, Automática ou Desativada.

A abertura apresenta CAPUZ e a operação BREACH em uma sequência cinematográfica, com arte ASCII original ampliada `ANARCO.EXE // CAPUZ`, digitação acelerada, bip de inicialização e cliques retro de teclado. A habilidade exclusiva NÓ FANTASMA toca um erro curto se tentada com outro operador. Os sons são discretos e respeitam o botão Mudo.

## Otimizações de desempenho e carregamento

Os três GLBs dos chefes foram reduzidos de 6,09 MB para 1,69 MB (−72,2%), preservando os rigs e animações. O Banqueiro é pré-carregado na fase anterior ao chefe e, depois, só o próximo modelo fica em preparo. A qualidade gráfica desce mais cedo em janelas de desempenho lento e o DPR em telas touch fica limitado a 1,25.

O notebook 3D só é buscado no primeiro hack; se falhar, o placeholder de caixas permanece e a partida continua. Os cinco MP3 só começam a baixar depois de Invadir/Tutorial e, se Mudo estiver ativo, aguardam o desmute. Service worker armazena os assets grandes na primeira utilização online; shell, modelos e áudio já usados permanecem disponíveis offline. Se um asset ainda não tiver sido usado, o jogo mantém o fallback local.

## Otimizações difíceis v4.1.0

A skyline foi reorganizada em oito setores com geometria estática mesclada por material; no benchmark controlado, o delta visível/oculto caiu de 30 para 13 chamadas medianas e de 40 para 11 no p95. O loop reutiliza o estado enviado ao FX e evita vetores transitórios para partículas. A limpeza removeu apenas três arquivos sem importadores; Rapier foi mantido para desenvolvimento/testes. O coletor de frame time é carregado apenas em `?perf=1`.

A build final (`dist/`) tem 7,05 MiB; os 83 testes, smoke e E2E em Chromium passaram. O perfil de CPU e touch foi executado no sandbox com SwiftShader, não em GPU/telefone físico; consulte as limitações e arquivos JSON no [relatório v4.1.0](docs/RELATORIO-OTIMIZACOES-DIFICIL-V4.1.0.md).

## Documentação
- `docs/RELATORIO-MESCLA-V4.1.1.md` — mescla da v4.1.0 com a nossa v4.0.1 (menu, painéis, correções).
- `docs/RELATORIO-OTIMIZACOES-DIFICIL-V4.1.0.md` — checklist, metodologia, limitações e resultados antes/depois.
- `docs/STATUS-OTIMIZACOES-V4.2.0.md` — pendências ordenadas por dificuldade, auditoria da arquitetura scaffold e medição sem perdas dos modelos `.mdl`.
- `docs/performance/` — JSON bruto do baseline e do pós-otimização em SwiftShader.
- `docs/RELATORIO-UPGRADE-V4.0.0-VIGILANCIA-TOTAL.md` — relatório v4.0.0 e checklist histórica atualizada.
- `docs/RELATORIO-historico-A-a-P.md` — relatórios anteriores (itens A a P, mais o item Q da mescla v3.9).
- `docs/relatorios-v3.6-a-v3.8/` — relatórios e evidências da linha v3.6 → v3.8.
- `docs/capturas/` — capturas da interface e da introdução.
