import { formatTimeWithSeconds, generateLounges, getCurrentTime, getWeatherConditions } from '@/data/airportDatabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ExploreScreen() {
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [lounges, setLounges] = useState<any[]>([]);
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
      setLounges(generateLounges());
      setWeather(getWeatherConditions());
    }, 5000);

    // Initial load
    setLounges(generateLounges());
    setWeather(getWeatherConditions());

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Services</Text>
          <Text style={styles.headerSubtitle}>Votre confort à l'aéroport</Text>
        </View>
        <View style={styles.clockBox}>
          <Text style={styles.clockText}>{formatTimeWithSeconds(currentTime)}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Weather Card */}
        {weather && (
          <View style={styles.weatherCard}>
            <MaterialCommunityIcons
              name={weather.condition === 'clear' ? 'weather-sunny' : weather.condition === 'rain' ? 'weather-rainy' : 'weather-cloudy'}
              size={32}
              color="#1565C0"
            />
            <View style={styles.weatherInfo}>
              <Text style={styles.weatherTitle}>Météo Casablanca</Text>
              <Text style={styles.weatherDesc}>{weather.message}</Text>
            </View>
            {weather.impact && (
              <View style={styles.weatherBadge}>
                <Text style={styles.weatherBadgeText}>Impact vol</Text>
              </View>
            )}
          </View>
        )}

        {/* Lounges Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Salons VIP</Text>
          <View style={styles.sectionLine} />
        </View>

        {lounges.map((lounge) => (
          <TouchableOpacity key={lounge.id} style={styles.loungeCard} activeOpacity={0.85}>
            <View style={styles.loungeLeft}>
              <View style={[
                styles.loungeIcon,
                { backgroundColor: lounge.hasPromo ? 'rgba(212, 175, 55, 0.15)' : 'rgba(21, 101, 192, 0.08)' }
              ]}>
                <MaterialCommunityIcons
                  name="sofa-single"
                  size={24}
                  color={lounge.hasPromo ? '#D4AF37' : '#1565C0'}
                />
              </View>
              <View>
                <Text style={styles.loungeName}>{lounge.name}</Text>
                <Text style={styles.loungeTerminal}>Terminal {lounge.terminal}</Text>
                <View style={styles.loungeAmenities}>
                  {lounge.amenities.slice(0, 2).map((a: string, i: number) => (
                    <View key={i} style={styles.amenityBadge}>
                      <Text style={styles.amenityText}>{a}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
            <View style={styles.loungeRight}>
              <View style={styles.occupancyBox}>
                <Text style={styles.occupancyValue}>{lounge.currentOccupancy}%</Text>
                <Text style={styles.occupancyLabel}>occupé</Text>
              </View>
              {lounge.hasPromo && (
                <View style={styles.promoBadge}>
                  <Text style={styles.promoText}>-{lounge.promoDiscount}%</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* Services Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Informations</Text>
          <View style={styles.sectionLine} />
        </View>

        <TouchableOpacity style={styles.serviceCard} activeOpacity={0.85}>
          <View style={[styles.serviceIcon, { backgroundColor: 'rgba(46, 125, 50, 0.08)' }]}>
            <MaterialCommunityIcons name="help-circle-outline" size={24} color="#2E7D32" />
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>Assistance</Text>
            <Text style={styles.serviceDesc}>Besoin d'aide ? Contactez-nous</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#CBD5E1" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.serviceCard} activeOpacity={0.85}>
          <View style={[styles.serviceIcon, { backgroundColor: 'rgba(106, 27, 154, 0.08)' }]}>
            <MaterialCommunityIcons name="star-circle-outline" size={24} color="#6A1B9A" />
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>Programme Fidélité</Text>
            <Text style={styles.serviceDesc}>Vos avantages Safar Flyer</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#CBD5E1" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.serviceCard} activeOpacity={0.85}>
          <View style={[styles.serviceIcon, { backgroundColor: 'rgba(178, 34, 34, 0.08)' }]}>
            <MaterialCommunityIcons name="phone-outline" size={24} color="#B22222" />
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>Urgence</Text>
            <Text style={styles.serviceDesc}>+212 522 529 000</Text>
          </View>
          <MaterialCommunityIcons name="phone" size={20} color="#B22222" />
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Royal Air Maroc © 2025</Text>
          <Text style={styles.footerSubtext}>Smart Traveler v1.0</Text>
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
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  clockBox: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  clockText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#64748B',
    fontVariant: ['tabular-nums'],
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  weatherCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(21, 101, 192, 0.15)',
  },
  weatherInfo: {
    flex: 1,
  },
  weatherTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1565C0',
  },
  weatherDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1976D2',
    marginTop: 2,
  },
  weatherBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  weatherBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  loungeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  loungeLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    flex: 1,
  },
  loungeIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loungeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  loungeTerminal: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 2,
  },
  loungeAmenities: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  amenityBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  amenityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  loungeRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  occupancyBox: {
    alignItems: 'center',
  },
  occupancyValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  occupancyLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
  },
  promoBadge: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 8,
  },
  promoText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  serviceDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 1,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E8ECF0',
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  footerSubtext: {
    fontSize: 11,
    fontWeight: '500',
    color: '#CBD5E1',
    marginTop: 4,
  },
});
