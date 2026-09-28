import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { colors, fonts } from '@/theme/theme';

import { Text } from './Text';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
};

/** Fileira de pílulas para escolher uma opção (ex.: em qual refeição salvar). */
export function ChipGroup<T extends string>({ options, value, onChange, label }: Props<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={[styles.chip, on && styles.chipOn]}>
            <Text style={[styles.text, { color: on ? colors.onInk : colors.ink2 }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 6,
  },
  chip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipOn: {
    backgroundColor: colors.ink,
    borderColor: 'transparent',
  },
  text: {
    fontFamily: fonts.body.semibold,
    fontSize: 13,
    lineHeight: 17,
  },
});
