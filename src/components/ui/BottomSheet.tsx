import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, spacing } from '@/theme/theme';

import { Glass } from './Glass';
import { IconButton } from './IconButton';
import { Text } from './Text';

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  /** Fixo embaixo (ex.: o botão de salvar). */
  footer?: ReactNode;
};

/**
 * Folha de vidro que sobe de baixo, por cima da tela atual: fundo escurecido
 * (toque fecha), título com X, miolo rolável e rodapé fixo que sobe com o teclado.
 */
export function BottomSheet({ visible, title, subtitle, onClose, children, footer }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable accessibilityLabel="Fechar" onPress={onClose} style={[StyleSheet.absoluteFill, styles.scrim]} />
        <Glass rounded={28} flush style={styles.sheet} contentStyle={styles.inner}>
          <View style={styles.head}>
            <View style={styles.flex}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? (
                <Text variant="caption" tone="muted">
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <IconButton icon="close" label="Fechar" size={38} onPress={onClose} />
          </View>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.content, !footer && { paddingBottom: insets.bottom + spacing.lg }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
          {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>{footer}</View> : null}
        </Glass>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    backgroundColor: colors.modalScrimSolid,
  },
  sheet: {
    maxHeight: '92%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
    backgroundColor: colors.panel,
  },
  // A folha tem altura máxima; o miolo encolhe e a rolagem fica dentro dele.
  inner: {
    flexShrink: 1,
    minHeight: 0,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  flex: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontFamily: fonts.display.bold,
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: -0.5,
  },
  scroll: {
    flexGrow: 0,
  },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
});
