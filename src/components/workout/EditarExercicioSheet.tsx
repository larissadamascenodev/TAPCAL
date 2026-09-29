import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BottomSheet, NeonButton, Stepper, Text, TextField } from '@/components/ui';
import { exercicioPorId } from '@/lib/exercicios';
import { formatDecimal } from '@/lib/format';
import { DESCANSOS, LIMITES } from '@/lib/treino/editor';
import { repsLabel } from '@/lib/treino/plano';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import type { ExercicioNoTreino } from '@/types/treino';

type Mudanca = Partial<Omit<ExercicioNoTreino, 'id' | 'exercicioId'>>;

type Props = {
  item: ExercicioNoTreino | null;
  onClose: () => void;
  onSave: (mudanca: Mudanca) => void;
  onRemove: () => void;
};

/** Editar um exercício do treino: séries, repetições (faixa ou fixo), descanso, carga inicial e observação. */
export function EditarExercicioSheet({ item, onClose, onSave, onRemove }: Props) {
  if (!item) return null;
  return <Formulario key={item.id} item={item} onClose={onClose} onSave={onSave} onRemove={onRemove} />;
}

const limitar = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** "42,5" → 42.5; vazio ou inválido → undefined. */
function lerCarga(texto: string): number | undefined {
  const n = Number(texto.replace(',', '.').trim());
  return texto.trim() && Number.isFinite(n) && n > 0 ? n : undefined;
}

function Formulario({ item, onClose, onSave, onRemove }: Props & { item: ExercicioNoTreino }) {
  const ex = exercicioPorId(item.exercicioId);
  const [series, setSeries] = useState(item.series);
  const [fixo, setFixo] = useState(item.repsMin === item.repsMax);
  const [repsMin, setRepsMin] = useState(item.repsMin);
  const [repsMax, setRepsMax] = useState(item.repsMax);
  const [descanso, setDescanso] = useState(item.descansoSeg);
  const [carga, setCarga] = useState(item.cargaInicialKg ? formatDecimal(item.cargaInicialKg) : '');
  const [obs, setObs] = useState(item.observacao ?? '');

  const cargaKg = lerCarga(carga);
  const cargaInvalida = !!carga.trim() && cargaKg === undefined;
  const reps = { repsMin, repsMax: fixo ? repsMin : Math.max(repsMin, repsMax) };

  const salvar = () => {
    onSave({ series, ...reps, descansoSeg: descanso, cargaInicialKg: cargaKg ?? 0, observacao: obs });
    onClose();
  };

  const setMin = (n: number) => {
    const v = limitar(n, LIMITES.repsMin, LIMITES.repsMax);
    setRepsMin(v);
    if (repsMax < v) setRepsMax(v);
  };

  return (
    <BottomSheet
      visible
      title={ex?.nome ?? 'Exercício'}
      subtitle={`${series} × ${repsLabel(reps)} · descanso ${descanso} s`}
      onClose={onClose}
      footer={<NeonButton label="Pronto" onPress={salvar} disabled={cargaInvalida} />}>
      <Linha label="Séries" valor={String(series)}>
        <Stepper label="séries" onMinus={() => setSeries(limitar(series - 1, LIMITES.seriesMin, LIMITES.seriesMax))} onPlus={() => setSeries(limitar(series + 1, LIMITES.seriesMin, LIMITES.seriesMax))} />
      </Linha>

      <View style={styles.block}>
        <Text variant="label" tone="muted">
          Repetições
        </Text>
        <View style={styles.row}>
          <Opcao label="Faixa" on={!fixo} onPress={() => setFixo(false)} />
          <Opcao label="Número fixo" on={fixo} onPress={() => setFixo(true)} />
        </View>
      </View>
      {fixo ? (
        <Linha label="Repetições" valor={String(repsMin)}>
          <Stepper label="repetições" onMinus={() => setMin(repsMin - 1)} onPlus={() => setMin(repsMin + 1)} />
        </Linha>
      ) : (
        <>
          <Linha label="De" valor={String(repsMin)}>
            <Stepper label="mínimo de repetições" onMinus={() => setMin(repsMin - 1)} onPlus={() => setMin(repsMin + 1)} />
          </Linha>
          <Linha label="Até" valor={String(Math.max(repsMin, repsMax))}>
            <Stepper
              label="máximo de repetições"
              onMinus={() => setRepsMax(limitar(Math.max(repsMin, repsMax) - 1, repsMin, LIMITES.repsMax))}
              onPlus={() => setRepsMax(limitar(Math.max(repsMin, repsMax) + 1, repsMin, LIMITES.repsMax))}
            />
          </Linha>
        </>
      )}

      <View style={styles.block}>
        <Text variant="label" tone="muted">
          Descanso entre séries
        </Text>
        <View style={styles.row}>
          {DESCANSOS.map((s) => (
            <Opcao key={s} label={`${s} s`} on={descanso === s} onPress={() => setDescanso(s)} />
          ))}
        </View>
      </View>

      <TextField
        label="Carga inicial (opcional)"
        unit="kg"
        value={carga}
        onChangeText={setCarga}
        placeholder="Sem carga definida"
        keyboardType="decimal-pad"
        error={cargaInvalida ? 'Use só números, ex.: 20 ou 22,5' : null}
      />
      <TextField label="Observação (opcional)" value={obs} onChangeText={setObs} placeholder="Ex.: pegada fechada, banco a 30°" maxLength={120} />

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          onRemove();
          onClose();
        }}
        style={({ pressed }) => [styles.remove, pressed && styles.pressed]}>
        <Text style={styles.removeText}>Tirar do treino</Text>
      </Pressable>
    </BottomSheet>
  );
}

function Linha({ label, valor, children }: { label: string; valor: string; children: ReactNode }) {
  return (
    <View style={styles.linha}>
      <Text tone="secondary" style={styles.linhaLabel}>
        {label}
      </Text>
      <Text style={styles.valor}>{valor}</Text>
      {children}
    </View>
  );
}

function Opcao({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={onPress} style={[styles.opcao, on && styles.opcaoOn]}>
      <Text style={[styles.opcaoText, { color: on ? colors.onLime : colors.ink2 }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  linhaLabel: {
    flex: 1,
    fontFamily: fonts.body.semibold,
  },
  valor: {
    minWidth: 36,
    textAlign: 'center',
    fontFamily: fonts.display.bold,
    fontSize: 22,
    fontVariant: ['tabular-nums'],
  },
  opcao: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  opcaoOn: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  opcaoText: {
    fontFamily: fonts.body.bold,
    fontSize: 13.5,
  },
  remove: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  removeText: {
    fontFamily: fonts.body.bold,
    color: colors.warnText,
  },
  pressed: {
    opacity: 0.7,
  },
});
