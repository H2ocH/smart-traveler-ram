import { useJourney } from '@/context/JourneyContext';
import {
    Flight,
    formatTimeRemaining,
    formatTimeWithSeconds,
    generateFlightForNumber,
    getCurrentTime,
} from '@/data/airportDatabase';
import {
    calculateOptimalRoute,
    getDirectionText,
    getGateZoneId,
    getRealtimeZoneData,
    NavigationStep,
    OptimalRoute,
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
    const [route, setRoute] = useState<OptimalRoute | null>(null);
    const [currentNavStep, setCurrentNavStep] = useState(0);
    const [zonesData, setZonesData] = useState(getRealtimeZoneData());

    const { currentStepIndex, completedSteps, advanceStep, isStepCompleted } = useJourney();

    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const isVIP = loyaltyTier === 'gold' || loyaltyTier === 'platinum';

    // Rafraîchir données temps réel
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(getCurrentTime());
            setZonesData(getRealtimeZoneData());

            if (flightNumber && myFlight) {
                // Recalculer la route avec les nouvelles données de foule
                const gateId = getGateZoneId(myFlight.newGate || myFlight.gate);
                const newRoute = calculateOptimalRoute('entrance', gateId, isVIP);
                setRoute(newRoute);
            }
        }, 5000); // Mise à jour toutes les 5 secondes

        return () => clearInterval(interval);
    }, [flightNumber, myFlight, isVIP]);

    // Horloge temps réel (secondes)
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(getCurrentTime()), 1000);
        return () => clearInterval(interval);
    }, []);

    // Animation pulse
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.03, duration: 1200, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
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

            // Calculer route optimale vers la porte
            const gateId = getGateZoneId(flight.newGate || flight.gate);
            const optimalRoute = calculateOptimalRoute('entrance', gateId, isVIP);
            setRoute(optimalRoute);
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
        if (route && currentNavStep < route.steps.length - 1) {
            setCurrentNavStep(prev => prev + 1);
            // Avancer aussi dans le parcours global si applicable
            const navStep = route.steps[currentNavStep];
            if (navStep.zoneId.includes('security')) advanceStep();
            if (navStep.zoneId.includes('passport')) advanceStep();
            if (navStep.zoneId.includes('gate')) advanceStep();
        }
    }, [route, currentNavStep, advanceStep]);

    const currentStep = route?.steps[currentNavStep];
    const isLastStep = route ? currentNavStep === route.steps.length - 1 : false;

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
                                    <MaterialCommunityIcons name="navigation-variant" size={28} color="#fff" />
                                    <View style={styles.aiPulse} />
                                </View>
                                <View>
                                    <View style={styles.titleRow}>
                                        <Text style={styles.headerTitle}>Smart Navigator</Text>
                                        <View style={styles.aiBadge}>
                                            <Text style={styles.aiBadgeText}>IA</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.headerSubtitle}>Chemin optimal en temps réel</Text>
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

                        {/* Countdown & Gate */}
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

                    {/* Route Summary */}
                    {route && (
                        <View style={styles.routeSummary}>
                            <View style={styles.summaryItem}>
                                <MaterialCommunityIcons name="clock-outline" size={18} color="#64748B" />
                                <Text style={styles.summaryText}>{route.totalTime} min</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <MaterialCommunityIcons name="map-marker-distance" size={18} color="#64748B" />
                                <Text style={styles.summaryText}>{route.totalDistance}</Text>
                            </View>
                            <View style={[styles.summaryItem, styles.crowdBadge, { backgroundColor: route.crowdScore > 50 ? '#FEE2E2' : '#D1FAE5' }]}>
                                <MaterialCommunityIcons name="account-group" size={18} color={route.crowdScore > 50 ? '#DC2626' : '#10B981'} />
                                <Text style={[styles.summaryText, { color: route.crowdScore > 50 ? '#DC2626' : '#10B981' }]}>
                                    {route.crowdScore > 50 ? 'Dense' : 'Fluide'}
                                </Text>
                            </View>
                            {isVIP && (
                                <View style={[styles.summaryItem, styles.vipBadge]}>
                                    <MaterialCommunityIcons name="crown" size={16} color="#D4AF37" />
                                    <Text style={styles.vipText}>VIP</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Navigation Steps */}
                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                        {/* Current Step Card */}
                        {currentStep && (
                            <Animated.View style={[styles.currentStepCard, { transform: [{ scale: pulseAnim }] }]}>
                                {/* Direction Arrow */}
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
                                            {currentStep.crowdWarning === 'high' && '⚠️ Zone très fréquentée'}
                                            {currentStep.crowdWarning === 'medium' && '👥 Affluence moyenne'}
                                        </Text>
                                    </View>
                                )}

                                {/* Alternative Route */}
                                {currentStep.alternativeRoute && (
                                    <View style={styles.alternativeBox}>
                                        <MaterialCommunityIcons name="routes" size={18} color="#7C3AED" />
                                        <Text style={styles.alternativeText}>{currentStep.alternativeRoute}</Text>
                                    </View>
                                )}

                                {/* Wait Time */}
                                {currentStep.estimatedTime > 2 && (
                                    <View style={styles.waitInfo}>
                                        <MaterialCommunityIcons name="clock-fast" size={18} color="#1565C0" />
                                        <Text style={styles.waitText}>
                                            Temps estimé: <Text style={styles.waitBold}>{currentStep.estimatedTime} min</Text>
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
                                        {isLastStep ? "Je suis à ma porte !" : "Je suis arrivé →"}
                                    </Text>
                                    <MaterialCommunityIcons
                                        name={isLastStep ? "airplane-takeoff" : "check-circle"}
                                        size={22}
                                        color="#fff"
                                    />
                                </TouchableOpacity>
                            </Animated.View>
                        )}

                        {/* Steps Overview */}
                        <View style={styles.stepsOverview}>
                            <Text style={styles.overviewTitle}>📍 Votre itinéraire</Text>
                            {route?.steps.map((step, index) => (
                                <View
                                    key={step.zoneId + index}
                                    style={[
                                        styles.stepItem,
                                        index < currentNavStep && styles.stepCompleted,
                                        index === currentNavStep && styles.stepCurrent,
                                    ]}
                                >
                                    <View style={[
                                        styles.stepDot,
                                        { backgroundColor: index <= currentNavStep ? '#10B981' : '#CBD5E1' }
                                    ]}>
                                        {index < currentNavStep && (
                                            <MaterialCommunityIcons name="check" size={12} color="#fff" />
                                        )}
                                    </View>
                                    <View style={styles.stepContent}>
                                        <Text style={[
                                            styles.stepName,
                                            index === currentNavStep && styles.stepNameCurrent
                                        ]}>
                                            {step.zoneName}
                                        </Text>
                                        {step.crowdWarning && (
                                            <View style={[styles.miniCrowd, { backgroundColor: getCrowdColor(step.crowdWarning) + '20' }]}>
                                                <Text style={[styles.miniCrowdText, { color: getCrowdColor(step.crowdWarning) }]}>
                                                    {step.crowdWarning === 'high' ? '⚡' : '👤'} {step.estimatedTime}min
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    {index < route.steps.length - 1 && (
                                        <View style={[styles.stepLine, { backgroundColor: index < currentNavStep ? '#10B981' : '#E8ECF0' }]} />
                                    )}
                                </View>
                            ))}
                        </View>

                    </ScrollView>

                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.75)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: '#F8FAFC', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: SCREEN_HEIGHT * 0.93, overflow: 'hidden' },
    header: { backgroundColor: '#1565C0', paddingTop: 20, paddingBottom: 16, paddingHorizontal: 20 },
    headerMain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    aiIconBox: { width: 52, height: 52, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    aiPulse: { position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#4ADE80', borderWidth: 3, borderColor: '#1565C0' },
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
    flightDest: { fontSize: 14, fontWeight: '700', color: '#FBBF24' },
    countdownBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 14, padding: 14 },
    gateInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    gateText: { fontSize: 16, fontWeight: '800', color: '#fff' },
    timeRemaining: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    countdownValue: { fontSize: 18, fontWeight: '900', color: '#D4AF37' },
    routeSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', padding: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E8ECF0', flexWrap: 'wrap', gap: 8 },
    summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    summaryText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
    crowdBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    vipBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: '#FEF3C7' },
    vipText: { fontSize: 12, fontWeight: '800', color: '#D4AF37' },
    content: { flex: 1, padding: 16 },
    currentStepCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20, shadowColor: '#1565C0', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
    directionBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#1565C0', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    directionText: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginBottom: 6 },
    instruction: { fontSize: 16, fontWeight: '600', color: '#64748B', textAlign: 'center', marginBottom: 16 },
    crowdWarning: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, marginBottom: 12, width: '100%' },
    crowdText: { fontSize: 14, fontWeight: '700', flex: 1 },
    alternativeBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F3E8FF', padding: 12, borderRadius: 12, marginBottom: 12, width: '100%' },
    alternativeText: { fontSize: 13, fontWeight: '600', color: '#7C3AED', flex: 1 },
    waitInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    waitText: { fontSize: 14, fontWeight: '500', color: '#1565C0' },
    waitBold: { fontWeight: '800' },
    actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#1565C0', paddingVertical: 18, paddingHorizontal: 32, borderRadius: 18, width: '100%' },
    actionButtonFinal: { backgroundColor: '#166534' },
    actionButtonText: { fontSize: 17, fontWeight: '800', color: '#fff' },
    stepsOverview: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
    overviewTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 16 },
    stepItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4, opacity: 0.6 },
    stepCompleted: { opacity: 0.5 },
    stepCurrent: { opacity: 1 },
    stepDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    stepContent: { flex: 1, paddingBottom: 20 },
    stepName: { fontSize: 14, fontWeight: '600', color: '#64748B' },
    stepNameCurrent: { fontWeight: '800', color: '#1E293B', fontSize: 15 },
    miniCrowd: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
    miniCrowdText: { fontSize: 11, fontWeight: '700' },
    stepLine: { position: 'absolute', left: 11, top: 24, width: 2, height: 20 },
});
