import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedProps, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { tempoDaSerieMs } from '@/lib/treino/met';
import { colors } from '@/theme/theme';
import type { SessaoEmAndamento } from '@/types/treino';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Caminho do contorno do cartão: começa no canto de cima à esquerda (depois da curva) e segue no sentido do relógio até voltar a ele. */
export function contorno(w: number, h: number, r: number, m: number) {
  const x0 = m;
  const y0 = m;
  const x1 = w - m;
  const y1 = h - m;
  const d = `M${x0 + r} ${y0}H${x1 - r}A${r} ${r} 0 0 1 ${x1} ${y0 + r}V${y1 - r}A${r} ${r} 0 0 1 ${x1 - r} ${y1}H${x0 + r}A${r} ${r} 0 0 1 ${x0} ${y1 - r}V${y0 + r}A${r} ${r} 0 0 1 ${x0 + r} ${y0}Z`;
  const perimetro = 2 * (x1 - x0 + (y1 - y0)) - 8 * r + 2 * Math.PI * r;
  return { d, perimetro };
}

/** Quanto dura a troca treino ↔ descanso na linha (cor e posição). */
export const TROCA_MS = 800;
const SAI_DA_TROCA = Easing.out(Easing.cubic);

/**
 * A linha em volta do cartão, deslizando sem pulos: no treino dá uma volta a
 * cada minuto (pelo tempo de treino); no descanso vai do que falta até zero.
 * Pausado, fica parada.
 *
 * Na troca, nada pula: ao entrar no descanso a linha enche o cartão enquanto
 * fica branca e só então começa a esvaziar; ao voltar ao treino ela cresce do
 * canto até o ponto do minuto enquanto fica verde, com um brilho que acende e
 * apaga. Ao aparecer, a linha também cresce do canto.
 */
function useVolta({ sessao, descansando, perimetro }: { sessao: SessaoEmAndamento; descansando: boolean; perimetro: number }) {
  const reduce = useReducedMotion();
  const p = useSharedValue(0);
  const modo = useSharedValue(descansando ? 1 : 0);
  const brilho = useSharedValue(0);
  const pausado = !!sessao.pausadoEm;
  // Modo da última passada (null = acabou de aparecer): a animação de troca só roda quando o modo muda.
  const modoAnterior = useRef<boolean | null>(null);
  useEffect(() => {
    const agora = Date.now();
    const mudou = modoAnterior.current !== descansando;
    modoAnterior.current = descansando;
    const troca = reduce || !mudou ? 0 : TROCA_MS;
    if (mudou) {
      modo.set(withTiming(descansando ? 1 : 0, { duration: troca, easing: SAI_DA_TROCA }));
      if (troca) brilho.set(withSequence(withTiming(1, { duration: troca * 0.4 }), withTiming(0, { duration: troca * 0.9 })));
    }
    cancelAnimation(p);
    if (descansando && sessao.descansoAte) {
      // O descanso corre no relógio (mesmo com o treino pausado): enche até onde ele vai estar e esvazia dali.
      const falta = Math.max(0, Date.parse(sessao.descansoAte) - agora);
      const total = Math.max(1, sessao.descansoSeg ?? 1) * 1000;
      const ajuste = troca || 300; // ±15 s: desliza até a nova posição em vez de pular
      const depois = Math.max(0, falta - ajuste);
      p.set(
        withSequence(
          withTiming(Math.min(1, depois / total), { duration: Math.min(ajuste, falta), easing: SAI_DA_TROCA }),
          withTiming(0, { duration: depois, easing: Easing.linear }),
        ),
      );
      return;
    }
    // Uma volta por minuto da série da vez: começa do zero quando o descanso acaba.
    const ms = tempoDaSerieMs(sessao, agora);
    if (pausado) {
      // Pausado: a linha para onde está (só se ajeita se o card acabou de aparecer).
      if (mudou) p.set((ms % 60_000) / 60_000);
      return;
    }
    const base = ((ms + troca) % 60_000) / 60_000;
    const ciclo = withSequence(
      withTiming(1, { duration: (1 - base) * 60_000, easing: Easing.linear }),
      withRepeat(withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: 60_000, easing: Easing.linear })), -1),
    );
    // Na troca (ou ao aparecer) cresce do canto até o ponto; ao voltar da pausa segue de onde parou.
    p.set(troca ? withSequence(withTiming(0, { duration: 0 }), withTiming(base, { duration: troca, easing: SAI_DA_TROCA }), ciclo) : ciclo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [descansando, pausado, sessao.descansoAte, sessao.descansoSeg, sessao.inicio, sessao.pausaMs, sessao.serieDesdeMs]);
  // Cada linha lê `p` direto: o Reanimated só acompanha os valores que aparecem no próprio updater
  // (lidos por uma função auxiliar, a linha só andava quando a tela redesenhava, a cada segundo).
  const verde = useAnimatedProps(() => ({ strokeDashoffset: perimetro * (1 - Math.max(0.0005, p.get())), strokeOpacity: 1 - modo.get() }));
  const branca = useAnimatedProps(() => ({ strokeDashoffset: perimetro * (1 - Math.max(0.0005, p.get())), strokeOpacity: modo.get() }));
  const brilhoVerde = useAnimatedProps(() => ({
    strokeDashoffset: perimetro * (1 - Math.max(0.0005, p.get())),
    strokeOpacity: brilho.get() * (1 - modo.get()),
  }));
  const brilhoBranco = useAnimatedProps(() => ({ strokeDashoffset: perimetro * (1 - Math.max(0.0005, p.get())), strokeOpacity: brilho.get() * modo.get() }));
  return { verde, branca, brilhoVerde, brilhoBranco };
}


/**
 * A linha do treino em andamento em volta de uma forma arredondada (o card da
 * aba Treino, a pílula do tempo no treino ao vivo): verde no treino, branca no
 * descanso, com o brilho da troca. Fica por cima, sem pegar toques.
 */
export function LinhaAoVivo({
  sessao,
  descansando,
  largura,
  altura,
  raio,
  traco = 2.5,
}: {
  sessao: SessaoEmAndamento;
  descansando: boolean;
  largura: number;
  altura: number;
  raio: number;
  traco?: number;
}) {
  const { d, perimetro } = contorno(largura, altura, Math.min(raio, altura / 2 - traco / 2), traco / 2);
  const volta = useVolta({ sessao, descansando, perimetro });
  return (
    <Svg width={largura} height={altura} style={styles.linha} pointerEvents="none">
      {/* Brilho largo da troca, embaixo, e as duas linhas (verde do treino, branca do descanso) trocando de cor */}
      {[
        { cor: colors.tracoBrilho, largura: traco * 4, props: volta.brilhoVerde, k: 'bv' },
        { cor: colors.tracoBrilhoBranco, largura: traco * 4, props: volta.brilhoBranco, k: 'bb' },
        { cor: colors.lime, largura: traco, props: volta.verde, k: 'v' },
        { cor: colors.ink, largura: traco, props: volta.branca, k: 'b' },
      ].map((l) => (
        <AnimatedPath
          key={l.k}
          d={d}
          fill="none"
          stroke={l.cor}
          strokeWidth={l.largura}
          strokeLinecap="round"
          strokeDasharray={`${perimetro} ${perimetro}`}
          animatedProps={l.props}
        />
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  linha: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
