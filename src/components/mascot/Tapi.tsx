import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cubicBezier, useReducedMotion, type CSSAnimationKeyframes } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';

import type { Mood } from '@/lib/mascot';
import { colors, mascotColors } from '@/theme/theme';

import {
  PIVOTS,
  TapiAntenna,
  TapiArm,
  TapiBody,
  TapiDefs,
  TapiEyes,
  TapiFace,
  TapiHead,
  TapiShadow,
  VIEW_H,
  VIEW_W,
  blinks,
  heartPath,
  type EyesKind,
  type MouthKind,
} from './TapiArt';

/** Pose de uma parte: deslocamento (em unidades do desenho), giro em graus, escala e opacidade. */
type Pose = { x?: number; y?: number; r?: number; sx?: number; sy?: number; o?: number };

type Anim = {
  frames: Record<string, Pose>;
  ms: number;
  ease?: 'ease-in-out' | 'ease-out' | 'ease-in' | 'linear' | ReturnType<typeof cubicBezier>;
  once?: boolean;
  alternate?: boolean;
  delay?: number;
};

/** Cada parte ou está animando em loop, ou parada numa pose (com transição suave). */
type Motion = Anim | Pose;

type Part = 'all' | 'shadow' | 'head' | 'antL' | 'antR' | 'armL' | 'armR' | 'eyes';

const BOUNCE = cubicBezier(0.3, 0, 0.3, 1);
const SPRING = cubicBezier(0.3, 1.4, 0.5, 1);

/** Movimento de repouso: respira, balança a cabeça, mexe as antenas e pisca. */
const BASE: Record<Part, Motion> = {
  all: { frames: { '0%': {}, '50%': { sx: 1.015, sy: 0.985 }, '100%': {} }, ms: 3200 },
  shadow: { frames: { '0%': {}, '50%': { sx: 0.96 }, '100%': {} }, ms: 3200 },
  head: { frames: { '0%': {}, '50%': { r: 1.5, y: 1 }, '100%': {} }, ms: 4000 },
  antL: { frames: { '0%': {}, '50%': { r: -8 }, '100%': {} }, ms: 2400 },
  antR: { frames: { '0%': {}, '50%': { r: 8 }, '100%': {} }, ms: 2400, delay: 300 },
  armL: { r: 10 },
  armR: { r: -10 },
  eyes: {
    frames: { '0%': {}, '92%': {}, '95%': { sy: 0.1 }, '100%': {} },
    ms: 4600,
    ease: 'linear',
  },
};

const JUMP_SHADOW: Anim = {
  frames: { '0%': { o: 1 }, '45%': { sx: 0.7, o: 0.45 }, '100%': { o: 1 } },
  ms: 900,
  ease: BOUNCE,
};

/** O que muda em cada humor, por cima do repouso. */
const MOODS: Record<Mood, Partial<Record<Part, Motion>>> = {
  feliz: {
    all: {
      frames: {
        '0%': {},
        '60%': {},
        '70%': { y: 2, sx: 1.04, sy: 0.96 },
        '82%': { y: -12, sx: 0.98, sy: 1.02 },
        '100%': {},
      },
      ms: 1800,
      ease: BOUNCE,
    },
    shadow: {
      frames: { '0%': { o: 1 }, '60%': { o: 1 }, '82%': { sx: 0.8, o: 0.6 }, '100%': { o: 1 } },
      ms: 1800,
      ease: BOUNCE,
    },
    armL: { frames: { '0%': { r: 14 }, '50%': { r: 4 }, '100%': { r: 14 } }, ms: 1800 },
    armR: { frames: { '0%': { r: -14 }, '50%': { r: -4 }, '100%': { r: -14 } }, ms: 1800 },
  },
  acenando: {
    armR: { frames: { '0%': { r: -150 }, '50%': { r: -118 }, '100%': { r: -150 } }, ms: 1100 },
    head: { frames: { '0%': {}, '50%': { r: -5 }, '100%': {} }, ms: 2200 },
  },
  pensando: {
    armR: { frames: { '0%': { r: 136 }, '50%': { r: 130 }, '100%': { r: 136 } }, ms: 1600 },
    head: { r: -8 },
  },
  comemorando: {
    all: {
      frames: {
        '0%': { sx: 1.05, sy: 0.95 },
        '45%': { y: -26, sx: 0.97, sy: 1.03 },
        '100%': { sx: 1.05, sy: 0.95 },
      },
      ms: 900,
      ease: BOUNCE,
    },
    shadow: JUMP_SHADOW,
    armL: { frames: { '0%': { r: 150 }, '100%': { r: 172 } }, ms: 450, alternate: true },
    armR: { frames: { '0%': { r: -150 }, '100%': { r: -172 } }, ms: 450, alternate: true },
    antL: { frames: { '0%': { r: -24 }, '100%': { r: 2 } }, ms: 450, alternate: true },
    antR: { frames: { '0%': { r: 24 }, '100%': { r: -2 } }, ms: 450, alternate: true },
  },
  apaixonado: {
    all: { frames: { '0%': { r: -4 }, '50%': { r: 4 }, '100%': { r: -4 } }, ms: 2400 },
    armL: { r: -40 },
    armR: { r: 40 },
  },
  preocupado: {
    head: {
      frames: {
        '0%': { y: 3 },
        '70%': { y: 3 },
        '74%': { x: -2, y: 3 },
        '78%': { x: 2, y: 3 },
        '82%': { x: -1, y: 3 },
        '100%': { y: 3 },
      },
      ms: 2600,
    },
    armL: { r: -26 },
    armR: { r: 26 },
    antL: { r: -30 },
    antR: { r: 30 },
  },
};

/** Pulinho com giro quando alguém toca no Tapi. */
const POKE: Partial<Record<Part, Motion>> = {
  all: {
    frames: {
      '0%': {},
      '15%': { sx: 1.08, sy: 0.9 },
      '50%': { y: -34, r: -8, sx: 0.96, sy: 1.05 },
      '75%': { y: -8, r: 4 },
      '100%': {},
    },
    ms: 800,
    ease: BOUNCE,
    once: true,
  },
  shadow: { ...JUMP_SHADOW, ms: 800, once: true },
};

const FACES: Record<Mood | 'risada', { eyes: EyesKind; mouth: MouthKind }> = {
  feliz: { eyes: 'big', mouth: 'open' },
  acenando: { eyes: 'big', mouth: 'smile' },
  pensando: { eyes: 'up', mouth: 'hmm' },
  comemorando: { eyes: 'squint', mouth: 'big' },
  apaixonado: { eyes: 'hearts', mouth: 'open' },
  preocupado: { eyes: 'worried', mouth: 'frown' },
  risada: { eyes: 'happy', mouth: 'big' },
};

function isAnim(m: Motion): m is Anim {
  return 'frames' in m;
}

/** Mesma lista de transformações em todo quadro, para a interpolação ficar estável. */
function toTransform({ x = 0, y = 0, r = 0, sx = 1, sy = 1 }: Pose, s: number) {
  return [{ translateX: x * s }, { translateY: y * s }, { rotate: `${r}deg` }, { scaleX: sx }, { scaleY: sy }];
}

function motionStyle(m: Motion, s: number, still: boolean) {
  if (!isAnim(m)) {
    return {
      transform: toTransform(m, s),
      opacity: m.o ?? 1,
      transitionProperty: ['transform', 'opacity'] as ('transform' | 'opacity')[],
      transitionDuration: 450,
      transitionTimingFunction: SPRING,
    };
  }
  const usesOpacity = Object.values(m.frames).some((f) => f.o !== undefined);
  if (still) return { transform: toTransform(m.frames['0%'] ?? {}, s) };
  const frames: CSSAnimationKeyframes = {};
  for (const [k, f] of Object.entries(m.frames)) {
    frames[k] = usesOpacity ? { transform: toTransform(f, s), opacity: f.o ?? 1 } : { transform: toTransform(f, s) };
  }
  return {
    animationName: frames,
    animationDuration: m.ms,
    animationTimingFunction: m.ease ?? 'ease-in-out',
    animationIterationCount: m.once ? 1 : ('infinite' as const),
    animationDirection: m.alternate ? ('alternate' as const) : ('normal' as const),
    animationDelay: m.delay ?? 0,
  };
}

type Props = {
  mood: Mood;
  /** Enquanto verdadeiro, faz o pulinho e dá risada. */
  poking?: boolean;
  width: number;
};

/**
 * Tapi, o robozinho da Início. Cada parte é uma camada de SVG que gira no
 * próprio ponto (ombro, pescoço, base da antena), animada com as animações
 * CSS do Reanimated. O humor troca rosto, pose e animação.
 */
export function Tapi({ mood, poking = false, width }: Props) {
  const reduce = useReducedMotion();
  const s = width / VIEW_W;
  const height = VIEW_H * s;

  const styles = useMemo(() => {
    const pick = (p: Part) => (poking && POKE[p]) || MOODS[mood][p] || BASE[p];
    const out = {} as Record<Part, object>;
    for (const p of Object.keys(BASE) as Part[]) {
      const pivot = p === 'shadow' ? PIVOTS.all : PIVOTS[p];
      out[p] = [
        StyleSheet.absoluteFill,
        { transformOrigin: `${pivot[0] * s}px ${pivot[1] * s}px` },
        motionStyle(pick(p), s, reduce),
      ];
    }
    return out;
  }, [mood, poking, s, reduce]);

  const face = FACES[poking ? 'risada' : mood];
  const art = (children: ReactNode) => (
    <Svg width={width} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
      <TapiDefs />
      {children}
    </Svg>
  );

  return (
    <View style={{ width, height }} pointerEvents="none">
      <Animated.View style={styles.shadow}>{art(<TapiShadow />)}</Animated.View>
      <Animated.View style={styles.all}>
        <View style={StyleSheet.absoluteFill}>{art(<TapiBody />)}</View>
        <Animated.View style={styles.armL}>{art(<TapiArm side="l" />)}</Animated.View>
        <Animated.View style={styles.armR}>{art(<TapiArm side="r" />)}</Animated.View>
        <Animated.View style={styles.head}>
          <Animated.View style={styles.antL}>{art(<TapiAntenna side="l" />)}</Animated.View>
          <Animated.View style={styles.antR}>{art(<TapiAntenna side="r" />)}</Animated.View>
          <View style={StyleSheet.absoluteFill}>
            {art(
              <>
                <TapiHead blush={mood === 'apaixonado' ? 1 : 0.55} />
                <TapiFace eyes={face.eyes} mouth={face.mouth} />
              </>,
            )}
          </View>
          {blinks(face.eyes) && <Animated.View style={styles.eyes}>{art(<TapiEyes kind={face.eyes} />)}</Animated.View>}
        </Animated.View>
        {!poking && !reduce && <Effects mood={mood} s={s} art={art} />}
      </Animated.View>
    </View>
  );
}

type EffectsProps = { mood: Mood; s: number; art: (c: ReactNode) => ReactNode };

/** Efeitos em volta do Tapi: corações, faíscas, gotinha de suor, balão de pensamento. */
function Effects({ mood, s, art }: EffectsProps) {
  const layer = (key: string, pivot: readonly [number, number], anim: Anim, children: ReactNode) => (
    <Animated.View
      key={key}
      style={[
        StyleSheet.absoluteFill,
        { transformOrigin: `${pivot[0] * s}px ${pivot[1] * s}px` },
        motionStyle(anim, s, false),
      ]}>
      {art(children)}
    </Animated.View>
  );

  if (mood === 'apaixonado') {
    const rise = (delay: number): Anim => ({
      frames: {
        '0%': { y: 8, sx: 0.6, sy: 0.6, o: 0 },
        '20%': { y: -2.4, sx: 0.7, sy: 0.7, o: 1 },
        '100%': { y: -44, sx: 1.1, sy: 1.1, o: 0 },
      },
      ms: 2200,
      ease: 'ease-out',
      delay,
    });
    return (
      <>
        {layer('h1', [212, 50], rise(0), <Path d={heartPath(212, 44, 16)} fill={colors.lime} />)}
        {layer('h2', [26, 68], rise(1100), <Path d={heartPath(26, 64, 12)} fill={colors.lime} />)}
      </>
    );
  }
  if (mood === 'comemorando') {
    const spark: Anim = {
      frames: { '0%': { sx: 0.8, sy: 0.8, o: 0.3 }, '100%': { sx: 1.1, sy: 1.1, o: 1 } },
      ms: 450,
      alternate: true,
    };
    return layer(
      'sparks',
      [120, 76],
      spark,
      <G stroke={colors.lime} strokeWidth={5} strokeLinecap="round">
        <Path d="M30 60l-10-14" />
        <Path d="M18 92l-16-4" />
        <Path d="M210 60l10-14" />
        <Path d="M222 92l16-4" />
      </G>,
    );
  }
  if (mood === 'preocupado') {
    return layer(
      'drop',
      [196, 88],
      {
        frames: { '0%': { o: 0 }, '40%': { o: 0 }, '50%': { y: 2.2, o: 1 }, '100%': { y: 22, o: 0 } },
        ms: 2600,
        ease: 'ease-in',
      },
      <Path d="M196 74c0 0-8 10-8 15a8 8 0 0 0 16 0c0-5-8-15-8-15z" fill={mascotColors.drop} opacity={0.9} />,
    );
  }
  if (mood === 'pensando') {
    const dots: [number, number, number][] = [
      [198, 52, 4.5],
      [212, 38, 5.5],
      [228, 22, 6.5],
    ];
    return (
      <>
        {dots.map(([cx, cy, r], i) =>
          layer(
            `d${i}`,
            [cx, cy],
            { frames: { '0%': { o: 0.25 }, '50%': { o: 1 }, '100%': { o: 0.25 } }, ms: 1500, delay: i * 200 },
            <Circle cx={cx} cy={cy} r={r} fill={mascotColors.thought} />,
          ),
        )}
      </>
    );
  }
  return null;
}
