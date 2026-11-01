# ANARCO.EXE 3D — Relatório da mescla v4.1.1

**O que é:** o pacote recebido v4.1.0 (otimizações) + nossas correções da v4.0.1 (menu, painéis, teste e2e).
**Validação:** 83 testes, build, smoke e e2e ("tudo certo") passam. `dist/` com 7,2 MB (era 14,4 MiB). Capturas do menu e dos painéis refeitas após a mescla.

## 1. Verificação da v4.1.0 contra a lista de otimização
Legenda: ✅ feito · 🟡 parcial · ❌ não feito.

| # | Item da lista | Status | O que a v4.1.0 fez / observação |
|---|---|---|---|
| 1 | Chamadas de desenho da cidade | ✅ | 46 prédios em 8 lotes estáticos por material e setor, com recorte de câmera por setor. Delta da skyline: p50 30→13 chamadas (−56,7%), p95 40→11. |
| 2 | Trabalho repetido no loop | 🟡 | Reuso do objeto de estado do FX e do vetor de velocidade. Sem índice espacial nem lista de partículas ativas, porque o update+gameplay p95 já ficou abaixo de 1 ms. Decisão coerente com "medir antes". |
| 3 | Código morto da base Manus | ✅ | 3 arquivos sem importadores removidos (33 KB). Rapier virou dependência de desenvolvimento. `src/game` e `src/engine` ficam por causa dos testes. **Não reduz o bundle**: eram órfãos, e o relatório diz isso. |
| 4 | Medir tempos de quadro | 🟡 | Painel `?perf=1` (p50/p95/p99, exporta JSON). Medido só em Chromium com render por software (SwiftShader). **Falta rodar em PC e celular reais.** |
| 5 | Chefões GLB | ✅ | Meshopt + WebP: 2,1/2,0/1,9 MB → 0,72/0,52/0,44 MB (total ~1,7 MB, antes ~6 MB). Rigs e animações cobertos pelo e2e. |
| 6 | Qualidade gráfica adaptativa | ❌ | Seguem as 4 `PointLight`; DPR no desktop continua até 2. (No toque já havia teto de 1,25.) |
| 7 | Notebook sob demanda | ✅ | Fora do pré-cache; teste novo garante que, se o modelo falhar, o placeholder segura e o hack continua. |
| 8 | Áudio sob demanda | ✅ | Pré-cache do service worker só tem o shell e `anarco.mdl`. Mute e offline preservados (e2e). |
| 9 | Fonte CJK | ✅ | Removida (fontes: 1,00 → 0,08 MB gzip). |
| 10 | `og.png` | ✅ | Virou `og.jpg` de 171 KB (a meta era ~100 KB; bom o suficiente). |
| 11 | Minificar `script.js` | ✅ | 168 → 126 KB. Menos que os ~80 KB previstos, porque **os nomes foram preservados de propósito** (os testes e2e usam variáveis globais). |
| 12 | Peso total do `dist/` | ✅ | 14,4 → 7,2 MB; transferência gzip 13,6 → 6,3 MB. |

**Leitura honesta dos números de FPS:** os ganhos (+5% no desktop emulado, +30% no toque emulado) vieram de renderização por **software**, com a qualidade adaptativa mexendo junto. Servem para comparar versões no mesmo ambiente, não para prometer FPS em aparelho real.

## 2. O que a v4.1.0 não trazia (e foi mesclado de volta)
Ela foi construída sobre a v4.0.0, então faltavam as correções da nossa v4.0.1. Mescla de 3 vias (base v4.0.0 · nosso v4.0.1 · deles v4.1.0), sem conflito de código:
- Menu: `#ov > div` no lugar de `#ov div`, seletor do HUD com o mesmo visual, cartão que cabe em telas baixas.
- Briefing no topo, sem cobrir os botões de habilidade e a escolha de rota.
- Ranking, Vazamentos e Pausa no visual neon.
- e2e: espera do minigame de 10 s → 45 s (o hack leva ~22 s; sem isso o teste falha mesmo com o jogo certo).
- Conflitos tratados à mão: nome do cache do service worker (`anarco-v4.1.1-lazy-menu-largo`), versão (4.1.1) e README.

## 3. Pendências (ordem Difícil → Fácil)
1. **Medir em aparelhos reais** (`?perf=1` → CAPTURAR 30 s → BAIXAR JSON) em um PC e em um celular. Sem isso, não dá para saber o gargalo.
2. **Item 6:** qualidade adaptativa mais cedo (DPR ≤ 1,5, desligar 2 `PointLight` na qualidade Baixa). Fazer com base no JSON do passo 1.
3. **Item 2 (resto):** índice espacial/partículas ativas só se o perfil real mostrar custo.
4. Polimento do menu: sobra um vão entre a 1ª e a 2ª caixa de opções quando não há resultado a mostrar.

## 4. Conceitos praticados
Mescla de 3 vias com base comum, leitura crítica de relatório de terceiros (conferir contra o código, não só contra o texto), draw calls e instanciamento/lotes estáticos, compressão de malha (meshopt), cache sob demanda no service worker, medição por percentis (p50/p95), limites de validade de medições em SwiftShader.
