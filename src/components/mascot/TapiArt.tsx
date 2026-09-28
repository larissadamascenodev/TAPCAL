/**
 * Desenho do Tapi, o mascote da Início, em partes separadas para poder animar
 * cada uma (braços, cabeça, antenas, olhos). Todas usam a mesma caixa
 * 240 × 300, então as camadas se sobrepõem certinho.
 * Mockup: design-reference/inicio-v2.html
 */
import { G, Circle, Defs, Ellipse, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { colors, mascotColors as m } from '@/theme/theme';

export const VIEW_W = 240;
export const VIEW_H = 300;

/** Pontos de giro de cada parte, no sistema de 240 × 300. */
export const PIVOTS = {
  all: [120, 290],
  head: [120, 184],
  antL: [100, 50],
  antR: [140, 50],
  armL: [87, 200],
  armR: [153, 200],
  eyes: [120, 122],
} as const;

export type EyesKind = 'big' | 'up' | 'happy' | 'squint' | 'hearts' | 'worried';
export type MouthKind = 'smile' | 'open' | 'big' | 'hmm' | 'frown';

function stops(list: readonly string[], offsets: readonly number[]) {
  return list.map((c, i) => <Stop key={i} offset={offsets[i]} stopColor={c} />);
}

/** Gradientes do mascote; cada camada (Svg) precisa da sua cópia. */
export function TapiDefs() {
  return (
    <Defs>
      <RadialGradient id="tpShell" cx="34%" cy="22%" r="95%">
        {stops(m.shell, [0, 0.38, 0.7, 0.9, 1])}
      </RadialGradient>
      <LinearGradient id="tpAO" x1="0" y1="0" x2="0" y2="1">
        <Stop offset={0.55} stopColor={m.occlusion} stopOpacity={0} />
        <Stop offset={1} stopColor={m.occlusion} stopOpacity={0.45} />
      </LinearGradient>
      <RadialGradient id="tpSpec" cx="50%" cy="50%" r="50%">
        <Stop offset={0} stopColor={m.white} stopOpacity={0.95} />
        <Stop offset={1} stopColor={m.white} stopOpacity={0} />
      </RadialGradient>
      <RadialGradient id="tpBody" cx="38%" cy="20%" r="100%">
        {stops(m.body, [0, 0.5, 0.85, 1])}
      </RadialGradient>
      <LinearGradient id="tpRim" x1="0" y1="0" x2="0" y2="1">
        {stops(m.rim, [0, 0.35, 0.8, 1])}
      </LinearGradient>
      <RadialGradient id="tpLimeSoft" cx="36%" cy="28%" r="85%">
        {stops(m.limeSoft, [0, 0.5, 1])}
      </RadialGradient>
      <RadialGradient id="tpFace" cx="45%" cy="35%" r="80%">
        {stops(m.face, [0, 0.7, 1])}
      </RadialGradient>
      <LinearGradient id="tpGlass" x1="0" y1="0" x2="1" y2="1">
        <Stop offset={0} stopColor={m.white} stopOpacity={0.85} />
        <Stop offset={0.35} stopColor={m.white} stopOpacity={0.15} />
        <Stop offset={0.5} stopColor={m.white} stopOpacity={0} />
      </LinearGradient>
      <RadialGradient id="tpEye" cx="50%" cy="28%" r="80%">
        {stops(m.eye, [0, 0.48, 0.7, 0.86, 1])}
      </RadialGradient>
      <RadialGradient id="tpBall" cx="34%" cy="28%" r="75%">
        {stops(m.ball, [0, 0.6, 1])}
      </RadialGradient>
      <RadialGradient id="tpShadow" cx="50%" cy="50%" r="50%">
        <Stop offset={0} stopColor={m.black} stopOpacity={0.65} />
        <Stop offset={1} stopColor={m.black} stopOpacity={0} />
      </RadialGradient>
      <RadialGradient id="tpBlush" cx="50%" cy="50%" r="50%">
        <Stop offset={0} stopColor={m.blush} stopOpacity={0.5} />
        <Stop offset={1} stopColor={m.blush} stopOpacity={0} />
      </RadialGradient>
      <RadialGradient id="tpGlow" cx="50%" cy="50%" r="50%">
        <Stop offset={0} stopColor={colors.lime} stopOpacity={0.75} />
        <Stop offset={1} stopColor={colors.lime} stopOpacity={0} />
      </RadialGradient>
      <RadialGradient id="tpCup" cx="40%" cy="35%" r="70%">
        {stops(m.cup, [0, 0.7, 1])}
      </RadialGradient>
    </Defs>
  );
}

export function TapiShadow() {
  return <Ellipse cx={120} cy={292} rx={52} ry={7} fill="url(#tpShadow)" />;
}

const TORSO =
  'M120 180c20 0 32 12 37 30 6 20 5 38-6 50-9 9-22 12-31 12s-22-3-31-12c-11-12-12-30-6-50 5-18 17-30 37-30z';

/** Pernas, pés e tronco em formato de feijãozinho, com a luz verde no peito. */
export function TapiBody() {
  return (
    <G>
      <Path d="M96 252c-3 10-4 20-2 26h18c2-6 2-16 0-26z" fill="url(#tpBody)" />
      <Path d="M128 252c-2 10-2 20 0 26h18c2-6 1-16-2-26z" fill="url(#tpBody)" />
      <G transform="rotate(-8 100 282)">
        <Path d="M82 282c0-9 8-15 19-15s19 6 19 15c0 5-4 7-9 7H91c-5 0-9-2-9-7z" fill="url(#tpBody)" />
        <Path d="M82 283c1 4 4 6 9 6h20c5 0 8-2 9-6-5 2-12 3-19 3s-14-1-19-3z" fill="url(#tpRim)" />
        <Ellipse cx={94} cy={274} rx={6} ry={3} fill="url(#tpSpec)" opacity={0.85} />
      </G>
      <G transform="rotate(8 140 282)">
        <Path d="M120 282c0-9 8-15 19-15s19 6 19 15c0 5-4 7-9 7h-20c-5 0-9-2-9-7z" fill="url(#tpBody)" />
        <Path d="M120 283c1 4 4 6 9 6h20c5 0 8-2 9-6-5 2-12 3-19 3s-14-1-19-3z" fill="url(#tpRim)" />
        <Ellipse cx={132} cy={274} rx={6} ry={3} fill="url(#tpSpec)" opacity={0.85} />
      </G>

      <Path d={TORSO} fill="url(#tpBody)" />
      <Path d={TORSO} fill="url(#tpAO)" />
      <Path
        d="M86 246c9 9 21 13 34 13s25-4 34-13c-1 6-3 10-6 14-8 7-18 10-28 10s-20-3-28-10c-3-4-5-8-6-14z"
        fill="url(#tpRim)"
      />
      <Path
        d="M100 186c5-4 12-6 20-6s15 2 20 6c-3 4-6 6-9 6-3-2-7-3-11-3s-8 1-11 3c-3 0-6-2-9-6z"
        fill="url(#tpRim)"
      />
      <Path
        d="M134 196c9 7 13 19 11 32-1 6-3 11-6 15"
        fill="none"
        stroke={m.seamBody}
        strokeOpacity={0.7}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <Path
        d="M136 195c9 7 13 19 11 32-1 6-3 11-6 15"
        fill="none"
        stroke={m.white}
        strokeOpacity={0.9}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <Ellipse cx={101} cy={208} rx={8} ry={15} fill="url(#tpSpec)" opacity={0.9} transform="rotate(12 101 208)" />
      <Circle cx={120} cy={222} r={19} fill="url(#tpGlow)" />
      <Circle cx={120} cy={222} r={10.5} fill={m.coreFill} />
      <Circle cx={120} cy={222} r={10.5} fill="none" stroke={colors.lime} strokeWidth={3.2} />
      <Circle cx={120} cy={222} r={14} fill="none" stroke={m.white} strokeOpacity={0.6} strokeWidth={1.2} />
      <Circle cx={117} cy={219} r={3} fill={m.white} />
    </G>
  );
}

/** Braço curvo com ombro verde e mãozinha de luva; `side` espelha o desenho. */
export function TapiArm({ side }: { side: 'l' | 'r' }) {
  if (side === 'l') {
    return (
      <G>
        <Path
          d="M86 196c-9 2-15 10-18 20-2 8-2 14 2 17 4 2 9 0 12-6 3-7 6-15 9-22 2-5 0-9-5-9z"
          fill="url(#tpBody)"
        />
        <Path d="M80 204c-4 5-6 11-7 17" fill="none" stroke={m.white} strokeWidth={3} strokeLinecap="round" opacity={0.9} />
        <Circle cx={87} cy={200} r={7.5} fill="url(#tpRim)" />
        <Circle cx={85} cy={197.5} r={2.4} fill={m.white} opacity={0.8} />
        <Path d="M62 236c0-7 5-12 11-12s11 5 11 11c0 7-4 12-10 12-7 0-12-4-12-11z" fill="url(#tpLimeSoft)" />
        <Path d="M81 229c4 0 6 3 5 6s-4 4-6 2" fill="url(#tpLimeSoft)" />
        <Path d="M66 232c2-3 5-4 8-4" fill="none" stroke={m.white} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
      </G>
    );
  }
  return (
    <G>
      <Path
        d="M154 196c9 2 15 10 18 20 2 8 2 14-2 17-4 2-9 0-12-6-3-7-6-15-9-22-2-5 0-9 5-9z"
        fill="url(#tpBody)"
      />
      <Path d="M160 204c4 5 6 11 7 17" fill="none" stroke={m.white} strokeWidth={2.4} strokeLinecap="round" opacity={0.55} />
      <Circle cx={153} cy={200} r={7.5} fill="url(#tpRim)" />
      <Circle cx={151} cy={197.5} r={2.4} fill={m.white} opacity={0.8} />
      <Path d="M178 236c0-7-5-12-11-12s-11 5-11 11c0 7 4 12 10 12 7 0 12-4 12-11z" fill="url(#tpLimeSoft)" />
      <Path d="M159 229c-4 0-6 3-5 6s4 4 6 2" fill="url(#tpLimeSoft)" />
      <Path d="M162 230c3-2 6-2 8-1" fill="none" stroke={m.white} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
    </G>
  );
}

/** Antena com bolinha branca na ponta. */
export function TapiAntenna({ side }: { side: 'l' | 'r' }) {
  const d = side === 'l' ? 'M100 50L88 22' : 'M140 50l12-28';
  const x = side === 'l' ? 86 : 154;
  return (
    <G>
      <Path d={d} stroke="url(#tpRim)" strokeWidth={4.5} strokeLinecap="round" />
      <Circle cx={x} cy={18} r={14} fill="url(#tpGlow)" opacity={0.5} />
      <Circle cx={x} cy={18} r={9.5} fill="url(#tpBall)" />
      <Circle cx={x - 3} cy={15} r={3} fill={m.white} />
    </G>
  );
}

const SHELL = 'M120 40c56 0 90 30 90 78 0 46-34 70-90 70s-90-24-90-70c0-48 34-78 90-78z';
const PLATE = 'M120 77c38 0 58 7 60 40 1 32-19 46-60 46s-61-14-60-46c2-33 22-40 60-40z';

function Cup({ side }: { side: 'l' | 'r' }) {
  const outer = side === 'l' ? 30 : 210;
  const inner = side === 'l' ? 26 : 214;
  const shine = side === 'l' ? 24 : 212;
  return (
    <G>
      <Ellipse cx={outer} cy={122} rx={17} ry={30} fill="url(#tpRim)" />
      <Ellipse cx={inner} cy={122} rx={10.5} ry={21} fill="url(#tpCup)" />
      <Ellipse cx={inner} cy={122} rx={13} ry={24} fill="none" stroke={m.cupRing} strokeWidth={2.6} />
      <Ellipse cx={shine} cy={112} rx={3} ry={7} fill={m.white} opacity={0.75} />
    </G>
  );
}

/** Casco da cabeça, fones e a placa do rosto (TV) com borda verde. */
export function TapiHead({ blush }: { blush: number }) {
  return (
    <G>
      <Cup side="l" />
      <Cup side="r" />
      <Path d={SHELL} fill="url(#tpShell)" />
      <Path d={SHELL} fill="url(#tpAO)" />
      <Path
        d="M121 41c4 16 14 28 32 34 20 6 40 16 52 28"
        fill="none"
        stroke={m.seam}
        strokeOpacity={0.75}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <Path
        d="M123 41c4 15 14 27 32 33 20 6 40 16 52 28"
        fill="none"
        stroke={m.white}
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <Ellipse cx={78} cy={62} rx={28} ry={13} fill="url(#tpSpec)" transform="rotate(-22 78 62)" />

      <Path d="M120 66c44 0 70 8 72 50 1 40-22 58-72 58s-73-18-72-58c2-42 28-50 72-50z" fill={m.white} opacity={0.9} />
      <Path d="M120 70c42 0 66 8 68 46 1 38-21 54-68 54s-69-16-68-54c2-38 26-46 68-46z" fill="url(#tpRim)" />
      <Path d={PLATE} fill="url(#tpFace)" />
      <Path d={PLATE} fill="url(#tpGlass)" />
      <Path d="M68 100c6-14 22-19 44-20" fill="none" stroke={m.white} strokeWidth={4} strokeLinecap="round" opacity={0.95} />

      <Ellipse cx={72} cy={150} rx={11} ry={6} fill="url(#tpBlush)" opacity={blush} />
      <Ellipse cx={168} cy={150} rx={11} ry={6} fill="url(#tpBlush)" opacity={blush} />
    </G>
  );
}

/** Coração com a ponta para baixo, centrado em x, topo perto de y. */
export function heartPath(x: number, y: number, s: number): string {
  return (
    `M${x} ${y + s * 0.35}` +
    `c0 ${-s * 0.5} ${-s * 0.7} ${-s * 0.75} ${-s * 0.7} ${-s * 0.1}` +
    `c0 ${s * 0.45} ${s * 0.7} ${s * 0.75} ${s * 0.7} ${s * 0.95}` +
    `c0 ${-s * 0.2} ${s * 0.7} ${-s * 0.5} ${s * 0.7} ${-s * 0.95}` +
    `c0 ${-s * 0.65} ${-s * 0.7} ${-s * 0.65} ${-s * 0.7} ${s * 0.1}z`
  );
}

/** Olho realista: íris escura com brilho verde embaixo e reflexos brancos. */
function Eye({ cx, cy, rx, ry, dx = 0, dy = 0 }: { cx: number; cy: number; rx: number; ry: number; dx?: number; dy?: number }) {
  const hx = cx - rx * 0.28 + dx;
  const hy = cy - ry * 0.36 + dy;
  return (
    <G>
      <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#tpEye)" />
      <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={m.black} strokeOpacity={0.35} strokeWidth={1.2} />
      <Ellipse cx={hx} cy={hy} rx={rx * 0.42} ry={ry * 0.34} fill={m.white} transform={`rotate(-18 ${hx} ${hy})`} />
      <Circle cx={cx + rx * 0.36 + dx} cy={cy + ry * 0.22 + dy} r={rx * 0.14} fill={m.white} opacity={0.95} />
      <Path
        d={`M${cx - rx * 0.6} ${cy + ry * 0.62}q${rx * 0.6} ${ry * 0.3} ${rx * 1.2} 0`}
        fill="none"
        stroke={m.eyeLine}
        strokeOpacity={0.55}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </G>
  );
}

function Line({ d, w }: { d: string; w: number }) {
  return <Path d={d} fill="none" stroke={m.ink} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />;
}

/** Olhos que piscam (os abertos). Os fechados/corações ficam em TapiFace. */
export function blinks(kind: EyesKind): boolean {
  return kind === 'big' || kind === 'up' || kind === 'worried';
}

/** Olhos abertos (camada que pisca). */
export function TapiEyes({ kind }: { kind: EyesKind }) {
  if (kind === 'big') {
    return (
      <G>
        <Eye cx={92} cy={122} rx={20} ry={25} />
        <Eye cx={148} cy={122} rx={20} ry={25} />
      </G>
    );
  }
  if (kind === 'up') {
    return (
      <G>
        <Eye cx={92} cy={120} rx={19} ry={24} dx={4} dy={-4} />
        <Eye cx={148} cy={120} rx={19} ry={24} dx={4} dy={-4} />
      </G>
    );
  }
  if (kind === 'worried') {
    return (
      <G>
        <Eye cx={92} cy={126} rx={17} ry={21} dy={2} />
        <Eye cx={148} cy={126} rx={17} ry={21} dy={2} />
      </G>
    );
  }
  return null;
}

/** Boca, sobrancelhas e olhos que não piscam (fechados, apertados, corações). */
export function TapiFace({ eyes, mouth }: { eyes: EyesKind; mouth: MouthKind }) {
  return (
    <G>
      {eyes === 'happy' && (
        <>
          <Line d="M76 126q16-18 32 0" w={5.5} />
          <Line d="M132 126q16-18 32 0" w={5.5} />
        </>
      )}
      {eyes === 'squint' && (
        <>
          <Line d="M80 110l18 12-18 12" w={5.5} />
          <Line d="M160 110l-18 12 18 12" w={5.5} />
        </>
      )}
      {eyes === 'hearts' && (
        <>
          <Path d={heartPath(92, 110, 24)} fill={colors.lime} stroke={m.heartEdge} strokeWidth={2} />
          <Path d={heartPath(148, 110, 24)} fill={colors.lime} stroke={m.heartEdge} strokeWidth={2} />
          <Circle cx={84} cy={113} r={3.4} fill={m.white} />
          <Circle cx={140} cy={113} r={3.4} fill={m.white} />
        </>
      )}
      {eyes === 'worried' && (
        <>
          <Line d="M76 102l22-8" w={3.8} />
          <Line d="M164 102l-22-8" w={3.8} />
        </>
      )}

      {mouth === 'smile' && <Line d="M112 153q8 6 16 0" w={3.2} />}
      {mouth === 'open' && (
        <>
          <Path d="M111 150q9 12 18 0z" fill={m.mouth} stroke={m.ink} strokeWidth={2} strokeLinejoin="round" />
          <Path d="M115 156q5 3.6 10 0q-5-4-10 0z" fill={m.tongue} />
        </>
      )}
      {mouth === 'big' && (
        <>
          <Path d="M106 149q14 18 28 0z" fill={m.mouth} stroke={m.ink} strokeWidth={2} strokeLinejoin="round" />
          <Path d="M112 158q8 5 16 0q-8-5.5-16 0z" fill={m.tongue} />
        </>
      )}
      {mouth === 'hmm' && <Line d="M113 156q3.5-3 7 0t7 0" w={3} />}
      {mouth === 'frown' && <Line d="M112 159q8-7 16 0" w={3.4} />}
    </G>
  );
}
