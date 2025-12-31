import {
    Flight,
    formatTimeRemaining,
    formatTimeWithSeconds,
    generateFlightForNumber,
    generateLounges,
    generateSecurityZones,
    getCurrentTime,
    getWeatherConditions,
} from '@/data/airportDatabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type AlertType = 'CROWD' | 'SHOPPING' | 'GATE' | 'BOARDING' | 'DELAY' | 'PRIORITY' | 'FINAL_CALL' | 'WEATHER';

interface SmartAlert {
    id: string;
    type: AlertType;
    title: string;
    message: string;
    impact: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    action?: string;
    timestamp: Date;
}

const ALERT_CONFIG: Record<AlertType, {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    color: string;
}> = {
    CROWD: { icon: 'account-group', color: '#D84315' },
    SHOPPING: { icon: 'shopping', color: '#2E7D32' },
    GATE: { icon: 'gate-arrow-right', color: '#1565C0' },
    BOARDING: { icon: 'airplane-takeoff', color: '#00695C' },
    DELAY: { icon: 'clock-alert-outline', color: '#E65100' },
    PRIORITY: { icon: 'star-circle', color: '#6A1B9A' },
    FINAL_CALL: { icon: 'alert-circle', color: '#C62828' },
    WEATHER: { icon: 'weather-cloudy-alert', color: '#37474F' },
};

const analyzeFlightData = (
    flight: Flight,
    securityZones: any[],
    lounges: any[],
    loyaltyTier: string
): SmartAlert[] => {
    const alerts: SmartAlert[] = [];
    const now = getCurrentTime();

    const timeToBoarding = (flight.boardingTime.getTime() - now.getTime()) / 60000;
    const timeToGateClose = (flight.gateCloseTime.getTime() - now.getTime()) / 60000;

    if (flight.status === 'final-call' || (timeToGateClose <= 15 && timeToGateClose > 0)) {
        alerts.push({
            id: `final-${now.getTime()}`,
            type: 'FINAL_CALL',
            title: `DERNIER APPEL - ${flight.flightNumber}`,
            message: `Fermeture porte ${flight.newGate || flight.gate} dans ${formatTimeRemaining(flight.gateCloseTime)} !`,
            impact: formatTimeRemaining(flight.gateCloseTime),
            priority: 'critical',
            action: 'Courir !',
            timestamp: now,
        });
    } else if (flight.status === 'boarding' || (timeToBoarding <= 5 && timeToBoarding > -30)) {
        alerts.push({
            id: `boarding-${now.getTime()}`,
            type: 'BOARDING',
            title: `Embarquement - ${flight.flightNumber}`,
            message: `Direction ${flight.destination}. Porte ${flight.newGate || flight.gate}.`,
            impact: `Porte ${flight.newGate || flight.gate}`,
            priority: 'high',
            action: 'Embarquer',
            timestamp: now,
        });
    } else if (flight.status === 'gate-change' && flight.newGate) {
        alerts.push({
            id: `gate-${now.getTime()}`,
            type: 'GATE',
            title: `Changement porte - ${flight.flightNumber}`,
            message: `Nouvelle porte: ${flight.gate} → ${flight.newGate}. ~8 min de marche.`,
            impact: flight.newGate,
            priority: 'high',
            action: 'Itinéraire',
            timestamp: new Date(now.getTime() - 2 * 60000),
        });
    }

    if (flight.status === 'delayed' && flight.delay) {
        alerts.push({
            id: `delay-${now.getTime()}`,
            type: 'DELAY',
            title: `Retard ${flight.flightNumber}`,
            message: `+${flight.delay} min. Profitez-en pour visiter nos lounges !`,
            impact: `+${flight.delay}min`,
            priority: 'medium',
            timestamp: new Date(now.getTime() - 5 * 60000),
        });
    }

    const sortedSecurity = [...securityZones].sort((a, b) => a.currentWaitTime - b.currentWaitTime);
    const bestZone = sortedSecurity[0];
    const passengerZone = securityZones[0];

    if (passengerZone.currentWaitTime - bestZone.currentWaitTime >= 8) {
        alerts.push({
            id: `crowd-${now.getTime()}`,
            type: 'CROWD',
            title: `File optimisée`,
            message: `${bestZone.name} plus rapide: ${bestZone.currentWaitTime}min vs ${passengerZone.currentWaitTime}min`,
            impact: `-${passengerZone.currentWaitTime - bestZone.currentWaitTime}min`,
            priority: passengerZone.currentWaitTime > 20 ? 'high' : 'medium',
            action: 'Y aller',
            timestamp: new Date(now.getTime() - 1 * 60000),
        });
    }

    if (loyaltyTier === 'gold' || loyaltyTier === 'platinum') {
        const priorityZone = securityZones.find(z => z.name.includes('Prioritaire'));
        if (priorityZone) {
            alerts.push({
                id: `priority-${now.getTime()}`,
                type: 'PRIORITY',
                title: `Accès VIP disponible`,
                message: `Accès Prioritaire: seulement ${priorityZone.currentWaitTime}min !`,
                impact: `${priorityZone.currentWaitTime}min`,
                priority: 'medium',
                action: 'VIP',
                timestamp: new Date(now.getTime() - 3 * 60000),
            });
        }
    }

    if (timeToBoarding > 50) {
        const bestLounge = lounges.filter(l => l.hasPromo && l.currentOccupancy < 65)[0];
        if (bestLounge) {
            alerts.push({
                id: `lounge-${now.getTime()}`,
                type: 'SHOPPING',
                title: `${bestLounge.name}`,
                message: `${bestLounge.currentOccupancy}% occupé. -${bestLounge.promoDiscount}% !`,
                impact: `-${bestLounge.promoDiscount}%`,
                priority: 'low',
                action: 'Réserver',
                timestamp: new Date(now.getTime() - 10 * 60000),
            });
        }
    }

    const weather = getWeatherConditions();
    if (weather.impact) {
        alerts.push({
            id: `weather-${now.getTime()}`,
            type: 'WEATHER',
            title: `Alerte météo`,
            message: weather.message,
            impact: 'Attention',
            priority: 'low',
            timestamp: new Date(now.getTime() - 15 * 60000),
        });
    }

    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 5);
};

interface Props {
    visible: boolean;
    onClose: () => void;
    flightNumber: string;
    loyaltyTier: string;
}

export default function SmartAssistantModal({ visible, onClose, flightNumber, loyaltyTier }: Props) {
    const [currentTime, setCurrentTime] = useState(getCurrentTime());
    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [alerts, setAlerts] = useState<SmartAlert[]>([]);
    const [myFlight, setMyFlight] = useState<Flight | null>(null);
    const [securityInfo, setSecurityInfo] = useState<{ best: string; time: number } | null>(null);
    const [fadeAnims] = useState(() => [0, 1, 2, 3, 4].map(() => new Animated.Value(0)));
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(getCurrentTime()), 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.03, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        );
        pulse.start();

        const rotate = Animated.loop(
            Animated.timing(rotateAnim, { toValue: 1, duration: 3000, useNativeDriver: true })
        );
        rotate.start();

        return () => { pulse.stop(); rotate.stop(); };
    }, []);

    const runAnalysis = useCallback(() => {
        if (!flightNumber) return;

        setIsAnalyzing(true);
        setAlerts([]);
        fadeAnims.forEach(anim => anim.setValue(0));

        setTimeout(() => {
            // Générer le vol basé sur le numéro de vol du passager
            const flight = generateFlightForNumber(flightNumber);
            const securityZones = generateSecurityZones();
            const lounges = generateLounges();

            setMyFlight(flight);
            const bestSec = [...securityZones].sort((a, b) => a.currentWaitTime - b.currentWaitTime)[0];
            setSecurityInfo({ best: bestSec.name, time: bestSec.currentWaitTime });

            setTimeout(() => {
                setIsAnalyzing(false);
                const generatedAlerts = analyzeFlightData(flight, securityZones, lounges, loyaltyTier);

                generatedAlerts.forEach((alert, index) => {
                    setTimeout(() => {
                        setAlerts(prev => [...prev, alert]);
                        Animated.spring(fadeAnims[index], { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }).start();
                    }, index * 200);
                });
            }, 1200);
        }, 500);
    }, [fadeAnims, flightNumber, loyaltyTier]);

    useEffect(() => {
        if (visible && !isAnalyzing && flightNumber) {
            const autoRefresh = setInterval(() => {
                const flight = generateFlightForNumber(flightNumber);
                const securityZones = generateSecurityZones();
                const lounges = generateLounges();

                setMyFlight(flight);
                const bestSec = [...securityZones].sort((a, b) => a.currentWaitTime - b.currentWaitTime)[0];
                setSecurityInfo({ best: bestSec.name, time: bestSec.currentWaitTime });
                setAlerts(analyzeFlightData(flight, securityZones, lounges, loyaltyTier));
            }, 30000);
            return () => clearInterval(autoRefresh);
        }
    }, [visible, isAnalyzing, flightNumber, loyaltyTier]);

    useEffect(() => {
        if (visible && flightNumber) {
            Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 10 }).start();
            runAnalysis();
        } else {
            slideAnim.setValue(SCREEN_HEIGHT);
        }
    }, [visible, flightNumber]);

    const handleClose = () => {
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 300, useNativeDriver: true }).start(() => onClose());
    };

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const renderAlertCard = ({ item, index }: { item: SmartAlert; index: number }) => {
        const config = ALERT_CONFIG[item.type];
        const isCritical = item.priority === 'critical';

        return (
            <Animated.View
                style={[
                    styles.alertCard,
                    isCritical && styles.alertCardCritical,
                    {
                        opacity: fadeAnims[index] || 1,
                        transform: [
                            { scale: isCritical ? pulseAnim : 1 },
                            {
                                translateX: (fadeAnims[index] || new Animated.Value(1)).interpolate({
                                    inputRange: [0, 1], outputRange: [-50, 0],
                                })
                            }
                        ]
                    },
                ]}
            >
                <View style={[styles.alertIconBox, { backgroundColor: config.color }]}>
                    <MaterialCommunityIcons name={config.icon} size={24} color="#fff" />
                </View>

                <View style={styles.alertContent}>
                    <View style={styles.alertTopRow}>
                        <View style={[styles.priorityDot, { backgroundColor: config.color }]} />
                        <Text style={styles.alertType}>{item.type.replace('_', ' ')}</Text>
                    </View>
                    <Text style={styles.alertTitle}>{item.title}</Text>
                    <Text style={styles.alertMessage}>{item.message}</Text>
                </View>

                <View style={styles.alertRight}>
                    <View style={[styles.impactBadge, { backgroundColor: `${config.color}20` }]}>
                        <Text style={[styles.impactText, { color: config.color }]}>{item.impact}</Text>
                    </View>
                    {item.action && (
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: config.color }]} activeOpacity={0.85}>
                            <Text style={styles.actionBtnText}>{item.action}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Animated.View>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
            <View style={styles.overlay}>
                <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerPattern}>
                            {[...Array(4)].map((_, i) => (
                                <View key={i} style={[styles.patternDot, {
                                    left: 20 + i * 100,
                                    top: 10 + (i % 2) * 30,
                                    opacity: 0.1 + i * 0.05,
                                }]} />
                            ))}
                        </View>

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
                                    <Text style={styles.headerSubtitle}>Analyse en temps réel</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.85}>
                                <MaterialCommunityIcons name="close" size={22} color="#1E293B" />
                            </TouchableOpacity>
                        </View>

                        {/* Flight & Time Info */}
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

                    {/* Status */}
                    <View style={styles.statusBar}>
                        <View style={[styles.statusDot, { backgroundColor: isAnalyzing ? '#F59E0B' : '#10B981' }]} />
                        <Text style={styles.statusText}>
                            {isAnalyzing ? 'Scan en cours...' : `${alerts.length} recommandation${alerts.length > 1 ? 's' : ''}`}
                        </Text>
                        {securityInfo && !isAnalyzing && (
                            <View style={styles.securityBadge}>
                                <MaterialCommunityIcons name="shield-check" size={14} color="#10B981" />
                                <Text style={styles.securityText}>{securityInfo.time}min</Text>
                            </View>
                        )}
                    </View>

                    {/* Content */}
                    {isAnalyzing ? (
                        <View style={styles.loadingBox}>
                            <Animated.View style={[styles.loadingCircle, { transform: [{ rotate: spin }] }]}>
                                <View style={styles.loadingInner}>
                                    <MaterialCommunityIcons name="brain" size={32} color="#B22222" />
                                </View>
                            </Animated.View>
                            <Text style={styles.loadingTitle}>Analyse IA</Text>
                            <Text style={styles.loadingDesc}>Scan pour {flightNumber}</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={alerts}
                            renderItem={renderAlertCard}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View style={styles.emptyBox}>
                                    <View style={styles.emptyIcon}>
                                        <MaterialCommunityIcons name="check-decagram" size={48} color="#10B981" />
                                    </View>
                                    <Text style={styles.emptyTitle}>Parfait !</Text>
                                    <Text style={styles.emptyDesc}>Aucune alerte pour {flightNumber}</Text>
                                </View>
                            }
                        />
                    )}

                    {/* Footer */}
                    {!isAnalyzing && (
                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.refreshBtn} onPress={runAnalysis} activeOpacity={0.85}>
                                <MaterialCommunityIcons name="refresh" size={20} color="#B22222" />
                                <Text style={styles.refreshText}>Actualiser</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.continueBtn} onPress={handleClose} activeOpacity={0.9}>
                                <Text style={styles.continueText}>Continuer</Text>
                                <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                            </TouchableOpacity>
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
    header: { backgroundColor: '#B22222', paddingTop: 20, paddingBottom: 16, paddingHorizontal: 20, overflow: 'hidden' },
    headerPattern: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    patternDot: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff' },
    headerMain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    aiIconBox: { width: 52, height: 52, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    aiPulse: { position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#4ADE80', borderWidth: 3, borderColor: '#B22222' },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
    aiBadge: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    aiBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
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
    statusBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E8ECF0' },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
    statusText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#64748B' },
    securityBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    securityText: { fontSize: 13, fontWeight: '700', color: '#10B981' },
    loadingBox: { padding: 50, alignItems: 'center' },
    loadingCircle: { width: 90, height: 90, borderRadius: 45, borderWidth: 4, borderColor: '#E8ECF0', borderTopColor: '#B22222', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    loadingInner: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
    loadingTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
    loadingDesc: { fontSize: 14, fontWeight: '500', color: '#94A3B8', marginTop: 6 },
    listContent: { padding: 16 },
    alertCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
    alertCardCritical: { backgroundColor: '#FEF2F2', borderWidth: 2, borderColor: '#FECACA' },
    alertIconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    alertContent: { flex: 1 },
    alertTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    priorityDot: { width: 8, height: 8, borderRadius: 4 },
    alertType: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
    alertTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
    alertMessage: { fontSize: 12, fontWeight: '500', color: '#64748B', lineHeight: 17 },
    alertRight: { alignItems: 'flex-end', gap: 8 },
    impactBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    impactText: { fontSize: 12, fontWeight: '800' },
    actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    actionBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
    emptyBox: { alignItems: 'center', paddingVertical: 50 },
    emptyIcon: { width: 90, height: 90, borderRadius: 28, backgroundColor: 'rgba(16, 185, 129, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
    emptyDesc: { fontSize: 14, fontWeight: '500', color: '#94A3B8', marginTop: 4 },
    footer: { flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 32, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E8ECF0' },
    refreshBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16, borderWidth: 2, borderColor: '#B22222', backgroundColor: '#fff' },
    refreshText: { fontSize: 15, fontWeight: '700', color: '#B22222' },
    continueBtn: { flex: 1.3, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16, backgroundColor: '#B22222' },
    continueText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
