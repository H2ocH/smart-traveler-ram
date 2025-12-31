import RequireAuth from '@/components/RequireAuth';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  PanGestureHandler,
  PinchGestureHandler,
  State,
} from 'react-native-gesture-handler';

type Point = { x: number; y: number };

// Carte bancaire (ISO/IEC 7810 ID-1)
const CARD_W_MM = 85.6;
const CARD_H_MM = 53.98;

// Dimensions cabine RAM (pour verdict) — tu peux modifier si besoin
const CABIN_L = 55;
const CABIN_W = 40;
const CABIN_H = 25;

// Soute : règle “somme <= 203 cm” (standard beaucoup de compagnies)
const CHECKED_SUM_CM = 203;

function dist(a: Point, b: Point) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function MeasureScreenContent() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // points: ordre HG, HD, BD, BG
  const [cardPts, setCardPts] = useState<Point[]>([]);
  const [bagPts, setBagPts] = useState<Point[]>([]);
  const [imageLayout, setImageLayout] = useState<{ w: number; h: number }>({ w: 1, h: 1 });

  // ---------- STEP ----------
  const step = useMemo(() => {
    if (!photoUri) return 'camera';
    if (cardPts.length < 4) return 'card';
    if (bagPts.length < 4) return 'bag';
    return 'done';
  }, [photoUri, cardPts.length, bagPts.length]);

  const instruction = useMemo(() => {
    const order = ['coin haut-gauche', 'coin haut-droit', 'coin bas-droit', 'coin bas-gauche'];
    if (step === 'card') return `Tape le ${order[cardPts.length]} de la CARTE.`;
    if (step === 'bag') return `Tape le ${order[bagPts.length]} de la VALISE.`;
    return '';
  }, [step, cardPts.length, bagPts.length]);

  // ---------- ZOOM / PAN ----------
  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const scale = Animated.multiply(baseScale, pinchScale);

  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  const offsetX = useRef(new Animated.Value(0)).current;
  const offsetY = useRef(new Animated.Value(0)).current;

  const lastOffset = useRef({ x: 0, y: 0 });
  const lastScale = useRef(1);

  const onPinchEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    { useNativeDriver: true }
  );

  const onPinchStateChange = (e: any) => {
    if (e.nativeEvent.oldState === State.ACTIVE) {
      const next = clamp(lastScale.current * e.nativeEvent.scale, 1, 5);
      lastScale.current = next;
      baseScale.setValue(next);
      pinchScale.setValue(1);
    }
  };

  const onPanEvent = Animated.event(
    [{ nativeEvent: { translationX: panX, translationY: panY } }],
    { useNativeDriver: true }
  );

  const onPanStateChange = (e: any) => {
    if (e.nativeEvent.oldState === State.ACTIVE) {
      const nx = lastOffset.current.x + e.nativeEvent.translationX;
      const ny = lastOffset.current.y + e.nativeEvent.translationY;

      lastOffset.current = { x: nx, y: ny };
      offsetX.setValue(nx);
      offsetY.setValue(ny);

      panX.setValue(0);
      panY.setValue(0);
    }
  };

  const translateX = Animated.add(offsetX, panX);
  const translateY = Animated.add(offsetY, panY);

  // ---------- SCALE ESTIMATION ----------
  const ppm = useMemo(() => {
    // pixels/mm (sur image affichée)
    if (cardPts.length < 4) return null;

    const tl = cardPts[0];
    const tr = cardPts[1];
    const bl = cardPts[3];

    const pxW = dist(tl, tr);
    const pxH = dist(tl, bl);

    const ppmW = pxW / CARD_W_MM;
    const ppmH = pxH / CARD_H_MM;

    const avg = (ppmW + ppmH) / 2;
    if (!isFinite(avg) || avg <= 0) return null;
    return avg;
  }, [cardPts]);

  const bagDims = useMemo(() => {
    if (!ppm || bagPts.length < 4) return null;

    const tl = bagPts[0];
    const tr = bagPts[1];
    const bl = bagPts[3];

    const pxW = dist(tl, tr);
    const pxH = dist(tl, bl);

    const widthCm = (pxW / ppm) / 10;
    const heightCm = (pxH / ppm) / 10;

    return { widthCm, heightCm };
  }, [ppm, bagPts]);

  const classification = useMemo(() => {
    if (!bagDims) return null;

    // On a 2D (face). On classe “cabine possible” si 2 dimensions <= (55,40) (ordre libre)
    const a = bagDims.widthCm;
    const b = bagDims.heightCm;

    const max2 = Math.max(a, b);
    const min2 = Math.min(a, b);

    const cabinPossible = (max2 <= CABIN_L && min2 <= CABIN_W);

    return {
      cabinRule: `Cabine: ≤ ${CABIN_L}×${CABIN_W}×${CABIN_H} cm`,
      checkedRule: `Soute: somme (L+W+H) ≤ ${CHECKED_SUM_CM} cm`,
      verdict: cabinPossible
        ? `✅ Cabine possible si l’épaisseur ≤ ${CABIN_H} cm`
        : `❌ Trop grand pour cabine (sur la photo)`,
      note: `* Pour conclure 100% "cabine", il faut aussi mesurer l’épaisseur (photo de profil).`,
    };
  }, [bagDims]);

  // ---------- ACTIONS ----------
  const takePhoto = async () => {
    try {
      if (!cameraRef.current) return;
      // @ts-ignore
      const pic = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!pic?.uri) return;

      setPhotoUri(pic.uri);
      setCardPts([]);
      setBagPts([]);

      // reset zoom/pan
      baseScale.setValue(1);
      pinchScale.setValue(1);
      lastScale.current = 1;

      offsetX.setValue(0);
      offsetY.setValue(0);
      panX.setValue(0);
      panY.setValue(0);
      lastOffset.current = { x: 0, y: 0 };
    } catch {
      Alert.alert('Erreur', "Impossible de prendre la photo.");
    }
  };

  const retake = () => {
    setPhotoUri(null);
    setCardPts([]);
    setBagPts([]);
  };

  const resetPoints = () => {
    setCardPts([]);
    setBagPts([]);
  };

  const undoLast = () => {
    if (step === 'card') {
      setCardPts((prev) => prev.slice(0, -1));
    } else if (step === 'bag') {
      setBagPts((prev) => prev.slice(0, -1));
    }
  };

  const onTapImage = (evt: any) => {
    if (step !== 'card' && step !== 'bag') return;

    const { locationX, locationY } = evt.nativeEvent;

    // attention: on utilise la position sur l'image affichée
    const x = clamp(locationX, 0, imageLayout.w);
    const y = clamp(locationY, 0, imageLayout.h);
    const p = { x, y };

    if (step === 'card') {
      if (cardPts.length >= 4) return;
      setCardPts((prev) => [...prev, p]);
    } else {
      if (!ppm) {
        Alert.alert('Info', 'Termine d’abord les 4 points de la carte.');
        return;
      }
      if (bagPts.length >= 4) return;
      setBagPts((prev) => [...prev, p]);
    }
  };

  // ---------- UI PERMISSIONS ----------
  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Chargement des permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Permission caméra requise</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnText}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ---------- UI ----------
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <MaterialIcons name="straighten" size={24} color="#111" />
          <Text style={styles.hTitle}>Mesure valise</Text>
        </View>
        <Text style={styles.hSub}>Référence : carte bancaire</Text>
      </View>

      {!photoUri ? (
        <View style={styles.card}>
          <View style={styles.cameraBox}>
            <CameraView ref={cameraRef} style={styles.camera} facing="back" />
          </View>

          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>Conseil</Text>
            <Text style={styles.tipText}>
              Mets la carte bancaire à côté de la face de la valise (bien visible). Photo bien de face.
            </Text>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={takePhoto}>
            <MaterialIcons name="photo-camera" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>Prendre la photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.stepRow}>
            <View style={[styles.chip, step === 'card' && styles.chipActive]}>
              <Text style={[styles.chipText, step === 'card' && styles.chipTextActive]}>1) Carte</Text>
            </View>
            <View style={[styles.chip, step === 'bag' && styles.chipActive]}>
              <Text style={[styles.chipText, step === 'bag' && styles.chipTextActive]}>2) Valise</Text>
            </View>
            <View style={[styles.chip, step === 'done' && styles.chipActive]}>
              <Text style={[styles.chipText, step === 'done' && styles.chipTextActive]}>3) Résultat</Text>
            </View>
          </View>

          {(step === 'card' || step === 'bag') && (
            <Text style={styles.instruction}>{instruction}</Text>
          )}

          <View style={styles.imageWrap}>
            <PanGestureHandler onGestureEvent={onPanEvent} onHandlerStateChange={onPanStateChange}>
              <Animated.View style={{ flex: 1 }}>
                <PinchGestureHandler onGestureEvent={onPinchEvent} onHandlerStateChange={onPinchStateChange}>
                  <Animated.View style={{ flex: 1 }}>
                    <Pressable onPress={onTapImage} style={{ flex: 1 }}>
                      <Animated.View
                        style={{
                          flex: 1,
                          transform: [{ translateX }, { translateY }, { scale }],
                        }}
                      >
                        <Image
                          source={{ uri: photoUri }}
                          style={styles.image}
                          resizeMode="contain"
                          onLayout={(e) => {
                            setImageLayout({
                              w: e.nativeEvent.layout.width,
                              h: e.nativeEvent.layout.height,
                            });
                          }}
                        />

                        {cardPts.map((p, i) => (
                          <View
                            key={`c-${i}`}
                            style={[
                              styles.dot,
                              { left: p.x - 7, top: p.y - 7, backgroundColor: '#1e88e5' },
                            ]}
                          />
                        ))}

                        {bagPts.map((p, i) => (
                          <View
                            key={`b-${i}`}
                            style={[
                              styles.dot,
                              { left: p.x - 7, top: p.y - 7, backgroundColor: '#43a047' },
                            ]}
                          />
                        ))}
                      </Animated.View>
                    </Pressable>
                  </Animated.View>
                </PinchGestureHandler>
              </Animated.View>
            </PanGestureHandler>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Carte</Text>
              <Text style={styles.infoValue}>{cardPts.length}/4</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Valise</Text>
              <Text style={styles.infoValue}>{bagPts.length}/4</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Zoom</Text>
              <Text style={styles.infoValue}>Pincer + Glisser</Text>
            </View>
          </View>

          {ppm && (
            <Text style={styles.scaleText}>Échelle: {ppm.toFixed(2)} px/mm</Text>
          )}

          {bagDims && (
            <View style={styles.resultBox}>
              <View style={styles.resultHeader}>
                <MaterialIcons name="inventory-2" size={20} color="#065f46" />
                <Text style={styles.resultTitle}>Dimensions estimées</Text>
              </View>
              <Text style={styles.resultLine}>Largeur: {bagDims.widthCm.toFixed(1)} cm</Text>
              <Text style={styles.resultLine}>Hauteur: {bagDims.heightCm.toFixed(1)} cm</Text>

              <View style={styles.ruleBox}>
                <Text style={styles.ruleTitle}>Cabine / Soute</Text>
                <Text style={styles.ruleText}>{classification?.cabinRule}</Text>
                <Text style={styles.ruleText}>{classification?.checkedRule}</Text>
                <Text style={styles.verdict}>{classification?.verdict}</Text>
                <Text style={styles.note}>{classification?.note}</Text>
              </View>
            </View>
          )}

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.secondaryBtn, !(step === 'card' || step === 'bag') && styles.btnDisabled]}
              onPress={undoLast}
              disabled={!(step === 'card' || step === 'bag')}
            >
              <MaterialIcons name="undo" size={18} color="#222" />
              <Text style={styles.secondaryBtnText}>Annuler dernier</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={resetPoints}>
              <MaterialIcons name="restart-alt" size={18} color="#222" />
              <Text style={styles.secondaryBtnText}>Reset points</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.ghostBtn} onPress={retake}>
              <Text style={styles.ghostText}>Refaire photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', paddingTop: 40, paddingHorizontal: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  msg: { color: '#111', marginBottom: 10, fontWeight: '600' },

  header: { alignItems: 'center', marginBottom: 10 },
  hTitle: { fontSize: 20, fontWeight: '900', color: '#111' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  cameraBox: { height: 420, borderRadius: 14, overflow: 'hidden' },
  camera: { flex: 1 },

  tipBox: { marginTop: 10, padding: 10, backgroundColor: '#f9fafb', borderRadius: 12 },
  tipTitle: { fontWeight: '800', color: '#111', marginBottom: 4 },
  tipText: { fontSize: 12, color: '#374151' },

  primaryBtn: {
    marginTop: 12,
    backgroundColor: '#B22222',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtnText: { color: '#fff', fontWeight: '900' },

  stepRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 10 },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: '#f3f4f6' },
  chipActive: { backgroundColor: '#111' },
  chipText: { fontSize: 12, color: '#374151', fontWeight: '700' },
  chipTextActive: { color: '#fff' },

  instruction: { textAlign: 'center', fontWeight: '800', color: '#111', marginBottom: 8 },

  imageWrap: {
    height: 420,
    backgroundColor: '#0b0f19',
    borderRadius: 14,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },

  dot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },

  infoGrid: { flexDirection: 'row', gap: 8, marginTop: 10 },
  infoCard: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 12, padding: 10 },
  infoLabel: { fontSize: 11, color: '#6b7280', fontWeight: '700' },
  infoValue: { fontSize: 12, color: '#111', fontWeight: '900', marginTop: 4 },

  scaleText: { marginTop: 8, textAlign: 'center', color: '#374151', fontWeight: '700' },

  resultBox: { marginTop: 10, backgroundColor: '#ecfdf5', borderRadius: 12, padding: 12 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  resultTitle: { fontWeight: '900', color: '#065f46' },
  resultLine: { fontWeight: '800', color: '#065f46' },

  ruleBox: { marginTop: 10, padding: 10, backgroundColor: '#fff', borderRadius: 12 },
  ruleTitle: { fontWeight: '900', color: '#111', marginBottom: 6 },
  ruleText: { fontSize: 12, color: '#374151' },
  verdict: { marginTop: 8, fontWeight: '900', color: '#111' },
  note: { marginTop: 6, fontSize: 11, color: '#6b7280' },

  btnRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  secondaryBtnText: { fontWeight: '900', color: '#111' },
  btnDisabled: { opacity: 0.4 },

  ghostBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: { fontWeight: '900', color: '#111' },
});

export default function MeasureScreen() {
  return (
    <RequireAuth>
      <MeasureScreenContent />
    </RequireAuth>
  );
}
