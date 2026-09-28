import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glass } from '@/components/ui/Glass';
import { IconButton } from '@/components/ui/IconButton';
import { NeonButton } from '@/components/ui/NeonButton';
import { Text } from '@/components/ui/Text';
import type { CatalogExercise, MuscleKey } from '@/data/exercises';
import { EQUIPMENT_LABELS, MUSCLE_LABELS, MUSCLE_ORDER, searchExercises } from '@/lib/exercises';
import { colors, fonts, radius, spacing } from '@/theme/theme';

import { BodyMap } from './BodyMap';
import { ExerciseAnim } from './ExerciseAnim';

type Props = {
  /** Escolher exercícios para um treino (com ✓) ou só consultar. */
  picked?: ReadonlySet<string>;
  onToggle?: (id: string) => void;
  /** Filtro inicial por músculo. */
  initialMuscle?: MuscleKey | null;
};

/**
 * Biblioteca de exercícios: busca, mapa do corpo e filtros por músculo, com a
 * animação de cada exercício. Tocar abre o detalhe; no modo de escolha, o ✓
 * adiciona ou tira do treino.
 */
export function ExerciseLibrary({ picked, onToggle, initialMuscle = null }: Props) {
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleKey | null>(initialMuscle);
  const [showMap, setShowMap] = useState(false);
  const [open, setOpen] = useState<CatalogExercise | null>(null);
  const results = useMemo(() => searchExercises({ query, muscle }), [query, muscle]);
  const picking = !!onToggle;

  return (
    <View style={styles.wrap}>
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.ink3} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar exercício (ex.: supino, remada)"
          placeholderTextColor={colors.ink3}
          selectionColor={colors.lime2}
          keyboardAppearance="dark"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Buscar exercício"
          style={styles.searchInput}
        />
        <IconButton
          icon={showMap ? 'body' : 'body-outline'}
          label={showMap ? 'Esconder mapa do corpo' : 'Mostrar mapa do corpo'}
          size={36}
          onPress={() => setShowMap((v) => !v)}
        />
      </View>

      {showMap && (
        <Glass contentStyle={styles.mapCard}>
          <BodyMap selected={muscle} onSelect={setMuscle} />
        </Glass>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="Todos" on={!muscle} onPress={() => setMuscle(null)} />
        {MUSCLE_ORDER.map((m) => (
          <Chip key={m} label={MUSCLE_LABELS[m]} on={muscle === m} onPress={() => setMuscle(muscle === m ? null : m)} />
        ))}
      </ScrollView>

      <Text variant="caption" tone="muted">
        {results.length} {results.length === 1 ? 'exercício' : 'exercícios'}
        {picked && picked.size ? ` · ${picked.size} no treino` : ''}
      </Text>

      <View>
        {results.map((e) => {
          const on = picked?.has(e.id) ?? false;
          return (
            <Pressable
              key={e.id}
              accessibilityRole="button"
              accessibilityLabel={e.name}
              onPress={() => setOpen(e)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <ExerciseAnim id={e.id} still style={styles.thumb} />
              <View style={styles.flex}>
                <Text style={styles.rowName}>{e.name}</Text>
                <Text variant="caption" tone="muted">
                  {MUSCLE_LABELS[e.muscle]} · {EQUIPMENT_LABELS[e.equipment]}
                </Text>
              </View>
              {picking ? (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={on ? `Tirar ${e.name} do treino` : `Adicionar ${e.name} ao treino`}
                  hitSlop={8}
                  onPress={() => onToggle?.(e.id)}
                  style={[styles.check, on && styles.checkOn]}>
                  <Ionicons name={on ? 'checkmark' : 'add'} size={18} color={on ? colors.onLime : colors.ink} />
                </Pressable>
              ) : (
                <Ionicons name="chevron-forward" size={16} color={colors.ink3} />
              )}
            </Pressable>
          );
        })}
      </View>

      <ExerciseDetail
        exercise={open}
        onClose={() => setOpen(null)}
        picked={open ? (picked?.has(open.id) ?? false) : false}
        onToggle={picking && open ? () => onToggle?.(open.id) : undefined}
      />
    </View>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={[styles.chip, on && styles.chipOn]}>
      <Text style={[styles.chipText, { color: on ? colors.onInk : colors.ink2 }]}>{label}</Text>
    </Pressable>
  );
}

/** Detalhe do exercício: animação grande, músculo e equipamento. */
function ExerciseDetail({
  exercise,
  onClose,
  picked,
  onToggle,
}: {
  exercise: CatalogExercise | null;
  onClose: () => void;
  picked: boolean;
  onToggle?: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal transparent visible={!!exercise} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      {exercise && (
        <View style={styles.modalRoot}>
          <Pressable accessibilityLabel="Fechar" onPress={onClose} style={[StyleSheet.absoluteFill, styles.scrim]} />
          <Glass
            rounded={28}
            flush
            style={styles.sheet}
            contentStyle={[styles.sheetContent, { paddingBottom: insets.bottom + spacing.lg }]}>
            <ExerciseAnim id={exercise.id} style={styles.big} />
            <View style={styles.sheetHead}>
              <View style={styles.flex}>
                <Text style={styles.sheetTitle}>{exercise.name}</Text>
                <Text variant="caption" tone="muted">
                  {MUSCLE_LABELS[exercise.muscle]} · {EQUIPMENT_LABELS[exercise.equipment]}
                </Text>
              </View>
              <IconButton icon="close" label="Fechar" size={38} onPress={onClose} />
            </View>
            {onToggle && (
              <NeonButton
                label={picked ? 'Tirar do treino' : 'Adicionar ao treino'}
                onPress={() => {
                  onToggle();
                  onClose();
                }}
              />
            )}
          </Glass>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 54,
    paddingLeft: 16,
    paddingRight: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.frostCardEdge,
    borderTopColor: colors.frostCardEdgeTop,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    color: colors.ink,
    fontFamily: fonts.body.semibold,
    fontSize: 15.5,
  },
  mapCard: {
    paddingVertical: spacing.md,
  },
  chips: {
    gap: 6,
  },
  chip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipOn: {
    backgroundColor: colors.ink,
    borderColor: 'transparent',
  },
  chipText: {
    fontFamily: fonts.body.semibold,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  rowName: {
    fontFamily: fonts.body.semibold,
    fontSize: 15,
    lineHeight: 20,
  },
  check: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  checkOn: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  pressed: {
    opacity: 0.7,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    backgroundColor: colors.modalScrimSolid,
  },
  sheet: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
    backgroundColor: colors.panel,
  },
  sheetContent: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  big: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 22,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  sheetTitle: {
    fontFamily: fonts.display.bold,
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: -0.5,
  },
});
