import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { colors, typography, type TypographyVariant } from '@/theme/theme';

type Tone = 'primary' | 'secondary' | 'muted' | 'accent' | 'onEmber';

const toneColor: Record<Tone, string> = {
  primary: colors.ink,
  secondary: colors.ink2,
  muted: colors.ink3,
  accent: colors.ember2,
  onEmber: colors.onEmber,
};

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  tone?: Tone;
};

/** Texto do app: sempre usa uma variante do tema (Sora ou Manrope). */
export function Text({ variant = 'body', tone = 'primary', style, ...rest }: TextProps) {
  return <RNText style={[typography[variant], { color: toneColor[tone] }, style]} {...rest} />;
}
