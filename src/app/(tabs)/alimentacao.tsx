import { EmptyState, Screen, Text } from '@/components/ui';

export default function AlimentacaoScreen() {
  return (
    <Screen>
      <Text variant="label" tone="accent">
        Refeições
      </Text>
      <Text variant="title">Alimentação</Text>
      <EmptyState
        icon="restaurant-outline"
        title="Nenhuma refeição ainda"
        message="Café da manhã, almoço, lanche e jantar vão aparecer aqui, com o resumo do dia."
      />
    </Screen>
  );
}
