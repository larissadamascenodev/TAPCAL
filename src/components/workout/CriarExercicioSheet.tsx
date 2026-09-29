import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BottomSheet, NeonButton, Text, TextField } from '@/components/ui';
import { EQUIPAMENTO_LABELS, EQUIPAMENTO_ORDEM, MUSCULO_LABELS, MUSCULO_ORDEM } from '@/lib/exercicios';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import type { Equipamento, Exercicio, Musculo } from '@/types/treino';

type Props = {
  visible: boolean;
  /** Texto da busca, para já vir preenchido. */
  nomeInicial?: string;
  onClose: () => void;
  onCriado: (ex: Exercicio) => void;
};

/** "Não achou? Criar exercício": nome, músculo principal e equipamento. Só a pessoa vê. */
export function CriarExercicioSheet({ visible, nomeInicial = '', onClose, onCriado }: Props) {
  if (!visible) return null;
  return <Formulario nomeInicial={nomeInicial} onClose={onClose} onCriado={onCriado} />;
}

function Formulario({ nomeInicial, onClose, onCriado }: Omit<Props, 'visible'>) {
  const criarExercicio = useAppStore((s) => s.criarExercicio);
  const [nome, setNome] = useState(nomeInicial ?? '');
  const [musculo, setMusculo] = useState<Musculo | null>(null);
  const [equipamento, setEquipamento] = useState<Equipamento | null>(null);
  const pronto = nome.trim().length >= 2 && musculo && equipamento;

  const salvar = () => {
    if (!musculo || !equipamento) return;
    onCriado(criarExercicio({ nome, musculo, equipamento }));
    onClose();
  };

  return (
    <BottomSheet
      visible
      title="Criar exercício"
      subtitle="Fica só na sua biblioteca, sem animação."
      onClose={onClose}
      footer={<NeonButton label="Criar exercício" onPress={salvar} disabled={!pronto} />}>
      <TextField label="Nome" value={nome} onChangeText={setNome} placeholder="Ex.: Remada no TRX" maxLength={60} autoFocus={!nomeInicial} />
      <View style={styles.block}>
        <Text variant="label" tone="muted">
          Músculo principal
        </Text>
        <View style={styles.wrap}>
          {MUSCULO_ORDEM.map((m) => (
            <Opcao key={m} label={MUSCULO_LABELS[m]} on={musculo === m} onPress={() => setMusculo(m)} />
          ))}
        </View>
      </View>
      <View style={styles.block}>
        <Text variant="label" tone="muted">
          Equipamento
        </Text>
        <View style={styles.wrap}>
          {EQUIPAMENTO_ORDEM.map((q) => (
            <Opcao key={q} label={EQUIPAMENTO_LABELS[q]} on={equipamento === q} onPress={() => setEquipamento(q)} />
          ))}
        </View>
      </View>
    </BottomSheet>
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
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  opcao: {
    height: 36,
    paddingHorizontal: 13,
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
    fontSize: 13,
  },
});
