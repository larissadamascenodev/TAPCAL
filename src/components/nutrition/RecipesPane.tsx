import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { FoodVisual, type VisualTone } from '@/components/ui/FoodVisual';
import { Glass } from '@/components/ui/Glass';
import { Text } from '@/components/ui/Text';
import { FEATURED_RECIPE, RECIPE_FILTERS, SAMPLE_RECIPES } from '@/data/recipesSample';
import { formatInt } from '@/lib/format';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import type { Recipe } from '@/types';

type Filter = (typeof RECIPE_FILTERS)[number];

/** Fundo de cada receita de exemplo, alternando as cores. */
const TONES: VisualTone[] = ['jantar', 'verde', 'sol', 'cafe_da_manha', 'almoco', 'lanche', 'sol', 'cafe_da_manha'];

function tagStyle(tag: Recipe['tag']) {
  if (tag === 'Alta proteína') return { bg: colors.lime, fg: colors.onLime };
  if (tag === 'Low carb') return { bg: colors.mint, fg: colors.onMint };
  return { bg: colors.tagGlass, fg: colors.ink };
}

/** Aba Receitas: busca, filtros, receita da semana e a grade de receitas (exemplo). */
export function RecipesPane({ kcalLeft }: { kcalLeft: number }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('Todas');
  const [favs, setFavs] = useState<Set<string>>(() => new Set());

  const q = query.trim().toLowerCase();
  const list = SAMPLE_RECIPES.filter((r) => {
    if (filter === 'Favoritas' && !favs.has(r.id)) return false;
    if (filter !== 'Todas' && filter !== 'Favoritas' && !r.categories.includes(filter)) return false;
    return !q || r.name.toLowerCase().includes(q);
  });

  const toggleFav = (id: string) =>
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const f = FEATURED_RECIPE;
  return (
    <View>
      <Glass flush rounded={24} contentStyle={styles.search}>
        <Ionicons name="search" size={18} color={colors.ink3} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar receita"
          placeholderTextColor={colors.ink3}
          selectionColor={colors.lime2}
          keyboardAppearance="dark"
          returnKeyType="search"
          accessibilityLabel="Buscar receita"
          style={styles.input}
        />
      </Glass>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={styles.filtersRow}>
        {RECIPE_FILTERS.map((name) => {
          const on = name === filter;
          return (
            <Pressable
              key={name}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => setFilter(name)}
              style={[styles.filter, on && styles.filterOn]}>
              {name === 'Favoritas' && <Ionicons name="heart" size={12} color={on ? colors.onLime : colors.heart} />}
              <Text style={[styles.filterText, on && styles.filterTextOn]}>{name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Glass flush rounded={28} style={styles.featured}>
        <FoodVisual emoji={f.emoji} tone="sol" height={150} plate={108} style={styles.featuredVisual}>
          <View style={styles.featuredText}>
            <View style={[styles.tag, { backgroundColor: colors.tagGlass }]}>
              <Text style={styles.tagText}>Receita da semana</Text>
            </View>
            <Text style={styles.featuredName}>{f.name}</Text>
          </View>
        </FoodVisual>
        <View style={styles.featuredBody}>
          <Meta minutes={f.minutes} kcal={f.kcal} protein={f.proteinG} />
          {f.kcal <= kcalLeft && <Text style={styles.fits}>Cabe no seu dia</Text>}
        </View>
      </Glass>

      <View style={styles.grid}>
        {list.map((r) => {
          const tone = TONES[SAMPLE_RECIPES.indexOf(r) % TONES.length];
          const t = tagStyle(r.tag);
          const fav = favs.has(r.id);
          return (
            <Glass key={r.id} flush rounded={22} style={styles.card}>
              <FoodVisual emoji={r.emoji} tone={tone} height={108} plate={66}>
                <View style={[styles.tag, styles.cardTag, { backgroundColor: t.bg }]}>
                  <Text style={[styles.tagText, { color: t.fg }]}>{r.tag}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={fav ? `Tirar ${r.name} das favoritas` : `Favoritar ${r.name}`}
                  hitSlop={6}
                  onPress={() => toggleFav(r.id)}
                  style={styles.fav}>
                  <Ionicons name={fav ? 'heart' : 'heart-outline'} size={15} color={fav ? colors.heart : colors.ink} />
                </Pressable>
              </FoodVisual>
              <View style={styles.cardBody}>
                <Text style={styles.cardName} numberOfLines={2}>
                  {r.name}
                </Text>
                <Meta minutes={r.minutes} kcal={r.kcal} />
              </View>
            </Glass>
          );
        })}
        {!list.length && (
          <Text variant="caption" tone="muted" style={styles.empty}>
            Nenhuma receita encontrada. Tente outra palavra ou filtro.
          </Text>
        )}
      </View>

      <View style={styles.source}>
        <Ionicons name="shield-checkmark-outline" size={16} color={colors.ink3} />
        <Text variant="caption" tone="muted" style={styles.sourceText}>
          Receitas de fontes confiáveis, com calorias e macros calculados pela tabela TACO.
        </Text>
      </View>
    </View>
  );
}

function Meta({ minutes, kcal, protein }: { minutes: number; kcal: number; protein?: number }) {
  return (
    <View style={styles.meta}>
      <View style={styles.metaItem}>
        <Ionicons name="time-outline" size={12} color={colors.ink3} />
        <Text style={styles.metaText}>{minutes} min</Text>
      </View>
      <View style={styles.metaItem}>
        <Ionicons name="flame-outline" size={12} color={colors.ink3} />
        <Text style={styles.metaText}>{formatInt(kcal)} kcal</Text>
      </View>
      {protein != null && <Text style={styles.metaText}>{protein} g proteína</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    paddingHorizontal: spacing.lg,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: fonts.body.medium,
    fontSize: 14.5,
    color: colors.ink,
  },
  filters: {
    marginTop: spacing.md,
    marginHorizontal: -spacing.lg,
  },
  filtersRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  filter: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.glassSubtle,
    borderWidth: 1,
    borderColor: colors.line,
  },
  filterOn: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  filterText: {
    fontFamily: fonts.body.bold,
    fontSize: 12.5,
    lineHeight: 16,
    color: colors.ink2,
  },
  filterTextOn: {
    color: colors.onLime,
  },
  featured: {
    marginTop: 14,
  },
  featuredVisual: {
    justifyContent: 'center',
  },
  featuredText: {
    position: 'absolute',
    left: 18,
    top: 18,
    bottom: 16,
    width: '55%',
    justifyContent: 'space-between',
  },
  featuredName: {
    fontFamily: fonts.display.semibold,
    fontSize: 19,
    lineHeight: 24,
    letterSpacing: -0.4,
  },
  featuredBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  fits: {
    fontFamily: fonts.body.bold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.lime,
  },
  tag: {
    alignSelf: 'flex-start',
    height: 22,
    paddingHorizontal: 9,
    borderRadius: 11,
    justifyContent: 'center',
  },
  cardTag: {
    position: 'absolute',
    left: 10,
    bottom: 10,
  },
  tagText: {
    fontFamily: fonts.body.bold,
    fontSize: 10.5,
    lineHeight: 14,
  },
  fav: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tagGlass,
    borderWidth: 1,
    borderColor: colors.line,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  card: {
    width: '48.4%',
  },
  cardBody: {
    padding: 12,
    gap: 6,
  },
  cardName: {
    fontFamily: fonts.body.bold,
    fontSize: 14,
    lineHeight: 18,
    minHeight: 36,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontFamily: fonts.body.bold,
    fontSize: 11,
    lineHeight: 15,
    color: colors.ink3,
  },
  empty: {
    width: '100%',
    marginTop: spacing.sm,
  },
  source: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 2,
  },
  sourceText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
  },
});
