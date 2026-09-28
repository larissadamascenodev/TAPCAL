# Toque duplo na traseira do iPhone

O iPhone deixa rodar um atalho quando você toca duas vezes na parte de trás
dele. O TapCal tem um **link único** para isso: `tapcal://atalho`. Ele abre a
tela "O que você quer registrar?" com três opções:

- **Escanear alimento**: abre a câmera do scanner.
- **Hidratação**: soma 250 ml de água e mostra o total do dia.
- **Exercício**: começa (ou continua) o treino de hoje.

## 1. Criar o atalho

1. Abra o app **Atalhos** (da Apple) e toque em **+**.
2. Toque em **Adicionar Ação**, busque **Abrir URLs** e escolha essa ação.
3. No campo do link, cole `tapcal://atalho`.
4. Dê o nome "TapCal" ao atalho e toque em **OK**.

## 2. Ligar ao toque na traseira

1. Abra **Ajustes → Acessibilidade → Toque → Toque Traseiro**.
2. Escolha **Toque Duplo**.
3. Na lista, desça até **Atalhos** e escolha o atalho "TapCal".

## Links diretos (opcional)

Para pular a escolha, também existem `tapcal://atalho/foto`,
`tapcal://atalho/agua` e `tapcal://atalho/treino` (bons para o **Toque Triplo**).

## Testando pelo Expo Go

Enquanto o app roda pelo Expo Go, o link muda: use o endereço que aparece no
terminal do `npx expo start` (começa com `exp://`) e acrescente `/--/atalho`.
Exemplo: `exp://192.168.0.10:8081/--/atalho`. O computador precisa estar com o
`npx expo start` rodando, e o endereço muda se o IP da rede mudar.

Os links `tapcal://` passam a valer quando o app for instalado de verdade
(build do EAS ou TestFlight).
