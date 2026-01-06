import RequireAuth from '@/components/RequireAuth';
import { formatTimeWithSeconds, getCurrentTime, getWeatherConditions } from '@/data/airportDatabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, Linking, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SHOPS_DATA } from './shop';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ExploreScreen() {
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [weather, setWeather] = useState<any>(null);
  const [showAssistanceModal, setShowAssistanceModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
      setWeather(getWeatherConditions());
    }, 5000);

    setWeather(getWeatherConditions());

    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'clear': return 'weather-sunny';
      case 'rain': return 'weather-rainy';
      case 'storm': return 'weather-lightning';
      case 'fog': return 'weather-fog';
      default: return 'weather-cloudy';
    }
  };

  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  const handleEmail = () => {
    Linking.openURL('mailto:assistance@royalairmaroc.com?subject=Demande d\'assistance');
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/212522529000');
  };

  return (
    <RequireAuth>
      <View style={styles.container}>
        {/* Header with gradient effect */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Services</Text>
              <Text style={styles.headerSubtitle}>Votre confort à l’aéroport</Text>
            </View>
            <View style={styles.clockBadge}>
              <View style={styles.clockDot} />
              <Text style={styles.clockText}>{formatTimeWithSeconds(currentTime)}</Text>
            </View>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* Weather Card */}
          {weather && (
            <View style={styles.weatherCard}>
              <View style={styles.weatherLeft}>
                <View style={styles.weatherIconBox}>
                  <MaterialCommunityIcons
                    name={getWeatherIcon(weather.condition)}
                    size={36}
                    color="#1565C0"
                  />
                </View>
                <View>
                  <Text style={styles.weatherTitle}>Météo CMN</Text>
                  <Text style={styles.weatherTemp}>24°C</Text>
                </View>
              </View>
              <View style={styles.weatherRight}>
                <Text style={styles.weatherDesc}>{weather.message}</Text>
                {weather.impact && (
                  <View style={styles.weatherAlert}>
                    <MaterialCommunityIcons name="alert" size={14} color="#F59E0B" />
                    <Text style={styles.weatherAlertText}>Impact possible</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Boutiques Section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <MaterialCommunityIcons name="store" size={18} color="#B22222" />
            </View>
            <Text style={styles.sectionTitle}>Boutiques & Services</Text>
            <View style={styles.sectionLine} />
          </View>

          {SHOPS_DATA.map((shop) => (
            <View
              key={shop.id}
              style={styles.loungeCard}
            >
              <TouchableOpacity 
                activeOpacity={0.9} 
                style={styles.loungeInner}
                onPress={() => router.push({ pathname: '/(tabs)/shop', params: { shopId: shop.id } })}
              >
                <View style={styles.loungeTop}>
                  <View style={[
                    styles.loungeIconBox,
                    { backgroundColor: `${shop.color}15` }
                  ]}>
                    <MaterialCommunityIcons
                      name={shop.icon as any}
                      size={28}
                      color={shop.color}
                    />
                  </View>
                  <View style={styles.loungeInfo}>
                    <Text style={styles.loungeName}>{shop.name}</Text>
                    <Text style={styles.loungeTerminal}>{shop.type} • Terminal {shop.terminal}</Text>
                  </View>
                  <View style={styles.shopArrow}>
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#94A3B8" />
                  </View>
                </View>

                {/* Featured Products Images */}
                <View style={styles.featuredImagesRow}>
                  {shop.featuredImages.map((img, idx) => (
                    <View key={idx} style={styles.featuredImageWrapper}>
                      <Image 
                        source={{ uri: img }} 
                        style={styles.featuredImage}
                        resizeMode="cover"
                      />
                    </View>
                  ))}
                  <View style={styles.moreProductsBox}>
                    <Text style={styles.moreProductsNumber}>+{shop.items.length - 3}</Text>
                    <Text style={styles.moreProductsText}>articles</Text>
                  </View>
                </View>

                <View style={styles.shopMeta}>
                  <View style={styles.shopMetaItem}>
                    <MaterialCommunityIcons name="tag-multiple" size={14} color="#64748B" />
                    <Text style={styles.shopMetaText}>{shop.items.length} articles</Text>
                  </View>
                  <View style={styles.shopMetaItem}>
                    <MaterialCommunityIcons name="map-marker" size={14} color="#64748B" />
                    <Text style={styles.shopMetaText}>Terminal {shop.terminal}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ))}

          {/* Services Grid */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <MaterialCommunityIcons name="apps" size={18} color="#B22222" />
            </View>
            <Text style={styles.sectionTitle}>Services</Text>
            <View style={styles.sectionLine} />
          </View>

          <View style={styles.servicesGrid}>
            <TouchableOpacity style={styles.serviceCard} activeOpacity={0.85} onPress={() => router.push('/claims')}>
              <View style={[styles.serviceIcon, { backgroundColor: 'rgba(178, 34, 34, 0.1)' }]}>
                <MaterialCommunityIcons name="clipboard-text" size={28} color="#B22222" />
              </View>
              <Text style={styles.serviceName}>Réclamations</Text>
              <Text style={styles.serviceDesc}>Historique</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.serviceCard} activeOpacity={0.85} onPress={() => router.push('/(tabs)/loyalty')}>
              <View style={[styles.serviceIcon, { backgroundColor: 'rgba(106, 27, 154, 0.1)' }]}>
                <MaterialCommunityIcons name="star-circle" size={28} color="#6A1B9A" />
              </View>
              <Text style={styles.serviceName}>Fidélité</Text>
              <Text style={styles.serviceDesc}>Safar Flyer</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.serviceCard} activeOpacity={0.85} onPress={() => handleCall('+212522529000')}>
              <View style={[styles.serviceIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <MaterialCommunityIcons name="alert-circle" size={28} color="#EF4444" />
              </View>
              <Text style={styles.serviceName}>Urgence</Text>
              <Text style={styles.serviceDesc}>Appel direct</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.serviceCard} activeOpacity={0.85} onPress={() => setShowAssistanceModal(true)}>
              <View style={[styles.serviceIcon, { backgroundColor: 'rgba(46, 125, 50, 0.1)' }]}>
                <MaterialCommunityIcons name="headset" size={28} color="#2E7D32" />
              </View>
              <Text style={styles.serviceName}>Assistance</Text>
              <Text style={styles.serviceDesc}>Support 24/7</Text>
            </TouchableOpacity>
          </View>

          {/* Contact Banner */}
          <View style={styles.contactBanner}>
            <View style={styles.contactIcon}>
              <MaterialCommunityIcons name="headphones" size={24} color="#fff" />
            </View>
            <View style={styles.contactText}>
              <Text style={styles.contactTitle}>Besoin d’aide ?</Text>
              <Text style={styles.contactNumber}>+212 522 529 000</Text>
            </View>
            <TouchableOpacity style={styles.callButton}>
              <MaterialCommunityIcons name="phone" size={20} color="#B22222" />
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerLogo}>
              <MaterialCommunityIcons name="airplane" size={20} color="#CBD5E1" />
            </View>
            <Text style={styles.footerText}>Royal Air Maroc © 2025</Text>
            <Text style={styles.footerVersion}>Smart Traveler v1.0</Text>
          </View>

        </ScrollView>

        {/* Modal Assistance */}
        <Modal
          visible={showAssistanceModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAssistanceModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.assistanceModal}>
              <View style={styles.assistanceHeader}>
                <View style={styles.assistanceHeaderIcon}>
                  <MaterialCommunityIcons name="headset" size={32} color="#2E7D32" />
                </View>
                <Text style={styles.assistanceTitle}>Assistance 24/7</Text>
                <TouchableOpacity onPress={() => setShowAssistanceModal(false)} style={styles.closeBtn}>
                  <MaterialCommunityIcons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.assistanceSubtitle}>
                Notre équipe est disponible pour vous aider à tout moment
              </Text>

              {/* Contact Options */}
              <View style={styles.contactOptions}>
                <TouchableOpacity style={styles.contactOptionItem} onPress={() => handleCall('+212522529000')}>
                  <View style={[styles.contactOptionIcon, { backgroundColor: 'rgba(178, 34, 34, 0.1)' }]}>
                    <MaterialCommunityIcons name="phone" size={24} color="#B22222" />
                  </View>
                  <View style={styles.contactOptionInfo}>
                    <Text style={styles.contactOptionTitle}>Appeler</Text>
                    <Text style={styles.contactOptionDesc}>+212 522 529 000</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#CBD5E1" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.contactOptionItem} onPress={handleWhatsApp}>
                  <View style={[styles.contactOptionIcon, { backgroundColor: 'rgba(37, 211, 102, 0.1)' }]}>
                    <MaterialCommunityIcons name="whatsapp" size={24} color="#25D366" />
                  </View>
                  <View style={styles.contactOptionInfo}>
                    <Text style={styles.contactOptionTitle}>WhatsApp</Text>
                    <Text style={styles.contactOptionDesc}>Chat en direct</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#CBD5E1" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.contactOptionItem} onPress={handleEmail}>
                  <View style={[styles.contactOptionIcon, { backgroundColor: 'rgba(21, 101, 192, 0.1)' }]}>
                    <MaterialCommunityIcons name="email" size={24} color="#1565C0" />
                  </View>
                  <View style={styles.contactOptionInfo}>
                    <Text style={styles.contactOptionTitle}>Email</Text>
                    <Text style={styles.contactOptionDesc}>assistance@royalairmaroc.com</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#CBD5E1" />
                </TouchableOpacity>
              </View>

              {/* FAQ Section */}
              <View style={styles.faqSection}>
                <Text style={styles.faqTitle}>Questions fréquentes</Text>
                
                <View style={styles.faqItem}>
                  <MaterialCommunityIcons name="help-circle-outline" size={18} color="#64748B" />
                  <Text style={styles.faqText}>Comment modifier ma réservation ?</Text>
                </View>
                
                <View style={styles.faqItem}>
                  <MaterialCommunityIcons name="help-circle-outline" size={18} color="#64748B" />
                  <Text style={styles.faqText}>Où récupérer mes bagages ?</Text>
                </View>
                
                <View style={styles.faqItem}>
                  <MaterialCommunityIcons name="help-circle-outline" size={18} color="#64748B" />
                  <Text style={styles.faqText}>Comment enregistrer en ligne ?</Text>
                </View>
                
                <View style={styles.faqItem}>
                  <MaterialCommunityIcons name="help-circle-outline" size={18} color="#64748B" />
                  <Text style={styles.faqText}>Quels sont les horaires des vols ?</Text>
                </View>
              </View>

              {/* Horaires */}
              <View style={styles.horairesBadge}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#10B981" />
                <Text style={styles.horairesBadgeText}>Service disponible 24h/24, 7j/7</Text>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </RequireAuth>
  );
}

const getAmenityIcon = (amenity: string): any => {
  const icons: Record<string, string> = {
    'WiFi': 'wifi',
    'WiFi Premium': 'wifi',
    'Buffet': 'food',
    'Buffet Marocain': 'food',
    'Douches': 'shower',
    'Presse': 'newspaper',
    'Presse internationale': 'newspaper',
    'Champagne': 'glass-wine',
    'Spa': 'spa',
    'Chef privé': 'chef-hat',
    'Service conciergerie': 'concierge-bell',
    'Snacks': 'cookie',
    'Café & Thé': 'coffee',
    'Boissons': 'cup',
    'Vue piste': 'binoculars',
  };
  return icons[amenity] || 'check';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  clockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8ECF0',
  },
  clockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  clockText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    fontVariant: ['tabular-nums'],
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  weatherCard: {
    backgroundColor: '#E0F2FE',
    borderRadius: 22,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  weatherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  weatherIconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(21, 101, 192, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0369A1',
  },
  weatherTemp: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1565C0',
    marginTop: -2,
  },
  weatherRight: {
    alignItems: 'flex-end',
  },
  weatherDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
    textAlign: 'right',
    maxWidth: 120,
  },
  weatherAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 8,
  },
  weatherAlertText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(178, 34, 34, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  loungeCard: {
    marginBottom: 14,
  },
  loungeInner: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  loungePromoRibbon: {
    position: 'absolute',
    top: 16,
    right: -32,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 40,
    paddingVertical: 6,
    transform: [{ rotate: '45deg' }],
  },
  promoRibbonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
  },
  loungeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  loungeIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loungeInfo: {
    flex: 1,
  },
  loungeName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  loungeTerminal: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 2,
  },
  shopArrow: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredImagesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  featuredImageWrapper: {
    width: 70,
    height: 70,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  moreProductsBox: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreProductsNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  moreProductsText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  shopMeta: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  shopMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shopMetaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  occupancyCircle: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  occupancyValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
  },
  occupancyLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
  },
  loungeAmenities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  amenityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  loungeBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  loungeCapacity: {
    flex: 1,
    marginRight: 16,
  },
  capacityBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  capacityFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  capacityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#B22222',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  serviceCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  serviceDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  contactBanner: {
    backgroundColor: '#B22222',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  contactIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactText: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  contactNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginTop: 2,
  },
  callButton: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  footerLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  footerVersion: {
    fontSize: 11,
    fontWeight: '500',
    color: '#CBD5E1',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  assistanceModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  assistanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  assistanceHeaderIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  assistanceTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assistanceSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 20,
  },
  contactOptions: {
    gap: 12,
    marginBottom: 20,
  },
  contactOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  contactOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactOptionInfo: {
    flex: 1,
  },
  contactOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  contactOptionDesc: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  faqSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  faqTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  faqText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  horairesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
  },
  horairesBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
});
