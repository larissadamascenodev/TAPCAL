# Imagens do card do treino do dia

O card usa uma foto de fundo em 3D realista, escolhida pelo **músculo principal do primeiro exercício do dia**, na versão **feminina ou masculina** conforme o sexo do perfil. As imagens precisam ser geradas numa ferramenta de imagem com IA (a mesma usada na referência) e depois entram no app.

## Cenas (12 × feminino e masculino = 24 imagens)

| Arquivo | Cena | Usada quando o músculo principal é |
| --- | --- | --- |
| `peito-{f,m}.jpg` | Supino reto com barra, deitado no banco | peito |
| `costas-{f,m}.jpg` | Puxada frontal na polia, vista de costas | costas (alta), lombar |
| `trapezio-{f,m}.jpg` | Encolhimento com halteres, vista de costas | trapézio |
| `ombros-{f,m}.jpg` | Desenvolvimento com halteres, sentado | ombros |
| `biceps-{f,m}.jpg` | Rosca direta com barra, em pé | bíceps, antebraço |
| `triceps-{f,m}.jpg` | Tríceps na polia com corda | tríceps |
| `quadriceps-{f,m}.jpg` | Agachamento livre com barra | quadríceps, adutores |
| `posterior-{f,m}.jpg` | Levantamento terra romeno | posterior de coxa |
| `gluteos-{f,m}.jpg` | Elevação pélvica (hip thrust) com barra | glúteos, abdutores |
| `panturrilha-{f,m}.jpg` | Panturrilha em pé na máquina | panturrilha, tibial |
| `abdomen-{f,m}.jpg` | Abdominal na prancha / crunch | abdômen, oblíquos |
| `cardio-{f,m}.jpg` | Corrida na esteira | cardio / sem músculo principal |

## Regras de todas as imagens

- **Tamanho:** 1200 × 800 px (3:2), JPG ou WebP, até 250 KB.
- **Enquadramento:** a pessoa e o aparelho no **lado direito (60%)**; o terço esquerdo escuro e vazio (é onde fica o texto).
- **Fundo:** estúdio de academia preto, iluminação dramática de cima, sem textos, sem logos e sem marcas.
- **Pele:** anatômica, cinza-escuro fosco, com os músculos definidos (como na referência).
- **Músculos trabalhados:** acesos em **verde neon #D1FB39**, com um brilho leve. O resto do corpo continua cinza.
- **Mesma câmera e mesma luz em todas**, para o app parecer uma coisa só.

## Texto para gerar (em inglês, que funciona melhor nessas ferramentas)

Troque os trechos entre colchetes:

> Photorealistic 3D render of an anatomical [female | male] figure performing [a barbell bench press on a flat bench], dark matte charcoal-gray skin showing detailed muscle definition, the [chest] muscles glowing in bright neon lime green (#D1FB39) with a soft glow, all other muscles dark gray. Dark gym studio, pure black background, dramatic top lighting, subtle rim light. Subject and equipment placed on the right 60% of the frame, empty dark space on the left third. No text, no logos, no watermark. 3:2 aspect ratio, 1200x800.

Depois de gerar, mande as imagens aqui no chat (ou coloque em `assets/images/treino/`) com os nomes da tabela, que eu ligo no app.
