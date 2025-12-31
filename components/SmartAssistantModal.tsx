import {
    Flight,
    formatTimeRemaining,
    formatTimeWithSeconds,
    generateFlightForNumber,
    generateSecurityZones,
    getCurrentTime,
} from '@/data/airportDatabase';
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

// Les étapes du parcours aéroport
const JOURNEY_STEPS = [
    {
        id: 'checkin',
        title: 'Enregistrement',
        instruction: 'Rendez-vous aux comptoirs d\'enregistrement ou utilisez une borne auto-enregistrement.',
        icon: 'desktop-classic',
        action: 'Je suis enregistré',
        tips: ['Préparez votre passeport', 'Imprimez ou téléchargez votre carte d\'embarquement'],
    },
    {
        id: 'baggage',
        title: 'Dépose Bagages',
        instruction: 'Déposez vos bagages en soute au comptoir dédié.',
        icon: 'bag-suitcase',
        action: 'Bagages déposés',
        tips: ['Max 23kg par bagage', 'Gardez vos objets de valeur en cabine'],
    },
    {
        id: 'security',
        title: 'Contrôle Sécurité',
        instruction: 'Passez le contrôle de sécurité. Préparez vos liquides et appareils électroniques.',
        icon: 'shield-check',
        action: 'Sécurité passée',
        tips: ['Liquides < 100ml dans sac transparent', 'Retirez ceinture, veste, montre'],
        dynamic: true, // Indique qu'on veut afficher des infos temps réel
    },
    {
        id: 'passport',
        title: 'Contrôle Passeport',
        instruction: 'Passez le contrôle des passeports pour accéder à la zone internationale.',
        icon: 'passport',
        action: 'Passeport vérifié',
        tips: ['Passeport valide 6 mois après le voyage', 'Visa si nécessaire'],
    },
    {
        id: 'gate',
        title: 'Direction Porte',
        instruction: 'Dirigez-vous vers votre porte d\'embarquement.',
        icon: 'gate',
        action: 'Arrivé à la porte',
        tips: ['Vérifiez les écrans pour le numéro de porte', 'Comptez 10-15 min de marche'],
        dynamic: true,
    },
    {
        id: 'boarding',
        title: 'Embarquement',
        instruction: 'Présentez-vous à la porte. L\'embarquement va commencer !',
        icon: 'airplane-takeoff',
        action: 'Je suis à bord !',
        tips: ['Carte d\'embarquement + passeport prêts', 'Désactivez le mode avion après le décollage'],
    },
];

interface Props {
    visible: boolean;
    onClose: () => void;
    flightNumber: string;
    loyaltyTier: string;
}

export default function SmartAssistantModal({ visible, onClose, flightNumber, loyaltyTier }: Props) {
    const [currentTime, setCurrentTime] = useState(getCurrentTime());
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [myFlight, setMyFlight] = useState<Flight | null>(null);
    const [securityInfo, setSecurityInfo] = useState<any>(null);
    const [completedSteps, setCompletedSteps] = useState<string[]>([]);

    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    // Horloge temps réel
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(getCurrentTime());
            // Rafraîchir données vol toutes les 10 secondes
            if (flightNumber) {
                setMyFlight(generateFlightForNumber(flightNumber));
                const zones = generateSecurityZones();
                const best = [...zones].sort((a, b) => a.currentWaitTime - b.currentWaitTime)[0];
                setSecurityInfo(best);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [flightNumber]);

    // Animation pulse
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

    // Animation ouverture
    useEffect(() => {
        if (visible && flightNumber) {
            Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 10 }).start();
            // Charger données initiales
            setMyFlight(generateFlightForNumber(flightNumber));
            const zones = generateSecurityZones();
            const best = [...zones].sort((a, b) => a.currentWaitTime - b.currentWaitTime)[0];
            setSecurityInfo(best);
        } else {
            slideAnim.setValue(SCREEN_HEIGHT);
        }
    }, [visible, flightNumber]);

    // Animation barre de progression
    useEffect(() => {
        const progress = (currentStepIndex / (JOURNEY_STEPS.length - 1)) * 100;
        Animated.timing(progressAnim, { toValue: progress, duration: 500, useNativeDriver: false }).start();
    }, [currentStepIndex]);

    const handleClose = () => {
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 300, useNativeDriver: true }).start(() => onClose());
    };

    const handleStepComplete = useCallback(() => {
        Vibration.vibrate(100);
        const currentStep = JOURNEY_STEPS[currentStepIndex];
        setCompletedSteps(prev => [...prev, currentStep.id]);

        if (currentStepIndex < JOURNEY_STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        }
    }, [currentStepIndex]);

    const currentStep = JOURNEY_STEPS[currentStepIndex];
    const isLastStep = currentStepIndex === JOURNEY_STEPS.length - 1;
    const allCompleted = completedSteps.length === JOURNEY_STEPS.length;

    const getStepColor = (index: number) => {
        if (index < currentStepIndex) return '#10B981'; // Completed
        if (index === currentStepIndex) return '#B22222'; // Current
        return '#CBD5E1'; // Upcoming
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
                                        <Text style={styles.headerTitle}>Smart Guide</Text>
                                        <View style={styles.aiBadge}>
                                            <Text style={styles.aiBadgeText}>IA</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.headerSubtitle}>Je vous guide pas à pas</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.85}>
                                <MaterialCommunityIcons name="close" size={22} color="#1E293B" />
                            </TouchableOpacity>
                        </View>

                        {/* Flight Info */}
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
                                <MaterialCommunityIcons name="timer-sand" size={18} color="#D4AF37" />
                                <Text style={styles.countdownLabel}>Embarquement</Text>
                                <Text style={styles.countdownValue}>{formatTimeRemaining(myFlight.boardingTime)}</Text>
                            </View>
                        )}
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressSection}>
                        <View style={styles.progressBar}>
                            <Animated.View
                                style={[
                                    styles.progressFill,
                                    { width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }
                                ]}
                            />
                        </View>
                        <Text style={styles.progressText}>
                            Étape {currentStepIndex + 1} / {JOURNEY_STEPS.length}
                        </Text>
                    </View>

                    {/* Steps Timeline */}
                    <View style={styles.timeline}>
                        {JOURNEY_STEPS.map((step, index) => (
                            <View key={step.id} style={styles.timelineItem}>
                                <View style={[styles.timelineDot, { backgroundColor: getStepColor(index) }]}>
                                    {index < currentStepIndex && (
                                        <MaterialCommunityIcons name="check" size={12} color="#fff" />
                                    )}
                                </View>
                                {index < JOURNEY_STEPS.length - 1 && (
                                    <View style={[styles.timelineLine, { backgroundColor: getStepColor(index) }]} />
                                )}
                            </View>
                        ))}
                    </View>

                    {/* Current Step Content */}
                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {!allCompleted ? (
                            <Animated.View style={[styles.stepCard, { transform: [{ scale: pulseAnim }] }]}>
                                <View style={styles.stepIconBox}>
                                    <MaterialCommunityIcons
                                        name={currentStep.icon as any}
                                        size={40}
                                        color="#B22222"
                                    />
                                </View>

                                <Text style={styles.stepTitle}>{currentStep.title}</Text>
                                <Text style={styles.stepInstruction}>{currentStep.instruction}</Text>

                                {/* Dynamic Info - Security Wait Time */}
                                {currentStep.id === 'security' && securityInfo && (
                                    <View style={styles.dynamicInfo}>
                                        <MaterialCommunityIcons name="clock-fast" size={20} color="#1565C0" />
                                        <Text style={styles.dynamicText}>
                                            {securityInfo.name}: <Text style={styles.dynamicHighlight}>{securityInfo.currentWaitTime} min</Text> d'attente
                                        </Text>
                                    </View>
                                )}

                                {/* Dynamic Info - Gate */}
                                {currentStep.id === 'gate' && myFlight && (
                                    <View style={styles.dynamicInfo}>
                                        <MaterialCommunityIcons name="gate" size={20} color="#D4AF37" />
                                        <Text style={styles.dynamicText}>
                                            Porte: <Text style={styles.dynamicHighlight}>{myFlight.newGate || myFlight.gate}</Text>
                                            {myFlight.newGate && <Text style={styles.gateChanged}> (Changée!)</Text>}
                                        </Text>
                                    </View>
                                )}

                                {/* Tips */}
                                <View style={styles.tipsBox}>
                                    <Text style={styles.tipsTitle}>💡 Conseils</Text>
                                    {currentStep.tips.map((tip, i) => (
                                        <View key={i} style={styles.tipRow}>
                                            <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
                                            <Text style={styles.tipText}>{tip}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Action Button */}
                                <TouchableOpacity
                                    style={[styles.actionButton, isLastStep && styles.actionButtonFinal]}
                                    onPress={handleStepComplete}
                                    activeOpacity={0.9}
                                >
                                    <Text style={styles.actionButtonText}>{currentStep.action}</Text>
                                    <MaterialCommunityIcons
                                        name={isLastStep ? "airplane-takeoff" : "arrow-right"}
                                        size={20}
                                        color="#fff"
                                    />
                                </TouchableOpacity>
                            </Animated.View>
                        ) : (
                            <View style={styles.completedCard}>
                                <View style={styles.completedIcon}>
                                    <MaterialCommunityIcons name="party-popper" size={60} color="#D4AF37" />
                                </View>
                                <Text style={styles.completedTitle}>Bon voyage ! ✈️</Text>
                                <Text style={styles.completedText}>
                                    Vous êtes à bord du vol {flightNumber}. Profitez de votre voyage vers {myFlight?.destination} !
                                </Text>
                                <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                                    <Text style={styles.closeButtonText}>Fermer</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>

                    {/* VIP Badge */}
                    {(loyaltyTier === 'gold' || loyaltyTier === 'platinum') && (
                        <View style={styles.vipBadge}>
                            <MaterialCommunityIcons name="crown" size={16} color="#D4AF37" />
                            <Text style={styles.vipText}>Accès prioritaire disponible</Text>
                        </View>
                    )}

                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: '#F8FAFC', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: SCREEN_HEIGHT * 0.92, overflow: 'hidden' },
    header: { backgroundColor: '#B22222', paddingTop: 20, paddingBottom: 16, paddingHorizontal: 20 },
    headerMain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    aiIconBox: { width: 52, height: 52, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    aiPulse: { position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#4ADE80', borderWidth: 3, borderColor: '#B22222' },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
    aiBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    aiBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginTop: 2 },
    closeBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    timeBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
    timeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80' },
    timeText: { fontSize: 18, fontWeight: '900', color: '#fff', fontVariant: ['tabular-nums'] },
    flightBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
    flightCode: { fontSize: 16, fontWeight: '800', color: '#fff' },
    flightDest: { fontSize: 14, fontWeight: '700', color: '#D4AF37' },
    countdownBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(212,175,55,0.2)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(212,175,55,0.4)' },
    countdownLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
    countdownValue: { fontSize: 18, fontWeight: '900', color: '#D4AF37', marginLeft: 'auto' },
    progressSection: { paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E8ECF0' },
    progressBar: { flex: 1, height: 8, backgroundColor: '#E8ECF0', borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 4 },
    progressText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
    timeline: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, backgroundColor: '#fff' },
    timelineItem: { flexDirection: 'row', alignItems: 'center' },
    timelineDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    timelineLine: { width: 30, height: 3, borderRadius: 2 },
    content: { flex: 1, padding: 20 },
    stepCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#B22222', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
    stepIconBox: { width: 90, height: 90, borderRadius: 28, backgroundColor: 'rgba(178, 34, 34, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    stepTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginBottom: 8, textAlign: 'center' },
    stepInstruction: { fontSize: 15, fontWeight: '500', color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 16 },
    dynamicInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EFF6FF', padding: 14, borderRadius: 14, marginBottom: 16, width: '100%' },
    dynamicText: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
    dynamicHighlight: { fontWeight: '900', color: '#1565C0' },
    gateChanged: { color: '#DC2626', fontWeight: '700' },
    tipsBox: { backgroundColor: '#F0FDF4', padding: 16, borderRadius: 14, width: '100%', marginBottom: 20 },
    tipsTitle: { fontSize: 14, fontWeight: '800', color: '#166534', marginBottom: 10 },
    tipRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
    tipText: { fontSize: 13, fontWeight: '500', color: '#166534', flex: 1 },
    actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#B22222', paddingVertical: 18, paddingHorizontal: 32, borderRadius: 18, width: '100%' },
    actionButtonFinal: { backgroundColor: '#166534' },
    actionButtonText: { fontSize: 17, fontWeight: '800', color: '#fff' },
    completedCard: { backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center' },
    completedIcon: { width: 120, height: 120, borderRadius: 40, backgroundColor: 'rgba(212, 175, 55, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    completedTitle: { fontSize: 28, fontWeight: '900', color: '#1E293B', marginBottom: 12 },
    completedText: { fontSize: 15, fontWeight: '500', color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    closeButton: { backgroundColor: '#B22222', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 16 },
    closeButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    vipBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF3C7', padding: 12, borderTopWidth: 1, borderTopColor: '#FDE68A' },
    vipText: { fontSize: 13, fontWeight: '700', color: '#92400E' },
});
