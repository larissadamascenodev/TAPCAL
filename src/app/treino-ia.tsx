import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { DishTitle, SheetBadge } from '@/components/nutrition/PlateSheet';
import { Button, confirmDestructive, Glass, GlassModal, IconButton, NeonButton, Text, toast } from '@/components/ui';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { MapaDeFoco, MapaMuscular } from '@/components/workout/MapaMuscular';
import { exercicioPorId } from '@/lib/exercicios';
import { repsLabel } from '@/lib/treino/plano';
import { DIA_CURTO, DIA_NOME, DIAS } from '@/lib/treino/semana';
import { gerarTreino, type Geracao } from '@/lib/treinoIA/cliente';
import { numerosDasRegras } from '@/lib/treinoIA/plano';
import { FOCO_LABELS, FOCO_MUSCULOS, FONTES, type Foco } from '@/lib/treinoIA/regras';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import type { Goal } from '@/types';
import type { Cardio, DiaSemana, Equipamento, RegiaoArticular, RespostasTreinoIA } from '@/types/treino';

type Passo = 'experiencia' | 'local' | 'casa' | 'dias' | 'tempo' | 'foco' | 'musculos' | 'lesoes' | 'cardio' | 'fontes' | 'montando' | 'resultado';

const PERGUNTAS: Passo[] = ['experiencia', 'local', 'casa', 'dias', 'tempo', 'foco', 'lesoes', 'cardio'];

const PADRAO: RespostasTreinoIA = {
  experiencia: 'iniciante',
  local: 'academia-completa',
  equipamentosCasa: [],
  dias: ['seg', 'qua', 'sex'],
  tempo: '45-60',
  foco: ['corpo-todo'],
  lesoes: [],
  cardio: 'agora-nao',
};

type Opcao<T> = { valor: T; titulo: string; texto?: string; icone?: keyof typeof Ionicons.glyphMap };

const EXPERIENCIA: (Opcao<RespostasTreinoIA['experiencia']> & { chave: string })[] = [
  { chave: 'nunca', valor: 'iniciante', titulo: 'Nunca treinei ou estou voltando agora' },
  { chave: 'menos1', valor: 'iniciante', titulo: 'Treino há menos de 1 ano' },
  { chave: '1a3', valor: 'intermediario', titulo: 'Treino de 1 a 3 anos' },
  { chave: 'mais3', valor: 'avancado', titulo: 'Treino há mais de 3 anos' },
];
const LOCAIS: Opcao<RespostasTreinoIA['local']>[] = [
  { valor: 'academia-completa', titulo: 'Academia completa', icone: 'business-outline' },
  { valor: 'academia-pequena', titulo: 'Academia pequena', texto: 'Halteres, barra e poucos aparelhos', icone: 'barbell-outline' },
  { valor: 'casa', titulo: 'Em casa', icone: 'home-outline' },
];
const CASA: Opcao<Equipamento | 'nada'>[] = [
  { valor: 'nada', titulo: 'Nada, só o corpo' },
  { valor: 'halteres', titulo: 'Halteres' },
  { valor: 'elastico', titulo: 'Elástico' },
  { valor: 'barra', titulo: 'Barra e anilhas' },
  { valor: 'kettlebell', titulo: 'Kettlebell' },
  { valor: 'banco', titulo: 'Banco' },
];
const TEMPOS: Opcao<RespostasTreinoIA['tempo']>[] = [
  { valor: '30-45', titulo: '30 a 45 min' },
  { valor: '45-60', titulo: '45 a 60 min' },
  { valor: '60-90', titulo: '60 a 90 min' },
  { valor: '90+', titulo: 'Mais de 90 min' },
];
const FOCOS: Foco[] = ['corpo-todo', 'gluteos', 'pernas', 'abdomen', 'costas', 'peito', 'ombros', 'bracos'];
const LESOES: Opcao<RegiaoArticular>[] = [
  { valor: 'joelho', titulo: 'Joelho' },
  { valor: 'ombro', titulo: 'Ombro' },
  { valor: 'lombar', titulo: 'Lombar' },
  { valor: 'punho', titulo: 'Punho' },
  { valor: 'cotovelo', titulo: 'Cotovelo' },
  { valor: 'quadril', titulo: 'Quadril' },
];
const CARDIO: Opcao<RespostasTreinoIA['cardio']>[] = [
  { valor: 'ja-faco', titulo: 'Já faço' },
  { valor: 'quero-comecar', titulo: 'Quero começar' },
  { valor: 'agora-nao', titulo: 'Agora não' },
];
const ATIVIDADES: Opcao<Cardio['atividade']>[] = [
  { valor: 'caminhada', titulo: 'Caminhada' },
  { valor: 'corrida', titulo: 'Corrida' },
  { valor: 'bicicleta', titulo: 'Bicicleta' },
  { valor: 'eliptico', titulo: 'Elíptico' },
];
const MENSAGENS = ['Escolhendo a divisão da semana…', 'Calculando as séries de cada músculo…', 'Separando os exercícios que servem para você…', 'Escolhendo os exercícios…', 'Conferindo tudo…'];

const alternar = <T,>(lista: readonly T[], v: T) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);

/**
 * Treino com IA (SPEC-TREINOS, etapa 5): mini-onboarding (uma pergunta por
 * tela), telas de apoio, "montando…" e o resultado. Com `?proximaFase=1`,
 * monta o bloco seguinte direto, com as mesmas respostas.
 */
export default function TreinoIAScreen() {
  const { proximaFase } = useLocalSearchParams<{ proximaFase?: string }>();
  const salvas = useAppStore((s) => s.respostasTreinoIA);
  const objetivo = useAppStore((s) => s.profile?.goal ?? 'manter');
  const sexo = useAppStore((s) => s.profile?.sex);
  const hoje = useAppStore((s) => s.today.date);
  const planoAtual = useAppStore((s) => s.planos.find((p) => p.ativo));
  const temAtivo = !!planoAtual;
  const { salvarRespostasTreinoIA, salvarPlano } = useAppStore();
  const primeiraVez = !salvas;

  const fase = proximaFase && planoAtual?.ia ? (planoAtual.ia.bloco ?? 1) + 1 : 1;
  const [r, setR] = useState<RespostasTreinoIA>(() => (proximaFase && planoAtual?.ia ? planoAtual.ia.respostas : (salvas ?? PADRAO)));
  const [experiencia, setExperiencia] = useState<string | null>(() => (salvas ? (EXPERIENCIA.find((e) => e.valor === salvas.experiencia)?.chave ?? null) : null));
  const [passo, setPasso] = useState<Passo>(proximaFase && planoAtual?.ia ? 'montando' : 'experiencia');
  const [historico, setHistorico] = useState<Passo[]>([]);
  const [geracao, setGeracao] = useState<Geracao | null>(null);
  const [evitar, setEvitar] = useState<string[] | undefined>(() =>
    proximaFase && planoAtual ? planoAtual.treinos.flatMap((t) => t.exercicios.map((e) => e.exercicioId)) : undefined,
  );

  const mudar = (m: Partial<RespostasTreinoIA>) => setR((x) => ({ ...x, ...m }));
  const ir = (p: Passo) => {
    setHistorico((h) => [...h, passo]);
    setPasso(p);
  };
  const voltar = () => {
    const anterior = historico.at(-1);
    if (!anterior) return router.back();
    setHistorico((h) => h.slice(0, -1));
    setPasso(anterior);
  };

  // Próximo passo de cada pergunta (pula "em casa" e as telas de apoio quando não cabem).
  const proximo = (): Passo => {
    switch (passo) {
      case 'experiencia':
        return 'local';
      case 'local':
        return r.local === 'casa' ? 'casa' : 'dias';
      case 'casa':
        return 'dias';
      case 'dias':
        return 'tempo';
      case 'tempo':
        return 'foco';
      case 'foco':
        return primeiraVez ? 'musculos' : 'lesoes';
      case 'musculos':
        return 'lesoes';
      case 'lesoes':
        return 'cardio';
      case 'cardio':
        return primeiraVez ? 'fontes' : 'montando';
      default:
        return 'montando';
    }
  };

  // "Montando…": gera o plano (IA ou regras) com uma animação de progresso.
  const [progresso, setProgresso] = useState(0);
  const pedidoAtivo = useRef(0);
  useEffect(() => {
    if (passo !== 'montando') return;
    const id = ++pedidoAtivo.current;
    const controller = new AbortController();
    const inicio = Date.now();
    const tick = setInterval(() => setProgresso(Math.min(0.92, (Date.now() - inicio) / 9000)), 200);
    salvarRespostasTreinoIA(r);
    gerarTreino({ respostas: r, objetivo, hoje, evitar, bloco: fase }, undefined, controller.signal).then((g) => {
      if (id !== pedidoAtivo.current) return;
      setProgresso(1);
      setGeracao(g);
      setTimeout(() => setPasso('resultado'), 350);
    });
    return () => {
      clearInterval(tick);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- gera uma vez a cada entrada em "montando"
  }, [passo]);

  const usar = (depois: (planoId: string) => void) => {
    if (!geracao) return;
    const fazer = () => {
      salvarPlano(geracao.plano);
      depois(geracao.plano.id);
    };
    if (temAtivo) confirmDestructive('Usar este treino?', 'Ele passa a ser o seu treino ativo. O atual fica guardado em Meus treinos.', 'Usar', fazer);
    else fazer();
  };

  const gerarOutro = () => {
    if (!geracao) return;
    setEvitar(geracao.plano.treinos.flatMap((t) => t.exercicios.map((e) => e.exercicioId)));
    setProgresso(0);
    setPasso('montando');
  };

  const pergunta = PERGUNTAS.indexOf(passo);
  const totalPerguntas = r.local === 'casa' ? PERGUNTAS.length : PERGUNTAS.length - 1;
  const numero = pergunta < 0 ? null : pergunta + 1 - (r.local !== 'casa' && pergunta > PERGUNTAS.indexOf('casa') ? 1 : 0);

  const diasOk = r.dias.length >= 2 && r.dias.length <= 6;
  const podeSeguir =
    passo === 'experiencia' ? !!experiencia : passo === 'dias' ? diasOk : passo === 'foco' ? r.foco.length > 0 : passo === 'cardio' ? r.cardio !== 'ja-faco' || !!r.cardioAtividade : true;

  const footer =
    passo === 'montando' ? undefined : passo === 'resultado' ? (
      <View style={styles.resultBtns}>
        <NeonButton label="Começar a usar" onPress={() => usar(() => (toast('Treino ativado'), router.dismissTo('/treino')))} />
        <View style={styles.row}>
          <Button label="Gerar outro" variant="secondary" onPress={gerarOutro} style={styles.flex} />
          <Button
            label="Editar"
            variant="secondary"
            onPress={() => usar((id) => router.replace({ pathname: '/treino-editor', params: { planoId: id } }))}
            style={styles.flex}
          />
        </View>
      </View>
    ) : (
      <NeonButton label={passo === 'fontes' ? 'Montar meu treino' : 'Continuar'} onPress={() => ir(proximo())} disabled={!podeSeguir} />
    );

  return (
    <GlassModal
      badge={<SheetBadge icon="sparkles" label={passo === 'resultado' ? 'TREINO COM IA' : numero ? `PERGUNTA ${numero} DE ${totalPerguntas}` : 'TREINO COM IA'} />}
      leading={passo !== 'montando' && historico.length > 0 ? <IconButton icon="chevron-back" label="Voltar" size={38} onPress={voltar} /> : undefined}
      onClose={() => router.back()}
      footer={footer}>
      {numero && <ProgressBar value={numero / totalPerguntas} color={colors.lime} height={4} />}

      {passo === 'experiencia' && (
        <>
          <DishTitle>Há quanto tempo você treina?</DishTitle>
          {EXPERIENCIA.map((o) => (
            <Escolha
              key={o.chave}
              titulo={o.titulo}
              on={experiencia === o.chave}
              onPress={() => {
                setExperiencia(o.chave);
                mudar({ experiencia: o.valor });
              }}
            />
          ))}
        </>
      )}

      {passo === 'local' && (
        <>
          <DishTitle>Onde você treina?</DishTitle>
          {LOCAIS.map((o) => (
            <Escolha key={o.valor} icone={o.icone} titulo={o.titulo} texto={o.texto} on={r.local === o.valor} onPress={() => mudar({ local: o.valor })} />
          ))}
        </>
      )}

      {passo === 'casa' && (
        <>
          <DishTitle>O que você tem em casa?</DishTitle>
          <Text tone="secondary">Pode marcar mais de um.</Text>
          {CASA.map((o) => {
            const on = o.valor === 'nada' ? r.equipamentosCasa.length === 0 : r.equipamentosCasa.includes(o.valor);
            return (
              <Escolha
                key={o.valor}
                multi
                titulo={o.titulo}
                on={on}
                onPress={() => mudar({ equipamentosCasa: o.valor === 'nada' ? [] : alternar(r.equipamentosCasa, o.valor) })}
              />
            );
          })}
        </>
      )}

      {passo === 'dias' && (
        <>
          <DishTitle>Quais dias você vai treinar?</DishTitle>
          <View style={styles.days}>
            {DIAS.map((d) => {
              const on = r.dias.includes(d);
              return (
                <Pressable
                  key={d}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={DIA_NOME[d]}
                  onPress={() => mudar({ dias: DIAS.filter((x) => (x === d ? !on : r.dias.includes(x))) })}
                  style={[styles.day, on && styles.dayOn]}>
                  <Text style={[styles.dayText, { color: on ? colors.onLime : colors.ink2 }]}>{DIA_CURTO[d]}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text variant="caption" tone={diasOk ? 'muted' : 'secondary'} style={!diasOk && styles.alerta}>
            {r.dias.length < 2
              ? 'Escolha pelo menos 2 dias.'
              : r.dias.length === 7
                ? 'Deixe pelo menos 1 dia de descanso: o músculo cresce na recuperação.'
                : `${r.dias.length} dias de treino · ${7 - r.dias.length} de descanso`}
          </Text>
          {r.experiencia === 'iniciante' && r.dias.length >= 5 && r.dias.length <= 6 && (
            <Text variant="caption" tone="secondary">
              No começo, 3 ou 4 dias costumam render mais. Se preferir mais dias, mantemos o volume de iniciante.
            </Text>
          )}
        </>
      )}

      {passo === 'tempo' && (
        <>
          <DishTitle>Quanto tempo por treino?</DishTitle>
          {TEMPOS.map((o) => (
            <Escolha key={o.valor} titulo={o.titulo} on={r.tempo === o.valor} onPress={() => mudar({ tempo: o.valor })} />
          ))}
        </>
      )}

      {passo === 'foco' && (
        <>
          <DishTitle>O que você mais quer evoluir?</DishTitle>
          <Glass contentStyle={styles.mapa}>
            <MapaDeFoco musculos={r.foco.flatMap((f) => (f === 'corpo-todo' ? [] : FOCO_MUSCULOS[f]))} sexo={sexo} altura={180} />
          </Glass>
          <View style={styles.wrap}>
            {FOCOS.map((f) => {
              const on = r.foco.includes(f);
              return (
                <Chip
                  key={f}
                  label={FOCO_LABELS[f]}
                  on={on}
                  onPress={() => {
                    if (f === 'corpo-todo') return mudar({ foco: ['corpo-todo'] });
                    const sem = r.foco.filter((x) => x !== 'corpo-todo');
                    const novo = alternar(sem, f);
                    mudar({ foco: novo.length ? novo : ['corpo-todo'] });
                  }}
                />
              );
            })}
          </View>
        </>
      )}

      {passo === 'musculos' && (
        <>
          <DishTitle>Você vê os músculos de cada exercício</DishTitle>
          <Glass contentStyle={styles.mapa}>
            <MapaMuscular principal="gluteal" secundarios={['hamstring', 'quadriceps']} sexo={sexo} altura={220} />
          </Glass>
          <Text tone="secondary">Em verde neon, o músculo que mais trabalha; em verde claro, os que ajudam. Assim você sabe o que sentir em cada movimento.</Text>
        </>
      )}

      {passo === 'lesoes' && (
        <>
          <DishTitle>Tem alguma lesão ou dor?</DishTitle>
          {LESOES.map((o) => (
            <Escolha key={o.valor} multi titulo={o.titulo} on={r.lesoes.includes(o.valor)} onPress={() => mudar({ lesoes: alternar(r.lesoes, o.valor) })} />
          ))}
          <Escolha multi titulo="Nenhuma" on={r.lesoes.length === 0} onPress={() => mudar({ lesoes: [] })} />
          {r.lesoes.length > 0 && (
            <View style={styles.aviso}>
              <Ionicons name="medkit-outline" size={18} color={colors.warnText} />
              <Text variant="caption" style={styles.avisoText}>
                O TapCal evita exercícios que forçam essa região, mas não substitui um profissional. Se a dor for forte ou recente, procure um fisioterapeuta ou médico.
              </Text>
            </View>
          )}
        </>
      )}

      {passo === 'cardio' && (
        <>
          <DishTitle>E o cardio?</DishTitle>
          {CARDIO.map((o) => (
            <Escolha key={o.valor} titulo={o.titulo} on={r.cardio === o.valor} onPress={() => mudar({ cardio: o.valor, cardioAtividade: o.valor === 'ja-faco' ? r.cardioAtividade : undefined })} />
          ))}
          {r.cardio === 'ja-faco' && (
            <>
              <Text variant="label" tone="muted" style={styles.gapTop}>
                Qual?
              </Text>
              <View style={styles.wrap}>
                {ATIVIDADES.map((o) => (
                  <Chip key={o.valor} label={o.titulo} on={r.cardioAtividade === o.valor} onPress={() => mudar({ cardioAtividade: o.valor })} />
                ))}
              </View>
            </>
          )}
        </>
      )}

      {passo === 'fontes' && (
        <>
          <DishTitle>De onde vêm os números</DishTitle>
          <Text tone="secondary">
            A estrutura do seu treino (dias, séries, repetições e descanso) segue regras tiradas destes estudos. A IA só escolhe os exercícios dentro delas.
          </Text>
          <Fontes />
        </>
      )}

      {passo === 'montando' && <Montando progresso={progresso} />}

      {passo === 'resultado' && geracao && <Resultado geracao={geracao} respostas={r} objetivo={objetivo} />}
    </GlassModal>
  );
}

function Montando({ progresso }: { progresso: number }) {
  const msg = MENSAGENS[Math.min(MENSAGENS.length - 1, Math.floor(progresso * MENSAGENS.length))];
  return (
    <View style={styles.montando}>
      <View style={styles.montandoIcone}>
        <Ionicons name="sparkles" size={34} color={colors.lime} />
      </View>
      <DishTitle>Montando seu treino…</DishTitle>
      <ProgressBar value={progresso} color={colors.lime} height={8} style={styles.montandoBarra} />
      <Text tone="secondary" style={styles.center} accessibilityLiveRegion="polite">
        {msg}
      </Text>
    </View>
  );
}

function Resultado({ geracao, respostas, objetivo }: { geracao: Geracao; respostas: RespostasTreinoIA; objetivo: Goal }) {
  const { plano, fonte, esqueleto } = geracao;
  const [abrirFontes, setAbrirFontes] = useState(false);
  const porDia = new Map(plano.treinos.map((t) => [t.dia, t]));
  return (
    <>
      <View style={styles.titleRow}>
        <DishTitle>Seu treino está pronto</DishTitle>
        {fonte === 'exemplo' && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>EXEMPLO</Text>
          </View>
        )}
      </View>
      {fonte === 'regras' && (
        <Text variant="caption" tone="muted">
          A IA não respondeu agora; os exercícios foram escolhidos pelas regras do TapCal.
        </Text>
      )}

      <View style={styles.week}>
        {DIAS.map((d: DiaSemana) => {
          const t = porDia.get(d);
          return (
            <View key={d} style={[styles.weekDay, t && styles.weekDayOn]}>
              <Text style={[styles.weekDayText, t && { color: colors.onLime }]}>{DIA_CURTO[d]}</Text>
            </View>
          );
        })}
      </View>

      {esqueleto.avisos.map((a) => (
        <Text key={a} variant="caption" tone="secondary">
          {a}
        </Text>
      ))}

      {plano.treinos.map((t) => (
        <Glass key={t.dia} contentStyle={styles.dayCard}>
          <Text style={styles.kicker}>{DIA_NOME[t.dia].toUpperCase()}</Text>
          <Text style={styles.dayTitle}>{t.nome}</Text>
          {t.exercicios.map((e) => (
            <View key={e.id} style={styles.exRow}>
              <Text style={styles.exName} numberOfLines={1}>
                {exercicioPorId(e.exercicioId)?.nome}
              </Text>
              <Text variant="caption" tone="muted">
                {e.series} × {repsLabel(e)}
              </Text>
            </View>
          ))}
          {t.cardio && (
            <View style={styles.cardio}>
              <Ionicons name="walk-outline" size={15} color={colors.ink2} />
              <Text variant="caption" tone="secondary">
                No fim: {t.cardio.minutos} min de {t.cardio.atividade === 'eliptico' ? 'elíptico' : t.cardio.atividade}, ritmo moderado
              </Text>
            </View>
          )}
        </Glass>
      ))}

      <Text variant="label" tone="muted" style={styles.gapTop}>
        Por que esse treino
      </Text>
      <Glass contentStyle={styles.why}>
        <Text>{plano.ia?.explicacao}</Text>
        {numerosDasRegras(respostas, objetivo, esqueleto).map((l) => (
          <View key={l} style={styles.bullet}>
            <View style={styles.dot} />
            <Text variant="caption" tone="secondary" style={styles.flex}>
              {l}
            </Text>
          </View>
        ))}
      </Glass>

      <Pressable accessibilityRole="button" accessibilityState={{ expanded: abrirFontes }} onPress={() => setAbrirFontes((v) => !v)} style={styles.expand}>
        <Text style={styles.expandText}>De onde vêm os números</Text>
        <Ionicons name={abrirFontes ? 'chevron-up' : 'chevron-down'} size={18} color={colors.lime} />
      </Pressable>
      {abrirFontes && <Fontes />}
    </>
  );
}

function Fontes() {
  return (
    <View style={styles.fontes}>
      {FONTES.map((f) => (
        <View key={f.titulo} style={styles.fonte}>
          <Text variant="caption" style={styles.fonteUso}>
            {f.uso}
          </Text>
          <Text variant="caption" tone="muted">
            {f.titulo}
          </Text>
        </View>
      ))}
    </View>
  );
}

function Escolha({
  titulo,
  texto,
  icone,
  on,
  multi,
  onPress,
}: {
  titulo: string;
  texto?: string;
  icone?: keyof typeof Ionicons.glyphMap;
  on: boolean;
  multi?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole={multi ? 'checkbox' : 'radio'} accessibilityState={multi ? { checked: on } : { selected: on }} onPress={onPress}>
      {({ pressed }) => (
        <Glass strong={on} style={[on && styles.escolhaOn, pressed && styles.pressed]} contentStyle={styles.escolha}>
          {icone && (
            <View style={styles.escolhaIcone}>
              <Ionicons name={icone} size={20} color={colors.lime} />
            </View>
          )}
          <View style={styles.flex}>
            <Text style={styles.escolhaTitulo}>{titulo}</Text>
            {texto ? (
              <Text variant="caption" tone="secondary">
                {texto}
              </Text>
            ) : null}
          </View>
          <Ionicons
            name={multi ? (on ? 'checkbox' : 'square-outline') : on ? 'radio-button-on' : 'radio-button-off'}
            size={22}
            color={on ? colors.lime : colors.ink3}
          />
        </Glass>
      )}
    </Pressable>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={onPress} style={[styles.chip, on && styles.chipOn]}>
      <Text style={[styles.chipText, { color: on ? colors.onLime : colors.ink2 }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    minWidth: 0,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  center: {
    textAlign: 'center',
  },
  gapTop: {
    marginTop: spacing.sm,
  },
  alerta: {
    color: colors.warnText,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  days: {
    flexDirection: 'row',
    gap: 6,
  },
  day: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  dayOn: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  dayText: {
    fontFamily: fonts.body.bold,
    fontSize: 11.5,
    letterSpacing: 0.6,
  },
  chip: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipOn: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  chipText: {
    fontFamily: fonts.body.bold,
    fontSize: 14,
  },
  mapa: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  escolha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
  },
  escolhaOn: {
    borderColor: colors.limeEdge,
    borderTopColor: colors.limeEdge,
  },
  escolhaIcone: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.limeWash,
  },
  escolhaTitulo: {
    fontFamily: fonts.body.bold,
    fontSize: 15.5,
    lineHeight: 21,
  },
  aviso: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.warnTint,
    borderWidth: 1,
    borderColor: colors.warnEdge,
  },
  avisoText: {
    flex: 1,
    color: colors.warnText,
    lineHeight: 18,
  },
  montando: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.xxl,
  },
  montandoIcone: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.limeWash,
    borderWidth: 1,
    borderColor: colors.limeEdge,
  },
  montandoBarra: {
    alignSelf: 'stretch',
  },
  resultBtns: {
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.goldTint,
    borderWidth: 1,
    borderColor: colors.goldEdge,
  },
  tagText: {
    fontFamily: fonts.body.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.gold,
  },
  week: {
    flexDirection: 'row',
    gap: 5,
  },
  weekDay: {
    flex: 1,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
  },
  weekDayOn: {
    backgroundColor: colors.lime,
  },
  weekDayText: {
    fontFamily: fonts.body.bold,
    fontSize: 10.5,
    letterSpacing: 0.6,
    color: colors.ink3,
  },
  dayCard: {
    gap: 6,
    padding: 16,
  },
  kicker: {
    fontFamily: fonts.body.bold,
    fontSize: 11,
    letterSpacing: 1.6,
    color: colors.lime,
  },
  dayTitle: {
    fontFamily: fonts.display.semibold,
    fontSize: 19,
    lineHeight: 24,
    marginBottom: 4,
  },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  exName: {
    flex: 1,
    fontFamily: fonts.body.semibold,
    fontSize: 14,
  },
  cardio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  why: {
    gap: 10,
    padding: 16,
  },
  bullet: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 7,
    backgroundColor: colors.lime,
  },
  expand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  expandText: {
    fontFamily: fonts.body.bold,
    color: colors.lime,
  },
  fontes: {
    gap: spacing.md,
  },
  fonte: {
    gap: 2,
  },
  fonteUso: {
    fontFamily: fonts.body.bold,
    color: colors.ink,
  },
  pressed: {
    opacity: 0.8,
  },
});
