import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { formatDuration } from '@/lib/format';
import { tempoDeTreinoMs } from '@/lib/treino/met';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts } from '@/theme/theme';

import { useAgora } from './HeroDoDia';

/** O ponto pisca devagar, como quem está gravando. */
export const PISCA = {
  animationName: { '0%': { opacity: 1 }, '50%': { opacity: 0.25 }, '100%': { opacity: 1 } },
  animationDuration: 1400,
  animationIterationCount: 'infinite' as const,
  animationTimingFunction: 'ease-in-out' as const,
};

/**
 * Pílula do treino em andamento, no meio do topo de todas as abas: o tempo
 * (ou o descanso) correndo, para ninguém esquecer o treino aberto. Tocar
 * abre o treino ao vivo; o ícone da direita pausa ou continua.
 */
export function PilulaAoVivo() {
  const sessao = useAppStore((s) => s.sessaoAtiva);
  const pausar = useAppStore((s) => s.pausarTreino);
  const retomar = useAppStore((s) => s.retomarTreino);
  const agora = useAgora();
  const reduce = useReducedMotion();
  if (!sessao) return null;
  const pausado = !!sessao.pausadoEm;
  const restante = sessao.descansoAte ? Math.max(0, Math.ceil((Date.parse(sessao.descansoAte) - agora) / 1000)) : 0;
  const descansando = restante > 0;
  const tempo = formatDuration(descansando ? restante : tempoDeTreinoMs(sessao, agora) / 1000);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Treino ${pausado ? 'pausado' : descansando ? 'em descanso' : 'em andamento'}, ${tempo}. Abrir o treino`}
      onPress={() => router.push('/treino-sessao')}
      style={({ pressed }) => [styles.pill, pressed && styles.pressed]}>
      <Animated.View style={[styles.ponto, descansando && styles.pontoDescanso, pausado && styles.pontoOff, !pausado && !descansando && !reduce && PISCA]} />
      <Text style={[styles.tempo, pausado && styles.tempoOff]}>{tempo}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={pausado ? 'Continuar o treino' : 'Pausar o treino'}
        hitSlop={10}
        onPress={pausado ? retomar : pausar}>
        <Ionicons name={pausado ? 'play' : 'pause'} size={13} color={colors.ink3} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 11,
    borderRadius: 18,
    backgroundColor: colors.glassFillStrong,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.frostCardEdgeTop,
  },
  ponto: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.gravando,
  },
  pontoDescanso: {
    backgroundColor: colors.ink,
  },
  pontoOff: {
    backgroundColor: colors.ink3,
  },
  tempo: {
    fontFamily: fonts.display.semibold,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  tempoOff: {
    color: colors.ink3,
  },
  pressed: {
    opacity: 0.8,
  },
});
