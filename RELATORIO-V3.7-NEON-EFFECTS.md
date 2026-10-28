# ANARCO.EXE v3.7 — Relatório de Neon Effects & Advanced Combat FX

## Resumo

A v3.7 parte do ZIP incremental v3.6 enviado pelo usuário e acrescenta uma camada cosmética independente para efeitos de combate, identidade de fase e qualidade gráfica. O loop principal — infiltração, hacking, coleta, drones, chefões, progressão e controles — foi mantido no runtime legado. Os efeitos não participam do solver de colisão, dano, recompensa ou detecção.

Não foram gerados nem substituídos modelos de gameplay, personagens, skins ou áudio. Os GLB, buffers binários, skins e arquivos base continuam provenientes dos materiais enviados. A capa OG e a favicon são arte de sharing/identidade, não recursos de gameplay.

## Alterações implementadas

### Renderização e qualidade

- Novo `AnarcoFxSystem` em `src/anarco-fx.ts`, com partículas em pool `THREE.Points`/`BufferGeometry` e até 520 slots reutilizáveis.
- Perfil baixa: teto de 100 partículas, DPR 1, sem luzes temporárias nem bloom completo.
- Perfil média (padrão): teto de 280 partículas, DPR 1,35, até quatro luzes temporárias simultâneas e brilho seletivo leve.
- Perfil alta: teto de 520 partículas, DPR 2, até sete luzes temporárias, sombras e `EffectComposer`/`UnrealBloomPass`.
- Amostragem adaptativa a cada 90 frames de jogo: se mais de metade exceder 25 ms, rebaixa um nível de efeitos; se já estiver no menor nível, reduz a escala de resolução até 0,75.
- O menu guarda a preferência manual de qualidade. O perfil baixo não executa flashes de tela, e `prefers-reduced-motion` bloqueia efeitos de movimento.

### Combate, habilidades e resposta visual

- Partículas tipadas e gradientes próprios para EMP, VÍRUS, BREACH, esquiva, NÓ FANTASMA, colisões, coleta, metal/caixas, drones, efeitos industriais, códigos, documentos, petróleo e derrota de chefões.
- Rastros/duplicatas transparentes da VANTA e iluminação temporária reciclada por pool; não se criam luzes por ataque.
- Glitches breves para BREACH, EMP/VÍRUS, alerta, blecaute, hacking, eventos de chefão e colapso final, com limitações de duração/qualidade e suporte a movimento reduzido.
- Os gatilhos do `script.js` acrescentam feedback visual a eventos existentes, sem reescrever as regras das habilidades ou de combate.

### Identidade de fases e chefões

- Mantidas as assinaturas da sequência: Distrito Financeiro magenta/azul; Zona Industrial laranja, fumaça, poeira e brasas; Centro de Vigilância ciano/scanlines; Esconderijo Data verde/código/baixa luz; Subestação Elétrica azul intensa/flashes; Núcleo Megacorp rosa/roxo/bloom.
- Diretor-Banqueiro recebe documentos/selos e dados; Barão do Petróleo fumaça escura, brasas, ataques em laranja e distorção térmica breve; CEO MEGACORP cubos/grades de dados, glitch magenta, energia e colapso visual final.
- O feedback cosmético de colisão, ataques, entradas e derrotas é visual e não altera resultados ou tempos da simulação.

## Assets e distribuição

- Three.js e pós-processamento vêm das dependências locais; a experiência não depende de CDN externo para carregar código.
- Assets do usuário ficam sob `assets/` e são recuperáveis pelo lock do projeto; o build restaura os arquivos gerenciados e copia os assets para `dist/assets/`, mantendo a pasta de exportação independente de storage.
- Os arquivos `.bin` do personagem/notebook, não reconhecidos pelo sincronizador como imagem/modelo, continuam como buffers locais no código-fonte e também são copiados para `dist/`.
- `dist/` contém jogo estático, manifesto PWA, manifesto da rota única, loader próprio, favicon e OG cover. A exportação é apropriada para hosting estático, inclusive Vercel; o HTML do ZIP de Vercel aponta as prévias para o domínio Vercel existente no projeto.
- O runtime portátil `dist/script.js` é copiado diretamente do `script.js` v3.7 da raiz. A duplicata antiga `public/script.js` foi removida porque sombreava a fonte durante o Preview e podia distribuir runtime v3.6.
- Removido o registro de `sw.js`, que não existia e causava resposta HTML com MIME incorreto; o manifesto PWA continua no pacote.
- Build verificado: 36 arquivos estáticos, aproximadamente 18,69 MiB. Nenhuma publicação/deploy foi executada.

## Validações executadas

- `pnpm typecheck`: passou.
- `pnpm test`: 12 arquivos de teste, 79 testes passaram.
- `node --check script.js`, `node --check scripts/copy-game-assets.mjs` e `node --check scripts/smoke.mjs`: passaram.
- `pnpm build`: passou, incluindo restauração/cópia de assets e a etapa de sharing; o verificador mediu 0,24 MiB de JavaScript gzip, 1,00 MiB de fontes e 16,78 MiB de transferência.
- `pnpm smoke`: passou; confirma arquivos, assets locais e presença de marcadores v3.7 no runtime standalone, evitando retorno de script antigo, além da capa OG e manifesto da rota única.
- Preview HTTP de produção: 200 para `/`, `/script.js` (MIME JavaScript), manifesto de ícones/props, capa OG, buffer do personagem, skin e manifesto PWA.
- O favicon foi conferido também em 32×32 px.
- Playtest interativo Chromium em Preview de desenvolvimento e também em `dist/`: WebGL iniciou, o menu abriu, o contador avançou, o tutorial foi dispensado, movimento por seta alterou a posição do personagem, esquiva C respondeu, e os controles BREACH/EMP/VÍRUS foram acionados. Baixa, Média e Alta mudaram o estado e a indicação do FX para `FX · BAIXA/MÉDIA/ALTA`. Na exportação de produção não houve erros de console, exceções, requisições falhas ou respostas HTTP de erro. Captura de gameplay: `/home/ubuntu/Downloads/ANARCO.EXE-v3.7-playtest.png`.

## Limite de aceitação

A simulação executada usou Chromium headless com WebGL em software (SwiftShader), viewport 1280×720 e áudio silenciado, incluindo teclado; não equivale a validação em GPU física, touch/mobile, áudio audível ou benchmark em dispositivos reais. A composição visual completa, progressão até os chefões e desempenho em celulares continuam pendentes de aceite manual. O smoke é estático e a resposta HTTP confirma distribuição/arquivos, não substituindo essa execução interativa. A saída do Vite imprime um aviso informativo porque `assets/dados/manifesto.js` é intencionalmente um script global legado; o arquivo é servido localmente e está presente no build.

## Publicação

O checkpoint é interno ao WebDev. `publishing.auto_publish` estava desativado, portanto salvar/push do checkpoint não solicita deploy. O ZIP estático para Vercel é entregue separadamente e não foi enviado para o domínio.
