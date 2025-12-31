import { useJourney } from '@/context/JourneyContext';
import {
    Flight,
    formatTimeRemaining,
    formatTimeWithSeconds,
    generateFlightForNumber,
    getCurrentTime,
} from '@/data/airportDatabase';
import {
    calculateMultipleRoutes,
    getDirectionText,
    getGateZoneId,
    NavigationStep,
    RouteOption
} from '@/data/airportNavigation';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
    visible: boolean;
    onClose: () => void;
    flightNumber: string;
    loyaltyTier: string;
}

export default function SmartAssistantModal({ visible, onClose, flightNumber, loyaltyTier }: Props) {
    const [currentTime, setCurrentTime] = useState(getCurrentTime());
    const [myFlight, setMyFlight] = useState<Flight | null>(null);
    const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
    const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
    const [currentNavStep, setCurrentNavStep] = useState(0);

    const { advanceStep } = useJourney();

    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const isVIP = loyaltyTier === 'gold' || loyaltyTier === 'platinum';

    // Rafraîchir données temps réel toutes les 3 secondes
    useEffect(() => {
        const interval = setInterval(() => {
            if (flightNumber && myFlight) {
                const gateId = getGateZoneId(myFlight.newGate || myFlight.gate);
                const newRoutes = calculateMultipleRoutes('entrance', gateId, isVIP);
                setRouteOptions(newRoutes);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [flightNumber, myFlight, isVIP]);

    // Horloge temps réel
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(getCurrentTime()), 1000);
        return () => clearInterval(interval);
    }, []);

    // Animation pulse
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    // Initialisation
    useEffect(() => {
        if (visible && flightNumber) {
            Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 10 }).start();

            const flight = generateFlightForNumber(flightNumber);
            setMyFlight(flight);

            // Calculer les routes alternatives
            const gateId = getGateZoneId(flight.newGate || flight.gate);
            const routes = calculateMultipleRoutes('entrance', gateId, isVIP);
            setRouteOptions(routes);
            setSelectedRouteIndex(0);
            setCurrentNavStep(0);
        } else {
            slideAnim.setValue(SCREEN_HEIGHT);
        }
    }, [visible, flightNumber, isVIP]);

    const handleClose = () => {
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 300, useNativeDriver: true }).start(() => onClose());
    };

    const handleArrived = useCallback(() => {
        Vibration.vibrate(100);
        const selectedRoute = routeOptions[selectedRouteIndex];
        if (selectedRoute && currentNavStep < selectedRoute.route.steps.length - 1) {
            setCurrentNavStep(prev => prev + 1);
            const navStep = selectedRoute.route.steps[currentNavStep];
            if (navStep.zoneId.includes('security')) advanceStep();
            if (navStep.zoneId.includes('passport')) advanceStep();
            if (navStep.zoneId.includes('gate')) advanceStep();
        }
    }, [routeOptions, selectedRouteIndex, currentNavStep, advanceStep]);

    const selectedRoute = routeOptions[selectedRouteIndex];
    const currentStep = selectedRoute?.route.steps[currentNavStep];
    const isLastStep = selectedRoute ? currentNavStep === selectedRoute.route.steps.length - 1 : false;

    const getCrowdColor = (level: 'low' | 'medium' | 'high' | null) => {
        if (!level) return '#10B981';
        if (level === 'high') return '#DC2626';
        if (level === 'medium') return '#F59E0B';
        return '#10B981';
    };

    const getDirectionIcon = (direction: NavigationStep['direction']): string => {
        switch (direction) {
            case 'straight': return 'arrow-up';
            case 'left': return 'arrow-left';
            case 'right': return 'arrow-right';
            case 'up': return 'stairs-up';
            case 'down': return 'stairs-down';
            case 'arrive': return 'flag-checkered';
            default: return 'arrow-up';
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
            <View style={styles.overlay}>
                <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerMain}>
                            <View style={styles.headerLeft}>
                                <View style={styles.aiIconBox}>
                                    <MaterialCommunityIcons name="robot-happy" size={28} color="#fff" />
                                    <View style={styles.aiPulse} />
                                </View>
                                <View>
                                    <View style={styles.titleRow}>
                                        <Text style={styles.headerTitle}>Smart Assistant</Text>
                                        <View style={styles.aiBadge}>
                                            <Text style={styles.aiBadgeText}>IA</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.headerSubtitle}>Navigation intelligente en temps réel</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                                <MaterialCommunityIcons name="close" size={22} color="#1E293B" />
                            </TouchableOpacity>
                        </View>

                        {/* Flight & Time */}
                        <View style={styles.infoRow}>
                            <View style={styles.timeBox}>
                                <View style={styles.timeDot} />
                                <Text style={styles.timeText}>{formatTimeWithSeconds(currentTime)}</Text>
                            </View>
                            {myFlight && (
                                <View style={styles.flightBox}>
                                    <Text style={styles.flightCode}>{myFlight.flightNumber}</Text>
                                    <MaterialCommunityIcons name="arrow-right" size={14} color="rgba(255,255,255,0.6)" />
                                    <Text style={styles.flightDest}>{myFlight.destinationCode}</Text>
                                </View>
                            )}
                        </View>

                        {/* Countdown */}
                        {myFlight && (
                            <View style={styles.countdownBar}>
                                <View style={styles.gateInfo}>
                                    <MaterialCommunityIcons name="gate" size={18} color="#fff" />
                                    <Text style={styles.gateText}>Porte {myFlight.newGate || myFlight.gate}</Text>
                                </View>
                                <View style={styles.timeRemaining}>
                                    <MaterialCommunityIcons name="timer-sand" size={16} color="#D4AF37" />
                                    <Text style={styles.countdownValue}>{formatTimeRemaining(myFlight.boardingTime)}</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Route Options */}
                    <View style={styles.routeOptionsContainer}>
                        <Text style={styles.routeOptionsTitle}>📍 Choisir votre itinéraire :</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.routeOptionsList}>
                            {routeOptions.map((option, index) => (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.routeOptionCard,
                                        selectedRouteIndex === index && styles.routeOptionCardSelected,
                                    ]}
                                    onPress={() => { setSelectedRouteIndex(index); setCurrentNavStep(0); }}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.routeOptionName, selectedRouteIndex === index && styles.routeOptionNameSelected]}>
                                        {option.name}
                                    </Text>
                                    <Text style={[styles.routeOptionTime, selectedRouteIndex === index && styles.routeOptionTimeSelected]}>
                                        {option.route.totalTime} min
                                    </Text>
                                    <Text style={[
                                        styles.routeOptionReco,
                                        option.isFastest && styles.recoFastest,
                                        option.timeDifference > 5 && styles.recoSlow,
                                    ]}>
                                        {option.recommendation}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Navigation Content */}
                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                        {/* Current Step Card */}
                        {currentStep && (
                            <Animated.View style={[styles.currentStepCard, { transform: [{ scale: pulseAnim }] }]}>
                                <View style={styles.directionBox}>
                                    <MaterialCommunityIcons
                                        name={getDirectionIcon(currentStep.direction) as any}
                                        size={50}
                                        color="#fff"
                                    />
                                </View>

                                <Text style={styles.directionText}>{getDirectionText(currentStep.direction)}</Text>
                                <Text style={styles.instruction}>{currentStep.instruction}</Text>

                                {/* Crowd Warning */}
                                {currentStep.crowdWarning && (
                                    <View style={[styles.crowdWarning, { backgroundColor: getCrowdColor(currentStep.crowdWarning) + '20' }]}>
                                        <MaterialCommunityIcons
                                            name="account-group"
                                            size={20}
                                            color={getCrowdColor(currentStep.crowdWarning)}
                                        />
                                        <Text style={[styles.crowdText, { color: getCrowdColor(currentStep.crowdWarning) }]}>
                                            {currentStep.crowdWarning === 'high' && '⚠️ Zone très fréquentée - risque de retard'}
                                            {currentStep.crowdWarning === 'medium' && '👥 Affluence moyenne'}
                                        </Text>
                                    </View>
                                )}

                                {/* Alternative Route Hint */}
                                {currentStep.alternativeRoute && (
                                    <View style={styles.alternativeBox}>
                                        <MaterialCommunityIcons name="routes" size={18} color="#7C3AED" />
                                        <Text style={styles.alternativeText}>{currentStep.alternativeRoute}</Text>
                                    </View>
                                )}

                                {/* Wait Time */}
                                {currentStep.estimatedTime > 3 && (
                                    <View style={styles.waitInfo}>
                                        <MaterialCommunityIcons name="clock-fast" size={18} color="#B22222" />
                                        <Text style={styles.waitText}>
                                            ⏱️ Attente estimée: <Text style={styles.waitBold}>{currentStep.estimatedTime} min</Text>
                                        </Text>
                                    </View>
                                )}

                                {/* Action Button */}
                                <TouchableOpacity
                                    style={[styles.actionButton, isLastStep && styles.actionButtonFinal]}
                                    onPress={handleArrived}
                                    activeOpacity={0.9}
                                >
                                    <Text style={styles.actionButtonText}>
                                        {isLastStep ? "Je suis à ma porte !" : "J'y suis arrivé →"}
                                    </Text>
                                    <MaterialCommunityIcons
                                        name={isLastStep ? "airplane-takeoff" : "check-circle"}
                                        size={22}
                                        color="#fff"
                                    />
                                </TouchableOpacity>
                            </Animated.View>
                        )}

                        {/* Mini Steps Overview */}
                        {selectedRoute && (
                            <View style={styles.stepsOverview}>
                                <Text style={styles.overviewTitle}>🗺️ Étapes restantes</Text>
                                {selectedRoute.route.steps.slice(currentNavStep).map((step, index) => (
                                    <View
                                        key={step.zoneId + index}
                                        style={[styles.stepItem, index === 0 && styles.stepCurrent]}
                                    >
                                        <View style={[styles.stepDot, { backgroundColor: index === 0 ? '#B22222' : '#CBD5E1' }]}>
                                            {step.crowdWarning === 'high' && (
                                                <Text style={styles.stepDotWarning}>!</Text>
                                            )}
                                        </View>
                                        <View style={styles.stepContent}>
                                            <Text style={[styles.stepName, index === 0 && styles.stepNameCurrent]}>
                                                {step.zoneName}
                                            </Text>
                                            <Text style={styles.stepTime}>
                                                {step.estimatedTime > 2 ? `~${step.estimatedTime}min` : 'Rapide'}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                    </ScrollView>

                    {/* VIP Badge */}
                    {isVIP && (
                        <View style={styles.vipFooter}>
                            <MaterialCommunityIcons name="crown" size={16} color="#D4AF37" />
                            <Text style={styles.vipText}>Accès prioritaire activé dans le calcul</Text>
                        </View>
                    )}

                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.75)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: '#F8FAFC', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: SCREEN_HEIGHT * 0.93, overflow: 'hidden' },
    header: { backgroundColor: '#B22222', paddingTop: 20, paddingBottom: 16, paddingHorizontal: 20 },
    headerMain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    aiIconBox: { width: 52, height: 52, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    aiPulse: { position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#4ADE80', borderWidth: 3, borderColor: '#B22222' },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
    aiBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    aiBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '500', marginTop: 2 },
    closeBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    timeBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
    timeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80' },
    timeText: { fontSize: 18, fontWeight: '900', color: '#fff', fontVariant: ['tabular-nums'] },
    flightBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
    flightCode: { fontSize: 16, fontWeight: '800', color: '#fff' },
    flightDest: { fontSize: 14, fontWeight: '700', color: '#D4AF37' },
    countdownBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 14, padding: 14 },
    gateInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    gateText: { fontSize: 16, fontWeight: '800', color: '#fff' },
    timeRemaining: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    countdownValue: { fontSize: 18, fontWeight: '900', color: '#D4AF37' },
    routeOptionsContainer: { backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E8ECF0' },
    routeOptionsTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B', marginBottom: 10 },
    routeOptionsList: { flexDirection: 'row' },
    routeOptionCard: { backgroundColor: '#F1F5F9', borderRadius: 14, padding: 12, marginRight: 10, minWidth: 140, borderWidth: 2, borderColor: 'transparent' },
    routeOptionCardSelected: { backgroundColor: '#B22222', borderColor: '#B22222' },
    routeOptionName: { fontSize: 13, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
    routeOptionNameSelected: { color: '#fff' },
    routeOptionTime: { fontSize: 18, fontWeight: '900', color: '#64748B', marginBottom: 6 },
    routeOptionTimeSelected: { color: '#fff' },
    routeOptionReco: { fontSize: 11, fontWeight: '600', color: '#64748B' },
    recoFastest: { color: '#10B981' },
    recoSlow: { color: '#DC2626' },
    content: { flex: 1, padding: 16 },
    currentStepCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20, shadowColor: '#B22222', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
    directionBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#B22222', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    directionText: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginBottom: 6 },
    instruction: { fontSize: 16, fontWeight: '600', color: '#64748B', textAlign: 'center', marginBottom: 16 },
    crowdWarning: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, marginBottom: 12, width: '100%' },
    crowdText: { fontSize: 14, fontWeight: '700', flex: 1 },
    alternativeBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F3E8FF', padding: 12, borderRadius: 12, marginBottom: 12, width: '100%' },
    alternativeText: { fontSize: 13, fontWeight: '600', color: '#7C3AED', flex: 1 },
    waitInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    waitText: { fontSize: 14, fontWeight: '500', color: '#B22222' },
    waitBold: { fontWeight: '800' },
    actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#B22222', paddingVertical: 18, paddingHorizontal: 32, borderRadius: 18, width: '100%' },
    actionButtonFinal: { backgroundColor: '#166534' },
    actionButtonText: { fontSize: 17, fontWeight: '800', color: '#fff' },
    stepsOverview: { backgroundColor: '#fff', borderRadius: 20, padding: 16 },
    overviewTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B', marginBottom: 12 },
    stepItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, opacity: 0.7 },
    stepCurrent: { opacity: 1 },
    stepDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    stepDotWarning: { color: '#fff', fontWeight: '900', fontSize: 14 },
    stepContent: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    stepName: { fontSize: 14, fontWeight: '600', color: '#64748B' },
    stepNameCurrent: { fontWeight: '800', color: '#1E293B' },
    stepTime: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
    vipFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF3C7', padding: 12, borderTopWidth: 1, borderTopColor: '#FDE68A' },
    vipText: { fontSize: 13, fontWeight: '700', color: '#92400E' },
});
