import { EmptyState, Screen, Text } from '@/components/ui';

export default function InicioScreen() {
  return (
    <Screen>
      <Text variant="label" tone="accent">
        Hoje
      </Text>
      <Text variant="title">Início</Text>
      <EmptyState
        icon="flame-outline"
        title="Seu dia aparece aqui"
        message="O medidor de calorias, os macros, a água e o treino do dia chegam na fase 3."
      />
    </Screen>
  );
}
