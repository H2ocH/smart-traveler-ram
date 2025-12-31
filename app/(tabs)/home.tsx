import SmartAssistantModal from '@/components/SmartAssistantModal';
import {
  formatTimeRemaining,
  formatTimeWithSeconds,
  generateFlights,
  generateSecurityZones,
  getCurrentTime,
  getPassengerContext,
} from '@/data/airportDatabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const [showSmartAssistant, setShowSmartAssistant] = useState(false);
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [flightInfo, setFlightInfo] = useState<any>(null);
  const [securityInfo, setSecurityInfo] = useState<any>(null);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Afficher le popup au démarrage
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSmartAssistant(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Horloge temps réel + mise à jour données
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());

      const flights = generateFlights();
      const security = generateSecurityZones();
      const passenger = getPassengerContext();

      const myFlight = flights.find(f => f.flightNumber === passenger.flightNumber);
      if (myFlight) setFlightInfo(myFlight);

      const bestSec = [...security].sort((a, b) => a.currentWaitTime - b.currentWaitTime)[0];
      setSecurityInfo(bestSec);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initial data load
  useEffect(() => {
    const flights = generateFlights();
    const security = generateSecurityZones();
    const passenger = getPassengerContext();

    const myFlight = flights.find(f => f.flightNumber === passenger.flightNumber);
    if (myFlight) setFlightInfo(myFlight);

    const bestSec = [...security].sort((a, b) => a.currentWaitTime - b.currentWaitTime)[0];
    setSecurityInfo(bestSec);
  }, []);

  // Animations
  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Scale up
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();

    // Float animation
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    );
    float.start();

    return () => {
      pulse.stop();
      float.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      <SmartAssistantModal
        visible={showSmartAssistant}
        onClose={() => setShowSmartAssistant(false)}
      />

      {/* Gradient Header */}
      <View style={styles.header}>
        <View style={styles.headerPattern}>
          {[...Array(6)].map((_, i) => (
            <View key={i} style={[styles.patternCircle, {
              left: (i % 3) * 150 - 50,
              top: Math.floor(i / 3) * 100 - 50,
              opacity: 0.05 + (i * 0.02),
              width: 100 + i * 30,
              height: 100 + i * 30,
            }]} />
          ))}
        </View>

        {/* Top Row */}
        <View style={styles.headerTop}>
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <MaterialCommunityIcons name="airplane" size={26} color="#fff" />
            </View>
            <View>
              <Text style={styles.brandName}>ROYAL AIR MAROC</Text>
              <Text style={styles.appName}>Smart Traveler</Text>
            </View>
          </View>
          <View style={styles.clockBox}>
            <View style={styles.clockDot} />
            <Text style={styles.clockText}>{formatTimeWithSeconds(currentTime)}</Text>
          </View>
        </View>

        {/* Flight Card */}
        {flightInfo && (
          <Animated.View style={[styles.flightCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.flightHeader}>
              <View style={styles.flightBadge}>
                <Text style={styles.flightBadgeText}>VOL ACTIF</Text>
              </View>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>À l'heure</Text>
              </View>
            </View>

            <View style={styles.flightMain}>
              <View style={styles.flightRoute}>
                <View style={styles.cityBox}>
                  <Text style={styles.cityCode}>CMN</Text>
                  <Text style={styles.cityName}>Casablanca</Text>
                </View>
                <View style={styles.routeLine}>
                  <View style={styles.routeDot} />
                  <View style={styles.routeDash} />
                  <MaterialCommunityIcons name="airplane" size={20} color="#D4AF37" style={styles.routePlane} />
                  <View style={styles.routeDash} />
                  <View style={styles.routeDot} />
                </View>
                <View style={[styles.cityBox, { alignItems: 'flex-end' }]}>
                  <Text style={styles.cityCode}>{flightInfo.destinationCode}</Text>
                  <Text style={styles.cityName}>{flightInfo.destination.split(' ')[0]}</Text>
                </View>
              </View>

              <View style={styles.flightDetails}>
                <View style={styles.flightDetail}>
                  <Text style={styles.detailLabel}>N° VOL</Text>
                  <Text style={styles.detailValue}>{flightInfo.flightNumber}</Text>
                </View>
                <View style={styles.flightDetail}>
                  <Text style={styles.detailLabel}>PORTE</Text>
                  <Text style={[styles.detailValue, styles.gateValue]}>{flightInfo.newGate || flightInfo.gate}</Text>
                </View>
                <View style={styles.flightDetail}>
                  <Text style={styles.detailLabel}>TERMINAL</Text>
                  <Text style={styles.detailValue}>{flightInfo.terminal}</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Countdown */}
        {flightInfo && (
          <Animated.View style={[styles.countdownCard, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.countdownIcon}>
              <MaterialCommunityIcons name="timer-sand" size={22} color="#D4AF37" />
            </View>
            <View style={styles.countdownText}>
              <Text style={styles.countdownLabel}>Embarquement dans</Text>
              <Text style={styles.countdownValue}>{formatTimeRemaining(flightInfo.boardingTime)}</Text>
            </View>
            <View style={styles.countdownProgress}>
              <View style={styles.countdownProgressBar} />
            </View>
          </Animated.View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Smart Assistant Card */}
        <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
          <TouchableOpacity
            style={styles.smartCard}
            onPress={() => setShowSmartAssistant(true)}
            activeOpacity={0.9}
          >
            <View style={styles.smartGlow} />
            <View style={styles.smartContent}>
              <View style={styles.smartIcon}>
                <MaterialCommunityIcons name="robot-happy" size={32} color="#B22222" />
                <View style={styles.smartPulse} />
              </View>
              <View style={styles.smartText}>
                <View style={styles.smartTitleRow}>
                  <Text style={styles.smartTitle}>Smart Assistant</Text>
                  <View style={styles.aiBadge}>
                    <Text style={styles.aiBadgeText}>IA</Text>
                  </View>
                </View>
                <Text style={styles.smartSubtitle}>
                  {securityInfo ? `🛡️ ${securityInfo.name}: ${securityInfo.currentWaitTime} min` : 'Analyse temps réel'}
                </Text>
              </View>
            </View>
            <View style={styles.smartArrow}>
              <MaterialCommunityIcons name="arrow-right" size={22} color="#B22222" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <MaterialCommunityIcons name="shield-check" size={28} color="#fff" />
            <Text style={styles.statValueWhite}>{securityInfo?.currentWaitTime || '--'}</Text>
            <Text style={styles.statLabelWhite}>min sécurité</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
              <MaterialCommunityIcons name="crown" size={24} color="#D4AF37" />
            </View>
            <Text style={styles.statValue}>Gold</Text>
            <Text style={styles.statLabel}>Statut VIP</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(46, 125, 50, 0.1)' }]}>
              <MaterialCommunityIcons name="bag-checked" size={24} color="#2E7D32" />
            </View>
            <Text style={styles.statValue}>1</Text>
            <Text style={styles.statLabel}>Bagage</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Outils</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/scan')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionGradient, { backgroundColor: '#B22222' }]}>
              <MaterialCommunityIcons name="qrcode-scan" size={36} color="#fff" />
            </View>
            <Text style={styles.actionTitle}>Scanner</Text>
            <Text style={styles.actionDesc}>QR Code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/measure')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionGradient, { backgroundColor: '#1565C0' }]}>
              <MaterialCommunityIcons name="ruler-square" size={36} color="#fff" />
            </View>
            <Text style={styles.actionTitle}>Mesurer</Text>
            <Text style={styles.actionDesc}>Dimensions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/weight')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionGradient, { backgroundColor: '#D4AF37' }]}>
              <MaterialCommunityIcons name="scale" size={36} color="#fff" />
            </View>
            <Text style={styles.actionTitle}>Peser</Text>
            <Text style={styles.actionDesc}>Estimation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/explore')}
            activeOpacity={0.85}
          >
            <View style={[styles.actionGradient, { backgroundColor: '#2E7D32' }]}>
              <MaterialCommunityIcons name="compass" size={36} color="#fff" />
            </View>
            <Text style={styles.actionTitle}>Services</Text>
            <Text style={styles.actionDesc}>Aéroport</Text>
          </TouchableOpacity>
        </View>

        {/* Promo Banner */}
        <View style={styles.promoBanner}>
          <View style={styles.promoIcon}>
            <MaterialCommunityIcons name="gift" size={24} color="#D4AF37" />
          </View>
          <View style={styles.promoText}>
            <Text style={styles.promoTitle}>Offre Lounge Atlas</Text>
            <Text style={styles.promoDesc}>-25% aujourd'hui sur votre accès VIP</Text>
          </View>
          <TouchableOpacity style={styles.promoButton}>
            <Text style={styles.promoButtonText}>Voir</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#B22222',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  headerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternCircle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: '#fff',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  brandName: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1.5,
  },
  appName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  clockBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  clockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  clockText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  flightCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
  },
  flightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  flightBadge: {
    backgroundColor: 'rgba(212,175,55,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  flightBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4ADE80',
  },
  flightMain: {},
  flightRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  cityBox: {},
  cityCode: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  cityName: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  routeLine: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  routeDash: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
  },
  routePlane: {
    transform: [{ rotate: '90deg' }],
    marginHorizontal: 8,
  },
  flightDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 12,
    padding: 14,
  },
  flightDetail: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  gateValue: {
    color: '#D4AF37',
  },
  countdownCard: {
    backgroundColor: 'rgba(212,175,55,0.2)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
  },
  countdownIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(212,175,55,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    flex: 1,
  },
  countdownLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  countdownValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#D4AF37',
    marginTop: 2,
  },
  countdownProgress: {
    width: 4,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  countdownProgressBar: {
    width: '100%',
    height: '60%',
    backgroundColor: '#D4AF37',
    borderRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  smartCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#B22222',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(178, 34, 34, 0.08)',
    overflow: 'hidden',
  },
  smartGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(178, 34, 34, 0.05)',
  },
  smartContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  smartIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(178, 34, 34, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smartPulse: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4ADE80',
    borderWidth: 3,
    borderColor: '#fff',
  },
  smartText: {},
  smartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  smartTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1E293B',
  },
  aiBadge: {
    backgroundColor: '#B22222',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  smartSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 4,
  },
  smartArrow: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(178, 34, 34, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  statCardPrimary: {
    backgroundColor: '#B22222',
  },
  statIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
    marginTop: 8,
  },
  statValueWhite: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  statLabelWhite: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  actionGradient: {
    width: 70,
    height: 70,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  promoBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  promoIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(212,175,55,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoText: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
  },
  promoDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: '#B45309',
    marginTop: 2,
  },
  promoButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  promoButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});
