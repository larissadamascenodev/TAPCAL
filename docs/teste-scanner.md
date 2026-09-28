# Teste do scanner com 20 pratos brasileiros

Critério da fase 4: **arroz, feijão e carne saem certos, e o erro fica perto de 20% nas kcal.**

## Como fazer

1. Monte o prato e **pese cada alimento** numa balança de cozinha antes de fotografar.
2. Calcule as kcal reais pela busca TACO do próprio app (ou pela tabela) com os pesos da balança.
3. Fotografe pelo scanner, de cima, com o prato inteiro no enquadramento e boa luz.
4. **Não ajuste as porções** antes de anotar: anote o que a IA estimou.
5. Erro % = (kcal da IA − kcal real) ÷ kcal real × 100.

## Pratos sugeridos

Variar preparo, luz e prato. Os 10 primeiros são o "feijão com arroz" que precisa sair certo.

| # | Prato | Alimentos que a IA listou | kcal IA | kcal real | Erro % | O que errou |
|---|---|---|---|---|---|---|
| 1 | Arroz, feijão, bife e salada | | | | | |
| 2 | Arroz, feijão, frango grelhado | | | | | |
| 3 | Arroz, feijão, ovo frito, batata frita | | | | | |
| 4 | Feijoada com arroz, couve e farofa | | | | | |
| 5 | Arroz, feijão, carne moída, purê | | | | | |
| 6 | Macarrão ao molho de tomate com carne | | | | | |
| 7 | Strogonoff de frango, arroz, batata palha | | | | | |
| 8 | Peixe grelhado, arroz, legumes | | | | | |
| 9 | Prato feito de restaurante (PF) | | | | | |
| 10 | Marmita (vista de cima, pote) | | | | | |
| 11 | Pão francês com ovo mexido e café com leite | | | | | |
| 12 | Tapioca com queijo | | | | | |
| 13 | Cuscuz com ovo | | | | | |
| 14 | Pão de queijo (3 unidades) | | | | | |
| 15 | Açaí na tigela com granola e banana | | | | | |
| 16 | Salada de frutas | | | | | |
| 17 | Coxinha e refrigerante | | | | | |
| 18 | Pizza (2 fatias) | | | | | |
| 19 | Salada grande com frango e grão-de-bico | | | | | |
| 20 | Sopa de legumes (prato fundo) | | | | | |

## O que observar

- Reconheceu **todos** os alimentos? Inventou algum?
- A porção de **arroz e feijão** ficou perto do peso real? (é onde mais se erra)
- Calorias por 100 g batem com a TACO?
- Pratos com molho, fritura e óleo costumam sair **abaixo** do real.

Com os resultados, ajusto o prompt da função `analyze-meal` (`supabase/functions/analyze-meal/index.ts`).
