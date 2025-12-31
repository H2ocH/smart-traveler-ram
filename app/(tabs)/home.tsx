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
import React, { useEffect, useState } from 'react';
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
  const pulseAnim = useState(new Animated.Value(1))[0];

  // Afficher le popup au démarrage
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSmartAssistant(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Horloge temps réel + mise à jour données
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());

      // Refresh flight & security data
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

  // Pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View style={styles.container}>
      <SmartAssistantModal
        visible={showSmartAssistant}
        onClose={() => setShowSmartAssistant(false)}
      />

      {/* Gradient Header */}
      <View style={styles.header}>
        <View style={styles.headerGlow} />

        {/* Top Row - Logo & Clock */}
        <View style={styles.headerTop}>
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <MaterialCommunityIcons name="airplane" size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.brandName}>Royal Air Maroc</Text>
              <Text style={styles.appName}>Smart Traveler</Text>
            </View>
          </View>
          <View style={styles.clockBox}>
            <MaterialCommunityIcons name="clock-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.clockText}>{formatTimeWithSeconds(currentTime)}</Text>
          </View>
        </View>

        {/* Flight Info Card */}
        {flightInfo && (
          <View style={styles.flightCard}>
            <View style={styles.flightLeft}>
              <Text style={styles.flightLabel}>Votre vol</Text>
              <View style={styles.flightRow}>
                <Text style={styles.flightNumber}>{flightInfo.flightNumber}</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color="#D4AF37" />
                <Text style={styles.flightDest}>{flightInfo.destinationCode}</Text>
              </View>
              <Text style={styles.flightDestFull}>{flightInfo.destination}</Text>
            </View>
            <View style={styles.flightRight}>
              <Text style={styles.gateLabel}>Porte</Text>
              <Text style={styles.gateValue}>{flightInfo.newGate || flightInfo.gate}</Text>
              <Text style={styles.terminalText}>Terminal {flightInfo.terminal}</Text>
            </View>
          </View>
        )}

        {/* Countdown */}
        {flightInfo && (
          <Animated.View style={[styles.countdownCard, { transform: [{ scale: pulseAnim }] }]}>
            <MaterialCommunityIcons name="timer-outline" size={20} color="#D4AF37" />
            <Text style={styles.countdownLabel}>Embarquement dans</Text>
            <Text style={styles.countdownValue}>{formatTimeRemaining(flightInfo.boardingTime)}</Text>
          </Animated.View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Smart Assistant Banner */}
        <TouchableOpacity
          style={styles.smartBanner}
          onPress={() => setShowSmartAssistant(true)}
          activeOpacity={0.9}
        >
          <View style={styles.smartBannerLeft}>
            <View style={styles.smartIcon}>
              <MaterialCommunityIcons name="robot-happy" size={28} color="#B22222" />
            </View>
            <View>
              <View style={styles.smartTitleRow}>
                <Text style={styles.smartTitle}>Smart Assistant</Text>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </View>
              <Text style={styles.smartSubtitle}>
                {securityInfo ? `${securityInfo.name}: ${securityInfo.currentWaitTime} min` : 'Analyse IA en temps réel'}
              </Text>
            </View>
          </View>
          <View style={styles.smartArrow}>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#B22222" />
          </View>
        </TouchableOpacity>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <MaterialCommunityIcons name="shield-check" size={22} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{securityInfo?.currentWaitTime || '--'}</Text>
            <Text style={styles.statLabel}>min sécurité</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(212, 175, 55, 0.15)' }]}>
              <MaterialCommunityIcons name="star-circle" size={22} color="#D4AF37" />
            </View>
            <Text style={styles.statValue}>Gold</Text>
            <Text style={styles.statLabel}>Statut</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(178, 34, 34, 0.1)' }]}>
              <MaterialCommunityIcons name="bag-checked" size={22} color="#B22222" />
            </View>
            <Text style={styles.statValue}>1</Text>
            <Text style={styles.statLabel}>Bagage</Text>
          </View>
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Outils</Text>
          <View style={styles.sectionLine} />
        </View>

        {/* Feature Cards - 2x2 Grid */}
        <View style={styles.featuresGrid}>
          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => router.push('/scan')}
            activeOpacity={0.85}
          >
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(178, 34, 34, 0.08)' }]}>
              <MaterialCommunityIcons name="qrcode-scan" size={32} color="#B22222" />
            </View>
            <Text style={styles.featureTitle}>Scanner</Text>
            <Text style={styles.featureDesc}>QR Code bagage</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => router.push('/measure')}
            activeOpacity={0.85}
          >
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(21, 101, 192, 0.08)' }]}>
              <MaterialCommunityIcons name="ruler-square" size={32} color="#1565C0" />
            </View>
            <Text style={styles.featureTitle}>Mesurer</Text>
            <Text style={styles.featureDesc}>Dimensions valise</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => router.push('/weight')}
            activeOpacity={0.85}
          >
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(212, 175, 55, 0.12)' }]}>
              <MaterialCommunityIcons name="scale" size={32} color="#D4AF37" />
            </View>
            <Text style={styles.featureTitle}>Peser</Text>
            <Text style={styles.featureDesc}>Estimation poids</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => router.push('/explore')}
            activeOpacity={0.85}
          >
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(46, 125, 50, 0.08)' }]}>
              <MaterialCommunityIcons name="compass-outline" size={32} color="#2E7D32" />
            </View>
            <Text style={styles.featureTitle}>Explorer</Text>
            <Text style={styles.featureDesc}>Services aéroport</Text>
          </TouchableOpacity>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <MaterialCommunityIcons name="lightbulb-outline" size={20} color="#64748B" />
          <Text style={styles.infoBannerText}>
            Préparez vos bagages avant l'aéroport pour gagner du temps
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
    backgroundColor: '#B22222',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
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
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  clockBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  clockText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  flightCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  flightLeft: {},
  flightLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  flightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flightNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
  },
  flightDest: {
    fontSize: 20,
    fontWeight: '800',
    color: '#D4AF37',
  },
  flightDestFull: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  flightRight: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  gateLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
  },
  gateValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
  },
  terminalText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  countdownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  countdownLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  countdownValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#D4AF37',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  smartBanner: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    shadowColor: '#B22222',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(178, 34, 34, 0.1)',
  },
  smartBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  smartIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: 'rgba(178, 34, 34, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smartTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.3,
  },
  smartSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  smartArrow: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(178, 34, 34, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
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
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  featureCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8ECF0',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 19,
  },
});
