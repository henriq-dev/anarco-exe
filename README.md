# ANARCO.EXE 3D — Breach Protocol (v4.0.0)

Jogo 3D de infiltração cyberpunk. O jogo roda no `script.js` (JavaScript clássico, com comentários **ÂNCORA**);
o TypeScript fica só no módulo de efeitos (`src/anarco-fx.ts`) e no carregador (`src/anarco-entry.ts`).

## Rodar no computador
```bash
pnpm install
pnpm dev          # http://localhost:3000 (ou a porta que o Vite mostrar)
pnpm test         # 12 arquivos / 79 testes
pnpm build        # gera a pasta dist/ (typecheck + vite + cópia dos assets + limites de tamanho)
pnpm smoke        # depois do build: confere os arquivos da dist/
pnpm e2e           # fluxos desktop, celular, torres e estados de hack (Chromium)
```
Este pacote inclui o projeto editável e uma build pronta em `dist/`. Para abrir a build: `python3 -m http.server 4173 --directory dist` e acessar `http://localhost:4173`.
Não abra o `index.html` da raiz com duplo clique nem com o Live Server: ele é o código-fonte (chama `src/anarco-entry.ts`, TypeScript) e só funciona via `pnpm dev` ou depois do `pnpm build` (use a pasta `dist/`).

No Windows (PowerShell), se o `npm` reclamar de scripts desabilitados: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`. É preciso ter o Node.js LTS (nodejs.org) e depois `npm install -g pnpm`.

## Subir no GitHub e publicar na Vercel
1. Crie a branch de backup do repositório atual (ex.: `backup-v3.4`).
2. Na `main`, troque os arquivos pelos deste pacote (não mexa na pasta `.git`) e faça commit + push.
3. Na Vercel (Settings → Build & Development):
   - Framework Preset: **Vite**
   - Build Command: `pnpm build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`
4. Plano B: rode `pnpm build` no seu computador e publique só a pasta `dist/`.

Os assets (skins e modelos dos chefões, ~18 MB) estão **dentro do repositório**; o build não depende de nenhum serviço externo.

## Controles
WASD/setas movem · Shift corre · Espaço = BREACH · E = EMP · Q = VÍRUS · R = NÓ FANTASMA (VANTA) · C = ESQUIVA · Esc pausa.

## Upgrade v4.0.0 — Vigilância Total
A torre Vigilância Total Corp. agora tem blindagem modular, antena de datacenter e placa identificadora. Ao entrar no raio de hack, um uplink ciano contextual mostra conexão, extração, autenticação root e comprometimento; o fluxo de partículas acompanha o progresso e glitcha em magenta quando a sequência falha. Em telas touch, a interface compacta fica acima do minigame sem bloquear os controles. A chuva de códigos do BREACH fica ativa por padrão no desktop, inclusive com movimento reduzido; no menu, escolha Ativa, Automática ou Desativada. O pacote inclui uma trilha cyberpunk instrumental e quatro efeitos originais (conexão, fluxo de dados, erro e acesso root), armazenados localmente e compatíveis com o mute e o funcionamento offline.

## Documentação
- `docs/RELATORIO-historico-A-a-P.md` — nossos relatórios (itens A a P, mais o item Q da mescla v3.9).
- `docs/relatorios-v3.6-a-v3.8/` — relatórios e evidências da linha v3.6 → v3.8.
- `docs/capturas/` — capturas da v3.9.
