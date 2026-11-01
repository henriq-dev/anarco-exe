# ANARCO.EXE 3D — Breach Protocol (v4.1.1)

Jogo 3D de infiltração cyberpunk. O jogo roda no `script.js` (JavaScript clássico, com comentários **ÂNCORA**); o TypeScript fica no módulo de efeitos (`src/anarco-fx.ts`), no carregador (`src/anarco-entry.ts`) e no coletor de desempenho opt-in (`src/anarco-perf.ts`).

## Rodar no computador

```bash
pnpm install
pnpm dev          # http://localhost:3000 (ou a porta que o Vite mostrar)
pnpm test         # 13 arquivos / 83 testes
pnpm build        # gera dist/ (typecheck + Vite + assets + limite de tamanho)
pnpm smoke        # depois do build: confere os arquivos e modelos da dist/
pnpm e2e          # gameplay, modelos, áudio/offline, desktop e celular (Chromium)
pnpm perf         # depois do build: benchmark SwiftShader e salva JSON em docs/performance/
```

`pnpm perf` mede draw calls com skyline visível/oculta e perfis desktop/touch emulados. SwiftShader é renderização WebGL por software, não FPS de GPU física. Para medir seu PC ou telefone, abra a partida com `?perf=1`, toque em **CAPTURAR 30 s** e depois em **BAIXAR JSON**; a captura fica no dispositivo e não envia telemetria.

Opcional: `pnpm compress:bosses` repete a compressão dos três GLBs dos chefes. O pipeline usa glTF Transform/Meshopt, preserva e valida rigs/animações e não substitui os arquivos se a checagem falhar.

Este pacote inclui o projeto editável e uma build pronta em `dist/`. Para abrir a build: `python3 -m http.server 4173 --directory dist` e acessar `http://localhost:4173`.
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
- `docs/performance/` — JSON bruto do baseline e do pós-otimização em SwiftShader.
- `docs/RELATORIO-UPGRADE-V4.0.0-VIGILANCIA-TOTAL.md` — relatório v4.0.0 e checklist histórica atualizada.
- `docs/RELATORIO-historico-A-a-P.md` — relatórios anteriores (itens A a P, mais o item Q da mescla v3.9).
- `docs/relatorios-v3.6-a-v3.8/` — relatórios e evidências da linha v3.6 → v3.8.
- `docs/capturas/` — capturas da interface e da introdução.
