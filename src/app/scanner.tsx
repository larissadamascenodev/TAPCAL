import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FRAME_SIDE, ScanFrame } from '@/components/scanner/ScanFrame';
import { Button, ChipGroup, IconButton, ProgressBar, Text, TextField, toast } from '@/components/ui';
import { formatDecimal, formatInt } from '@/lib/format';
import { MEAL_OPTIONS, mealByHour, mealShort, parseMeal } from '@/lib/meals';
import { editScanItem, itemMacros, removeScanItem, scanTotals, toFoodItems, type ScanResult } from '@/lib/scan';
import { analyzeMeal } from '@/lib/scanClient';
import { goalPlan } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, macroColors, radius, spacing } from '@/theme/theme';
import type { MealType } from '@/types';

type Phase =
  | { step: 'camera' }
  | { step: 'analyzing'; uri: string }
  | { step: 'result'; uri: string; result: ScanResult; example: boolean; reason?: string }
  | { step: 'error'; uri: string; message: string; canRetry: boolean; base64: string };

const PHOTO_H = 370;
/** Altura do botão "Adicionar manualmente" acima da linha do disparador. */
const MANUAL_OFFSET = 100;
/** Diâmetro do disparador (a linha mais alta de baixo). */
const SHUTTER = 78;

/** Reduz a foto para ~1024 px e devolve em base64 (menos dados, análise mais rápida). */
async function prepare(uri: string): Promise<{ uri: string; base64: string }> {
  const ref = await ImageManipulator.manipulate(uri).resize({ width: 1024 }).renderAsync();
  const out = await ref.saveAsync({ base64: true, compress: 0.6, format: SaveFormat.JPEG });
  return { uri: out.uri, base64: out.base64 ?? '' };
}

/** Scanner de pratos: câmera → análise → resultado com porções ajustáveis → salvar. */
export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ refeicao?: string }>();
  const addFood = useAppStore((s) => s.addFood);
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);

  const [phase, setPhase] = useState<Phase>({ step: 'camera' });
  const [meal, setMeal] = useState<MealType>(parseMeal(params.refeicao) ?? mealByHour());
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const state = useAppStore();
  const dayGoal = useMemo(() => goalPlan(state, state.today.date)?.macros ?? null, [state]);

  // Análise em andamento: dá para cancelar pelo X enquanto espera.
  const running = useRef<AbortController | null>(null);

  const analyze = async (uri: string, base64: string) => {
    running.current?.abort();
    const ctrl = new AbortController();
    running.current = ctrl;
    setPhase({ step: 'analyzing', uri });
    const outcome = await analyzeMeal(base64, undefined, ctrl.signal);
    if (ctrl.signal.aborted || outcome.kind === 'cancelled') return;
    running.current = null;
    if (outcome.kind === 'ok') {
      setPhase({ step: 'result', uri, result: outcome.result, example: outcome.example, reason: outcome.example ? outcome.reason : undefined });
    } else {
      setPhase({ step: 'error', uri, message: outcome.message, canRetry: outcome.canRetry, base64 });
    }
  };

  const cancelAnalysis = () => {
    running.current?.abort();
    running.current = null;
    setPhase({ step: 'camera' });
  };

  const shoot = async () => {
    if (busy || !camera.current) return;
    setBusy(true);
    try {
      const pic = await camera.current.takePictureAsync({ quality: 0.8, shutterSound: false });
      const img = await prepare(pic.uri);
      await analyze(img.uri, img.base64);
    } catch {
      toast('Não consegui tirar a foto. Tente de novo.');
    } finally {
      setBusy(false);
    }
  };

  const pickFromGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
    if (res.canceled || !res.assets[0]) return;
    setBusy(true);
    try {
      const img = await prepare(res.assets[0].uri);
      await analyze(img.uri, img.base64);
    } catch {
      toast('Não consegui abrir essa foto.');
    } finally {
      setBusy(false);
    }
  };

  // O enquadramento vai da barra do topo até logo acima da linha do disparador e da galeria.
  const frameTop = insets.top + spacing.sm + 42 + spacing.md;
  const frameBottom = insets.bottom + spacing.xl + SHUTTER + spacing.md;

  // ── Câmera ────────────────────────────────────────────────────────────────
  if (phase.step === 'camera') {
    const granted = permission?.granted;
    return (
      <View style={styles.root}>
        {granted ? (
          <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.permission]}>
            <Ionicons name="camera-outline" size={40} color={colors.lime2} />
            <Text variant="heading" style={styles.center}>
              Fotografe o prato
            </Text>
            <Text tone="secondary" style={styles.center}>
              O TapCal usa a câmera para reconhecer os alimentos e calcular as calorias.
            </Text>
            {permission?.canAskAgain !== false ? (
              <Button label="Permitir câmera" onPress={requestPermission} style={styles.permBtn} />
            ) : (
              <Text variant="caption" tone="muted" style={styles.center}>
                A câmera está bloqueada. Libere nos Ajustes do iPhone ou escolha uma foto da galeria.
              </Text>
            )}
          </View>
        )}
        <ScanFrame top={frameTop} bottom={frameBottom} />

        <View style={[styles.topBar, { top: insets.top + spacing.sm }]}>
          <IconButton icon="close" label="Fechar" dark onPress={() => router.back()} />
          <View style={styles.hintPill}>
            <Text variant="caption" style={styles.hintText}>
              Enquadre o prato inteiro
            </Text>
          </View>
          <View style={styles.spacer42} />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityHint="Buscar o alimento na tabela TACO ou digitar à mão"
          onPress={() => router.replace({ pathname: '/busca', params: { refeicao: meal } })}
          style={({ pressed }) => [styles.manual, { bottom: insets.bottom + spacing.xl + MANUAL_OFFSET }, pressed && styles.pressed]}>
          {Platform.OS !== 'android' && <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />}
          <Ionicons name="create-outline" size={16} color={colors.white} />
          <Text style={styles.manualText}>Adicionar manualmente</Text>
        </Pressable>

        <View style={[styles.shutterRow, { bottom: insets.bottom + spacing.xl }]}>
          <IconButton icon="images-outline" label="Escolher da galeria" dark size={52} onPress={pickFromGallery} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tirar foto"
            disabled={!granted || busy}
            onPress={shoot}
            style={({ pressed }) => [styles.shutter, (!granted || busy) && styles.disabled, pressed && styles.pressed]}>
            {busy ? <ActivityIndicator color={colors.onInk} /> : <View style={styles.shutterInner} />}
          </Pressable>
          <View style={styles.spacer52} />
        </View>
      </View>
    );
  }

  // ── Analisando ────────────────────────────────────────────────────────────
  if (phase.step === 'analyzing') {
    return (
      <View style={styles.root}>
        {/* A foto inteira, sem zoom, dentro do enquadramento. */}
        <Image
          source={{ uri: phase.uri }}
          style={[styles.analyzingPhoto, { top: frameTop + 8, bottom: frameBottom + 8 }]}
          resizeMode="contain"
        />
        <ScanFrame scanning top={frameTop} bottom={frameBottom} />
        <View style={[styles.topBar, { top: insets.top + spacing.sm }]}>
          <View style={styles.spacer42} />
          <IconButton icon="close" label="Cancelar análise" dark onPress={cancelAnalysis} />
        </View>
        <View style={[styles.analyzing, { bottom: insets.bottom + spacing.lg }]}>
          <ActivityIndicator color={colors.gold} />
          <Text variant="bodyStrong">Analisando o prato…</Text>
          <Text variant="caption" tone="secondary">
            Reconhecendo alimentos e porções
          </Text>
        </View>
      </View>
    );
  }

  // ── Erro ──────────────────────────────────────────────────────────────────
  if (phase.step === 'error') {
    return (
      <View style={styles.root}>
        <Image source={{ uri: phase.uri }} style={[styles.photo, { height: PHOTO_H }]} resizeMode="cover" />
        <View style={[styles.topBar, { top: insets.top + spacing.sm }]}>
          <IconButton icon="refresh" label="Nova foto" dark onPress={() => setPhase({ step: 'camera' })} />
          <IconButton icon="close" label="Fechar" dark onPress={() => router.back()} />
        </View>
        <View style={[styles.sheet, styles.errorSheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.grab} />
          <Ionicons name="alert-circle-outline" size={32} color={colors.lime2} style={styles.selfCenter} />
          <Text variant="heading" style={styles.center}>
            Não deu certo
          </Text>
          <Text tone="secondary" style={styles.center}>
            {phase.message}
          </Text>
          <View style={styles.acts}>
            <Button
              label="Digitar à mão"
              variant="secondary"
              onPress={() => router.replace({ pathname: '/busca', params: { refeicao: meal } })}
            />
            {phase.canRetry ? (
              <Button label="Tentar de novo" onPress={() => analyze(phase.uri, phase.base64)} style={styles.flex} />
            ) : (
              <Button label="Nova foto" onPress={() => setPhase({ step: 'camera' })} style={styles.flex} />
            )}
          </View>
        </View>
      </View>
    );
  }

  // ── Resultado ─────────────────────────────────────────────────────────────
  const { result } = phase;
  const totals = scanTotals(result.items);
  const lowConfidence = !phase.example && result.confidence < 0.6;
  const editingItem = result.items.find((i) => i.id === editing) ?? null;

  const macros = [
    { label: 'Proteína', value: totals.proteinG, goal: dayGoal?.proteinG, color: macroColors.proteinG },
    { label: 'Carboidrato', value: totals.carbsG, goal: dayGoal?.carbsG, color: macroColors.carbsG },
    { label: 'Gordura', value: totals.fatG, goal: dayGoal?.fatG, color: macroColors.fatG },
  ];

  const setItems = (items: ScanResult['items']) => setPhase({ ...phase, result: { ...result, items } });

  const save = () => {
    const foods = toFoodItems(result.items);
    if (!foods.length) {
      toast('Deixe pelo menos um alimento com mais de 0 g');
      return;
    }
    foods.forEach((f) => addFood(meal, f));
    toast(`${formatInt(totals.kcal)} kcal salvas no ${mealShort(meal).toLowerCase()}`);
    router.back();
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }} showsVerticalScrollIndicator={false}>
        <View style={{ height: PHOTO_H }}>
          <Image source={{ uri: phase.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <View style={[styles.topBar, { top: insets.top + spacing.sm }]}>
            <IconButton icon="refresh" label="Refazer foto" dark onPress={() => setPhase({ step: 'camera' })} />
            <IconButton icon="close" label="Fechar" dark onPress={() => router.back()} />
          </View>
        </View>

        <View style={styles.sheet}>
          {phase.example ? (
            <View style={styles.badgeRow}>
              <Ionicons name="information-circle" size={18} color={colors.gold} />
              <Text style={[styles.badgeText, { color: colors.gold }]}>
                MODO EXEMPLO · {phase.reason === 'sem_chave' ? 'FALTA A CHAVE DO GEMINI' : 'SEM CONEXÃO COM O SUPABASE'}
              </Text>
            </View>
          ) : (
            <View style={styles.badgeRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.lime} />
              <Text style={styles.badgeText}>IDENTIFICADO ITEM POR ITEM</Text>
            </View>
          )}
          <Text style={styles.dish}>{result.dish.toUpperCase()}</Text>
          <ChipGroup label="Refeição" options={MEAL_OPTIONS} value={meal} onChange={setMeal} />

          <View>
            <Text style={styles.sumLabel}>CALORIAS</Text>
            <View style={styles.kcalLine}>
              <Text style={styles.sumValue}>{formatInt(totals.kcal)}</Text>
              <Text style={styles.sumUnit}>KCAL</Text>
            </View>
            <View style={styles.barRow}>
              {macros.map((m) => (
                <MacroBar key={m.label} {...m} />
              ))}
            </View>
          </View>
          {lowConfidence && (
            <Text variant="caption" style={styles.warn}>
              A foto deixou dúvidas. Confira os alimentos e as porções antes de continuar.
            </Text>
          )}

          <View style={styles.list}>
            {result.items.map((i) => (
              <Pressable
                key={i.id}
                accessibilityRole="button"
                accessibilityHint="Toque para editar o nome e a quantidade"
                onPress={() => setEditing(i.id)}
                style={({ pressed }) => [styles.row, i.grams === 0 && styles.rowOff, pressed && styles.pressed]}>
                <View style={styles.flex}>
                  <Text style={styles.rowName}>{i.name}</Text>
                  <Text variant="caption" tone="muted">
                    {formatInt(itemMacros(i).kcal)} kcal
                  </Text>
                </View>
                <Text style={styles.rowGrams}>{formatInt(i.grams)} g</Text>
                <Ionicons name="pencil" size={14} color={colors.ink3} />
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/busca', params: { refeicao: meal } })}
              style={({ pressed }) => [styles.addRow, pressed && styles.pressed]}>
              <Ionicons name="add" size={16} color={colors.ink2} />
              <Text variant="caption" tone="secondary" style={styles.addRowText}>
                Adicionar alimento
              </Text>
            </Pressable>
          </View>

          <Pressable accessibilityRole="button" onPress={save} style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
            <Text style={styles.ctaText}>CONTINUAR</Text>
          </Pressable>
        </View>
      </ScrollView>

      {editingItem && (
        <EditItem
          key={editingItem.id}
          name={editingItem.name}
          grams={editingItem.grams}
          onCancel={() => setEditing(null)}
          onRemove={() => {
            setItems(removeScanItem(result.items, editingItem.id));
            setEditing(null);
          }}
          onSave={(name, grams) => {
            setItems(editScanItem(result.items, editingItem.id, { name, grams }));
            setEditing(null);
          }}
        />
      )}
    </View>
  );
}

type MacroProps = { label: string; value: number; goal?: number; color: string };

/** Barrinha de um macro: nome, gramas do prato e quanto isso é da meta do dia. */
function MacroBar({ label, value, goal, color }: MacroProps) {
  return (
    <View style={styles.bar} accessible accessibilityLabel={`${label}: ${formatDecimal(value, 0)} gramas`}>
      <Text variant="caption" tone="secondary" style={styles.barLabel}>
        {label}
      </Text>
      <Text style={styles.barValue}>{formatDecimal(value, 0)} g</Text>
      <ProgressBar value={goal ? value / goal : 0} color={color} height={6} />
    </View>
  );
}

type EditProps = {
  name: string;
  grams: number;
  onCancel: () => void;
  onRemove: () => void;
  onSave: (name: string, grams: number) => void;
};

/** Folha por cima do resultado para corrigir o nome e a quantidade de um alimento. */
function EditItem({ name, grams, onCancel, onRemove, onSave }: EditProps) {
  const insets = useSafeAreaInsets();
  const [nameText, setNameText] = useState(name);
  const [gramsText, setGramsText] = useState(String(grams));
  const parsed = Number(gramsText.replace(',', '.'));

  return (
    <View style={styles.editRoot}>
      <Pressable accessibilityLabel="Fechar edição" style={StyleSheet.absoluteFill} onPress={onCancel} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.editWrap}>
        <View style={[styles.editCard, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.grab} />
          <Text variant="heading">Editar alimento</Text>
          <TextField label="Nome" value={nameText} onChangeText={setNameText} autoCapitalize="sentences" returnKeyType="next" />
          <TextField
            label="Quantidade"
            unit="g"
            value={gramsText}
            onChangeText={setGramsText}
            keyboardType="number-pad"
            error={gramsText && !Number.isFinite(parsed) ? 'Use só números' : null}
          />
          <View style={styles.acts}>
            <Button label="Remover" variant="secondary" onPress={onRemove} />
            <Button
              label="Salvar"
              onPress={() => onSave(nameText, Number.isFinite(parsed) ? parsed : grams)}
              style={styles.flex}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ground,
  },
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  selfCenter: {
    alignSelf: 'center',
  },
  permission: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    backgroundColor: colors.panel,
  },
  permBtn: {
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  topBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hintPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.photoScrim,
  },
  hintText: {
    fontFamily: fonts.body.semibold,
    color: colors.white,
  },
  spacer42: {
    width: 42,
  },
  spacer52: {
    width: 52,
  },
  manual: {
    position: 'absolute',
    alignSelf: 'center',
    height: 42,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.glassFillStrong,
    borderWidth: 1,
    borderColor: colors.frostCardEdge,
    borderTopColor: colors.frostCardEdgeTop,
  },
  manualText: {
    fontFamily: fonts.body.bold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.white,
  },
  shutterRow: {
    position: 'absolute',
    left: spacing.xxl,
    right: spacing.xxl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shutter: {
    width: SHUTTER,
    height: SHUTTER,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.white,
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.white,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    transform: [{ scale: 0.94 }],
  },
  analyzingPhoto: {
    position: 'absolute',
    left: FRAME_SIDE + 8,
    right: FRAME_SIDE + 8,
  },
  analyzing: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 6,
  },
  photo: {
    width: '100%',
  },
  sheet: {
    marginTop: -40,
    paddingTop: 20,
    paddingHorizontal: spacing.lg,
    gap: 14,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: colors.sheetDark,
  },
  errorSheet: {
    flex: 1,
  },
  grab: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.handle,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeText: {
    fontFamily: fonts.body.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 2,
    color: colors.lime,
  },
  dish: {
    fontFamily: fonts.display.bold,
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.8,
  },
  list: {
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  rowOff: {
    opacity: 0.4,
  },
  rowName: {
    fontFamily: fonts.body.semibold,
    fontSize: 16,
    lineHeight: 21,
    color: colors.ink2,
  },
  rowGrams: {
    fontFamily: fonts.display.semibold,
    fontSize: 16,
    lineHeight: 21,
    fontVariant: ['tabular-nums'],
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  addRowText: {
    fontFamily: fonts.body.bold,
  },
  sumLabel: {
    fontFamily: fonts.body.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 2,
    color: colors.ink3,
  },
  sumValue: {
    marginTop: 2,
    fontFamily: fonts.display.bold,
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -2.4,
    fontVariant: ['tabular-nums'],
  },
  sumUnit: {
    fontFamily: fonts.body.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.5,
    color: colors.ink3,
  },
  kcalLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  barRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  bar: {
    flex: 1,
    gap: 4,
  },
  barLabel: {
    fontFamily: fonts.body.semibold,
  },
  barValue: {
    marginBottom: 4,
    fontFamily: fonts.display.semibold,
    fontSize: 18,
    lineHeight: 22,
    fontVariant: ['tabular-nums'],
  },
  cta: {
    height: 58,
    marginTop: spacing.xs,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lime,
  },
  ctaText: {
    fontFamily: fonts.display.bold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 3,
    color: colors.onLime,
  },
  editRoot: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    backgroundColor: colors.photoScrim,
  },
  editWrap: {
    width: '100%',
  },
  editCard: {
    gap: 14,
    paddingTop: 12,
    paddingHorizontal: spacing.lg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.panel,
    borderTopWidth: 1,
    borderColor: colors.line,
  },
  warn: {
    color: colors.gold,
  },
  acts: {
    flexDirection: 'row',
    gap: 10,
  },
});
