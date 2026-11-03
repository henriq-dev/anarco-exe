# Hotfix v4.1.7 — restauração da tipografia Special Elite

A v4.1.6 adicionou `ManusCC0` à pilha ativa (`"Special Elite", "ManusCC0", "Courier New", monospace`). Como Special Elite não estava incluída no pacote, o navegador selecionava ManusCC0 e a interface perdia o visual de máquina de escrever esperado. O preload daquela fonte também antecipava o arquivo errado.

A v4.1.7 restaura a pilha original `"Special Elite", "Courier New", monospace` e inclui a família Special Elite real como WOFF2 Latin, servida localmente em `public/fonts/SpecialElite-Latin.woff2`. A tag de preload aponta para esse arquivo local. O preload do entry JavaScript (`modulepreload`) permanece. ManusCC0 não é mais referenciada pela folha de estilos nem carregada como fallback ativo.

A página oficial do Google Fonts identifica a família Special Elite e o designer Astigmatic [1]. A licença exibida para essa família é Apache License 2.0, que permite reprodução e redistribuição quando seus termos são respeitados [2]. Incluí a cópia do texto oficial da licença em `public/fonts/SpecialElite-LICENSE.txt` [4] e o aviso de atribuição em `public/fonts/SpecialElite-NOTICE.txt`. O arquivo WOFF2 Latin foi obtido do CSS servido pelo Google Fonts [3]; a distribuição do arquivo continua autohospedada e não exige requisição ao Google em runtime.

## Regressões cobertas

O smoke agora verifica que o preload aponta para o WOFF2 existente, que a folha CSS de produção usa Special Elite e que ManusCC0 não reapareceu na pilha. Também exige que a licença e o aviso de atribuição estejam presentes no build. O E2E carrega `document.fonts` com texto em português, confirma a família computada e verifica que a requisição da fonte vem da mesma origem do jogo.

O build reportou fontes em **0,13/0,25 MiB** e transferência total em **6,36/8,00 MiB**. A fonte é carregada em tempo de execução pela origem local. A interface foi inspecionada no Chromium e o terminal introdutório manteve o estilo tipográfico de máquina de escrever.

A validação completa da v4.1.7 passou: typecheck, **85 testes em 14 arquivos**, build e budgets, smoke e E2E Chromium. O smoke encontrou 41 arquivos estáticos. O item global 19 (preload da fonte correta e do script) permanece concluído; o estado geral continua **10/20 itens concluídos**.

## Referências

[1]: https://fonts.google.com/specimen/Special+Elite "Google Fonts Special Elite"
[2]: https://fonts.google.com/specimen/Special+Elite/license "Licença Special Elite no Google Fonts"
[3]: https://fonts.googleapis.com/css2?family=Special+Elite&display=swap "Google Fonts CSS API Special Elite"
[4]: https://www.apache.org/licenses/LICENSE-2.0.txt "Apache License 2.0"
