# design-reference

Mockups aprovados do TapCal. **Nenhuma tela é construída sem o mockup dela aqui.**

| Arquivo | Telas | Fase |
| --- | --- | --- |
| `inicio.html` / `.png` | Início (dashboard) | 3 |
| `alimentacao.html` / `.png` | Diário de Alimentação e resultado da foto (scanner) | 3 e 4 |
| `treino.html` / `.png` | Plano da semana e treino em andamento | 3 |

Os `.html` são os mockups interativos originais (abra no navegador); os `.png`
são capturas para consulta rápida. Origem: artifacts "TapCal Dashboard",
"TapCal Alimentação" e "TapCal Treino".

As cores, fontes e medidas dos mockups vivem em `src/theme/theme.ts`. Se um mockup
mudar uma cor, muda lá, em um lugar só.

## Diferenças conscientes em relação aos mockups

- **"Queimadas" virou "Déficit"** (ou "Superávit"): a meta do motor de metas já
  inclui o treino pelo nível de atividade; somar calorias queimadas contaria o
  treino duas vezes.
- **Pílula "Pro" e "Seus módulos" (jejum, caneta) ficaram de fora**: são das
  fases 7 e 8 e da versão 1.1.
- **Ilustração do corpo e "Ver execução" no treino**: trocadas por um cartão com
  última vez, recorde e meta, até existirem vídeos dos exercícios.
- **Adicionar alimento à mão e busca TACO** não têm mockup próprio: seguem o padrão
  da folha "Resultado da foto" (vidro, pílulas de refeição, Corrigir/Salvar).
- **Câmera e análise** seguem a foto do mockup "Resultado da foto" (cantos
  brancos e linha dourada de varredura). As etiquetas dos alimentos ficam em fila
  sobre a foto, porque a IA não devolve a posição de cada alimento.
