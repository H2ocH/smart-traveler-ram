import SmartAssistantModal from '@/components/SmartAssistantModal';
import { usePassenger } from '@/context/PassengerContext';
import {
  formatTimeRemaining,
  formatTimeWithSeconds,
  generateFlightForNumber,
  generateSecurityZones,
  getCurrentTime,
} from '@/data/airportDatabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Liste des vols disponibles (simulation)
const AVAILABLE_FLIGHTS = [
  { number: 'AT205', destination: 'Paris CDG', code: 'CDG' },
  { number: 'AT302', destination: 'Londres', code: 'LHR' },
  { number: 'AT410', destination: 'New York', code: 'JFK' },
  { number: 'AT125', destination: 'Dubai', code: 'DXB' },
  { number: 'AT508', destination: 'Istanbul', code: 'IST' },
  { number: 'AT601', destination: 'Madrid', code: 'MAD' },
  { number: 'AT715', destination: 'Amsterdam', code: 'AMS' },
  { number: 'AT820', destination: 'Rome', code: 'FCO' },
];

export default function HomeScreen() {
  const { passenger, setPassenger } = usePassenger();
  const [showSmartAssistant, setShowSmartAssistant] = useState(false);
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [flightInfo, setFlightInfo] = useState<any>(null);
  const [securityInfo, setSecurityInfo] = useState<any>(null);
  const [flightInput, setFlightInput] = useState('');
  const [passengerName, setPassengerName] = useState('');
  const [showFlightList, setShowFlightList] = useState(false);
  const [hasShownPopup, setHasShownPopup] = useState(false);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Horloge temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Charger les données du vol quand le passager est connecté
  useEffect(() => {
    if (passenger.isLoggedIn && passenger.flightNumber) {
      const flight = generateFlightForNumber(passenger.flightNumber);
      setFlightInfo(flight);

      const security = generateSecurityZones();
      const bestSec = [...security].sort((a, b) => a.currentWaitTime - b.currentWaitTime)[0];
      setSecurityInfo(bestSec);

      // Afficher popup UNE SEULE FOIS après connexion
      if (!hasShownPopup) {
        setTimeout(() => {
          setShowSmartAssistant(true);
          setHasShownPopup(true);
        }, 1500);
      }
    }
  }, [passenger.isLoggedIn, passenger.flightNumber, hasShownPopup]);

  // Mise à jour périodique des données
  useEffect(() => {
    if (!passenger.isLoggedIn) return;

    const interval = setInterval(() => {
      if (passenger.flightNumber) {
        const flight = generateFlightForNumber(passenger.flightNumber);
        setFlightInfo(flight);

        const security = generateSecurityZones();
        const bestSec = [...security].sort((a, b) => a.currentWaitTime - b.currentWaitTime)[0];
        setSecurityInfo(bestSec);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [passenger.isLoggedIn, passenger.flightNumber]);

  // Animations
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();

    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -6, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    );
    float.start();

    return () => { pulse.stop(); float.stop(); };
  }, []);

  const handleLogin = useCallback(() => {
    if (!flightInput.trim() || !passengerName.trim()) return;

    const flight = AVAILABLE_FLIGHTS.find(f => f.number.toUpperCase() === flightInput.toUpperCase());
    if (!flight) {
      // Vol non trouvé, on le crée dynamiquement
      setPassenger({
        flightNumber: flightInput.toUpperCase(),
        passengerName: passengerName.trim(),
        seatNumber: `${Math.floor(Math.random() * 30) + 1}${['A', 'B', 'C', 'D', 'E', 'F'][Math.floor(Math.random() * 6)]}`,
        loyaltyTier: ['standard', 'silver', 'gold', 'platinum'][Math.floor(Math.random() * 4)] as any,
        hasCheckedBag: Math.random() > 0.5,
        isLoggedIn: true,
      });
    } else {
      setPassenger({
        flightNumber: flight.number,
        passengerName: passengerName.trim(),
        seatNumber: `${Math.floor(Math.random() * 30) + 1}${['A', 'B', 'C', 'D', 'E', 'F'][Math.floor(Math.random() * 6)]}`,
        loyaltyTier: ['standard', 'silver', 'gold', 'platinum'][Math.floor(Math.random() * 4)] as any,
        hasCheckedBag: Math.random() > 0.5,
        isLoggedIn: true,
      });
    }
    setHasShownPopup(false);
  }, [flightInput, passengerName, setPassenger]);

  const selectFlight = (flight: typeof AVAILABLE_FLIGHTS[0]) => {
    setFlightInput(flight.number);
    setShowFlightList(false);
  };

  // Vue LOGIN si pas connecté
  if (!passenger.isLoggedIn) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.loginContainer}>
          {/* Header */}
          <View style={styles.loginHeader}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="airplane" size={40} color="#B22222" />
            </View>
            <Text style={styles.loginTitle}>Smart Traveler</Text>
            <Text style={styles.loginSubtitle}>Royal Air Maroc</Text>
          </View>

          {/* Clock */}
          <View style={styles.loginClock}>
            <MaterialCommunityIcons name="clock-outline" size={18} color="#64748B" />
            <Text style={styles.loginClockText}>{formatTimeWithSeconds(currentTime)}</Text>
          </View>

          {/* Form */}
          <View style={styles.loginForm}>
            <Text style={styles.formTitle}>Connectez-vous à votre vol</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Votre nom</Text>
              <View style={styles.inputBox}>
                <MaterialCommunityIcons name="account" size={22} color="#94A3B8" />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Mohamed Alami"
                  placeholderTextColor="#CBD5E1"
                  value={passengerName}
                  onChangeText={setPassengerName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Numéro de vol</Text>
              <View style={styles.inputBox}>
                <MaterialCommunityIcons name="airplane" size={22} color="#94A3B8" />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: AT205"
                  placeholderTextColor="#CBD5E1"
                  value={flightInput}
                  onChangeText={(text) => {
                    setFlightInput(text.toUpperCase());
                    setShowFlightList(text.length > 0);
                  }}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Liste des vols disponibles */}
            {showFlightList && (
              <View style={styles.flightList}>
                <Text style={styles.flightListTitle}>Vols disponibles</Text>
                <ScrollView style={styles.flightListScroll} nestedScrollEnabled>
                  {AVAILABLE_FLIGHTS.filter(f =>
                    f.number.includes(flightInput) || f.destination.toLowerCase().includes(flightInput.toLowerCase())
                  ).map((flight) => (
                    <TouchableOpacity
                      key={flight.number}
                      style={styles.flightItem}
                      onPress={() => selectFlight(flight)}
                    >
                      <Text style={styles.flightItemNumber}>{flight.number}</Text>
                      <Text style={styles.flightItemDest}>→ {flight.destination}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <TouchableOpacity
              style={[styles.loginButton, (!flightInput || !passengerName) && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={!flightInput || !passengerName}
              activeOpacity={0.9}
            >
              <Text style={styles.loginButtonText}>Accéder à mon vol</Text>
              <MaterialCommunityIcons name="arrow-right" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={styles.loginInfo}>
            <MaterialCommunityIcons name="information-outline" size={18} color="#94A3B8" />
            <Text style={styles.loginInfoText}>
              Entrez votre numéro de vol pour accéder à vos informations personnalisées
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Vue PRINCIPALE si connecté
  return (
    <View style={styles.container}>
      <SmartAssistantModal
        visible={showSmartAssistant}
        onClose={() => setShowSmartAssistant(false)}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerPattern}>
          {[...Array(5)].map((_, i) => (
            <View key={i} style={[styles.patternCircle, {
              left: (i % 3) * 140 - 40,
              top: Math.floor(i / 3) * 80 - 40,
              opacity: 0.04 + (i * 0.02),
              width: 90 + i * 25,
              height: 90 + i * 25,
            }]} />
          ))}
        </View>

        {/* Top Row */}
        <View style={styles.headerTop}>
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <MaterialCommunityIcons name="airplane" size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.welcomeText}>Bienvenue,</Text>
              <Text style={styles.passengerName}>{passenger.passengerName}</Text>
            </View>
          </View>
          <View style={styles.clockBox}>
            <View style={styles.clockDot} />
            <Text style={styles.clockText}>{formatTimeWithSeconds(currentTime)}</Text>
          </View>
        </View>

        {/* Flight Card */}
        {flightInfo && (
          <View style={styles.flightCard}>
            <View style={styles.flightHeader}>
              <View style={styles.flightBadge}>
                <Text style={styles.flightBadgeText}>VOTRE VOL</Text>
              </View>
              <View style={[styles.statusBadge, flightInfo.status === 'delayed' && styles.statusDelayed]}>
                <View style={[styles.statusDot, flightInfo.status === 'delayed' && styles.statusDotDelayed]} />
                <Text style={[styles.statusText, flightInfo.status === 'delayed' && styles.statusTextDelayed]}>
                  {flightInfo.status === 'delayed' ? `+${flightInfo.delay}min` : 'À l\'heure'}
                </Text>
              </View>
            </View>

            <View style={styles.flightRoute}>
              <View style={styles.cityBox}>
                <Text style={styles.cityCode}>CMN</Text>
                <Text style={styles.cityName}>Casablanca</Text>
              </View>
              <View style={styles.routeLine}>
                <View style={styles.routeDot} />
                <View style={styles.routeDash} />
                <MaterialCommunityIcons name="airplane" size={18} color="#D4AF37" style={styles.routePlane} />
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
                <Text style={styles.detailLabel}>VOL</Text>
                <Text style={styles.detailValue}>{flightInfo.flightNumber}</Text>
              </View>
              <View style={styles.flightDetail}>
                <Text style={styles.detailLabel}>PORTE</Text>
                <Text style={[styles.detailValue, styles.gateValue]}>{flightInfo.newGate || flightInfo.gate}</Text>
              </View>
              <View style={styles.flightDetail}>
                <Text style={styles.detailLabel}>SIÈGE</Text>
                <Text style={styles.detailValue}>{passenger.seatNumber}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Countdown */}
        {flightInfo && (
          <Animated.View style={[styles.countdownCard, { transform: [{ scale: pulseAnim }] }]}>
            <MaterialCommunityIcons name="timer-sand" size={20} color="#D4AF37" />
            <Text style={styles.countdownLabel}>Embarquement dans</Text>
            <Text style={styles.countdownValue}>{formatTimeRemaining(flightInfo.boardingTime)}</Text>
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
            <View style={styles.smartContent}>
              <View style={styles.smartIcon}>
                <MaterialCommunityIcons name="robot-happy" size={30} color="#B22222" />
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
                  {securityInfo ? `🛡️ Sécurité: ${securityInfo.currentWaitTime} min` : 'Analyse temps réel'}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#B22222" />
          </TouchableOpacity>
        </Animated.View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <MaterialCommunityIcons name="shield-check" size={26} color="#fff" />
            <Text style={styles.statValueWhite}>{securityInfo?.currentWaitTime || '--'}</Text>
            <Text style={styles.statLabelWhite}>min sécurité</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="crown" size={26} color="#D4AF37" />
            <Text style={styles.statValue}>{passenger.loyaltyTier}</Text>
            <Text style={styles.statLabel}>Statut</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="bag-checked" size={26} color="#2E7D32" />
            <Text style={styles.statValue}>{passenger.hasCheckedBag ? '1' : '0'}</Text>
            <Text style={styles.statLabel}>Bagage</Text>
          </View>
        </View>

        {/* Actions */}
        <Text style={styles.sectionTitle}>Outils</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/scan')} activeOpacity={0.85}>
            <View style={[styles.actionIcon, { backgroundColor: '#B22222' }]}>
              <MaterialCommunityIcons name="qrcode-scan" size={32} color="#fff" />
            </View>
            <Text style={styles.actionTitle}>Scanner</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/measure')} activeOpacity={0.85}>
            <View style={[styles.actionIcon, { backgroundColor: '#1565C0' }]}>
              <MaterialCommunityIcons name="ruler-square" size={32} color="#fff" />
            </View>
            <Text style={styles.actionTitle}>Mesurer</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/weight')} activeOpacity={0.85}>
            <View style={[styles.actionIcon, { backgroundColor: '#D4AF37' }]}>
              <MaterialCommunityIcons name="scale" size={32} color="#fff" />
            </View>
            <Text style={styles.actionTitle}>Peser</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/explore')} activeOpacity={0.85}>
            <View style={[styles.actionIcon, { backgroundColor: '#2E7D32' }]}>
              <MaterialCommunityIcons name="compass" size={32} color="#fff" />
            </View>
            <Text style={styles.actionTitle}>Services</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // LOGIN STYLES
  loginContainer: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  loginHeader: { alignItems: 'center', marginBottom: 30 },
  logoCircle: { width: 90, height: 90, borderRadius: 30, backgroundColor: 'rgba(178, 34, 34, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  loginTitle: { fontSize: 32, fontWeight: '900', color: '#1E293B', letterSpacing: -1 },
  loginSubtitle: { fontSize: 14, fontWeight: '600', color: '#B22222', marginTop: 4 },
  loginClock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 30 },
  loginClockText: { fontSize: 18, fontWeight: '700', color: '#64748B', fontVariant: ['tabular-nums'] },
  loginForm: { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  formTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 20, textAlign: 'center' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8 },
  inputBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#E8ECF0' },
  input: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1E293B' },
  flightList: { backgroundColor: '#F8FAFC', borderRadius: 14, padding: 12, marginBottom: 16, maxHeight: 160 },
  flightListTitle: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8 },
  flightListScroll: { maxHeight: 120 },
  flightItem: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderRadius: 10, marginBottom: 6 },
  flightItemNumber: { fontSize: 16, fontWeight: '800', color: '#B22222' },
  flightItemDest: { fontSize: 14, fontWeight: '500', color: '#64748B', marginLeft: 8 },
  loginButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#B22222', borderRadius: 16, paddingVertical: 18, marginTop: 8 },
  loginButtonDisabled: { backgroundColor: '#CBD5E1' },
  loginButtonText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  loginInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24, padding: 16, backgroundColor: '#fff', borderRadius: 14 },
  loginInfoText: { flex: 1, fontSize: 13, fontWeight: '500', color: '#94A3B8', lineHeight: 19 },

  // MAIN STYLES
  header: { backgroundColor: '#B22222', paddingTop: 50, paddingBottom: 18, paddingHorizontal: 20, overflow: 'hidden' },
  headerPattern: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  patternCircle: { position: 'absolute', borderRadius: 100, backgroundColor: '#fff' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBox: { width: 46, height: 46, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  welcomeText: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },
  passengerName: { fontSize: 18, fontWeight: '800', color: '#fff' },
  clockBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  clockDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80' },
  clockText: { fontSize: 15, fontWeight: '800', color: '#fff', fontVariant: ['tabular-nums'] },
  flightCard: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 18, padding: 16, marginBottom: 12 },
  flightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  flightBadge: { backgroundColor: 'rgba(212,175,55,0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  flightBadgeText: { fontSize: 9, fontWeight: '800', color: '#D4AF37', letterSpacing: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDelayed: {},
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80' },
  statusDotDelayed: { backgroundColor: '#F59E0B' },
  statusText: { fontSize: 12, fontWeight: '700', color: '#4ADE80' },
  statusTextDelayed: { color: '#F59E0B' },
  flightRoute: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  cityBox: {},
  cityCode: { fontSize: 28, fontWeight: '900', color: '#fff' },
  cityName: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  routeLine: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  routeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  routeDash: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 3 },
  routePlane: { transform: [{ rotate: '90deg' }], marginHorizontal: 6 },
  flightDetails: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: 12 },
  flightDetail: { alignItems: 'center' },
  detailLabel: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5, marginBottom: 3 },
  detailValue: { fontSize: 16, fontWeight: '900', color: '#fff' },
  gateValue: { color: '#D4AF37' },
  countdownCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'rgba(212,175,55,0.2)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(212,175,55,0.4)' },
  countdownLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  countdownValue: { fontSize: 18, fontWeight: '900', color: '#D4AF37' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 32 },
  smartCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, shadowColor: '#B22222', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  smartContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  smartIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(178, 34, 34, 0.08)', alignItems: 'center', justifyContent: 'center' },
  smartPulse: { position: 'absolute', top: -2, right: -2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#4ADE80', borderWidth: 2, borderColor: '#fff' },
  smartText: {},
  smartTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  smartTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
  aiBadge: { backgroundColor: '#B22222', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  aiBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  smartSubtitle: { fontSize: 13, fontWeight: '500', color: '#64748B', marginTop: 3 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  statCardPrimary: { backgroundColor: '#B22222' },
  statValue: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginTop: 6, textTransform: 'capitalize' },
  statValueWhite: { fontSize: 24, fontWeight: '900', color: '#fff', marginTop: 6 },
  statLabel: { fontSize: 10, fontWeight: '600', color: '#94A3B8', marginTop: 2 },
  statLabelWhite: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: { width: (SCREEN_WIDTH - 50) / 2, backgroundColor: '#fff', borderRadius: 18, padding: 18, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  actionIcon: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  actionTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
});
