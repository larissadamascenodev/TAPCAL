/**
 * Atalhos de fora do app (toque duplo na traseira do iPhone, app Atalhos,
 * widgets): cada um é um link tapcal://atalho/<ação>.
 */

export type ShortcutAction = 'foto' | 'agua' | 'treino';

export const SHORTCUT_ACTIONS: readonly ShortcutAction[] = ['foto', 'agua', 'treino'];

/** Quanto de água cada atalho soma. */
export const SHORTCUT_WATER_ML = 250;

/** Lê a ação do link; qualquer outra coisa vira null. */
export function parseShortcut(value: unknown): ShortcutAction | null {
  const v = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return SHORTCUT_ACTIONS.includes(v as ShortcutAction) ? (v as ShortcutAction) : null;
}

/** Link único: abre a escolha entre foto, água e treino. */
export const SHORTCUT_MENU_URL = 'tapcal://atalho';

/** Link direto de uma ação (app instalado, com o esquema tapcal). */
export function shortcutUrl(action: ShortcutAction): string {
  return `${SHORTCUT_MENU_URL}/${action}`;
}
