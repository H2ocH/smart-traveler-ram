
import { useCrowd } from '@/context/CrowdContext';
import { usePassenger } from '@/context/PassengerContext';
import { generateFlightForNumber } from '@/data/airportDatabase';
import { AIRPORT_STEPS, formatDuration } from '@/data/crowdData';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SmartGuideScreen() {
    const {
        getActiveInProgress,
        submitTime,
        getAdjustedEstimatedTime,
        getCrowdLevel,
        getRemainingTimes,
        currentStep: contextCurrentStep,
        stepStartTime: contextStepStartTime,
        guideSessionId,
        setGuideState,
        startGuideSession,
        endGuideSession,
        flightTraffic
    } = useCrowd();

    const { passenger, logout, setPassenger, startNewJourney, completeCurrentJourney } = usePassenger();
    const router = useRouter();
    const params = useLocalSearchParams();

    // Use Context State
    const currentStepIndex = contextCurrentStep;
    const isTracking = contextStepStartTime !== null;

    // Derived State
    const currentStep = AIRPORT_STEPS[currentStepIndex];
    const nextStep = currentStepIndex < AIRPORT_STEPS.length - 1
        ? AIRPORT_STEPS[currentStepIndex + 1]
        : { id: 'finished', name: 'Terminé', icon: 'check-circle' as any, step: 99 };

    // Mandatory Scan Logic
    const isScanRequired = currentStep && (currentStep.id === 'checkin' || currentStep.id === 'baggage_claim');

    // Local state for UI only
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<{ from: string; to: string; duration: number }[]>([]);
    const [scanValidated, setScanValidated] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    // Initialisation - simplified logic
    useEffect(() => {
        // Si l'utilisateur n'est pas connecté, le renvoyer à l'accueil
        if (!passenger.isLoggedIn) {
            router.replace('/');
            return;
        }

        // Parcours déjà terminé : bloquer jusqu'à déconnexion
        if (passenger.hasCompletedParcours) {
            Alert.alert(
                'Parcours déjà terminé',
                'Vous avez déjà complété ce parcours.\n\nDéconnectez-vous puis reconnectez-vous pour en démarrer un nouveau.',
                [{ text: 'Retour Accueil', onPress: () => router.replace('/') }]
            );
            return;
        }

        if (!guideSessionId) {
            // Start new session
            startGuideSession();
            
            // Start a new journey si pas de voyage actif
            if (!passenger.currentJourneyId) {
                console.log('[Guide] Starting new journey for passenger:', passenger.passengerId);
                startNewJourney();
            }
        } else {
            // Restore elapsed time if already running
            if (contextStepStartTime) {
                const now = Date.now();
                const diff = Math.max(0, Math.floor((now - contextStepStartTime) / 1000));
                setElapsedSeconds(diff);
            }
        }
    }, [guideSessionId, passenger.isLoggedIn]);

    // Timer Interval
    useEffect(() => {
        let interval: any;

        if (contextStepStartTime) {
            // Update elapsed seconds every second based on start time
            const updateTimer = () => {
                const now = Date.now();
                const diff = Math.max(0, Math.floor((now - contextStepStartTime) / 1000));
                setElapsedSeconds(diff);
            };

            updateTimer(); // Initial update
            interval = setInterval(updateTimer, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [contextStepStartTime]);

    // Data Enrichment
    useEffect(() => {
        if (passenger.flightNumber && (!passenger.gate || !passenger.departureTime)) {
            console.log('[Guide] Enriching missing flight data for:', passenger.flightNumber);
            const flightDetails = generateFlightForNumber(passenger.flightNumber);

            setPassenger({
                gate: passenger.gate || flightDetails.newGate || flightDetails.gate,
                departureTime: passenger.departureTime || flightDetails.departureTime,
                arrivalTime: passenger.arrivalTime || flightDetails.arrivalTime,
                destination: passenger.destination || flightDetails.destination,
                destinationCode: passenger.destinationCode || flightDetails.destinationCode,
            });
        }
    }, [passenger.flightNumber]);

    // Check for scan return
    useEffect(() => {
        if (params.scanSuccess === 'true') {
            setScanValidated(true);
            router.setParams({ scanSuccess: undefined });
        }
    }, [params.scanSuccess]);


    const handleSubmitStep = () => {
        if (!isTracking) return;

        const safeDuration = isNaN(elapsedSeconds) ? 0 : elapsedSeconds;
        // Don't convert to minutes here, the server/dashboard expects seconds to format correctly
        // const durationMin = Math.ceil(safeDuration / 60);
        const safeName = passenger.passengerName && passenger.passengerName.trim() !== '' ? passenger.passengerName : 'Voyageur';

        const nextId = nextStep ? nextStep.id : 'finished';

        // Submit Time
        submitTime(currentStep.id, nextId, safeDuration, {
            travelerId: safeName,
            flightId: passenger.flightNumber || 'Unknown',
            seat: passenger.seatNumber || '-',
            gate: passenger.gate || '-',
            depAirport: passenger.depAirport || 'CMN',
            depAirportName: passenger.depAirportName || 'Casablanca',
            arrAirport: passenger.destinationCode || '-',
            arrAirportName: passenger.destination || '-',
            passengerName: safeName,
            sessionId: guideSessionId || 'unknown_session',
            departureTime: passenger.departureTime || '-',
            arrivalTime: passenger.arrivalTime || '-'
        }, 'completed');

        const nextIndex = currentStepIndex + 1;

        // Add to local history for display
        setCompletedSteps(prev => [...prev, {
            from: currentStep.name,
            to: nextIndex < AIRPORT_STEPS.length ? AIRPORT_STEPS[nextIndex].name : 'Terminé',
            duration: elapsedSeconds
        }]);

        if (nextIndex < AIRPORT_STEPS.length) {
            // Next Step
            setGuideState(nextIndex, Date.now(), guideSessionId || undefined);
            // Démarrer immédiatement l'étape suivante avec un record IN_PROGRESS
            const upcoming = AIRPORT_STEPS[nextIndex];
            const nextNextId = nextIndex + 1 < AIRPORT_STEPS.length ? AIRPORT_STEPS[nextIndex + 1].id : 'finished';
            submitTime(upcoming.id, nextNextId, 0, {
                travelerId: safeName,
                flightId: passenger.flightNumber || 'Unknown',
                seat: passenger.seatNumber || '-',
                gate: passenger.gate || '-',
                depAirport: passenger.depAirport || 'CMN',
                depAirportName: passenger.depAirportName || 'Casablanca',
                arrAirport: passenger.destinationCode || '-',
                arrAirportName: passenger.destination || '-',
                passengerName: safeName,
                sessionId: guideSessionId || 'unknown_session',
                departureTime: passenger.departureTime || '-',
                arrivalTime: passenger.arrivalTime || '-'
            }, 'in_progress');
            setElapsedSeconds(0);
            setScanValidated(false);
            Vibration.vibrate(100);
        } else {
            // Finished
            setIsFinished(true);
            endGuideSession();
            
            // Complete the current journey with all completed steps
            const stepIds = completedSteps.map(s => s.from);
            stepIds.push(currentStep.id); // Add the last step
            completeCurrentJourney(stepIds);
            console.log('[Guide] Journey completed with steps:', stepIds);
            
            Alert.alert(
                "🎉 Parcours Terminé",
                "Bon vol avec Royal Air Maroc !\n\nPour refaire un parcours, veuillez vous déconnecter puis vous reconnecter.",
                [{ text: "Retour Accueil", onPress: () => router.replace('/') }]
            );
        }
    };

    const toggleTracking = () => {
        if (isTracking) {
            handleSubmitStep();
        } else {
            // Start Step
            const nextId = nextStep ? nextStep.id : 'finished';
            // Enregistrer un record IN_PROGRESS pour le passager réel
            submitTime(currentStep.id, nextId, 0, {
                travelerId: passenger.passengerName || 'Voyageur',
                flightId: passenger.flightNumber || 'Unknown',
                seat: passenger.seatNumber || '-',
                gate: passenger.gate || '-',
                depAirport: passenger.depAirport || 'CMN',
                depAirportName: passenger.depAirportName || 'Casablanca',
                arrAirport: passenger.destinationCode || '-',
                arrAirportName: passenger.destination || '-',
                passengerName: passenger.passengerName || 'Voyageur',
                sessionId: guideSessionId || 'unknown_session',
                departureTime: passenger.departureTime || '-',
                arrivalTime: passenger.arrivalTime || '-'
            }, 'in_progress');
            setGuideState(currentStepIndex, Date.now(), guideSessionId || undefined);
        }
    };

    const handleAction = () => {
        if (!isTracking) {
            toggleTracking();
            return;
        }

        if (isScanRequired && !scanValidated) {
            const mode = currentStep.id === 'checkin' ? 'checkin' : 'checkout';
            Alert.alert(
                'Scan Requis',
                currentStep.id === 'checkin'
                    ? 'Veuillez scanner l\'étiquette de votre bagage pour l\'enregistrer.'
                    : 'Veuillez scanner le QR code pour récupérer votre bagage.',
                [
                    { text: 'Annuler', style: 'cancel' },
                    {
                        text: 'Scanner Maintenant',
                        onPress: () => router.push({ pathname: '/(tabs)/scan', params: { mode, returnTo: '/guide' } })
                    },
                    {
                        text: '[DEV] Simuler Scan',
                        onPress: () => {
                            Vibration.vibrate();
                            setScanValidated(true);
                        }
                    }
                ]
            );
            return;
        }

        handleSubmitStep();
    };

    const getEstimated = () => {
        if (!nextStep) return 0;
        const base = getAdjustedEstimatedTime(currentStep.id, nextStep.id);
        const remaining = Math.max(0, (isNaN(base) ? 0 : base) - (isNaN(elapsedSeconds) ? 0 : elapsedSeconds));
        return remaining;
    };

    const getCrowd = () => {
        if (!nextStep) return 'low';
        return getCrowdLevel(currentStep.id, nextStep.id);
    };

    const { remainingTotal } = getRemainingTimes(currentStepIndex, Date.now());

    const crowdLevel = getCrowd();
    const crowdConfig = {
        low: { color: '#22C55E', bg: '#DCFCE7', text: 'Faible', icon: 'account' },
        medium: { color: '#F59E0B', bg: '#FEF3C7', text: 'Modérée', icon: 'account-group' },
        high: { color: '#EF4444', bg: '#FEE2E2', text: 'Élevée', icon: 'account-multiple' },
    }[crowdLevel];

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>Guide Aéroport</Text>
                        <Text style={styles.headerSubtitle}>Mesure en temps réel</Text>
                    </View>
                    <View style={styles.activeBadge}>
                        <View style={styles.activeDot} />
                        <Text style={styles.activeText}>{getActiveInProgress()} actifs</Text>
                    </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    {AIRPORT_STEPS.map((step, index) => (
                        <React.Fragment key={step.id}>
                            <View style={[
                                styles.progressDot,
                                index <= currentStepIndex && styles.progressDotActive,
                                index === currentStepIndex && styles.progressDotCurrent
                            ]}>
                                <MaterialCommunityIcons
                                    name={index < currentStepIndex ? "check" : step.icon as any}
                                    size={14}
                                    color={index <= currentStepIndex ? "#fff" : "#94A3B8"}
                                />
                            </View>
                            {index < AIRPORT_STEPS.length - 1 && (
                                <View style={[
                                    styles.progressLine,
                                    index < currentStepIndex && styles.progressLineActive
                                ]} />
                            )}
                        </React.Fragment>
                    ))}
                </View>

                {/* Current Step Card */}
                <View style={styles.card}>
                    <View style={styles.stepHeader}>
                        <View style={styles.stepIcon}>
                            <MaterialCommunityIcons name={currentStep?.icon as any} size={32} color="#B22222" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.stepLabel}>ÉTAPE {currentStepIndex + 1}/{AIRPORT_STEPS.length}</Text>
                            <Text style={styles.stepTitle}>{currentStep?.name}</Text>
                        </View>
                    </View>

                    {nextStep && nextStep.id !== 'finished' && (
                        <View style={styles.nextStepRow}>
                            <MaterialCommunityIcons name="arrow-right-bottom" size={20} color="#64748B" />
                            <Text style={styles.nextStepText}>Vers : <Text style={styles.nextStepBold}>{nextStep.name}</Text></Text>
                        </View>
                    )}

                    <View style={styles.timerBox}>
                        <MaterialCommunityIcons name="timer-outline" size={24} color="#B22222" />
                        <Text style={styles.timerText}>
                            {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
                        </Text>
                        {isTracking && (
                            <View style={styles.recordingBadge}>
                                <View style={styles.recordingDot} />
                                <Text style={styles.recordingText}>ENREGISTREMENT</Text>
                            </View>
                        )}
                    </View>

                    {/* Traffic Indicator */}
                    {flightTraffic && (
                        <View style={styles.trafficBanner}>
                            <MaterialCommunityIcons name="airplane" size={16} color={flightTraffic.trafficColor} />
                            <Text style={styles.trafficBannerText}>
                                Trafic CMN: <Text style={[styles.trafficBannerLevel, { color: flightTraffic.trafficColor }]}>{flightTraffic.trafficLabel}</Text>
                                {flightTraffic.waitTimeMultiplier !== 1.0 && (
                                    <Text style={styles.trafficBannerMult}>
                                        {' '}({flightTraffic.waitTimeMultiplier > 1 ? '+' : ''}{Math.round((flightTraffic.waitTimeMultiplier - 1) * 100)}%)
                                    </Text>
                                )}
                            </Text>
                        </View>
                    )}

                    {/* Estimate & Crowd */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <MaterialCommunityIcons name="clock-outline" size={20} color="#64748B" />
                            <View>
                                <Text style={styles.statLabel}>Estimé</Text>
                                <Text style={styles.statValue}>{formatDuration(getEstimated())}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statItem}>
                            <MaterialCommunityIcons name={crowdConfig?.icon as any} size={20} color={crowdConfig?.color} />
                            <View>
                                <Text style={styles.statLabel}>Affluence</Text>
                                <Text style={[styles.statValue, { color: crowdConfig?.color }]}>{crowdConfig?.text || 'Faible'}</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statItem}>
                            <MaterialCommunityIcons name="timer-sand" size={20} color="#B22222" />
                            <View>
                                <Text style={styles.statLabel}>Total restant</Text>
                                <Text style={[styles.statValue, { color: '#B22222' }]}>{formatDuration(remainingTotal)}</Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.actionButton, isTracking ? styles.actionButtonActive : styles.actionButtonStart]}
                        onPress={handleAction}
                        activeOpacity={0.8}
                    >
                        <MaterialCommunityIcons
                            name={isTracking ? "flag-checkered" : "play"}
                            size={24}
                            color="#fff"
                        />
                        <Text style={styles.actionButtonText}>
                            {isTracking ? "Terminer l'étape" : "Démarrer"}
                        </Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    content: { paddingBottom: 40 },
    header: { backgroundColor: '#B22222', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    headerSubtitle: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.8)' },
    activeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 6 },
    activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80' },
    activeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    progressContainer: { flexDirection: 'row', paddingHorizontal: 24, marginVertical: 24, alignItems: 'center', justifyContent: 'center' },
    progressDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
    progressDotActive: { backgroundColor: '#B22222' },
    progressDotCurrent: { transform: [{ scale: 1.2 }], borderWidth: 2, borderColor: '#fff', shadowColor: '#B22222', shadowOpacity: 0.3, shadowRadius: 8 },
    progressLine: { flex: 1, height: 2, backgroundColor: '#E2E8F0', marginHorizontal: -4 },
    progressLineActive: { backgroundColor: '#B22222' },
    card: { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 20, elevation: 4 },
    stepHeader: { flexDirection: 'row', gap: 16, marginBottom: 20 },
    stepIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
    stepLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8', letterSpacing: 1, marginBottom: 4 },
    stepTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
    nextStepRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginBottom: 24 },
    nextStepText: { fontSize: 14, color: '#64748B' },
    nextStepBold: { fontWeight: '700', color: '#1E293B' },
    timerBox: { alignItems: 'center', paddingVertical: 24, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F1F5F9', marginBottom: 24 },
    timerText: { fontSize: 48, fontWeight: '900', color: '#1E293B', fontVariant: ['tabular-nums'], marginVertical: 8 },
    recordingBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
    recordingText: { fontSize: 11, fontWeight: '700', color: '#EF4444', letterSpacing: 0.5 },
    statsRow: { flexDirection: 'row', gap: 20, marginBottom: 24 },
    statItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    statLabel: { fontSize: 11, fontWeight: '600', color: '#94A3B8' },
    statValue: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
    divider: { width: 1, backgroundColor: '#E2E8F0' },
    actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 16 },
    actionButtonStart: { backgroundColor: '#1E293B' },
    actionButtonActive: { backgroundColor: '#B22222' },
    actionButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    trafficBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F8FAFC', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, marginBottom: 16 },
    trafficBannerText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    trafficBannerLevel: { fontWeight: '800' },
    trafficBannerMult: { fontSize: 12, fontWeight: '600', color: '#94A3B8' }
});
