import { Alert, Platform } from 'react-native';

/**
 * Pergunta de confirmação com ação destrutiva (ex.: apagar alimento).
 * No iPhone usa o alerta nativo; na web, o confirm do navegador.
 */
export function confirmDestructive(title: string, message: string, action: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: action, style: 'destructive', onPress: onConfirm },
  ]);
}
