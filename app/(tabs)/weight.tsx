import RequireAuth from '@/components/RequireAuth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

type Item = {
  id: string;
  label: string;
  grams: number;
  category: 'Vêtements' | 'Toiletries' | 'Tech' | 'Divers';
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const ITEMS: Item[] = [
  // Vêtements
  { id: 'jeans_adult', label: 'Jeans adulte', grams: 700, category: 'Vêtements', icon: 'tshirt-crew' },
  { id: 'jeans_kid', label: 'Jeans enfant', grams: 450, category: 'Vêtements', icon: 'tshirt-crew' },
  { id: 'tshirt', label: 'T-shirt', grams: 180, category: 'Vêtements', icon: 'tshirt-crew' },
  { id: 'hoodie', label: 'Sweat / Hoodie', grams: 550, category: 'Vêtements', icon: 'tshirt-crew' },
  { id: 'jacket', label: 'Veste légère', grams: 650, category: 'Vêtements', icon: 'coat-rack' },
  { id: 'socks', label: 'Paire de chaussettes', grams: 60, category: 'Vêtements', icon: 'shoe-formal' },
  { id: 'underwear', label: 'Sous-êtement', grams: 50, category: 'Vêtements', icon: 'tshirt-crew' },
  { id: 'shoes', label: 'Paire de chaussures', grams: 950, category: 'Vêtements', icon: 'shoe-sneaker' },

  // Liquides / toilette
  { id: 'liquid_100', label: 'Liquide 100 ml', grams: 120, category: 'Toiletries', icon: 'bottle-tonic' },
  { id: 'liquid_250', label: 'Liquide 250 ml', grams: 290, category: 'Toiletries', icon: 'bottle-tonic' },
  { id: 'shampoo_100', label: 'Shampoing 100 ml', grams: 130, category: 'Toiletries', icon: 'bottle-tonic-plus' },
  { id: 'toothpaste', label: 'Dentifrice', grams: 120, category: 'Toiletries', icon: 'toothbrush-paste' },
  { id: 'perfume_50', label: 'Parfum 50 ml', grams: 180, category: 'Toiletries', icon: 'spray' },
  { id: 'towel_small', label: 'Serviette petite', grams: 300, category: 'Toiletries', icon: 'tumble-dryer' },

  // Tech
  { id: 'laptop', label: 'Laptop 14"', grams: 1800, category: 'Tech', icon: 'laptop' },
  { id: 'tablet', label: 'Tablette', grams: 600, category: 'Tech', icon: 'tablet' },
  { id: 'phone', label: 'Téléphone', grams: 220, category: 'Tech', icon: 'cellphone' },
  { id: 'charger', label: 'Chargeur', grams: 200, category: 'Tech', icon: 'power-plug' },
  { id: 'headphones', label: 'Casque audio', grams: 300, category: 'Tech', icon: 'headphones' },
  { id: 'camera', label: 'Appareil photo', grams: 700, category: 'Tech', icon: 'camera' },

  // Divers
  { id: 'book', label: 'Livre', grams: 400, category: 'Divers', icon: 'book-open-variant' },
  { id: 'water_bottle', label: 'Gourde vide', grams: 180, category: 'Divers', icon: 'bottle-soda' },
  { id: 'snacks', label: 'Snacks', grams: 200, category: 'Divers', icon: 'food-apple' },
  { id: 'passport_wallet', label: 'Passeport + Portefeuille', grams: 150, category: 'Divers', icon: 'wallet' },
];

const CABIN_LIMIT_KG = 8;
const CHECKED_LIMIT_KG = 23;

// Base de données d'objets communs pour l'estimation IA
const AI_WEIGHT_DATABASE: Record<string, { minGrams: number; maxGrams: number; avgGrams: number }> = {
  // Vêtements
  'manteau': { minGrams: 800, maxGrams: 2000, avgGrams: 1200 },
  'veste': { minGrams: 400, maxGrams: 900, avgGrams: 650 },
  'pantalon': { minGrams: 400, maxGrams: 800, avgGrams: 600 },
  'robe': { minGrams: 200, maxGrams: 600, avgGrams: 350 },
  'pull': { minGrams: 300, maxGrams: 700, avgGrams: 450 },
  'chemise': { minGrams: 150, maxGrams: 300, avgGrams: 220 },
  // Tech
  'ordinateur': { minGrams: 1200, maxGrams: 2500, avgGrams: 1800 },
  'ipad': { minGrams: 400, maxGrams: 700, avgGrams: 550 },
  'kindle': { minGrams: 150, maxGrams: 250, avgGrams: 200 },
  'enceinte': { minGrams: 300, maxGrams: 1500, avgGrams: 600 },
  'drone': { minGrams: 250, maxGrams: 1500, avgGrams: 800 },
  // Accessoires
  'sac à main': { minGrams: 300, maxGrams: 1200, avgGrams: 600 },
  'trousse': { minGrams: 100, maxGrams: 400, avgGrams: 200 },
  'parapluie': { minGrams: 200, maxGrams: 500, avgGrams: 350 },
  'lunettes': { minGrams: 20, maxGrams: 50, avgGrams: 35 },
  'montre': { minGrams: 50, maxGrams: 200, avgGrams: 100 },
  'ceinture': { minGrams: 80, maxGrams: 200, avgGrams: 120 },
  // Autres
  'jouet': { minGrams: 100, maxGrams: 800, avgGrams: 350 },
  'peluche': { minGrams: 100, maxGrams: 500, avgGrams: 250 },
  'bouteille': { minGrams: 400, maxGrams: 1200, avgGrams: 700 },
  'livre': { minGrams: 200, maxGrams: 800, avgGrams: 400 },
  'magazine': { minGrams: 100, maxGrams: 300, avgGrams: 180 },
  'cadeau': { minGrams: 200, maxGrams: 2000, avgGrams: 500 },
  'souvenirs': { minGrams: 100, maxGrams: 500, avgGrams: 250 },
  'bijoux': { minGrams: 20, maxGrams: 200, avgGrams: 80 },
  'medicaments': { minGrams: 50, maxGrams: 300, avgGrams: 150 },
  'nourriture': { minGrams: 200, maxGrams: 1000, avgGrams: 400 },
};

const CATEGORY_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  'Vêtements': 'hanger',
  'Toiletries': 'shower',
  'Tech': 'devices',
  'Divers': 'package-variant',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Vêtements': '#1565C0',
  'Toiletries': '#00695C',
  'Tech': '#6A1B9A',
  'Divers': '#D4AF37',
};

function formatKg(g: number) {
  return (g / 1000).toFixed(2);
}

function WeightEstimatorScreenContent() {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ name: string; grams: number; confidence: string } | null>(null);
  const [customItems, setCustomItems] = useState<{ id: string; label: string; grams: number }[]>([]);

  const grouped = useMemo(() => {
    const cats: Record<string, Item[]> = {};
    for (const it of ITEMS) {
      if (!cats[it.category]) cats[it.category] = [];
      cats[it.category].push(it);
    }
    return cats;
  }, []);

  const totalGrams = useMemo(() => {
    let sum = 0;
    for (const it of ITEMS) {
      const q = qty[it.id] ?? 0;
      sum += q * it.grams;
    }
    // Ajouter les objets personnalisés
    for (const ci of customItems) {
      const q = qty[ci.id] ?? 0;
      sum += q * ci.grams;
    }
    return sum;
  }, [qty, customItems]);

  const verdict = useMemo(() => {
    const kg = totalGrams / 1000;
    if (kg <= CABIN_LIMIT_KG) return { label: 'OK Cabine', icon: 'check-circle', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)' };
    if (kg <= CHECKED_LIMIT_KG) return { label: 'Soute uniquement', icon: 'alert-circle', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)' };
    return { label: 'Limite dépassée', icon: 'close-circle', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.1)' };
  }, [totalGrams]);

  const inc = (id: string) => setQty((p) => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
  const dec = (id: string) =>
    setQty((p) => {
      const next = Math.max(0, (p[id] ?? 0) - 1);
      const copy = { ...p, [id]: next };
      if (next === 0) delete copy[id];
      return copy;
    });

  const reset = () => setQty({});

  const itemCount = Object.values(qty).reduce((a, b) => a + b, 0);

  // Fonction d'estimation via API Groq (texte uniquement)
  const estimateWithAI = async () => {
    if (!aiDescription.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une description de l\'objet.');
      return;
    }
    
    setAiLoading(true);
    Keyboard.dismiss();
    
    try {
      const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
      
      const prompt = `Tu es un expert en estimation de poids d'objets. Estime le poids de l'objet suivant en grammes.\n\nDescription de l'objet: ${aiDescription}\n\nRéponds UNIQUEMENT avec un JSON valide dans ce format exact, sans aucun texte avant ou après:\n{"name": "nom de l'objet", "grams": nombre_en_grammes, "confidence": "Élevée" ou "Moyenne" ou "Faible"}\n\nExemple: {"name": "Sac à main", "grams": 600, "confidence": "Élevée"}`;
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'Tu es un assistant expert en estimation de poids d\'objets du quotidien. Tu donnes des estimations précises basées sur ta connaissance des objets courants. Réponds uniquement en JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 256,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('API Error:', data);
        throw new Error(data.error?.message || 'Erreur API');
      }
      
      const aiResponse = data.choices?.[0]?.message?.content || '';
      
      // Parser la réponse JSON
      const jsonMatch = aiResponse.match(/\{[^}]+\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setAiResult({
          name: parsed.name || aiDescription || 'Objet',
          grams: parseInt(parsed.grams) || 300,
          confidence: parsed.confidence || 'Moyenne',
        });
      } else {
        // Fallback sur la base locale
        const searchText = aiDescription.toLowerCase();
        let bestMatch = { name: aiDescription || 'Objet', grams: 300, confidence: 'Moyenne' };
        for (const [keyword, dbData] of Object.entries(AI_WEIGHT_DATABASE)) {
          if (searchText.includes(keyword)) {
            bestMatch = {
              name: keyword.charAt(0).toUpperCase() + keyword.slice(1),
              grams: dbData.avgGrams,
              confidence: 'Moyenne',
            };
            break;
          }
        }
        setAiResult(bestMatch);
      }
    } catch (error) {
      console.error('Erreur Groq:', error);
      // Fallback sur la base de données locale
      const searchText = (aiDescription || '').toLowerCase();
      let bestMatch = { name: aiDescription || 'Objet', grams: 300, confidence: 'Moyenne' };
      for (const [keyword, dbData] of Object.entries(AI_WEIGHT_DATABASE)) {
        if (searchText.includes(keyword)) {
          bestMatch = {
            name: keyword.charAt(0).toUpperCase() + keyword.slice(1),
            grams: dbData.avgGrams,
            confidence: 'Moyenne',
          };
          break;
        }
      }
      setAiResult(bestMatch);
    }
    
    setAiLoading(false);
  };

  // Ajouter l'objet estimé à la liste
  const addAIItem = () => {
    if (aiResult) {
      const newItem = {
        id: `custom_${Date.now()}`,
        label: aiResult.name,
        grams: aiResult.grams,
      };
      setCustomItems(prev => [...prev, newItem]);
      setQty(prev => ({ ...prev, [newItem.id]: 1 }));
      resetAIModal();
      Alert.alert('✅ Ajouté', `"${aiResult.name}" (~${aiResult.grams}g) a été ajouté à votre estimation.`);
    }
  };

  const resetAIModal = () => {
    setShowAIModal(false);
    setAiDescription('');
    setAiResult(null);
    setAiLoading(false);
  };

  // Supprimer un objet personnalisé
  const removeCustomItem = (id: string) => {
    setCustomItems(prev => prev.filter(it => it.id !== id));
    setQty(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  return (
    <View style={styles.container}>
      {/* Premium Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconBox}>
            <MaterialCommunityIcons name="scale" size={26} color="#D4AF37" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Estimation Poids</Text>
            <Text style={styles.headerSubtitle}>Calculateur intelligent</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryMain}>
            <Text style={styles.summaryLabel}>Poids total estimé</Text>
            <View style={styles.summaryValueRow}>
              <Text style={styles.summaryValue}>{formatKg(totalGrams)}</Text>
              <Text style={styles.summaryUnit}>kg</Text>
            </View>
            <View style={[styles.verdictBadge, { backgroundColor: verdict.bgColor }]}>
              <MaterialCommunityIcons name={verdict.icon as any} size={16} color={verdict.color} />
              <Text style={[styles.verdictText, { color: verdict.color }]}>{verdict.label}</Text>
            </View>
          </View>

          <View style={styles.summaryRight}>
            <View style={styles.limitRow}>
              <MaterialCommunityIcons name="bag-carry-on" size={14} color="#64748B" />
              <Text style={styles.limitText}>Cabine: ≤{CABIN_LIMIT_KG} kg</Text>
            </View>
            <View style={styles.limitRow}>
              <MaterialCommunityIcons name="bag-suitcase" size={14} color="#64748B" />
              <Text style={styles.limitText}>Soute: ≤{CHECKED_LIMIT_KG} kg</Text>
            </View>
            <TouchableOpacity style={styles.resetButton} onPress={reset} activeOpacity={0.85}>
              <MaterialCommunityIcons name="refresh" size={16} color="#fff" />
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Items Counter */}
        <View style={styles.itemsCounter}>
          <MaterialCommunityIcons name="package-variant" size={18} color="#64748B" />
          <Text style={styles.itemsCounterText}>{itemCount} objet{itemCount > 1 ? 's' : ''} sélectionné{itemCount > 1 ? 's' : ''}</Text>
        </View>

        {/* Categories */}
        {Object.entries(grouped).map(([cat, items]) => (
          <View key={cat} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryIconBox, { backgroundColor: `${CATEGORY_COLORS[cat]}15` }]}>
                <MaterialCommunityIcons name={CATEGORY_ICONS[cat]} size={18} color={CATEGORY_COLORS[cat]} />
              </View>
              <Text style={styles.categoryTitle}>{cat}</Text>
              <View style={styles.categoryLine} />
            </View>

            <View style={styles.itemsContainer}>
              {items.map((it, index) => {
                const q = qty[it.id] ?? 0;
                const lineG = q * it.grams;

                return (
                  <View key={it.id} style={[styles.itemRow, index === 0 && { borderTopWidth: 0 }]}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemLabel}>{it.label}</Text>
                      <Text style={styles.itemSub}>
                        ~{it.grams}g{q > 0 && <Text style={styles.itemTotal}> • {formatKg(lineG)} kg</Text>}
                      </Text>
                    </View>

                    <View style={styles.controls}>
                      <TouchableOpacity
                        style={[styles.ctrlBtn, q === 0 && styles.ctrlBtnDisabled]}
                        onPress={() => dec(it.id)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="minus" size={18} color={q === 0 ? '#CBD5E1' : '#1E293B'} />
                      </TouchableOpacity>
                      <Text style={[styles.qtyText, q > 0 && styles.qtyTextActive]}>{q}</Text>
                      <TouchableOpacity
                        style={[styles.ctrlBtn, styles.ctrlBtnAdd]}
                        onPress={() => inc(it.id)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="plus" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {/* Note */}
        <View style={styles.noteCard}>
          <MaterialCommunityIcons name="information-outline" size={18} color="#94A3B8" />
          <Text style={styles.noteText}>
            Ces estimations sont basées sur des moyennes. Le poids réel peut varier selon la taille et la marque.
          </Text>
        </View>

        {/* Objets personnalisés ajoutés par IA */}
        {customItems.length > 0 && (
          <View style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                <MaterialCommunityIcons name="robot" size={18} color="#8B5CF6" />
              </View>
              <Text style={styles.categoryTitle}>Objets estimés par IA</Text>
              <View style={styles.categoryLine} />
            </View>
            <View style={styles.itemsContainer}>
              {customItems.map((it, index) => {
                const q = qty[it.id] ?? 0;
                const lineG = q * it.grams;
                return (
                  <View key={it.id} style={[styles.itemRow, index === 0 && { borderTopWidth: 0 }]}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemLabel}>{it.label}</Text>
                      <Text style={styles.itemSub}>
                        ~{it.grams}g{q > 0 && <Text style={styles.itemTotal}> • {formatKg(lineG)} kg</Text>}
                      </Text>
                    </View>
                    <View style={styles.controls}>
                      <TouchableOpacity
                        style={[styles.ctrlBtn, q === 0 && styles.ctrlBtnDisabled]}
                        onPress={() => dec(it.id)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="minus" size={18} color={q === 0 ? '#CBD5E1' : '#1E293B'} />
                      </TouchableOpacity>
                      <Text style={[styles.qtyText, q > 0 && styles.qtyTextActive]}>{q}</Text>
                      <TouchableOpacity
                        style={[styles.ctrlBtn, styles.ctrlBtnAdd]}
                        onPress={() => inc(it.id)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="plus" size={18} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.ctrlBtn, { backgroundColor: '#FEE2E2', marginLeft: 4 }]}
                        onPress={() => removeCustomItem(it.id)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Encart IA */}
        <TouchableOpacity style={styles.aiCard} onPress={() => setShowAIModal(true)} activeOpacity={0.85}>
          <View style={styles.aiCardGradient}>
            <View style={styles.aiCardIcon}>
              <MaterialCommunityIcons name="robot-excited-outline" size={32} color="#8B5CF6" />
            </View>
            <View style={styles.aiCardContent}>
              <Text style={styles.aiCardTitle}>Estimation IA</Text>
              <Text style={styles.aiCardDesc}>
                Décrivez un objet non listé et laissez l'IA estimer son poids
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#8B5CF6" />
          </View>
        </TouchableOpacity>

      </ScrollView>

      {/* Modal IA */}
      <Modal
        visible={showAIModal}
        transparent
        animationType="slide"
        onRequestClose={resetAIModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Estimation IA</Text>
                  <TouchableOpacity onPress={resetAIModal}>
                    <MaterialCommunityIcons name="close" size={24} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalSubtitle}>
                  Décrivez l'objet pour estimer son poids
                </Text>

                {/* Zone description */}
                <Text style={styles.inputLabel}>Description de l'objet</Text>
                <TextInput
                  style={styles.aiInput}
                  placeholder="Ex: sac à main en cuir, peluche géante, valise cabine..."
                  placeholderTextColor="#94A3B8"
                  value={aiDescription}
                  onChangeText={(t) => { setAiDescription(t); setAiResult(null); }}
                  multiline
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onSubmitEditing={Keyboard.dismiss}
                />

                {/* Résultat */}
                {aiResult && (
                  <View style={styles.aiResultCard}>
                    <View style={styles.aiResultIcon}>
                      <MaterialCommunityIcons name="lightbulb-on" size={24} color="#10B981" />
                    </View>
                    <View style={styles.aiResultInfo}>
                      <Text style={styles.aiResultName}>{aiResult.name}</Text>
                      <Text style={styles.aiResultWeight}>Poids estimé : ~{aiResult.grams}g</Text>
                      <Text style={styles.aiResultConfidence}>Confiance : {aiResult.confidence}</Text>
                    </View>
                  </View>
                )}

                {/* Boutons */}
                <View style={styles.modalActions}>
                  {!aiResult ? (
                    <TouchableOpacity 
                      style={[styles.aiActionBtn, aiLoading && styles.aiActionBtnDisabled]}
                      onPress={estimateWithAI}
                      disabled={aiLoading}
                    >
                      {aiLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="auto-fix" size={20} color="#fff" />
                          <Text style={styles.aiActionBtnText}>Estimer le poids</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.aiActionBtn, { backgroundColor: '#10B981' }]}
                      onPress={addAIItem}
                    >
                      <MaterialCommunityIcons name="plus-circle" size={20} color="#fff" />
                      <Text style={styles.aiActionBtnText}>Ajouter à ma liste</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F6',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 56,
    paddingBottom: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    marginBottom: 16,
  },
  summaryMain: {},
  summaryLabel: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 13,
  },
  summaryValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  summaryValue: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -1,
  },
  summaryUnit: {
    fontSize: 20,
    fontWeight: '700',
    color: '#94A3B8',
    marginLeft: 4,
  },
  verdictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  verdictText: {
    fontWeight: '700',
    fontSize: 13,
  },
  summaryRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  limitText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 12,
  },
  resetButton: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#B22222',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  itemsCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingLeft: 4,
  },
  itemsCounterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  categoryIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    fontWeight: '700',
    color: '#1E293B',
    fontSize: 15,
  },
  categoryLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
    marginLeft: 8,
  },
  itemsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  itemInfo: {
    flex: 1,
  },
  itemLabel: {
    fontWeight: '700',
    color: '#1E293B',
    fontSize: 14,
  },
  itemSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  itemTotal: {
    color: '#64748B',
    fontWeight: '700',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctrlBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlBtnDisabled: {
    backgroundColor: '#F8FAFC',
  },
  ctrlBtnAdd: {
    backgroundColor: '#B22222',
  },
  qtyText: {
    width: 28,
    textAlign: 'center',
    fontWeight: '800',
    color: '#CBD5E1',
    fontSize: 16,
  },
  qtyTextActive: {
    color: '#1E293B',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E8ECF0',
  },
  noteText: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  // Styles IA
  aiCard: {
    marginTop: 16,
    borderRadius: 18,
    overflow: 'hidden',
  },
  aiCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderWidth: 2,
    borderColor: '#DDD6FE',
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  aiCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiCardContent: {
    flex: 1,
  },
  aiCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#5B21B6',
    marginBottom: 4,
  },
  aiCardDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7C3AED',
    lineHeight: 17,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 20,
  },
  photoSection: {
    marginBottom: 20,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#DDD6FE',
    borderStyle: 'dashed',
  },
  photoBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C3AED',
  },
  photoPreviewContainer: {
    alignSelf: 'center',
    marginVertical: 16,
    position: 'relative',
  },
  photoPreview: {
    width: 160,
    height: 160,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#fff',
    borderRadius: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  aiInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  aiResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  aiResultIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiResultInfo: {
    flex: 1,
  },
  aiResultName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#065F46',
  },
  aiResultWeight: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 2,
  },
  aiResultConfidence: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6EE7B7',
    marginTop: 2,
  },
  modalActions: {
    marginTop: 4,
  },
  aiActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8B5CF6',
    borderRadius: 14,
    paddingVertical: 16,
  },
  aiActionBtnDisabled: {
    opacity: 0.7,
  },
  aiActionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});

export default function WeightEstimatorScreen() {
  return (
    <RequireAuth>
      <WeightEstimatorScreenContent />
    </RequireAuth>
  );
}
