import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { TodayRing } from '@/components/home/TodayRing';
import { Text } from '@/components/ui/Text';
import { fromDateKey } from '@/lib/dates';
import { datasDaSemana, DIA_CURTO, DIA_NOME, DIAS, type EstadoDoDia } from '@/lib/treino/semana';
import { colors, fonts } from '@/theme/theme';
import type { DateKey } from '@/types';
import type { DiaSemana } from '@/types/treino';

const RING = 40;

type Props = {
  hoje: DateKey;
  estados: Record<DiaSemana, EstadoDoDia>;
  selecionado: DiaSemana;
  onSelect: (dia: DiaSemana) => void;
};

/**
 * Semana de treino (segunda a domingo) no mesmo desenho da faixa de datas do
 * Início: dia da semana em cima, número embaixo e o anel de hoje — aqui em
 * verde. Embaixo do número: ✓ = feito, ponto = treino a fazer, nada = descanso.
 */
export function SemanaTreino({ hoje, estados, selecionado, onSelect }: Props) {
  const datas = datasDaSemana(hoje);
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {DIAS.map((dia, i) => {
        const e = estados[dia];
        const on = dia === selecionado;
        const futuro = datas[i] > hoje;
        const num = String(fromDateKey(datas[i]).getDate()).padStart(2, '0');
        const estado = e.tipo === 'feito' ? 'feito' : e.tipo === 'descanso' ? 'descanso' : 'treino a fazer';
        return (
          <Pressable
            key={dia}
            onPress={() => onSelect(dia)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${DIA_NOME[dia]} ${Number(num)}${e.hoje ? ', hoje' : ''}: ${estado}`}
            style={[styles.day, futuro && !on && styles.future]}>
            <Text style={[styles.week, (e.hoje || on) && styles.strong]}>{e.hoje ? 'HOJE' : DIA_CURTO[dia]}</Text>
            <View style={[styles.num, on && !e.hoje && styles.selected]}>
              {e.hoje && <TodayRing color={colors.lime} />}
              <Text style={[styles.numText, (e.hoje || on) && styles.strong, e.hoje && styles.bold, e.tipo === 'feito' && styles.done]}>{num}</Text>
            </View>
            <View style={styles.mark}>
              {e.tipo === 'feito' ? (
                <Ionicons name="checkmark" size={12} color={colors.ok} />
              ) : e.tipo === 'pendente' ? (
                <View style={[styles.dot, on && styles.dotOn]} />
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginHorizontal: -4,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: 7,
    paddingVertical: 4,
  },
  future: {
    opacity: 0.6,
  },
  week: {
    fontFamily: fonts.body.bold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1,
    color: colors.ink3,
  },
  num: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    backgroundColor: colors.glassFillStrong,
  },
  numText: {
    fontFamily: fonts.display.semibold,
    fontSize: 16,
    lineHeight: 20,
    color: colors.ink2,
  },
  strong: {
    color: colors.ink,
  },
  bold: {
    fontFamily: fonts.display.bold,
  },
  done: {
    color: colors.ok,
  },
  mark: {
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.ink3,
  },
  dotOn: {
    backgroundColor: colors.lime,
  },
});
