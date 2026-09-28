import { EmptyState, Screen, Text } from '@/components/ui';

export default function TreinoScreen() {
  return (
    <Screen>
      <Text variant="label" tone="accent">
        Semana
      </Text>
      <Text variant="title">Treino</Text>
      <EmptyState
        icon="barbell-outline"
        title="Nenhum treino montado"
        message="A divisão da semana, o treino do dia e o cronômetro chegam na fase 3."
      />
    </Screen>
  );
}
