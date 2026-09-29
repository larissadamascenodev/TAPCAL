import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { DishTitle, SheetBadge } from '@/components/nutrition/PlateSheet';
import { confirmDestructive, Glass, GlassModal, NeonButton, Text, toast } from '@/components/ui';
import { formatDayMonth } from '@/lib/format';
import { DIA_CURTO } from '@/lib/treino/semana';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import type { PlanoDeTreino } from '@/types/treino';

const ORIGEM: Record<PlanoDeTreino['origem'], string> = {
  personalizado: 'Do meu jeito',
  ia: 'Montado pela IA',
};

/** Meus treinos: um plano ativo por vez; os outros ficam guardados para ativar, duplicar ou apagar. */
export default function MeusTreinosScreen() {
  const planos = useAppStore((s) => s.planos);
  const sessaoAtiva = useAppStore((s) => s.sessaoAtiva);
  const { ativarPlano, duplicarPlano, apagarPlano } = useAppStore();
  const ordenados = [...planos].sort((a, b) => Number(b.ativo) - Number(a.ativo) || b.criadoEm.localeCompare(a.criadoEm));

  const ativar = (p: PlanoDeTreino) => {
    ativarPlano(p.id);
    toast(`"${p.nome}" agora é o seu treino`);
  };

  const apagar = (p: PlanoDeTreino) =>
    confirmDestructive(
      'Apagar treino?',
      p.ativo ? 'Este é o seu treino ativo. Os treinos já feitos continuam no histórico.' : 'Os treinos já feitos continuam no histórico.',
      'Apagar',
      () => apagarPlano(p.id),
    );

  return (
    <GlassModal
      badge={<SheetBadge icon="albums-outline" label="MEUS TREINOS" />}
      onClose={() => router.back()}
      footer={<NeonButton label="Criar treino" onPress={() => router.push('/treino-novo')} />}>
      <DishTitle>Seus treinos</DishTitle>
      <Text tone="secondary">Um treino fica ativo por vez: é ele que aparece na semana.</Text>

      {!ordenados.length && (
        <Text tone="muted" style={styles.empty}>
          Você ainda não criou nenhum treino.
        </Text>
      )}

      {ordenados.map((p) => {
        const emUso = sessaoAtiva?.planoId === p.id;
        return (
          <Glass key={p.id} contentStyle={styles.card} style={p.ativo && styles.activeCard}>
            <View style={styles.titleRow}>
              <Text style={styles.name} numberOfLines={2}>
                {p.nome}
              </Text>
              {p.ativo && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>ATIVO</Text>
                </View>
              )}
            </View>
            <Text variant="caption" tone="muted">
              {ORIGEM[p.origem]} · criado em {formatDayMonth(p.criadoEm.slice(0, 10))}
            </Text>
            <View style={styles.days}>
              {p.treinos.map((t) => (
                <View key={t.id} style={styles.day}>
                  <Text style={styles.dayText}>{DIA_CURTO[t.dia]}</Text>
                </View>
              ))}
            </View>
            <Text variant="caption" tone="secondary" numberOfLines={2}>
              {p.treinos.map((t) => t.nome).join(' · ')}
            </Text>
            <View style={styles.actions}>
              {!p.ativo && <Action icon="checkmark-circle-outline" label="Ativar" accent onPress={() => ativar(p)} />}
              <Action icon="create-outline" label="Editar" onPress={() => router.push({ pathname: '/treino-editor', params: { planoId: p.id } })} />
              <Action
                icon="copy-outline"
                label="Duplicar"
                onPress={() => {
                  duplicarPlano(p.id);
                  toast('Cópia criada');
                }}
              />
              <Action
                icon="trash-outline"
                label="Apagar"
                danger
                disabled={emUso}
                onPress={() => (emUso ? toast('Termine o treino em andamento antes') : apagar(p))}
              />
            </View>
          </Glass>
        );
      })}
    </GlassModal>
  );
}

function Action({
  icon,
  label,
  accent,
  danger,
  disabled,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  accent?: boolean;
  danger?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const color = accent ? colors.lime : danger ? colors.warnText : colors.ink2;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      style={({ pressed }) => [styles.action, accent && styles.actionAccent, (pressed || disabled) && styles.dim]}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.actionText, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  empty: {
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  card: {
    gap: 8,
    padding: 16,
  },
  activeCard: {
    borderColor: colors.limeEdge,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    fontFamily: fonts.display.semibold,
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.5,
  },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.limeTint,
  },
  badgeText: {
    fontFamily: fonts.body.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.lime,
  },
  days: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  day: {
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 12,
    justifyContent: 'center',
    backgroundColor: colors.track,
  },
  dayText: {
    fontFamily: fonts.body.bold,
    fontSize: 10.5,
    letterSpacing: 0.8,
    color: colors.ink2,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 4,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  actionAccent: {
    backgroundColor: colors.limeWash,
    borderColor: colors.limeEdge,
  },
  actionText: {
    fontFamily: fonts.body.bold,
    fontSize: 13,
  },
  dim: {
    opacity: 0.5,
  },
});
