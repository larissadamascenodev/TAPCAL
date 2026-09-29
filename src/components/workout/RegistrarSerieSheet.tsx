import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';

import { BottomSheet, Glass, NeonButton, Stepper, Text, toast } from '@/components/ui';
import { exercicioPorId } from '@/lib/exercicios';
import { formatDecimal } from '@/lib/format';
import { bateRecorde, repsLabel, seriesFeitas } from '@/lib/treino/plano';
import { sugestaoDoExercicio, valoresDaProximaSerie } from '@/lib/treino/progressao';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, spacing } from '@/theme/theme';
import type { ExercicioNoTreino } from '@/types/treino';

const KG_STEP = 2.5;

type Props = {
  /** Exercício do treino em andamento (com as séries da semana já ajustadas). */
  item: ExercicioNoTreino | null;
  onClose: () => void;
  /** Chamado quando a última série do exercício é concluída. */
  onExercicioConcluido?: () => void;
};

/**
 * Registrar a série sem sair da aba Treino: a mesma carga e repetições da tela
 * do exercício, "Concluir série" e o modal passa para a próxima com uma
 * animação. Na última série, fecha.
 */
export function RegistrarSerieSheet({ item, onClose, onExercicioConcluido }: Props) {
  if (!item) return null;
  return <Formulario key={item.id} item={item} onClose={onClose} onExercicioConcluido={onExercicioConcluido} />;
}

function Formulario({ item, onClose, onExercicioConcluido }: Props & { item: ExercicioNoTreino }) {
  const sessao = useAppStore((s) => s.sessaoAtiva);
  const sessoes = useAppStore((s) => s.sessoes);
  const planos = useAppStore((s) => s.planos);
  const registrarSerie = useAppStore((s) => s.registrarSerie);
  const [valores, setValores] = useState(() => (sessao ? valoresDaProximaSerie(item, sessao, sessoes, planos) : { kg: 10, reps: item.repsMin }));
  if (!sessao) return null;

  const ex = exercicioPorId(item.exercicioId);
  const feitas = seriesFeitas(sessao, item.id);
  const numero = feitas + 1;
  const sugestao = feitas === 0 ? sugestaoDoExercicio(item, sessoes, planos) : null;
  const ultima = feitas === item.series - 1;

  const concluir = () => {
    const recorde = bateRecorde([...sessoes, sessao], item.exercicioId, valores.kg, valores.reps);
    registrarSerie(item.id, valores.kg, valores.reps);
    if (recorde) toast(`Novo recorde: ${formatDecimal(valores.kg)} kg`);
    if (numero >= item.series) {
      if (!recorde) toast('Exercício concluído');
      onExercicioConcluido?.();
      onClose();
    }
  };

  return (
    <BottomSheet
      visible
      title={ex?.nome ?? 'Exercício'}
      subtitle={`Meta: ${item.series} × ${repsLabel(item)} · descanso ${item.descansoSeg} s`}
      onClose={onClose}
      footer={<NeonButton label={ultima ? 'Concluir exercício' : `Concluir série ${numero}`} onPress={concluir} />}>
      <View style={styles.progresso}>
        {Array.from({ length: item.series }, (_, k) => (
          <View key={k} style={[styles.traco, k < feitas && styles.tracoFeito, k === feitas && styles.tracoAgora]} />
        ))}
      </View>

      {/* A série muda com uma animação: a feita sai pela esquerda e a próxima entra pela direita. */}
      <Animated.View key={numero} entering={FadeInRight.duration(260)} exiting={FadeOutLeft.duration(180)} style={styles.bloco}>
        <Text style={styles.serie}>
          Série {numero} de {item.series}
        </Text>
        {sugestao && (
          <View style={styles.motivo}>
            <Ionicons name={sugestao.tipo === 'reduzir' ? 'trending-down' : sugestao.tipo === 'manter' ? 'repeat' : 'trending-up'} size={15} color={colors.ink2} />
            <Text variant="caption" tone="secondary" style={styles.flex}>
              {sugestao.motivo}
            </Text>
          </View>
        )}
        <View style={styles.campos}>
          <Glass flush style={styles.flex} contentStyle={styles.campo}>
            <Text variant="label" tone="muted">
              Carga
            </Text>
            <Text style={styles.valor}>
              {formatDecimal(valores.kg)}
              <Text variant="caption" tone="muted">
                {' '}kg
              </Text>
            </Text>
            <Stepper
              label="carga"
              onMinus={() => setValores((v) => ({ ...v, kg: Math.max(0, v.kg - KG_STEP) }))}
              onPlus={() => setValores((v) => ({ ...v, kg: v.kg + KG_STEP }))}
            />
          </Glass>
          <Glass flush style={styles.flex} contentStyle={styles.campo}>
            <Text variant="label" tone="muted">
              Repetições
            </Text>
            <Text style={styles.valor}>{valores.reps}</Text>
            <Stepper
              label="repetições"
              onMinus={() => setValores((v) => ({ ...v, reps: Math.max(1, v.reps - 1) }))}
              onPlus={() => setValores((v) => ({ ...v, reps: v.reps + 1 }))}
            />
          </Glass>
        </View>
      </Animated.View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  progresso: {
    flexDirection: 'row',
    gap: 5,
  },
  traco: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.track,
  },
  tracoFeito: {
    backgroundColor: colors.ink2,
  },
  tracoAgora: {
    backgroundColor: colors.lime,
  },
  bloco: {
    gap: spacing.md,
  },
  serie: {
    fontFamily: fonts.display.semibold,
    fontSize: 18,
    lineHeight: 24,
  },
  motivo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  campos: {
    flexDirection: 'row',
    gap: 10,
  },
  campo: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  valor: {
    fontFamily: fonts.display.bold,
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -1.2,
    fontVariant: ['tabular-nums'],
  },
});
