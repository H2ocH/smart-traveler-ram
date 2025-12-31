import {
    Flight,
    formatTimeRemaining,
    formatTimeWithSeconds,
    generateFlights,
    generateLounges,
    generateSecurityZones,
    getCurrentTime,
    getPassengerContext,
    getWeatherConditions,
    Lounge,
    SecurityZone,
} from '@/data/airportDatabase';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
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
    bgColor: string;
}> = {
    CROWD: { icon: 'account-group', color: '#D84315', bgColor: 'rgba(216, 67, 21, 0.08)' },
    SHOPPING: { icon: 'shopping', color: '#2E7D32', bgColor: 'rgba(46, 125, 50, 0.08)' },
    GATE: { icon: 'gate-arrow-right', color: '#1565C0', bgColor: 'rgba(21, 101, 192, 0.08)' },
    BOARDING: { icon: 'airplane-takeoff', color: '#00695C', bgColor: 'rgba(0, 105, 92, 0.08)' },
    DELAY: { icon: 'clock-alert-outline', color: '#E65100', bgColor: 'rgba(230, 81, 0, 0.08)' },
    PRIORITY: { icon: 'star-circle', color: '#6A1B9A', bgColor: 'rgba(106, 27, 154, 0.08)' },
    FINAL_CALL: { icon: 'alert-circle', color: '#C62828', bgColor: 'rgba(198, 40, 40, 0.08)' },
    WEATHER: { icon: 'weather-cloudy-alert', color: '#37474F', bgColor: 'rgba(55, 71, 79, 0.08)' },
};

// Moteur IA d'analyse
const analyzeAirportData = (
    flights: Flight[],
    securityZones: SecurityZone[],
    lounges: Lounge[]
): SmartAlert[] => {
    const alerts: SmartAlert[] = [];
    const now = getCurrentTime();
    const passenger = getPassengerContext();

    const myFlight = flights.find(f => f.flightNumber === passenger.flightNumber);
    if (!myFlight) return alerts;

    const timeToBoarding = (myFlight.boardingTime.getTime() - now.getTime()) / 60000;
    const timeToGateClose = (myFlight.gateCloseTime.getTime() - now.getTime()) / 60000;
    const timeToDeparture = (myFlight.scheduledDeparture.getTime() - now.getTime()) / 60000;

    // 1. FINAL CALL
    if (myFlight.status === 'final-call' || (timeToGateClose <= 15 && timeToGateClose > 0)) {
        alerts.push({
            id: `final-${now.getTime()}`,
            type: 'FINAL_CALL',
            title: `DERNIER APPEL - ${myFlight.flightNumber}`,
            message: `Fermeture porte ${myFlight.newGate || myFlight.gate} dans ${formatTimeRemaining(myFlight.gateCloseTime)} ! Présentez-vous immédiatement.`,
            impact: formatTimeRemaining(myFlight.gateCloseTime),
            priority: 'critical',
            action: 'Courir à la porte',
            timestamp: now,
        });
    }
    // 2. BOARDING
    else if (myFlight.status === 'boarding' || (timeToBoarding <= 5 && timeToBoarding > -30)) {
        alerts.push({
            id: `boarding-${now.getTime()}`,
            type: 'BOARDING',
            title: `Embarquement ouvert - ${myFlight.flightNumber}`,
            message: `Vol vers ${myFlight.destination}. Porte ${myFlight.newGate || myFlight.gate}, Terminal ${myFlight.terminal}. Fermeture: ${formatTimeRemaining(myFlight.gateCloseTime)}.`,
            impact: `Porte ${myFlight.newGate || myFlight.gate}`,
            priority: 'high',
            action: 'Embarquer',
            timestamp: now,
        });
    }
    // 3. GATE CHANGE
    else if (myFlight.status === 'gate-change' && myFlight.newGate) {
        alerts.push({
            id: `gate-${now.getTime()}`,
            type: 'GATE',
            title: `Changement - Vol ${myFlight.flightNumber}`,
            message: `Nouvelle porte: ${myFlight.gate} → ${myFlight.newGate}. Environ 8 min de marche. Embarquement dans ${formatTimeRemaining(myFlight.boardingTime)}.`,
            impact: `Nouvelle: ${myFlight.newGate}`,
            priority: 'high',
            action: 'Itinéraire',
            timestamp: new Date(now.getTime() - 2 * 60000),
        });
    }
    // 4. DELAY
    if (myFlight.status === 'delayed' && myFlight.delay) {
        alerts.push({
            id: `delay-${now.getTime()}`,
            type: 'DELAY',
            title: `Retard ${myFlight.flightNumber}`,
            message: `Retard de ${myFlight.delay} min. Nouveau départ estimé: ${new Date(myFlight.scheduledDeparture.getTime() + myFlight.delay * 60000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.`,
            impact: `+${myFlight.delay} min`,
            priority: 'medium',
            timestamp: new Date(now.getTime() - 5 * 60000),
        });
    }

    // 5. SÉCURITÉ
    const sortedSecurity = [...securityZones].sort((a, b) => a.currentWaitTime - b.currentWaitTime);
    const bestZone = sortedSecurity[0];
    const passengerZone = securityZones.find(z => z.name === 'Sécurité A') || securityZones[0];

    if (passengerZone.currentWaitTime - bestZone.currentWaitTime >= 8 && passengerZone.id !== bestZone.id) {
        alerts.push({
            id: `crowd-${now.getTime()}`,
            type: 'CROWD',
            title: `File optimisée disponible`,
            message: `${passengerZone.name}: ${passengerZone.currentWaitTime} min. Préférez ${bestZone.name}: seulement ${bestZone.currentWaitTime} min d'attente !`,
            impact: `-${passengerZone.currentWaitTime - bestZone.currentWaitTime} min`,
            priority: passengerZone.currentWaitTime > 20 ? 'high' : 'medium',
            action: `Aller à ${bestZone.name.split(' ')[1]}`,
            timestamp: new Date(now.getTime() - 1 * 60000),
        });
    }

    // 6. ACCÈS PRIORITAIRE
    if (passenger.loyaltyTier === 'gold' || passenger.loyaltyTier === 'platinum') {
        const priorityZone = securityZones.find(z => z.name.includes('Prioritaire'));
        if (priorityZone && priorityZone.currentWaitTime < bestZone.currentWaitTime) {
            alerts.push({
                id: `priority-${now.getTime()}`,
                type: 'PRIORITY',
                title: `Avantage ${passenger.loyaltyTier.toUpperCase()}`,
                message: `Accès Prioritaire ouvert ! Seulement ${priorityZone.currentWaitTime} min vs ${bestZone.currentWaitTime} min ailleurs.`,
                impact: `${priorityZone.currentWaitTime} min`,
                priority: 'medium',
                action: 'Accès VIP',
                timestamp: new Date(now.getTime() - 3 * 60000),
            });
        }
    }

    // 7. LOUNGE
    if (timeToBoarding > 50) {
        const bestLounge = lounges
            .filter(l => l.hasPromo && l.currentOccupancy < 65)
            .sort((a, b) => (b.promoDiscount || 0) - (a.promoDiscount || 0))[0];

        if (bestLounge && bestLounge.promoDiscount) {
            alerts.push({
                id: `lounge-${now.getTime()}`,
                type: 'SHOPPING',
                title: `${bestLounge.name} - Offre spéciale`,
                message: `${bestLounge.currentOccupancy}% d'occupation. -${bestLounge.promoDiscount}% aujourd'hui ! ${bestLounge.amenities.slice(0, 2).join(', ')}.`,
                impact: `-${bestLounge.promoDiscount}%`,
                priority: 'low',
                action: 'Réserver',
                timestamp: new Date(now.getTime() - 10 * 60000),
            });
        }
    }

    // 8. MÉTÉO
    const weather = getWeatherConditions();
    if (weather.impact) {
        alerts.push({
            id: `weather-${now.getTime()}`,
            type: 'WEATHER',
            title: `Alerte météo`,
            message: weather.message + '. Surveillez le statut de votre vol.',
            impact: 'Info',
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
}

export default function SmartAssistantModal({ visible, onClose }: Props) {
    const [currentTime, setCurrentTime] = useState(getCurrentTime());
    const [isAnalyzing, setIsAnalyzing] = useState(true);
    const [alerts, setAlerts] = useState<SmartAlert[]>([]);
    const [myFlight, setMyFlight] = useState<Flight | null>(null);
    const [securityInfo, setSecurityInfo] = useState<{ best: string; time: number } | null>(null);
    const [fadeAnims] = useState(() => [0, 1, 2, 3, 4].map(() => new Animated.Value(0)));
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(getCurrentTime()), 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.02, duration: 700, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    const runAnalysis = useCallback(() => {
        setIsAnalyzing(true);
        setAlerts([]);
        fadeAnims.forEach(anim => anim.setValue(0));

        setTimeout(() => {
            const flights = generateFlights();
            const securityZones = generateSecurityZones();
            const lounges = generateLounges();
            const passenger = getPassengerContext();

            setMyFlight(flights.find(f => f.flightNumber === passenger.flightNumber) || flights[0]);
            const bestSec = [...securityZones].sort((a, b) => a.currentWaitTime - b.currentWaitTime)[0];
            setSecurityInfo({ best: bestSec.name, time: bestSec.currentWaitTime });

            setTimeout(() => {
                setIsAnalyzing(false);
                const generatedAlerts = analyzeAirportData(flights, securityZones, lounges);

                generatedAlerts.forEach((alert, index) => {
                    setTimeout(() => {
                        setAlerts(prev => [...prev, alert]);
                        Animated.spring(fadeAnims[index], { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }).start();
                    }, index * 300);
                });
            }, 1000);
        }, 600);
    }, [fadeAnims]);

    useEffect(() => {
        if (visible && !isAnalyzing) {
            const autoRefresh = setInterval(() => {
                const flights = generateFlights();
                const securityZones = generateSecurityZones();
                const lounges = generateLounges();
                const passenger = getPassengerContext();

                setMyFlight(flights.find(f => f.flightNumber === passenger.flightNumber) || flights[0]);
                const bestSec = [...securityZones].sort((a, b) => a.currentWaitTime - b.currentWaitTime)[0];
                setSecurityInfo({ best: bestSec.name, time: bestSec.currentWaitTime });
                setAlerts(analyzeAirportData(flights, securityZones, lounges));
            }, 30000);
            return () => clearInterval(autoRefresh);
        }
    }, [visible, isAnalyzing]);

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 9 }).start();
            runAnalysis();
        } else {
            slideAnim.setValue(SCREEN_HEIGHT);
        }
    }, [visible]);

    const handleClose = () => {
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 280, useNativeDriver: true }).start(() => onClose());
    };

    const formatTimeAgo = (date: Date): string => {
        const diff = Math.floor((currentTime.getTime() - date.getTime()) / 60000);
        if (diff < 1) return "À l'instant";
        return `${diff} min`;
    };

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
                                translateY: (fadeAnims[index] || new Animated.Value(1)).interpolate({
                                    inputRange: [0, 1], outputRange: [25, 0],
                                })
                            }
                        ]
                    },
                ]}
            >
                <View style={[styles.alertIconContainer, { backgroundColor: config.bgColor }]}>
                    <MaterialCommunityIcons name={config.icon} size={22} color={config.color} />
                </View>

                <View style={styles.alertContent}>
                    <View style={styles.alertHeader}>
                        <Text style={[styles.alertType, { color: config.color }]}>{item.type.replace('_', ' ')}</Text>
                        <Text style={styles.alertTimestamp}>{formatTimeAgo(item.timestamp)}</Text>
                    </View>

                    <Text style={styles.alertTitle}>{item.title}</Text>
                    <Text style={styles.alertMessage}>{item.message}</Text>

                    <View style={styles.alertFooter}>
                        <View style={[styles.impactBadge, { backgroundColor: config.bgColor }]}>
                            <Text style={[styles.impactText, { color: config.color }]}>{item.impact}</Text>
                        </View>
                        {item.action && (
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: config.color }]}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.actionText}>{item.action}</Text>
                                <MaterialCommunityIcons name="arrow-right" size={12} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Animated.View>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
            <View style={styles.overlay}>
                <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>

                    {/* Premium Header */}
                    <View style={styles.header}>
                        <View style={styles.headerMain}>
                            <View style={styles.headerLeft}>
                                <View style={styles.headerIconBox}>
                                    <MaterialCommunityIcons name="robot-happy" size={26} color="#fff" />
                                </View>
                                <View>
                                    <Text style={styles.headerTitle}>Smart Assistant</Text>
                                    <Text style={styles.headerSubtitle}>Analyse IA en direct</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.8}>
                                <MaterialCommunityIcons name="close" size={20} color="#1E293B" />
                            </TouchableOpacity>
                        </View>

                        {/* Clock & Flight Info */}
                        <View style={styles.infoRow}>
                            <View style={styles.clockBox}>
                                <MaterialCommunityIcons name="clock-outline" size={16} color="#B22222" />
                                <Text style={styles.clockText}>{formatTimeWithSeconds(currentTime)}</Text>
                            </View>

                            {myFlight && (
                                <View style={styles.flightBox}>
                                    <Text style={styles.flightCode}>{myFlight.flightNumber}</Text>
                                    <Text style={styles.flightDest}>→ {myFlight.destinationCode}</Text>
                                </View>
                            )}
                        </View>

                        {/* Countdown */}
                        {myFlight && (
                            <View style={styles.countdownBox}>
                                <MaterialCommunityIcons name="airplane-takeoff" size={18} color="#D4AF37" />
                                <Text style={styles.countdownLabel}>Embarquement dans</Text>
                                <Text style={styles.countdownValue}>{formatTimeRemaining(myFlight.boardingTime)}</Text>
                            </View>
                        )}
                    </View>

                    {/* Status Bar */}
                    <View style={styles.statusBar}>
                        <View style={[styles.statusDot, { backgroundColor: isAnalyzing ? '#F59E0B' : '#10B981' }]} />
                        <Text style={styles.statusText}>
                            {isAnalyzing ? 'Analyse en cours...' : `${alerts.length} alerte${alerts.length > 1 ? 's' : ''} active${alerts.length > 1 ? 's' : ''}`}
                        </Text>
                        {!isAnalyzing && securityInfo && (
                            <View style={styles.statusBadge}>
                                <Text style={styles.statusBadgeText}>{securityInfo.best}: {securityInfo.time}min</Text>
                            </View>
                        )}
                    </View>

                    {/* Content */}
                    {isAnalyzing ? (
                        <View style={styles.loadingContainer}>
                            <View style={styles.loadingSpinner}>
                                <ActivityIndicator size="large" color="#B22222" />
                            </View>
                            <Text style={styles.loadingTitle}>Analyse en cours</Text>
                            <Text style={styles.loadingSubtitle}>Scan sécurité • Lounges • Statuts vols</Text>
                            <View style={styles.loadingDots}>
                                <View style={[styles.dot, styles.dotActive]} />
                                <View style={styles.dot} />
                                <View style={styles.dot} />
                            </View>
                        </View>
                    ) : (
                        <FlatList
                            data={alerts}
                            renderItem={renderAlertCard}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <View style={styles.emptyIconBox}>
                                        <MaterialCommunityIcons name="check-decagram" size={42} color="#10B981" />
                                    </View>
                                    <Text style={styles.emptyTitle}>Tout est parfait !</Text>
                                    <Text style={styles.emptySubtitle}>Aucune alerte, bon voyage ✈️</Text>
                                </View>
                            }
                        />
                    )}

                    {/* Premium Footer */}
                    {!isAnalyzing && (
                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.refreshBtn} onPress={runAnalysis} activeOpacity={0.85}>
                                <MaterialCommunityIcons name="refresh" size={18} color="#B22222" />
                                <Text style={styles.refreshBtnText}>Actualiser</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.continueBtn} onPress={handleClose} activeOpacity={0.9}>
                                <Text style={styles.continueBtnText}>Continuer</Text>
                                <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'flex-end'
    },
    modalContainer: {
        backgroundColor: '#F2F4F6',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: SCREEN_HEIGHT * 0.9,
        overflow: 'hidden',
    },
    header: {
        backgroundColor: '#B22222',
        paddingTop: 20,
        paddingBottom: 18,
        paddingHorizontal: 20,
    },
    headerMain: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    headerIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.3,
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.75)',
        fontWeight: '500',
        marginTop: 1,
    },
    closeButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    clockBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
    },
    clockText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
        fontVariant: ['tabular-nums'],
    },
    flightBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
    },
    flightCode: {
        fontSize: 15,
        fontWeight: '800',
        color: '#fff',
    },
    flightDest: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
    },
    countdownBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(212, 175, 55, 0.15)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.3)',
    },
    countdownLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.9)',
    },
    countdownValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#D4AF37',
        marginLeft: 'auto',
    },
    statusBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E8ECF0',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    statusBadge: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#10B981',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    loadingSpinner: {
        marginBottom: 20,
    },
    loadingTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    loadingSubtitle: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
        marginTop: 6,
    },
    loadingDots: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 20,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E2E8F0',
    },
    dotActive: {
        backgroundColor: '#B22222',
    },
    listContent: {
        padding: 16,
        paddingBottom: 10,
    },
    alertCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        gap: 14,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    alertCardCritical: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: 'rgba(198, 40, 40, 0.15)',
    },
    alertIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    alertContent: {
        flex: 1,
    },
    alertHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    alertType: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    alertTimestamp: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '500',
    },
    alertTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
        letterSpacing: -0.2,
    },
    alertMessage: {
        fontSize: 12,
        color: '#64748B',
        lineHeight: 18,
        marginBottom: 12,
        fontWeight: '500',
    },
    alertFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    impactBadge: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    impactText: {
        fontSize: 11,
        fontWeight: '800',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 10,
    },
    actionText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyIconBox: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
        marginTop: 4,
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        padding: 20,
        paddingBottom: 28,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E8ECF0',
    },
    refreshBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#B22222',
        backgroundColor: '#FFFFFF',
    },
    refreshBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#B22222',
    },
    continueBtn: {
        flex: 1.3,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 14,
        backgroundColor: '#B22222',
        shadowColor: '#B22222',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    continueBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
});
