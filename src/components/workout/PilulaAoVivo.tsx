import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { formatDuration } from '@/lib/format';
import { tempoDeTreinoMs } from '@/lib/treino/met';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts } from '@/theme/theme';

import { useAgora } from './HeroDoDia';

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
      <View style={[styles.ponto, descansando && styles.pontoDescanso, pausado && styles.pontoOff]} />
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
    gap: 8,
    height: 36,
    paddingHorizontal: 14,
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
    backgroundColor: colors.lime,
  },
  pontoDescanso: {
    backgroundColor: colors.ink,
  },
  pontoOff: {
    backgroundColor: colors.ink3,
  },
  tempo: {
    fontFamily: fonts.display.semibold,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  tempoOff: {
    color: colors.ink3,
  },
  pressed: {
    opacity: 0.8,
  },
});
