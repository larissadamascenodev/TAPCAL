import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { fromDateKey } from '@/lib/dates';
import { datasDaSemana, DIA_CURTO, DIA_NOME, DIAS, type EstadoDoDia } from '@/lib/treino/semana';
import { colors, fonts, spacing } from '@/theme/theme';
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
 * Semana de treino, de segunda a domingo. As pílulas mostram só o dia (nada de
 * divisão muscular): verde com ✓ = feito, anel = hoje, apagado = descanso e
 * ponto = treino a fazer.
 */
export function SemanaTreino({ hoje, estados, selecionado, onSelect }: Props) {
  const datas = datasDaSemana(hoje);
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {DIAS.map((dia, i) => {
        const e = estados[dia];
        const on = dia === selecionado;
        const num = String(fromDateKey(datas[i]).getDate()).padStart(2, '0');
        const estado = e.tipo === 'feito' ? 'feito' : e.tipo === 'descanso' ? 'descanso' : 'treino a fazer';
        return (
          <Pressable
            key={dia}
            onPress={() => onSelect(dia)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`${DIA_NOME[dia]} ${Number(num)}${e.hoje ? ', hoje' : ''}: ${estado}`}
            style={styles.day}>
            <Text style={[styles.week, (e.hoje || on) && styles.strong]}>{DIA_CURTO[dia]}</Text>
            <View
              style={[
                styles.num,
                e.tipo === 'feito' && styles.done,
                e.hoje && styles.today,
                on && styles.selected,
                e.tipo === 'descanso' && !on && styles.rest,
              ]}>
              <Text style={[styles.numText, (e.hoje || on) && styles.strong, e.tipo === 'feito' && styles.doneText]}>{num}</Text>
            </View>
            <View style={styles.mark}>
              {e.tipo === 'feito' ? (
                <Ionicons name="checkmark" size={12} color={colors.ok} />
              ) : e.tipo === 'pendente' ? (
                <View style={styles.dot} />
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
    marginHorizontal: -spacing.xs,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
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
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  done: {
    backgroundColor: colors.okTint,
  },
  today: {
    borderColor: colors.lime,
  },
  selected: {
    backgroundColor: colors.glassFillStrong,
  },
  rest: {
    opacity: 0.45,
  },
  numText: {
    fontFamily: fonts.display.semibold,
    fontSize: 16,
    lineHeight: 20,
    color: colors.ink2,
  },
  doneText: {
    color: colors.ok,
  },
  strong: {
    color: colors.ink,
  },
  mark: {
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.lime,
  },
});
