import { useCrowd } from '@/context/CrowdContext';
import { usePassenger } from '@/context/PassengerContext';
import {
    generateFlightForNumber,
    generateSecurityZones,
    getCurrentTime,
    MOROCCAN_AIRPORTS
} from '@/data/airportDatabase';
import { formatDuration } from '@/data/crowdData';
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
    View
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Liste des vols RAM disponibles (simulation réaliste)
// Liste des vols RAM disponibles (simulation réaliste)
const AVAILABLE_FLIGHTS = [
  // --- MAROC (DOMESTIQUE) ---
  { number: 'AT400', destination: 'Marrakech Menara', code: 'RAK' },
  { number: 'AT402', destination: 'Agadir Al Massira', code: 'AGA' },
  { number: 'AT404', destination: 'Tanger Ibn Battouta', code: 'TNG' },
  { number: 'AT406', destination: 'Fès Saïss', code: 'FEZ' },
  { number: 'AT408', destination: 'Oujda Angads', code: 'OUD' },
  { number: 'AT410', destination: 'Nador Al Aroui', code: 'NDR' },
  { number: 'AT412', destination: 'Laâyoune Hassan I', code: 'EUN' },
  { number: 'AT414', destination: 'Dakhla', code: 'VIL' },
  { number: 'AT416', destination: 'Ouarzazate', code: 'OZZ' },
  { number: 'AT418', destination: 'Al Hoceima', code: 'AHU' },
  { number: 'AT420', destination: 'Errachidia', code: 'ERH' },

  // --- FRANCE ---
  { number: 'AT700', destination: 'Paris CDG', code: 'CDG' },
  { number: 'AT702', destination: 'Paris Orly', code: 'ORY' },
  { number: 'AT704', destination: 'Lyon St-Exupéry', code: 'LYS' },
  { number: 'AT706', destination: 'Marseille Provence', code: 'MRS' },
  { number: 'AT708', destination: 'Toulouse Blagnac', code: 'TLS' },
  { number: 'AT710', destination: 'Bordeaux Mérignac', code: 'BOD' },
  { number: 'AT712', destination: 'Nice Côte d\'Azur', code: 'NCE' },
  { number: 'AT714', destination: 'Nantes Atlantique', code: 'NTE' },
  { number: 'AT716', destination: 'Montpellier', code: 'MPL' },

  // --- EUROPE (HORS FRANCE) ---
  { number: 'AT800', destination: 'Londres Heathrow', code: 'LHR' },
  { number: 'AT802', destination: 'Londres Gatwick', code: 'LGW' },
  { number: 'AT804', destination: 'Bruxelles Zaventem', code: 'BRU' },
  { number: 'AT806', destination: 'Amsterdam Schiphol', code: 'AMS' },
  { number: 'AT808', destination: 'Madrid Barajas', code: 'MAD' },
  { number: 'AT810', destination: 'Barcelone El Prat', code: 'BCN' },
  { number: 'AT812', destination: 'Malaga', code: 'AGP' },
  { number: 'AT814', destination: 'Valence', code: 'VLC' },
  { number: 'AT816', destination: 'Lisbonne', code: 'LIS' },
  { number: 'AT818', destination: 'Rome Fiumicino', code: 'FCO' },
  { number: 'AT820', destination: 'Milan Malpensa', code: 'MXP' },
  { number: 'AT822', destination: 'Bologne', code: 'BLQ' },
  { number: 'AT824', destination: 'Genève Cointrin', code: 'GVA' },
  { number: 'AT826', destination: 'Frankfurt', code: 'FRA' },
  { number: 'AT828', destination: 'Istanbul', code: 'IST' },

  // --- AMÉRIQUE DU NORD ---
  { number: 'AT200', destination: 'New York JFK', code: 'JFK' },
  { number: 'AT202', destination: 'Washington Dulles', code: 'IAD' },
  { number: 'AT204', destination: 'Montréal Trudeau', code: 'YUL' },
  { number: 'AT206', destination: 'Miami', code: 'MIA' },

  // --- AFRIQUE ---
  { number: 'AT500', destination: 'Dakar Diass', code: 'DSS' },
  { number: 'AT502', destination: 'Abidjan', code: 'ABJ' },
  { number: 'AT504', destination: 'Lagos', code: 'LOS' },
  { number: 'AT506', destination: 'Tunis Carthage', code: 'TUN' },
  { number: 'AT508', destination: 'Le Caire', code: 'CAI' },
  { number: 'AT510', destination: 'Alger', code: 'ALG' },
  { number: 'AT512', destination: 'Bamako', code: 'BKO' },
  { number: 'AT514', destination: 'Conakry', code: 'CKY' },
  { number: 'AT516', destination: 'Libreville', code: 'LBV' },

  // --- MOYEN-ORIENT ---
  { number: 'AT250', destination: 'Dubai International', code: 'DXB' },
  { number: 'AT252', destination: 'Jeddah', code: 'JED' },
  { number: 'AT254', destination: 'Riyad', code: 'RUH' },
  { number: 'AT256', destination: 'Doha Hamad', code: 'DOH' },

  ];

export default function HomeScreen() {
  const { passenger, setPassenger, logout, hydrated } = usePassenger();
  const { currentStep: guideCurrentStep, getRemainingTimes, stepStartTime, getActiveInProgress, flightTraffic, isLoadingTraffic, refreshFlightTraffic } = useCrowd();
  const [nowTick, setNowTick] = useState(Date.now());
  const [showSmartAssistant, setShowSmartAssistant] = useState(false);
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [flightInfo, setFlightInfo] = useState<any>(null);
  const [securityInfo, setSecurityInfo] = useState<any>(null);
  const [flightInput, setFlightInput] = useState('');
  const [passengerName, setPassengerName] = useState('');
  const [showFlightList, setShowFlightList] = useState(false);
  const [hasShownPopup, setHasShownPopup] = useState(false);
  const [selectedOrigin, setSelectedOrigin] = useState(MOROCCAN_AIRPORTS[0]); // Default CMN

  // Fade animation only for initial load
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Horloge temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Générer les infos de vol quand le passager change
  useEffect(() => {
    if (passenger.isLoggedIn && passenger.flightNumber) {
      // TOUJOURS régénérer les infos de vol avec les paramètres actuels du passager
      const flight = generateFlightForNumber(
        passenger.flightNumber, 
        passenger.destination, 
        passenger.destinationCode, 
        passenger.depAirport
      );
      setFlightInfo(flight);

      const security = generateSecurityZones();
      const bestSec = [...security].sort((a, b) => a.currentWaitTime - b.currentWaitTime)[0];
      setSecurityInfo(bestSec);
    }
  }, [passenger.isLoggedIn, passenger.flightNumber, passenger.destination, passenger.destinationCode, passenger.depAirport]);

  // Popup après connexion (séparé pour éviter les boucles)
  useEffect(() => {
    if (passenger.isLoggedIn && !hasShownPopup) {
      setTimeout(() => {
        setHasShownPopup(true);
      }, 1500);
    }
  }, [passenger.isLoggedIn, hasShownPopup]);

  // Animations
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  // FILTERED LISTS
  const filteredFlights = AVAILABLE_FLIGHTS.filter(f => {
    // Basic Search
    const matchesInput = flightInput === '' ||
      f.number.includes(flightInput) ||
      f.destination.toUpperCase().includes(flightInput) ||
      (f.code && f.code.includes(flightInput));

    if (!matchesInput) return false;

    // IF Origin is CMN (Default): Show all normal flights (except strictly arrival ones in main list, handled below)
    // IF Origin is NOT CMN (e.g. Marrakech):
    //    - Show flights where destination is NOT Marrakech (avoid RAK->RAK)
    //    - Ideally show "Vers Casablanca"

    if (selectedOrigin.code !== 'CMN') {
      // If I am in Marrakech (RAK):

      // Tous les vols sont des départs, pas d'arrivées
      return true;
    }

    return true;
  });

  // Pour l'affichage:
  // Si on est à Casa (CMN):
  //   - ramFlights = Departs Maroc (Vers Ailleurs)
  //   - intlFlights = Vols Internationaux (Vers Casa - Arrivées)

  // Si on est Ailleurs (ex: RAK):
  //   - ramFlights = Vers Casablanca (Hub)
  //   - intlFlights = Vols Internationaux (Departs de RAK vers ailleurs ?) -> Pour l'instant on simplifie, on montre tout sauf RAK->RAK

  const ramFlights = filteredFlights.filter(f => f.code !== selectedOrigin.code);

  const handleLogin = useCallback(() => {
    if (!flightInput.trim() || !passengerName.trim()) return;

    // Déterminer la classe de voyage (probabilité réaliste)
    const classRandom = Math.random();
    const travelClass: 'economy' | 'business' | 'first' =
      classRandom < 0.75 ? 'economy' :
        classRandom < 0.95 ? 'business' : 'first';

    const flight = AVAILABLE_FLIGHTS.find(f => f.number.toUpperCase() === flightInput.toUpperCase());

    let destName: string | undefined;
    let destCode: string | undefined;

    // Par défaut, l'origine est celle sélectionnée par l'utilisateur
    let originCode: string = selectedOrigin.code;
    let originName: string = selectedOrigin.name;

    if (flight) {
      // Vol Standard (ex: AT400 Casa -> Marrakech)
      // SI on part de Casa: Origin=CMN, Dest=RAK
      // SI on part de Marrakech (Origin=RAK): Dest cannot be RAK.

      if (selectedOrigin.code === flight.code) {
        // Cas : Partir de Marrakech avec un vol affiché "Vers Marrakech"
        // On inverse : C'est un vol VERS Casablanca
        destName = 'Casablanca Mohammed V';
        destCode = 'CMN';
      } else {
        destName = flight.destination;
        destCode = flight.code;
      }
    } else {
      // Vol manuel
      // Si code destination == code origine, on force Casa
      if (destCode === originCode) {
        destName = 'Casablanca Mohammed V';
        destCode = 'CMN';
      }
    }

    const generated = generateFlightForNumber(flightInput.toUpperCase(), destName, destCode, originCode);

    setPassenger({
      flightNumber: generated.flightNumber,
      destination: generated.destination,
      destinationCode: generated.destinationCode,
      depAirport: generated.originCode,
      depAirportName: generated.origin,
      passengerName: passengerName.trim(),
      seatNumber: generated.defaultSeat || '12A', // Force deterministic seat
      gate: generated.gate || '', // Force deterministic gate
      loyaltyTier: passenger.loyaltyTier || 'standard',
      travelClass: travelClass,
      hasCheckedBag: Math.random() > 0.5,
      isLoggedIn: true,
    });

    setHasShownPopup(false);
  }, [flightInput, passengerName, setPassenger, passenger.loyaltyTier, selectedOrigin]);

  const selectFlight = (flight: typeof AVAILABLE_FLIGHTS[0]) => {
    setFlightInput(flight.number);
    setShowFlightList(false);
  };

  // Tick pour rafraîchir les temps (1s) - MUST be before early returns
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Calcul temps restants (synchronisés guide/dashboard) - MUST be before early returns
  const stepIndex = guideCurrentStep ?? 0;
  const { remainingCurrent, remainingTotal } = getRemainingTimes(stepIndex, nowTick);

  // Vue LOGIN si pas connecté
  if (!hydrated) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <View style={[styles.loginForm, { width: '100%', maxWidth: 360 }]}>
          <View style={{ alignItems: 'center', gap: 12 }}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="progress-clock" size={40} color="#B22222" />
            </View>
            <Text style={styles.formTitle}>Chargement</Text>
            <Text style={[styles.loginInfoText, { textAlign: 'center' }]}>Récupération de votre session…</Text>
          </View>
        </View>
      </View>
    );
  }

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
                    setShowFlightList(true);
                  }}
                  onFocus={() => setShowFlightList(true)}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Liste des vols disponibles */}
            {showFlightList && (
              <View style={styles.flightList}>
                <Text style={styles.flightListTitle}>Sélectionnez votre itinéraire</Text>
                <ScrollView
                  style={styles.flightListScroll}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={true}
                >

                  {/* SECTION DEPARTS MAROC */}
                  {ramFlights.length > 0 && (
                    <>
                      <Text style={[styles.flightListTitle, { color: '#B22222', marginTop: 4 }]}>Departs Maroc (RAM)</Text>
                      {ramFlights.slice(0, flightInput ? 20 : 5).map((flight) => (
                        <TouchableOpacity
                          key={flight.number}
                          style={styles.flightItem}
                          onPress={() => selectFlight(flight)}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={styles.flightItemNumber}>{flight.number}</Text>
                            <Text style={{ fontSize: 11, color: '#64748B' }}>Vers: {flight.destination}</Text>
                          </View>
                          <MaterialCommunityIcons name="airplane-takeoff" size={16} color="#B22222" />
                        </TouchableOpacity>
                      ))}
                    </>
                  )}

                  
                  {filteredFlights.length === 0 && (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                      <Text style={{ color: '#94A3B8', fontStyle: 'italic' }}>Aucun vol trouvé pour "{flightInput}"</Text>
                    </View>
                  )}

                  {/* Space for scrolling */}
                  <View style={{ height: 20 }} />
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerPattern}>
          <View style={[styles.patternCircle, { top: -20, right: -20, width: 200, height: 200, opacity: 0.1 }]} />
          <View style={[styles.patternCircle, { bottom: -40, left: -40, width: 140, height: 140, opacity: 0.1 }]} />
        </View>
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
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <MaterialCommunityIcons name="logout" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {flightInfo && (
          <View style={styles.flightCard}>
            <View style={styles.flightHeader}>

              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>À l'heure</Text>
              </View>
            </View>

            <View style={styles.flightRoute}>
              <View style={styles.cityBox}>
                <Text style={styles.cityCode}>{flightInfo.originCode}</Text>
                <Text style={styles.cityName}>{flightInfo.origin.replace('Mohammed V', '').replace('Menara', '').replace('Al Massira', '')}</Text>
              </View>
              <View style={styles.routeLine}>
                <View style={styles.routeDot} />
                <View style={styles.routeDash} />
                <MaterialCommunityIcons name="airplane" size={20} color="#fff" style={styles.routePlane} />
                <View style={styles.routeDash} />
                <View style={styles.routeDot} />
              </View>
              <View style={styles.cityBox}>
                <Text style={styles.cityCode}>{flightInfo.destinationCode}</Text>
                <Text style={styles.cityName}>{flightInfo.destination.replace('Mohammed V', '').split(' ')[0]}</Text>
              </View>
            </View>

            <View style={styles.flightDetails}>
              <View style={styles.flightDetail}>
                <Text style={styles.detailLabel}>VOL</Text>
                <Text style={styles.detailValue}>{flightInfo.flightNumber}</Text>
              </View>
              <View style={styles.flightDetail}>
                <Text style={styles.detailLabel}>PORTE</Text>
                <Text style={[styles.detailValue, styles.gateValue]}>{flightInfo.gate}</Text>
              </View>
              <View style={styles.flightDetail}>
                <Text style={styles.detailLabel}>DÉPART</Text>
                <Text style={styles.detailValue}>{flightInfo.departureTime}</Text>
              </View>
              <View style={styles.flightDetail}>
                <Text style={styles.detailLabel}>SIÈGE</Text>
                <Text style={styles.detailValue}>{passenger.seatNumber}</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Smart Assistant Card */}
        <TouchableOpacity style={styles.smartCard} onPress={() => router.push('/guide')}>
          <View style={styles.smartContent}>
            <View style={[styles.smartIcon, { backgroundColor: '#EFF6FF' }]}>
              <MaterialCommunityIcons name="compass" size={28} color="#2563EB" />
            </View>
            <View style={styles.smartText}>
              <View style={styles.smartTitleRow}>
                <Text style={styles.smartTitle}>Guide Aéroport</Text>
                <View style={[styles.aiBadge, { backgroundColor: '#2563EB' }]}>
                  <Text style={styles.aiBadgeText}>IA</Text>
                </View>
              </View>
              <Text style={styles.smartSubtitle}>Navigation assistée pas à pas</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#CBD5E1" />
        </TouchableOpacity>

        {/* Temps à prévoir avant arrivée - HERO CARD */}
        <View style={styles.heroTimeCard}>
          <View style={styles.heroTimeGradient}>
            <View style={styles.heroTimeHeader}>
              <MaterialCommunityIcons name="clock-time-four" size={28} color="#fff" />
              <Text style={styles.heroTimeTitle}>Temps avant l'arrivée</Text>
            </View>
            <View style={styles.heroTimeDisplay}>
              <Text style={styles.heroTimeValue}>{formatDuration(remainingTotal + 1800, true)}</Text>
              <Text style={styles.heroTimeSubtext}>Incluant 30 min de marge</Text>
            </View>
          </View>
        </View>

        {/* Flight Traffic Indicator - AviationStack API */}
        <View style={styles.trafficCard}>
          <View style={styles.trafficHeader}>
            <MaterialCommunityIcons name="airplane-takeoff" size={20} color="#64748B" />
            <Text style={styles.trafficTitle}>Trafic Aéroport CMN</Text>
            {flightTraffic?.isFromMock && (
              <View style={styles.trafficMockBadge}>
                <Text style={styles.trafficMockText}>Simulé</Text>
              </View>
            )}
          </View>
          
          {isLoadingTraffic ? (
            <View style={styles.trafficLoading}>
              <Text style={styles.trafficLoadingText}>Chargement du trafic...</Text>
            </View>
          ) : flightTraffic ? (
            <View style={styles.trafficContent}>
              <View style={styles.trafficStats}>
                <View style={styles.trafficStat}>
                  <MaterialCommunityIcons name="airplane-landing" size={18} color="#10B981" />
                  <Text style={styles.trafficStatValue}>{flightTraffic.arrivals}</Text>
                  <Text style={styles.trafficStatLabel}>Arrivées</Text>
                </View>
                <View style={styles.trafficStatDivider} />
                <View style={styles.trafficStat}>
                  <MaterialCommunityIcons name="airplane-takeoff" size={18} color="#3B82F6" />
                  <Text style={styles.trafficStatValue}>{flightTraffic.departures}</Text>
                  <Text style={styles.trafficStatLabel}>Départs</Text>
                </View>
                <View style={styles.trafficStatDivider} />
                <View style={styles.trafficStat}>
                  <View style={[styles.trafficLevelBadge, { backgroundColor: flightTraffic.trafficColor + '20' }]}>
                    <View style={[styles.trafficLevelDot, { backgroundColor: flightTraffic.trafficColor }]} />
                    <Text style={[styles.trafficLevelText, { color: flightTraffic.trafficColor }]}>
                      {flightTraffic.trafficLabel}
                    </Text>
                  </View>
                </View>
              </View>
              {flightTraffic.waitTimeMultiplier !== 1.0 && (
                <View style={[
                  styles.trafficImpactBanner,
                  { backgroundColor: flightTraffic.waitTimeMultiplier > 1 ? '#FEF2F2' : '#ECFDF5' }
                ]}>
                  <View style={[
                    styles.trafficImpactIcon,
                    { backgroundColor: flightTraffic.waitTimeMultiplier > 1 ? '#FEE2E2' : '#D1FAE5' }
                  ]}>
                    <MaterialCommunityIcons 
                      name={flightTraffic.waitTimeMultiplier > 1 ? "alert-circle" : "check-circle"} 
                      size={20} 
                      color={flightTraffic.waitTimeMultiplier > 1 ? "#DC2626" : "#10B981"} 
                    />
                  </View>
                  <View style={styles.trafficImpactContent}>
                    <Text style={styles.trafficImpactTitle}>
                      {flightTraffic.waitTimeMultiplier > 1 ? 'Attente augmentée' : 'Attente réduite'}
                    </Text>
                    <Text style={[
                      styles.trafficImpactValue,
                      { color: flightTraffic.waitTimeMultiplier > 1 ? '#DC2626' : '#10B981' }
                    ]}>
                      {flightTraffic.waitTimeMultiplier > 1 ? '+' : ''}{Math.round((flightTraffic.waitTimeMultiplier - 1) * 100)}% sur les temps
                    </Text>
                  </View>
                </View>
              )}
              <TouchableOpacity 
                style={styles.refreshButton} 
                onPress={refreshFlightTraffic}
                disabled={isLoadingTraffic}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="refresh" size={16} color="#2563EB" />
                <Text style={styles.refreshButtonText}>Actualiser</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.trafficLoading}>
              <Text style={styles.trafficLoadingText}>Données non disponibles</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Services Connectés</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/claims')}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(178, 34, 34, 0.1)' }]}>
              <MaterialCommunityIcons name="clipboard-text" size={28} color="#B22222" />
            </View>
            <Text style={styles.actionTitle}>Réclamations</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/loyalty')}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(106, 27, 154, 0.1)' }]}>
              <MaterialCommunityIcons name="star-circle" size={28} color="#6A1B9A" />
            </View>
            <Text style={styles.actionTitle}>Fidélité</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/scan')}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(22, 163, 74, 0.1)' }]}>
              <MaterialCommunityIcons name="barcode-scan" size={28} color="#16A34A" />
            </View>
            <Text style={styles.actionTitle}>Scanner Bagage</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/measure')}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(220, 38, 38, 0.1)' }]}>
              <MaterialCommunityIcons name="cube-scan" size={28} color="#DC2626" />
            </View>
            <Text style={styles.actionTitle}>Mesure AR</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(tabs)/weight')}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(234, 88, 12, 0.1)' }]}>
              <MaterialCommunityIcons name="scale-bathroom" size={28} color="#EA580C" />
            </View>
            <Text style={styles.actionTitle}>Poids Bagage</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push({ pathname: '/(tabs)/shop', params: { shopId: 'shop-duty-free' } })}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(8, 145, 178, 0.1)' }]}>
              <MaterialCommunityIcons name="shopping" size={28} color="#0891B2" />
            </View>
            <Text style={styles.actionTitle}>Duty Free</Text>
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
  loginForm: { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  formTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 20, textAlign: 'center' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8 },
  inputBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#E8ECF0' },
  input: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1E293B' },
  flightList: { backgroundColor: '#F8FAFC', borderRadius: 14, padding: 12, marginBottom: 16, maxHeight: 300, minHeight: 150, borderWidth: 1, borderColor: '#E2E8F0' },
  flightListTitle: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8 },
  flightListScroll: { flexGrow: 1 },
  flightItem: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderRadius: 10, marginBottom: 6, borderWidth: 1, borderColor: '#F1F5F9' },
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoutButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.18)', alignItems: 'center', justifyContent: 'center' },
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
  journeyTimeCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 18, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  journeyTimeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  journeyTimeTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  journeyTimeContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  journeyTimeItem: { alignItems: 'center', flex: 1 },
  journeyTimeLabel: { fontSize: 12, fontWeight: '500', color: '#64748B', marginBottom: 4 },
  journeyTimeValue: { fontSize: 22, fontWeight: '800', color: '#1E293B' },
  journeyTimeDivider: { width: 1, height: 40, backgroundColor: '#E2E8F0' },
  activeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 6 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80' },
  activeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Flight Traffic Indicator Styles
  trafficCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 18, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  trafficHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  trafficTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', flex: 1 },
  trafficMockBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  trafficMockText: { fontSize: 10, fontWeight: '700', color: '#D97706' },
  trafficLoading: { alignItems: 'center', paddingVertical: 12 },
  trafficLoadingText: { fontSize: 13, fontWeight: '500', color: '#94A3B8' },
  trafficContent: {},
  trafficStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  trafficStat: { alignItems: 'center', gap: 4 },
  trafficStatValue: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  trafficStatLabel: { fontSize: 11, fontWeight: '500', color: '#64748B' },
  trafficStatDivider: { width: 1, height: 36, backgroundColor: '#E2E8F0' },
  trafficLevelBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  trafficLevelDot: { width: 8, height: 8, borderRadius: 4 },
  trafficLevelText: { fontSize: 13, fontWeight: '700' },
  trafficImpactBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, padding: 14, borderRadius: 12, borderWidth: 1.5 },
  trafficImpactIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  trafficImpactContent: { flex: 1 },
  trafficImpactTitle: { fontSize: 13, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  trafficImpactValue: { fontSize: 16, fontWeight: '900', letterSpacing: -0.5 },
  refreshButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingVertical: 10, backgroundColor: '#EFF6FF', borderRadius: 10 },
  refreshButtonText: { fontSize: 13, fontWeight: '700', color: '#2563EB' },

  // Hero Time Card Styles (Dark Purple)
  heroTimeCard: { marginBottom: 18, borderRadius: 24, overflow: 'hidden', shadowColor: '#0F172A', shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  heroTimeGradient: { backgroundColor: '#0F172A', padding: 24, position: 'relative' },
  heroTimeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  heroTimeTitle: { fontSize: 16, fontWeight: '700', color: '#E2E8F0', letterSpacing: 0.5 },
  heroTimeDisplay: { alignItems: 'center', marginBottom: 20 },
  heroTimeValue: { fontSize: 56, fontWeight: '900', color: '#F8FAFC', letterSpacing: -2, marginBottom: 6 },
  heroTimeSubtext: { fontSize: 14, fontWeight: '600', color: '#CBD5E1' },
  heroTimeBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, alignSelf: 'center' },
  heroTimeBadgeText: { fontSize: 13, fontWeight: '700', color: '#E2E8F0' },
});


