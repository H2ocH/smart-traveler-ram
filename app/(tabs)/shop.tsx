import RequireAuth from '@/components/RequireAuth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Types
interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
  image: string;
}

interface Shop {
  id: string;
  name: string;
  type: string;
  terminal: string;
  icon: string;
  color: string;
  items: ShopItem[];
  featuredImages: string[];
}

// Base de données des boutiques
const SHOPS_DATA: Shop[] = [
  {
    id: 'shop-duty-free',
    name: 'Duty Free Atlas',
    type: 'Duty Free',
    terminal: 'T1',
    icon: 'shopping',
    color: '#1565C0',
    featuredImages: [
      'https://images.unsplash.com/photo-1541643600914-78b084683601?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=200&h=200&fit=crop',
    ],
    items: [
      { id: 'df-1', name: 'Parfum Chanel N°5', description: 'Eau de parfum 100ml', price: 1200, category: 'Parfums', inStock: true, image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop' },
      { id: 'df-2', name: 'Parfum Dior Sauvage', description: 'Eau de toilette 100ml', price: 950, category: 'Parfums', inStock: true, image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&h=400&fit=crop' },
      { id: 'df-3', name: 'Montre Casio', description: 'Montre digitale classique', price: 450, category: 'Montres', inStock: true, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop' },
      { id: 'df-4', name: 'Chocolat Lindt', description: 'Assortiment premium 500g', price: 180, category: 'Confiserie', inStock: true, image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&h=400&fit=crop' },
      { id: 'df-5', name: 'Whisky Johnnie Walker', description: 'Black Label 1L', price: 650, category: 'Spiritueux', inStock: false, image: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&h=400&fit=crop' },
      { id: 'df-6', name: 'Cigarettes Marlboro', description: 'Cartouche 10 paquets', price: 320, category: 'Tabac', inStock: true, image: 'https://images.unsplash.com/photo-1571104508999-893933ded431?w=400&h=400&fit=crop' },
      { id: 'df-7', name: 'Lunettes Ray-Ban', description: 'Aviator classique', price: 1450, category: 'Accessoires', inStock: true, image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop' },
      { id: 'df-8', name: 'Huile d\'Argan', description: 'Bio marocaine 250ml', price: 280, category: 'Cosmétiques', inStock: true, image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop' },
    ],
  },
  {
    id: 'shop-fashion',
    name: 'Boutique Mode',
    type: 'Mode & Accessoires',
    terminal: 'T1',
    icon: 'hanger',
    color: '#9C27B0',
    featuredImages: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1560243563-062bfc001d68?w=200&h=200&fit=crop',
    ],
    items: [
      { id: 'fm-1', name: 'Écharpe en soie', description: 'Motifs traditionnels', price: 350, category: 'Accessoires', inStock: true, image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&h=400&fit=crop' },
      { id: 'fm-2', name: 'Sac à main cuir', description: 'Cuir véritable marocain', price: 890, category: 'Maroquinerie', inStock: true, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop' },
      { id: 'fm-3', name: 'Ceinture homme', description: 'Cuir premium', price: 320, category: 'Accessoires', inStock: true, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop' },
      { id: 'fm-4', name: 'Portefeuille', description: 'Cuir pleine fleur', price: 450, category: 'Maroquinerie', inStock: false, image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop' },
      { id: 'fm-5', name: 'Babouches artisanales', description: 'Fait main Fès', price: 280, category: 'Chaussures', inStock: true, image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400&h=400&fit=crop' },
      { id: 'fm-6', name: 'Djellaba traditionnelle', description: 'Coton premium', price: 750, category: 'Vêtements', inStock: true, image: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400&h=400&fit=crop' },
    ],
  },
  {
    id: 'shop-tech',
    name: 'Tech Store',
    type: 'Électronique',
    terminal: 'T2',
    icon: 'laptop',
    color: '#00897B',
    featuredImages: [
      'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=200&h=200&fit=crop',
    ],
    items: [
      { id: 'tc-1', name: 'Écouteurs AirPods Pro', description: 'Apple 2ème génération', price: 2800, category: 'Audio', inStock: true, image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&h=400&fit=crop' },
      { id: 'tc-2', name: 'Chargeur universel', description: 'Multi-prises voyage', price: 180, category: 'Accessoires', inStock: true, image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&h=400&fit=crop' },
      { id: 'tc-3', name: 'Power Bank 20000mAh', description: 'Charge rapide', price: 450, category: 'Accessoires', inStock: true, image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop' },
      { id: 'tc-4', name: 'Câble USB-C', description: 'Tressé 2m', price: 120, category: 'Câbles', inStock: true, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop' },
      { id: 'tc-5', name: 'Casque Bose QC45', description: 'Réduction de bruit', price: 3200, category: 'Audio', inStock: false, image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop' },
      { id: 'tc-6', name: 'Support téléphone', description: 'Avion compatible', price: 95, category: 'Accessoires', inStock: true, image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop' },
    ],
  },
  {
    id: 'shop-souvenirs',
    name: 'Souvenirs du Maroc',
    type: 'Artisanat',
    terminal: 'T1',
    icon: 'gift',
    color: '#E65100',
    featuredImages: [
      'https://images.unsplash.com/photo-1590587802016-f8b6b7b0c7e6?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1596466840350-cbcfc4bf7e46?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=200&h=200&fit=crop',
    ],
    items: [
      { id: 'sv-1', name: 'Tajine décoratif', description: 'Céramique peinte à la main', price: 350, category: 'Décoration', inStock: true, image: 'https://images.unsplash.com/photo-1590587802016-f8b6b7b0c7e6?w=400&h=400&fit=crop' },
      { id: 'sv-2', name: 'Lanterne marocaine', description: 'Métal ciselé', price: 480, category: 'Décoration', inStock: true, image: 'https://images.unsplash.com/photo-1596466840350-cbcfc4bf7e46?w=400&h=400&fit=crop' },
      { id: 'sv-3', name: 'Tapis berbère', description: 'Laine tissée main', price: 1200, category: 'Textile', inStock: false, image: 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=400&h=400&fit=crop' },
      { id: 'sv-4', name: 'Thé à la menthe', description: 'Coffret premium 500g', price: 180, category: 'Alimentaire', inStock: true, image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&h=400&fit=crop' },
      { id: 'sv-5', name: 'Épices marocaines', description: 'Coffret 12 épices', price: 220, category: 'Alimentaire', inStock: true, image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop' },
      { id: 'sv-6', name: 'Poterie de Safi', description: 'Bol artisanal', price: 150, category: 'Décoration', inStock: true, image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=400&fit=crop' },
      { id: 'sv-7', name: 'Savon noir Beldi', description: 'Traditionnel 250g', price: 85, category: 'Cosmétiques', inStock: true, image: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=400&h=400&fit=crop' },
    ],
  },
  {
    id: 'shop-food',
    name: 'Café & Délices',
    type: 'Restauration',
    terminal: 'T1',
    icon: 'food',
    color: '#D84315',
    featuredImages: [
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200&h=200&fit=crop',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&h=200&fit=crop',
    ],
    items: [
      { id: 'fd-1', name: 'Café espresso', description: 'Arabica premium', price: 35, category: 'Boissons', inStock: true, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop' },
      { id: 'fd-2', name: 'Thé à la menthe', description: 'Servi traditionnellement', price: 30, category: 'Boissons', inStock: true, image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&h=400&fit=crop' },
      { id: 'fd-3', name: 'Croissant au beurre', description: 'Frais du jour', price: 25, category: 'Viennoiseries', inStock: true, image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=400&fit=crop' },
      { id: 'fd-4', name: 'Sandwich poulet', description: 'Pain ciabatta', price: 75, category: 'Sandwichs', inStock: true, image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=400&fit=crop' },
      { id: 'fd-5', name: 'Salade César', description: 'Poulet grillé', price: 85, category: 'Salades', inStock: true, image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=400&fit=crop' },
      { id: 'fd-6', name: 'Pâtisseries marocaines', description: 'Assortiment 6 pièces', price: 65, category: 'Pâtisseries', inStock: true, image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop' },
      { id: 'fd-7', name: 'Jus d\'orange frais', description: 'Pressé minute', price: 40, category: 'Boissons', inStock: true, image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop' },
    ],
  },
];

export default function ShopScreen() {
  const params = useLocalSearchParams();
  const shopId = params.shopId as string;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const shop = SHOPS_DATA.find(s => s.id === shopId);

  const categories = useMemo(() => {
    if (!shop) return [];
    const cats = [...new Set(shop.items.map(item => item.category))];
    return cats;
  }, [shop]);

  const filteredItems = useMemo(() => {
    if (!shop) return [];
    return shop.items.filter(item => {
      const matchesSearch = searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [shop, searchQuery, selectedCategory]);

  if (!shop) {
    return (
      <RequireAuth>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(tabs)/explore')}>
              <MaterialCommunityIcons name="chevron-left" size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Boutique introuvable</Text>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(tabs)/explore')}>
            <MaterialCommunityIcons name="chevron-left" size={24} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{shop.name}</Text>
            <Text style={styles.headerSubtitle}>Terminal {shop.terminal}</Text>
          </View>
          <View style={[styles.shopIconBadge, { backgroundColor: `${shop.color}15` }]}>
            <MaterialCommunityIcons name={shop.icon as any} size={20} color={shop.color} />
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={22} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un article..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Filter */}
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            <TouchableOpacity
              style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>Tous</Text>
            </TouchableOpacity>
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[styles.categoryChip, selectedCategory === category && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(category === selectedCategory ? null : category)}
              >
                <Text style={[styles.categoryText, selectedCategory === category && styles.categoryTextActive]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Results Count */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>{filteredItems.length} article(s) trouvé(s)</Text>
        </View>

        {/* Items List */}
        <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
          {filteredItems.map(item => (
            <View key={item.id} style={styles.itemCard}>
              <Image 
                source={{ uri: item.image }} 
                style={styles.itemImage}
                resizeMode="cover"
              />
              {!item.inStock && (
                <View style={styles.outOfStockOverlay}>
                  <Text style={styles.outOfStockOverlayText}>Rupture</Text>
                </View>
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemDescription} numberOfLines={1}>{item.description}</Text>
                <View style={styles.itemFooter}>
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{item.category}</Text>
                  </View>
                  <Text style={styles.itemPrice}>{item.price} MAD</Text>
                </View>
              </View>
            </View>
          ))}

          {filteredItems.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="magnify-close" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Aucun résultat</Text>
              <Text style={styles.emptySubtitle}>Essayez avec d'autres mots-clés</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </RequireAuth>
  );
}

// Export shops data for use in explore.tsx
export { SHOPS_DATA };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 2,
  },
  shopIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF0',
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: '#B22222',
    borderColor: '#B22222',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryTextActive: {
    color: '#fff',
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  itemsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F1F5F9',
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  outOfStockOverlayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  itemInfo: {
    padding: 14,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  outOfStockBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  outOfStockText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  itemDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 10,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  itemPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: '#B22222',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 4,
  },
});
