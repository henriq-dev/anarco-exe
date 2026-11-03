# Roteiro de validação real — v4.2.3

Use este roteiro depois que a v4.2.3 estiver publicada em `https://anarcoexe.vercel.app`. O objetivo é colher evidência de hardware e tecnologias assistivas, que não pode ser substituída por SwiftShader, controle simulado ou inspeção automática.

## PC, celular e controle

No PC e no telefone físicos, abra `https://anarcoexe.vercel.app/?perf=1`, entre na partida e deixe a cena comparável por 30 segundos. No painel **PERF // TELEMETRIA LOCAL**, pressione **CAPTURAR 30 s** e depois **BAIXAR JSON**. Não altere zoom durante a captura. Registre também aparelho/CPU/GPU, sistema e versão, navegador, resolução/DPR, orientação, perfil gráfico selecionado e se havia outros apps exigentes abertos. O painel é local; não envia esses dados automaticamente.

No celular, repita em retrato e paisagem. Em paisagem próxima a 844×390, confira que o HUD não cobre BREACH, EMP ou VÍRUS, que o tutorial não fica sobre as habilidades, que os botões são tocáveis e que não há rolagem horizontal. Observe especialmente a nitidez do FXAA e qualquer queda perceptível de quadros ao alternar Baixa/Média/Alta.

Com um controle físico mapeado como `standard`, teste no menu, terminal introdutório, partida, pausa e minigame de sequência: analógico esquerdo, A, B, Start, X, Y, LB, RB, L3 e D-pad. Confirme que uma habilidade não se repete enquanto o botão fica segurado e que o foco/realce acompanha a navegação. Guarde o fabricante/modelo do controle e plataforma usada.

Guarde os JSONs baixados e anote falhas, aquecimento, stutter, latência de input ou artefatos. Para comparar builds, capture o mesmo aparelho, navegador, cenário e perfil gráfico.

## Leitores de tela

Teste em aparelhos com leitores reais: NVDA no Windows, VoiceOver no macOS ou iOS e TalkBack no Android. Use o navegador normalmente recomendado para cada plataforma e registre versões do sistema, navegador e leitor. Verifique a ordem de foco do menu; anúncio e ativação de **Invadir**; início/fechamento do terminal; nome e instruções do canvas; pausa/retomada; diálogos de Vazamentos e Ranking, incluindo foco contido e devolvido ao acionador; seletor de qualidade e estado anunciado; objetivo e progresso de hack; controles e habilidades no touch.

Anote texto anunciado, momento do anúncio, duplicações, silêncio inesperado, foco perdido e qualquer estado visual sem equivalente acessível. Não é preciso concluir as três combinações para relatar a primeira; identifique claramente quais leitor/plataforma foram efetivamente testados.

## Evidência a devolver

Anexe os JSONs `anarco-perf-*.json`, descreva o equipamento e navegador, e liste resultados positivos e problemas reproduzíveis. Para leitor de tela, inclua a combinação exata de sistema, navegador e leitor. Esses dados permitem fechar os itens 7 e 9 e priorizar eventuais correções antes de tratar o Lighthouse como aceite final da release.
