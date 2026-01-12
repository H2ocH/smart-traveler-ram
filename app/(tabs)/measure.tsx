import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
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

type Plan = '2D' | '3D';         // 2D = 1 photo, 3D = 2 photos
type ViewMode = 'face' | 'side'; // face = largeur/hauteur, side = épaisseur

// Référence carte bancaire (ISO/IEC 7810 ID-1)
const CARD_W_MM = 85.6;
const CARD_H_MM = 53.98;

// Limites cabine (ex: RAM — adapte si besoin)
const CABIN_L = 55;
const CABIN_W = 40;
const CABIN_H = 25;

// Soute : règle somme <= 203 cm (standard courant)
const CHECKED_SUM_CM = 203;

function dist(a: Point, b: Point) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return Math.sqrt(dx * dx + dy * dy);
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function MeasureScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  // Splash bar pour l'écran camera (optionnel)
  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    return () => StatusBar.setBarStyle('default');
  }, []);

  // Choix du plan (2D/3D)
  const [plan, setPlan] = useState<Plan | null>(null);

  // Vue actuelle : face puis side si 3D
  const [viewMode, setViewMode] = useState<ViewMode>('face');

  // Photos et points
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // points: ordre HG, HD, BD, BG
  const [cardPts, setCardPts] = useState<Point[]>([]);
  const [bagPts, setBagPts] = useState<Point[]>([]);
  const [imageLayout, setImageLayout] = useState<{ w: number; h: number }>({ w: 1, h: 1 });

  // Données finales
  const [faceDims, setFaceDims] = useState<{ widthCm: number; heightCm: number } | null>(null);
  const [sideDims, setSideDims] = useState<{ depthCm: number } | null>(null);

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

  const resetZoomPan = () => {
    baseScale.setValue(1);
    pinchScale.setValue(1);
    lastScale.current = 1;

    offsetX.setValue(0);
    offsetY.setValue(0);
    panX.setValue(0);
    panY.setValue(0);
    lastOffset.current = { x: 0, y: 0 };
  };

  // ---------- STEP ----------
  const step = useMemo(() => {
    if (!plan) return 'choose_plan';
    if (!photoUri) return 'camera';
    if (cardPts.length < 4) return 'card';
    if (bagPts.length < 4) return 'bag';

    // Bag pts completed on this photo
    if (plan === '3D' && viewMode === 'face' && !sideDims) return 'need_side';
    return 'done';
  }, [plan, photoUri, cardPts.length, bagPts.length, viewMode, sideDims]);

  const instruction = useMemo(() => {
    const order = ['coin haut-gauche', 'coin haut-droit', 'coin bas-droit', 'coin bas-gauche'];
    if (step === 'card') return `Tape le ${order[cardPts.length]} de la CARTE.`;
    if (step === 'bag') {
      const who = viewMode === 'face' ? 'VALISE (FACE)' : 'VALISE (PROFIL)';
      return `Tape le ${order[bagPts.length]} de la ${who}.`;
    }
    return '';
  }, [step, cardPts.length, bagPts.length, viewMode]);

  // ---------- SCALE ESTIMATION ----------
  // pixels/mm sur image affichée (à partir de la carte)
  const ppm = useMemo(() => {
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

  // Dimensions mesurées sur la photo courante (rectangle cliqué)
  const bagDimsOnThisPhoto = useMemo(() => {
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

  // Quand on a bagDims sur la photo, on sauvegarde dans faceDims ou sideDims
  useEffect(() => {
    if (!bagDimsOnThisPhoto) return;

    if (viewMode === 'face') {
      setFaceDims({
        widthCm: bagDimsOnThisPhoto.widthCm,
        heightCm: bagDimsOnThisPhoto.heightCm,
      });
    } else {
      // sur le profil: on prend l'horizontale comme l'épaisseur
      setSideDims({
        depthCm: bagDimsOnThisPhoto.widthCm,
      });
    }
  }, [bagDimsOnThisPhoto, viewMode]);

  // Dimensions complètes (si 3D: largeur/hauteur + épaisseur)
  const fullDims = useMemo(() => {
    if (!faceDims) return null;
    if (plan === '2D') return { ...faceDims, depthCm: null as number | null };
    if (!sideDims) return null;
    return { ...faceDims, depthCm: sideDims.depthCm };
  }, [faceDims, sideDims, plan]);

  // Verdict cabine/soute avec 3 dimensions si dispo
  const sizeVerdict = useMemo(() => {
    if (!fullDims) return null;

    if (fullDims.depthCm == null) {
      // 2D only -> verdict partiel
      const a = fullDims.widthCm;
      const b = fullDims.heightCm;
      const max2 = Math.max(a, b);
      const min2 = Math.min(a, b);
      const cabinPossible2D = max2 <= CABIN_L && min2 <= CABIN_W;
      return {
        mode: '2D' as const,
        verdict: cabinPossible2D
          ? `✅ Face OK pour cabine (épaisseur inconnue)`
          : `❌ Face trop grande pour cabine`,
        note: `Pour conclure 100% cabine, mesure aussi l’épaisseur (3D).`,
      };
    }

    // 3D -> on compare dimensions triées au standard cabine
    const dims = [fullDims.widthCm, fullDims.heightCm, fullDims.depthCm].sort((x, y) => y - x);
    const cabinDims = [CABIN_L, CABIN_W, CABIN_H].sort((x, y) => y - x);

    const cabinOk =
      dims[0] <= cabinDims[0] && dims[1] <= cabinDims[1] && dims[2] <= cabinDims[2];

    const sum = dims[0] + dims[1] + dims[2];
    const checkedOk = sum <= CHECKED_SUM_CM;

    return {
      mode: '3D' as const,
      cabinOk,
      checkedOk,
      verdict: cabinOk
        ? `✅ Cabine OK (${CABIN_L}×${CABIN_W}×${CABIN_H} cm)`
        : checkedOk
        ? `🟠 Pas cabine, mais OK soute (somme ≤ ${CHECKED_SUM_CM} cm)`
        : `🔴 Dépasse même la soute (somme > ${CHECKED_SUM_CM} cm)`,
    };
  }, [fullDims]);

  // ---------- ACTIONS ----------
  const takePhoto = async () => {
    try {
      if (!cameraRef.current) return;
      // @ts-ignore
      const pic = await cameraRef.current.takePictureAsync({ quality: 0.75 });
      if (!pic?.uri) return;

      setPhotoUri(pic.uri);
      setCardPts([]);
      setBagPts([]);
      resetZoomPan();
    } catch {
      Alert.alert('Erreur', "Impossible de prendre la photo.");
    }
  };

  const retakeThisShot = () => {
    // refaire la photo courante (face ou side)
    setPhotoUri(null);
    setCardPts([]);
    setBagPts([]);
    resetZoomPan();
  };

  const resetAll = () => {
    setPlan(null);
    setViewMode('face');
    setPhotoUri(null);
    setCardPts([]);
    setBagPts([]);
    setFaceDims(null);
    setSideDims(null);
    resetZoomPan();
  };

  const resetPoints = () => {
    setCardPts([]);
    setBagPts([]);
  };

  const undoLast = () => {
    if (step === 'card') setCardPts((prev) => prev.slice(0, -1));
    else if (step === 'bag') setBagPts((prev) => prev.slice(0, -1));
  };

  const onTapImage = (evt: any) => {
    if (step !== 'card' && step !== 'bag') return;

    const { locationX, locationY } = evt.nativeEvent;
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

  const goToSideMeasurement = () => {
    // on passe à la 2e photo
    setPhotoUri(null);
    setCardPts([]);
    setBagPts([]);
    setViewMode('side');
    resetZoomPan();
  };

  // ---------- PERMISSIONS ----------
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.header}>
        <Text style={styles.hTitle}>📏 Mesure valise (2D / 3D)</Text>
        <Text style={styles.hSub}>Référence : carte bancaire (à mettre visible sur chaque photo)</Text>
      </View>

      {/* 1) Choix du plan */}
      {step === 'choose_plan' && (
        <View style={styles.card}>
          <Text style={styles.bigTitle}>Tu veux mesurer quoi ?</Text>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: '#7A0C0C' }]}
            onPress={() => {
              setPlan('2D');
              setViewMode('face');
              setFaceDims(null);
              setSideDims(null);
            }}
          >
            <Text style={styles.primaryBtnText}>Mesure 2D (Largeur + Hauteur)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: '#B22222' }]}
            onPress={() => {
              setPlan('3D');
              setViewMode('face');
              setFaceDims(null);
              setSideDims(null);
            }}
          >
            <Text style={styles.primaryBtnText}>Mesure 3D (Face + Profil = Épaisseur)</Text>
          </TouchableOpacity>

          <Text style={styles.tipTextCenter}>
            • 2D = 1 photo (face), verdict cabine partiel{'\n'}
            • 3D = 2 photos (face puis profil), verdict cabine complet
          </Text>
        </View>
      )}

      {/* 2) Caméra */}
      {step === 'camera' && (
        <View style={styles.card}>
          <View style={styles.modeRow}>
            <View style={[styles.badge, { backgroundColor: '#111' }]}>
              <Text style={styles.badgeText}>Plan: {plan}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: viewMode === 'face' ? '#1E88E5' : '#4CAF50' }]}>
              <Text style={styles.badgeText}>
                {viewMode === 'face' ? 'Photo FACE (L×H)' : 'Photo PROFIL (Épaisseur)'}
              </Text>
            </View>
          </View>

          <View style={styles.cameraBox}>
            <CameraView ref={cameraRef} style={styles.camera} facing="back" />
          </View>

          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>Conseil</Text>
            <Text style={styles.tipText}>
              Photo bien de face, carte visible. Pour profil (épaisseur), tourne la valise sur le côté.
            </Text>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={takePhoto}>
            <MaterialIcons name="photo-camera" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>Prendre la photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ghostBtn} onPress={resetAll}>
            <Text style={styles.ghostText}>Revenir au choix 2D/3D</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3) Mesure sur photo */}
      {photoUri && step !== 'choose_plan' && (
        <View style={styles.card}>
          <View style={styles.modeRow}>
            <View style={[styles.badge, { backgroundColor: '#111' }]}>
              <Text style={styles.badgeText}>Plan: {plan}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: viewMode === 'face' ? '#1E88E5' : '#4CAF50' }]}>
              <Text style={styles.badgeText}>
                {viewMode === 'face' ? 'FACE (L×H)' : 'PROFIL (Épaisseur)'}
              </Text>
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

                        {/* Points carte */}
                        {cardPts.map((p, i) => (
                          <View
                            key={`c-${i}`}
                            style={[
                              styles.dot,
                              { left: p.x - 7, top: p.y - 7, backgroundColor: '#1e88e5' },
                            ]}
                          />
                        ))}

                        {/* Points valise */}
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

          {/* Boutons points */}
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
            <TouchableOpacity style={styles.ghostBtn} onPress={retakeThisShot}>
              <Text style={styles.ghostText}>Refaire cette photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghostBtn} onPress={resetAll}>
              <Text style={styles.ghostText}>Tout recommencer</Text>
            </TouchableOpacity>
          </View>

          {/* Résumé des mesures */}
          {faceDims && (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>📐 Mesure FACE</Text>
              <Text style={styles.resultLine}>Largeur ≈ {faceDims.widthCm.toFixed(1)} cm</Text>
              <Text style={styles.resultLine}>Hauteur ≈ {faceDims.heightCm.toFixed(1)} cm</Text>
            </View>
          )}

          {sideDims && (
            <View style={[styles.resultBox, { backgroundColor: '#eef6ff' }]}>
              <Text style={styles.resultTitle}>📐 Mesure PROFIL</Text>
              <Text style={styles.resultLine}>Épaisseur ≈ {sideDims.depthCm.toFixed(1)} cm</Text>
            </View>
          )}

          {/* Besoin photo profil */}
          {step === 'need_side' && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.needSideText}>
                ✅ Face mesurée. Maintenant tourne la valise sur le côté (profil) pour mesurer l’épaisseur.
              </Text>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#7A0C0C' }]} onPress={goToSideMeasurement}>
                <Text style={styles.primaryBtnText}>Mesurer l’épaisseur (Profil)</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Résultat final */}
          {step === 'done' && (
            <View style={{ marginTop: 12 }}>
              {/* Verdict taille */}
              {sizeVerdict && (
                <View style={styles.ruleBox}>
                  <Text style={styles.ruleTitle}>Cabine / Soute</Text>
                  <Text style={styles.verdict}>{sizeVerdict.verdict}</Text>
                  {'note' in sizeVerdict && (
                    <Text style={styles.note}>{sizeVerdict.note}</Text>
                  )}
                  {'mode' in sizeVerdict && sizeVerdict.mode === '3D' && (
                    <Text style={styles.note}>
                      Standard cabine: ≤ {CABIN_L}×{CABIN_W}×{CABIN_H} cm • Soute: somme ≤ {CHECKED_SUM_CM} cm
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', paddingTop: 40, paddingHorizontal: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  msg: { color: '#111', marginBottom: 10, fontWeight: '600' },

  header: { alignItems: 'center', marginBottom: 10 },
  hTitle: { fontSize: 18, fontWeight: '900', color: '#111' },
  hSub: { fontSize: 12, color: '#6b7280', marginTop: 2, textAlign: 'center' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  bigTitle: { fontWeight: '900', fontSize: 16, textAlign: 'center', marginBottom: 10, color: '#111' },

  modeRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 10, flexWrap: 'wrap' },
  badge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
  badgeText: { color: '#fff', fontWeight: '900', fontSize: 12 },

  cameraBox: { height: 420, borderRadius: 14, overflow: 'hidden' },
  camera: { flex: 1 },

  tipBox: { marginTop: 10, padding: 10, backgroundColor: '#f9fafb', borderRadius: 12 },
  tipTitle: { fontWeight: '800', color: '#111', marginBottom: 4 },
  tipText: { fontSize: 12, color: '#374151' },
  tipTextCenter: { marginTop: 10, color: '#6b7280', fontSize: 12, textAlign: 'center', lineHeight: 18 },

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

  ghostBtn: {
    marginTop: 10,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: { fontWeight: '900', color: '#111' },

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

  resultBox: { marginTop: 10, backgroundColor: '#ecfdf5', borderRadius: 12, padding: 12 },
  resultTitle: { fontWeight: '900', color: '#065f46', marginBottom: 6 },
  resultLine: { fontWeight: '800', color: '#065f46' },

  needSideText: { textAlign: 'center', fontWeight: '800', color: '#111', marginBottom: 8 },

  ruleBox: { marginTop: 10, padding: 12, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#f3f4f6' },
  ruleTitle: { fontWeight: '900', color: '#111', marginBottom: 6 },
  verdict: { marginTop: 4, fontWeight: '900', color: '#111' },
  note: { marginTop: 6, fontSize: 11, color: '#6b7280', lineHeight: 16 },
});