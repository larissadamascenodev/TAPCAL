import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme/theme';

import { BackdropGlow } from './BackdropGlow';
import { IconButton } from './IconButton';

type Props = {
  /** Selo do topo (ex.: "BUSCAR ALIMENTO"). */
  badge: ReactNode;
  onClose: () => void;
  /** Botão à esquerda do selo (ex.: voltar). */
  leading?: ReactNode;
  children: ReactNode;
  /** Fixo embaixo, sobe junto com o teclado (ex.: o botão neon de salvar). */
  footer?: ReactNode;
};

/**
 * Moldura premium das telas que abrem por cima (adicionar alimento): fundo
 * escuro com o verde suave, alça, selo com o X, conteúdo rolável e rodapé fixo.
 */
export function GlassModal({ badge, onClose, leading, children, footer }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}>
      <BackdropGlow />
      <View style={styles.handle} />
      <View style={styles.top}>
        {leading}
        <View style={styles.badge}>{badge}</View>
        <IconButton icon="close" label="Fechar" size={38} onPress={onClose} />
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>{footer}</View> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ground,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.handle,
    marginTop: spacing.md,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  badge: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: 14,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
});
