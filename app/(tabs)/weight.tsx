import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  { id: 'socks', label: 'Paire de chaussettes', grams: 60, category: 'Vêtements', icon: 'socks' },
  { id: 'underwear', label: 'Sous-vêtement', grams: 50, category: 'Vêtements', icon: 'tshirt-crew' },
  { id: 'shoes', label: 'Paire de chaussures', grams: 950, category: 'Vêtements', icon: 'shoe-sneaker' },

  // Liquides / toilette
  { id: 'liquid_100', label: 'Liquide 100 ml', grams: 120, category: 'Toiletries', icon: 'bottle-tonic' },
  { id: 'liquid_250', label: 'Liquide 250 ml', grams: 290, category: 'Toiletries', icon: 'bottle-tonic' },
  { id: 'shampoo_100', label: 'Shampoing 100 ml', grams: 130, category: 'Toiletries', icon: 'bottle-tonic-plus' },
  { id: 'toothpaste', label: 'Dentifrice', grams: 120, category: 'Toiletries', icon: 'toothbrush-paste' },
  { id: 'perfume_50', label: 'Parfum 50 ml', grams: 180, category: 'Toiletries', icon: 'spray' },
  { id: 'towel_small', label: 'Serviette petite', grams: 300, category: 'Toiletries', icon: 'tumble-dryer' },

  // Tech
  { id: 'laptop', label: 'PC portable', grams: 1500, category: 'Tech', icon: 'laptop' },
  { id: 'tablet', label: 'Tablette', grams: 500, category: 'Tech', icon: 'tablet' },
  { id: 'charger', label: 'Chargeur', grams: 150, category: 'Tech', icon: 'power-plug' },
  { id: 'powerbank', label: 'Powerbank', grams: 260, category: 'Tech', icon: 'battery-charging' },
  { id: 'headphones', label: 'Casque audio', grams: 220, category: 'Tech', icon: 'headphones' },

  // Divers
  { id: 'book', label: 'Livre', grams: 350, category: 'Divers', icon: 'book-open-variant' },
  { id: 'water_empty', label: 'Gourde vide', grams: 200, category: 'Divers', icon: 'cup-water' },
  { id: 'umbrella', label: 'Parapluie', grams: 320, category: 'Divers', icon: 'umbrella' },
  { id: 'bag_empty', label: 'Valise (vide) cabine', grams: 2500, category: 'Divers', icon: 'bag-carry-on' },
  { id: 'bag_empty_big', label: 'Valise (vide) soute', grams: 3500, category: 'Divers', icon: 'bag-suitcase' },
];

const CABIN_LIMIT_KG = 8;
const CHECKED_LIMIT_KG = 23;

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

export default function WeightEstimatorScreen() {
  const [qty, setQty] = useState<Record<string, number>>({});

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
    return sum;
  }, [qty]);

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

      </ScrollView>
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
});
