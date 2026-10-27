# Atualização standalone do ANARCO.EXE

Esta pasta foi preparada para substituir manualmente o conteúdo do repositório que publica `https://anarcoexe.vercel.app/`.

## Como substituir

1. Faça backup da pasta atual ou crie uma branch no GitHub.
2. Copie o conteúdo desta pasta para a raiz do repositório.
3. Substitua os arquivos existentes quando solicitado.
4. Confirme que `index.html`, `script.js`, `style.css` e `assets/` ficaram na raiz.
5. Faça commit e push para a branch usada pela Vercel, normalmente `main`.
6. Aguarde o novo deploy e abra `https://anarcoexe.vercel.app/`.

Não abra `index.html` por duplo clique. Para testar localmente, use um servidor:

```bash
python -m http.server 8080
```

Depois acesse `http://localhost:8080`.

## Arquivos novos importantes

- `assets/models/boss-banqueiro-animated.glb`
- `assets/models/boss-petroleo-rigged.glb`
- `assets/models/boss-ceo-rigged.glb`
- `assets/lib/three.module.js`
- `assets/lib/GLTFLoader.js`
- `assets/img/favicon.png`

A versão mantém o jogo offline e não exige Node.js, Vite ou instalação de dependências no repositório publicado.

## v2.2 — chefões animados
O Barão do Petróleo e o CEO MEGACORP não tinham animação gravada. Agora eles usam o "idle" (respiração) do Diretor-Banqueiro, que tem o mesmo esqueleto. A mudança está em `spawnBoss()` no `script.js` (procure por `bossIdleCache`). Só as rotações dos ossos são copiadas.
