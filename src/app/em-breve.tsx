import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Glass, Screen, Text } from '@/components/ui';
import { colors, fonts, radius, spacing } from '@/theme/theme';

type Section = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  when: string;
};

/** O que cada atalho vai ser, e quando chega (pelo roteiro). */
const SECTIONS: Record<string, Section> = {
  scanner: {
    title: 'Scanner de pratos',
    icon: 'scan-outline',
    description: 'Fotografe o prato e o app calcula calorias e macros, com porções ajustáveis.',
    when: 'Próxima fase',
  },
  busca: {
    title: 'Busca de alimentos',
    icon: 'search-outline',
    description: 'Busque qualquer alimento na tabela TACO e escolha a porção em gramas.',
    when: 'Próxima fase',
  },
  historico: {
    title: 'Histórico de treinos',
    icon: 'time-outline',
    description: 'Todos os treinos feitos, com cargas, volume e a evolução de cada exercício.',
    when: 'Em breve',
  },
  jornada: {
    title: 'Jornada',
    icon: 'images-outline',
    description: 'Fotos de progresso, medidas e conquistas ao longo do caminho.',
    when: 'Versão 1.2',
  },
  receitas: {
    title: 'Receitas',
    icon: 'book-outline',
    description: 'Receitas e dicas alinhadas à sua meta de calorias e proteína.',
    when: 'Versão 1.2',
  },
  mercado: {
    title: 'Mercado',
    icon: 'cart-outline',
    description: 'Lista de compras montada a partir da sua dieta e das receitas.',
    when: 'Versão 1.2',
  },
  caneta: {
    title: 'Caneta GLP-1',
    icon: 'medical-outline',
    description: 'Aplicações, lembretes, rodízio do local e efeitos colaterais, para quem usa Mounjaro ou Ozempic.',
    when: 'Antes do lançamento',
  },
  relatorios: {
    title: 'Relatórios',
    icon: 'stats-chart-outline',
    description: 'Resumos semanais e mensais de alimentação, treino e peso.',
    when: 'Versão 1.1',
  },
};

const FALLBACK: Section = {
  title: 'Em breve',
  icon: 'sparkles-outline',
  description: 'Essa parte do app está sendo construída.',
  when: 'Em breve',
};

/** Página de "Em breve" para os atalhos de seções que ainda não existem. */
export default function EmBreveScreen() {
  const { secao } = useLocalSearchParams<{ secao?: string }>();
  const s = (secao && SECTIONS[secao]) || FALLBACK;

  return (
    <Screen withTabBar={false}>
      <View style={styles.spacer} />
      <Glass contentStyle={styles.card}>
        <View style={styles.icon}>
          <Ionicons name={s.icon} size={30} color={colors.ember2} />
        </View>
        <View style={styles.badge}>
          <Text variant="label" tone="accent">
            {s.when}
          </Text>
        </View>
        <Text style={styles.title}>{s.title}</Text>
        <Text tone="secondary" style={styles.center}>
          {s.description}
        </Text>
      </Glass>
      <Button label="Voltar" variant="secondary" fullWidth onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  spacer: {
    height: spacing.xxxl * 2,
  },
  card: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  icon: {
    width: 68,
    height: 68,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.emberTint,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.emberTint,
  },
  title: {
    fontFamily: fonts.display.semibold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.7,
    textAlign: 'center',
  },
  center: {
    textAlign: 'center',
  },
});
