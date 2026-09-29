import type { ReactNode, RefObject } from 'react';
import { useState } from 'react';
import type { ScrollView } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { PilulaAoVivo } from '@/components/workout/PilulaAoVivo';
import { currentStreak } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';

import { APP_HEADER_H, AppHeader } from './AppHeader';

/** Basta começar a rolar: o nome aparece com um fade e o fundo do topo escurece. */
const SCROLLED_AT = 8;

type Props = {
  children: ReactNode;
  /** Algo fixo logo abaixo do topo (ex.: as abas da Alimentação) e a altura dele. */
  below?: ReactNode;
  belowHeight?: number;
  gap?: number;
  /** Força do verde de fundo (1 = normal). */
  brilho?: number;
  scrollRef?: RefObject<ScrollView | null>;
  /** Não mostra a pílula do treino em andamento no topo (a aba Treino já tem o card). */
  semAoVivo?: boolean;
};

/**
 * Moldura das abas: o mesmo topo da Início (avatar, nome ao rolar, chama da
 * sequência e notificações) por cima da rolagem, com o fundo verde suave.
 */
export function TabPage({ children, below, belowHeight = 0, gap, brilho, scrollRef, semAoVivo }: Props) {
  const name = useAppStore((s) => s.profile?.name.trim() ?? '');
  const streakDays = useAppStore((s) => currentStreak(s, s.today.date));
  const [scrolled, setScrolled] = useState(false);
  const aoVivo = useAppStore((s) => !!s.sessaoAtiva) && !semAoVivo;

  return (
    <Screen
      gap={gap}
      brilho={brilho}
      scrollRef={scrollRef}
      topOffset={APP_HEADER_H + belowHeight}
      onScrollY={(y) => setScrolled(y > SCROLLED_AT)}
      overlay={<AppHeader name={name} streakDays={streakDays} scrolled={scrolled} below={below} belowHeight={belowHeight} centro={aoVivo ? <PilulaAoVivo /> : undefined} />}>
      {children}
    </Screen>
  );
}
