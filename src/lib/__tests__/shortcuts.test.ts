import { describe, expect, it } from '@jest/globals';

import { parseShortcut, shortcutUrl } from '@/lib/shortcuts';

describe('atalhos do toque traseiro', () => {
  it('reconhece as três ações, sem ligar para maiúsculas', () => {
    expect(parseShortcut('foto')).toBe('foto');
    expect(parseShortcut('AGUA')).toBe('agua');
    expect(parseShortcut(' treino ')).toBe('treino');
  });

  it('ignora ações desconhecidas ou vazias', () => {
    expect(parseShortcut('pizza')).toBeNull();
    expect(parseShortcut(undefined)).toBeNull();
    expect(parseShortcut(['foto'])).toBeNull();
  });

  it('monta o link que o app Atalhos abre', () => {
    expect(shortcutUrl('agua')).toBe('tapcal://atalho/agua');
  });
});
