import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, Share, StyleSheet, Text as RNText, View } from 'react-native';

import { CheckCircle } from '@/components/ui/CheckCircle';
import { SegmentCaps } from '@/components/ui/SegmentCaps';
import { Text } from '@/components/ui/Text';
import { toast } from '@/components/ui/Toast';
import { SAMPLE_MARKET, SAMPLE_MARKET_CHECKED } from '@/data/marketSample';
import { addDays } from '@/lib/dates';
import { formatDayMonth } from '@/lib/format';
import { startOfWeek } from '@/lib/workout';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import type { DateKey } from '@/types';

/** Aba Mercado: lista da semana gerada do plano, com checklist por seção (exemplo). */
export function MarketPane({ today }: { today: DateKey }) {
  const [checked, setChecked] = useState<Set<string>>(() => new Set(SAMPLE_MARKET_CHECKED));
  const all = SAMPLE_MARKET.reduce((n, s) => n + s.items.length, 0);
  const monday = startOfWeek(today);
  const range = `${formatDayMonth(monday)} a ${formatDayMonth(addDays(monday, 6))}`;

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const share = () => {
    const text = SAMPLE_MARKET.map(
      (s) => `${s.name}\n${s.items.map((i) => `${checked.has(i.id) ? '✓' : '○'} ${i.name} · ${i.quantity}`).join('\n')}`,
    ).join('\n\n');
    Share.share({ message: `Lista do mercado (${range})\n\n${text}` }).catch(() => toast('Não deu para compartilhar agora'));
  };

  return (
    <View>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.eyebrow}>GERADA DO SEU PLANO</Text>
          <Text style={styles.h2}>Lista da semana</Text>
          <Text variant="caption" tone="secondary">
            {range} · 4 refeições por dia
          </Text>
        </View>
        <Text style={styles.count}>
          {checked.size}
          <Text style={styles.countOf}>/{all}</Text>
        </Text>
      </View>
      <SegmentCaps fraction={checked.size / all} count={36} style={styles.caps} />
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={share} style={({ pressed }) => [styles.pill, pressed && styles.pressed]}>
          <Ionicons name="share-outline" size={15} color={colors.ink} />
          <Text style={styles.pillText}>Compartilhar</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => toast('Em breve a lista acompanha o seu plano')}
          style={({ pressed }) => [styles.pill, pressed && styles.pressed]}>
          <Ionicons name="refresh" size={15} color={colors.ink} />
          <Text style={styles.pillText}>Atualizar do plano</Text>
        </Pressable>
      </View>

      {SAMPLE_MARKET.map((section) => {
        const done = section.items.filter((i) => checked.has(i.id)).length;
        return (
          <View key={section.name} style={styles.section}>
            <View style={styles.sectionHead}>
              <View style={styles.thumb}>
                <RNText style={styles.emoji}>{section.emoji}</RNText>
              </View>
              <Text style={styles.sectionName}>{section.name}</Text>
              <Text variant="caption" tone="muted" style={styles.sectionCount}>
                {done} de {section.items.length}
              </Text>
            </View>
            {section.items.map((item) => {
              const on = checked.has(item.id);
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`${item.name}, ${item.quantity}`}
                  onPress={() => toggle(item.id)}
                  style={styles.row}>
                  <CheckCircle checked={on} />
                  <Text style={[styles.name, on && styles.nameDone]}>{item.name}</Text>
                  <Text variant="caption" tone="muted" style={styles.qty}>
                    {item.quantity}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        );
      })}

      <Pressable
        accessibilityRole="button"
        onPress={() => toast('Em breve você adiciona itens à lista')}
        style={({ pressed }) => [styles.addItem, pressed && styles.pressed]}>
        <Ionicons name="add" size={18} color={colors.ink2} />
        <Text variant="caption" tone="secondary" style={styles.addText}>
          Adicionar item
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing.md,
    paddingHorizontal: 2,
  },
  headText: {
    flex: 1,
  },
  eyebrow: {
    fontFamily: fonts.body.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.5,
    color: colors.lime,
  },
  h2: {
    marginTop: 6,
    marginBottom: 2,
    fontFamily: fonts.display.semibold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.7,
  },
  count: {
    fontFamily: fonts.display.bold,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  countOf: {
    fontFamily: fonts.display.semibold,
    fontSize: 15,
    color: colors.ink3,
  },
  caps: {
    marginTop: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 14,
  },
  pill: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pillText: {
    fontFamily: fonts.body.bold,
    fontSize: 12.5,
    lineHeight: 16,
  },
  section: {
    marginTop: 26,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 2,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  thumb: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  emoji: {
    fontSize: 17,
    lineHeight: 22,
  },
  sectionName: {
    flex: 1,
    fontFamily: fonts.display.semibold,
    fontSize: 16,
    lineHeight: 20,
  },
  sectionCount: {
    fontFamily: fonts.body.bold,
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  name: {
    flex: 1,
    fontFamily: fonts.body.bold,
    fontSize: 14.5,
    lineHeight: 19,
  },
  nameDone: {
    color: colors.ink3,
    textDecorationLine: 'line-through',
  },
  qty: {
    fontFamily: fonts.body.bold,
    fontSize: 12.5,
  },
  addItem: {
    height: 50,
    marginTop: 22,
    borderRadius: 25,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.dashed,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addText: {
    fontFamily: fonts.body.bold,
    fontSize: 13.5,
  },
  pressed: {
    opacity: 0.7,
  },
});
