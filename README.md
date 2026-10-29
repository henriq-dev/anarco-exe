# ANARCO.EXE 3D — Breach Protocol (v3.9)

Jogo 3D de infiltração cyberpunk. O jogo roda no `script.js` (JavaScript clássico, com comentários **ÂNCORA**);
o TypeScript fica só no módulo de efeitos (`src/anarco-fx.ts`) e no carregador (`src/anarco-entry.ts`).

## Rodar no computador
```bash
pnpm install
pnpm dev          # http://localhost:3000 (ou a porta que o Vite mostrar)
pnpm test         # 12 arquivos / 79 testes
pnpm build        # gera a pasta dist/ (typecheck + vite + cópia dos assets + limites de tamanho)
pnpm smoke        # depois do build: confere os arquivos da dist/
```
Para ver o build pronto: `python3 -m http.server 4173 --directory dist` e abrir `http://localhost:4173`.
Não abra o `index.html` com duplo clique (precisa de servidor).

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

## Documentação
- `docs/RELATORIO-historico-A-a-P.md` — nossos relatórios (itens A a P, mais o item Q da mescla v3.9).
- `docs/relatorios-v3.6-a-v3.8/` — relatórios e evidências da linha v3.6 → v3.8.
- `docs/capturas/` — capturas da v3.9.
