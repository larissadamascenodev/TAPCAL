import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { DishTitle, SheetBadge } from '@/components/nutrition/PlateSheet';
import { Glass, GlassModal, Text } from '@/components/ui';
import { colors, fonts } from '@/theme/theme';

/** Criar treino: montar do meu jeito (editor) ou com a IA (etapa 5). */
export default function TreinoNovoScreen() {
  return (
    <GlassModal badge={<SheetBadge icon="barbell-outline" label="NOVO TREINO" />} onClose={() => router.back()}>
      <DishTitle>Como quer montar?</DishTitle>
      <Choice
        icon="construct-outline"
        title="Montar do meu jeito"
        text="Você escolhe os dias e monta cada treino com os exercícios da biblioteca."
        onPress={() => router.replace('/treino-editor')}
      />
      <Choice
        icon="sparkles"
        title="Montar com IA"
        text="Responde algumas perguntas e a IA monta o treino para você."
        onPress={() => router.replace('/treino-ia')}
      />
    </GlassModal>
  );
}

function Choice({
  icon,
  title,
  text,
  badge,
  selected,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
  badge?: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!selected }} onPress={onPress}>
      {({ pressed }) => (
        <Glass
          strong={selected}
          style={[selected && styles.choiceOn, pressed && styles.pressed]}
          contentStyle={styles.choice}>
          <View style={styles.choiceIcon}>
            <Ionicons name={icon} size={22} color={colors.lime} />
          </View>
          <View style={styles.flex}>
            {badge ? <Text style={styles.choiceBadge}>{badge}</Text> : null}
            <Text style={styles.choiceTitle}>{title}</Text>
            <Text variant="caption" tone="secondary" style={styles.choiceText}>
              {text}
            </Text>
          </View>
        </Glass>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    minWidth: 0,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  choiceOn: {
    borderColor: colors.limeEdge,
    borderTopColor: colors.limeEdge,
  },
  choiceIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.limeWash,
    borderWidth: 1,
    borderColor: colors.limeEdge,
  },
  choiceTitle: {
    fontFamily: fonts.display.semibold,
    fontSize: 17,
    lineHeight: 22,
  },
  choiceBadge: {
    marginBottom: 3,
    fontFamily: fonts.body.bold,
    fontSize: 10.5,
    letterSpacing: 1.5,
    color: colors.lime,
  },
  choiceText: {
    marginTop: 3,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.75,
  },
});
