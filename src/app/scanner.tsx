import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScanFrame } from '@/components/scanner/ScanFrame';
import { Button, ChipGroup, IconButton, Stepper, Text, toast } from '@/components/ui';
import { formatDecimal, formatInt } from '@/lib/format';
import { MEAL_OPTIONS, mealByHour, mealShort, parseMeal } from '@/lib/meals';
import { adjustGrams, itemMacros, scanTotals, toFoodItems, type ScanResult } from '@/lib/scan';
import { analyzeMeal } from '@/lib/scanClient';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, macroColors, radius, spacing } from '@/theme/theme';
import type { MealType } from '@/types';

type Phase =
  | { step: 'camera' }
  | { step: 'analyzing'; uri: string }
  | { step: 'result'; uri: string; result: ScanResult; example: boolean; reason?: string }
  | { step: 'error'; uri: string; message: string; canRetry: boolean; base64: string };

const STEP_G = 10;
const PHOTO_H = 370;

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

  const analyze = async (uri: string, base64: string) => {
    setPhase({ step: 'analyzing', uri });
    const outcome = await analyzeMeal(base64);
    if (outcome.kind === 'ok') {
      setPhase({ step: 'result', uri, result: outcome.result, example: outcome.example, reason: outcome.example ? outcome.reason : undefined });
    } else {
      setPhase({ step: 'error', uri, message: outcome.message, canRetry: outcome.canRetry, base64 });
    }
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
        <ScanFrame />

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
          style={({ pressed }) => [styles.manual, { bottom: insets.bottom + spacing.xl + 100 }, pressed && styles.pressed]}>
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
        <Image source={{ uri: phase.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={[StyleSheet.absoluteFill, styles.dim]} />
        <ScanFrame scanning />
        <View style={[styles.analyzing, { bottom: insets.bottom + spacing.xxxl }]}>
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
  const recognized = result.items.length;
  const lowConfidence = !phase.example && result.confidence < 0.6;

  const setItems = (items: ScanResult['items']) => setPhase({ ...phase, result: { ...result, items } });

  const save = () => {
    const foods = toFoodItems(result.items);
    if (!foods.length) {
      toast('Ajuste pelo menos um alimento com mais de 0 g');
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
          <View style={styles.tags}>
            {result.items.map((i) => (
              <View key={i.id} style={styles.tag}>
                <View style={styles.tagDot} />
                <Text style={styles.tagText}>{i.name}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.topBar, { top: insets.top + spacing.sm }]}>
            <IconButton icon="close" label="Fechar" dark onPress={() => router.back()} />
            <IconButton icon="refresh" label="Refazer foto" dark onPress={() => setPhase({ step: 'camera' })} />
          </View>
        </View>

        <View style={styles.sheet}>
          <View style={styles.grab} />
          {phase.example ? (
            <View style={[styles.badge, styles.badgeExample]}>
              <Text style={[styles.badgeText, { color: colors.gold }]}>
                Modo exemplo ·{' '}
                {phase.reason === 'sem_chave' ? 'falta a chave do Gemini no Supabase' : 'Supabase não configurado'}
              </Text>
            </View>
          ) : (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                ✓ {recognized} {recognized === 1 ? 'alimento reconhecido' : 'alimentos reconhecidos'}
              </Text>
            </View>
          )}
          <Text style={styles.dish}>{result.dish}</Text>
          <View style={styles.bigk}>
            <Text style={styles.bigkValue}>{formatInt(totals.kcal)}</Text>
            <Text variant="caption" tone="secondary">
              kcal estimadas
            </Text>
          </View>
          {lowConfidence && (
            <Text variant="caption" style={styles.warn}>
              A foto deixou dúvidas. Confira os alimentos e as porções antes de salvar.
            </Text>
          )}

          <View style={styles.chips}>
            <MacroChip label="Proteína" value={totals.proteinG} color={macroColors.proteinG} />
            <MacroChip label="Carbo" value={totals.carbsG} color={macroColors.carbsG} />
            <MacroChip label="Gordura" value={totals.fatG} color={macroColors.fatG} />
          </View>

          <View style={styles.plist}>
            {result.items.map((i) => (
              <View key={i.id} style={[styles.pitem, i.grams === 0 && styles.pitemOff]}>
                <View style={styles.flex}>
                  <Text variant="bodyStrong" style={styles.pname}>
                    {i.name}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {formatInt(itemMacros(i).kcal)} kcal
                  </Text>
                </View>
                <View style={styles.step}>
                  <Stepper
                    label={i.name}
                    size={28}
                    onMinus={() => setItems(adjustGrams(result.items, i.id, -STEP_G))}
                    onPlus={() => setItems(adjustGrams(result.items, i.id, STEP_G))}
                  />
                  <Text style={styles.gramsOut}>{formatInt(i.grams)} g</Text>
                </View>
              </View>
            ))}
          </View>

          <ChipGroup label="Refeição" options={MEAL_OPTIONS} value={meal} onChange={setMeal} />

          <View style={styles.acts}>
            <Button
              label="Corrigir"
              variant="secondary"
              onPress={() => router.push({ pathname: '/busca', params: { refeicao: meal } })}
            />
            <Button label={`Salvar no ${mealShort(meal).toLowerCase()}`} onPress={save} style={styles.flex} />
          </View>
          <Text variant="caption" tone="muted" style={styles.center}>
            Faltou algo? “Corrigir” abre a busca. Zere a porção do que não comeu.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function MacroChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.chip}>
      <View style={styles.chipLabel}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text variant="caption" tone="secondary" style={styles.chipLabelText}>
          {label}
        </Text>
      </View>
      <Text style={styles.chipValue}>{formatDecimal(value, 0)}g</Text>
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
    width: 78,
    height: 78,
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
  dim: {
    backgroundColor: colors.photoScrim,
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
  tags: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 56,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.tagFill,
    borderWidth: 1,
    borderColor: colors.handle,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
  tagText: {
    fontFamily: fonts.body.bold,
    fontSize: 11,
    color: colors.white,
  },
  sheet: {
    marginTop: -40,
    paddingTop: 20,
    paddingHorizontal: spacing.lg,
    gap: 14,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: colors.panel,
    borderTopWidth: 1,
    borderColor: colors.line,
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
  badge: {
    alignSelf: 'flex-start',
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 13,
    justifyContent: 'center',
    backgroundColor: colors.okTint,
  },
  badgeExample: {
    backgroundColor: colors.goldTint,
    borderWidth: 1,
    borderColor: colors.goldEdge,
  },
  badgeText: {
    fontFamily: fonts.body.bold,
    fontSize: 11,
    color: colors.ok,
  },
  dish: {
    fontFamily: fonts.display.semibold,
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: -0.7,
  },
  bigk: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginTop: -4,
  },
  bigkValue: {
    fontFamily: fonts.display.bold,
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -2.4,
    fontVariant: ['tabular-nums'],
  },
  warn: {
    color: colors.gold,
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.lg - 2,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipLabelText: {
    fontFamily: fonts.body.semibold,
    fontSize: 11,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  chipValue: {
    marginTop: 4,
    fontFamily: fonts.display.semibold,
    fontSize: 17,
  },
  plist: {
    gap: spacing.sm,
  },
  pitem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg - 2,
    backgroundColor: colors.glassSubtle,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  pitemOff: {
    opacity: 0.45,
  },
  pname: {
    fontSize: 14,
    lineHeight: 19,
  },
  step: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  gramsOut: {
    minWidth: 48,
    textAlign: 'center',
    fontFamily: fonts.display.semibold,
    fontSize: 13,
  },
  acts: {
    flexDirection: 'row',
    gap: 10,
  },
});
