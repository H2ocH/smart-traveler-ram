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
    getGateZoneId,
    RouteOption
} from '@/data/airportNavigation';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View
} from 'react-native';

interface Props {
    visible: boolean;
    onClose: () => void;
    flightNumber: string;
    loyaltyTier: string;
    destination?: string;
    destinationCode?: string;
}

export default function SmartAssistantModal({ visible, onClose, flightNumber, loyaltyTier, destination, destinationCode }: Props) {
    const [currentTime, setCurrentTime] = useState(getCurrentTime());
    const [myFlight, setMyFlight] = useState<Flight | null>(null);
    const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
    const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
    const [currentNavStep, setCurrentNavStep] = useState(0);
    const [showBaggageScan, setShowBaggageScan] = useState(false);
    const [baggageValidated, setBaggageValidated] = useState(false);
    // isCrowdSimulated removed

    const { advanceStep } = useJourney();

    const isVIP = loyaltyTier === 'gold' || loyaltyTier === 'platinum';

    // Real-time data refresh removed to stabilize route time as requested. 
    // Routes will only update when flightNumber or isVIP changes.

    // Real-time clock
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(getCurrentTime()), 1000);
        return () => clearInterval(interval);
    }, []);

    // Initialization
    useEffect(() => {
        if (visible && flightNumber) {
            const flight = generateFlightForNumber(flightNumber, destination, destinationCode);
            setMyFlight(flight);

            const gateId = getGateZoneId(flight.newGate || flight.gate);
            const routes = calculateMultipleRoutes('entrance', gateId, isVIP); // Removed forceCrowd
            setRouteOptions(routes);
            setSelectedRouteIndex(0);
            setCurrentNavStep(0);
            setShowBaggageScan(false);
            setBaggageValidated(false);
        }
    }, [visible, flightNumber, isVIP, destination, destinationCode]);

    const handleClose = () => {
        onClose();
    };

    const handleArrived = useCallback(() => {
        Vibration.vibrate(100);
        const selectedRoute = routeOptions[selectedRouteIndex];
        if (!selectedRoute) return;

        const navStep = selectedRoute.route.steps[currentNavStep];

        // Check if at baggage step
        if (navStep.zoneId.includes('checkin') && !baggageValidated) {
            setShowBaggageScan(true);
            return;
        }

        if (currentNavStep < selectedRoute.route.steps.length - 1) {
            setCurrentNavStep(prev => prev + 1);
            if (navStep.zoneId.includes('security')) advanceStep();
            if (navStep.zoneId.includes('passport')) advanceStep();
            if (navStep.zoneId.includes('gate')) advanceStep();
        }
    }, [routeOptions, selectedRouteIndex, currentNavStep, advanceStep, baggageValidated]);

    const handleScanBaggage = (isCheckout: boolean = false) => {
        // Simulate QR scan
        const title = isCheckout ? 'Récupération Bagage' : 'Scanner votre bagage';
        const message = isCheckout
            ? 'Scannez le QR code pour valider la récupération de votre bagage.'
            : 'Veuillez scanner le QR code de votre étiquette bagage pour confirmer le dépôt.';

        Alert.alert(
            title,
            message,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Scanner',
                    onPress: () => {
                        onClose();
                        router.push({ pathname: '/scan', params: { mode: isCheckout ? 'checkout' : 'checkin' } });
                    }
                },
                {
                    text: 'Simuler validation',
                    onPress: () => {
                        setBaggageValidated(true);
                        setShowBaggageScan(false);
                        Vibration.vibrate([0, 100, 50, 100]);
                        Alert.alert('Succès', isCheckout ? 'Bagage récupéré !' : 'Bagage enregistré !');

                        if (!isCheckout) {
                            setCurrentNavStep(prev => prev + 1);
                        } else {
                            // End of journey logic if needed
                            onClose();
                        }
                    }
                }
            ]
        );
    };

    const selectedRoute = routeOptions[selectedRouteIndex];
    const currentStep = selectedRoute?.route.steps[currentNavStep];
    const isLastStep = selectedRoute ? currentNavStep === selectedRoute.route.steps.length - 1 : false;
    const isBaggageStep = currentStep?.zoneId.includes('checkin');

    const getCrowdColor = (level: 'low' | 'medium' | 'high' | null | number) => {
        if (typeof level === 'number') {
            if (level > 60) return '#DC2626';
            if (level > 40) return '#F59E0B';
            return '#10B981';
        }
        if (!level) return '#10B981';
        if (level === 'high') return '#DC2626';
        if (level === 'medium') return '#F59E0B';
        return '#10B981';
    };

    const getRouteIcon = (routeId: string): string => {
        switch (routeId) {
            case 'fastest': return 'rocket-launch';
            case 'alternative': return 'leaf';
            case 'scenic': return 'shopping';
            default: return 'map-marker-path';
        }
    };

    // Get target direction based on next step
    const getTargetDirection = (): number => {
        if (!currentStep) return 0;
        switch (currentStep.direction) {
            case 'straight': return 0;
            case 'right': return 90;
            case 'left': return 270;
            case 'up': return 45;
            case 'down': return 135;
            default: return 0;
        }
    };

    return (
        <Modal visible={visible} animationType="slide" statusBarTranslucent>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerMain}>
                        <View style={styles.headerLeft}>
                            <View>
                                <View style={styles.titleRow}>
                                    <Text style={styles.headerTitle}>Guide Aéroport</Text>
                                    <View style={styles.aiBadge}>
                                        <Text style={styles.aiBadgeText}>IA</Text>
                                    </View>
                                </View>
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
                    <View style={styles.routeOptionsHeader}>
                        <MaterialCommunityIcons name="map-marker-path" size={18} color="#B22222" />
                        <Text style={styles.routeOptionsTitle}>Itinéraire</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                                <View style={styles.routeOptionHeader}>
                                    <MaterialCommunityIcons
                                        name={getRouteIcon(option.id) as any}
                                        size={18}
                                        color={selectedRouteIndex === index ? '#fff' : '#64748B'}
                                    />
                                    <Text style={[styles.routeOptionName, selectedRouteIndex === index && styles.routeOptionNameSelected]}>
                                        {option.name}
                                    </Text>
                                </View>
                                <Text style={[styles.routeOptionTime, selectedRouteIndex === index && styles.routeOptionTimeSelected]}>
                                    {option.route.totalTime} min
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Navigation Content */}
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>

                    {/* Compass Card */}


                    {/* Crowd Simulation Toggle REMOVED */}


                    {/* Next Step Card (Replaces Compass) */}
                    {currentStep && (
                        <View style={[styles.compassCard, { height: 'auto', paddingVertical: 24 }]}>
                            <View style={{ alignItems: 'center', marginBottom: 16 }}>
                                <MaterialCommunityIcons name={currentStep.icon as any || 'map-marker'} size={48} color="#B22222" />
                            </View>

                            <Text style={{
                                fontSize: 14,
                                color: '#64748B',
                                textTransform: 'uppercase',
                                letterSpacing: 1,
                                fontWeight: '600',
                                marginBottom: 4
                            }}>
                                {isLastStep ? 'Destination' : 'Prochaine étape'}
                            </Text>

                            <Text style={{
                                fontSize: 24,
                                fontWeight: '800',
                                color: '#1E293B',
                                textAlign: 'center',
                                marginBottom: 20
                            }}>
                                {currentStep.zoneName}
                            </Text>

                            {!isLastStep && (
                                <View style={styles.compassMeta}>
                                    <View style={styles.compassMetaItem}>
                                        <MaterialCommunityIcons name="walk" size={20} color="#64748B" />
                                        <Text style={[styles.compassMetaText, { fontSize: 18 }]}>{currentStep.distance}</Text>
                                    </View>
                                    <View style={styles.compassMetaItem}>
                                        <MaterialCommunityIcons name="clock-outline" size={20} color="#64748B" />
                                        <Text style={[styles.compassMetaText, { fontSize: 18 }]}>~{currentStep.estimatedTime} min</Text>
                                    </View>
                                </View>
                            )}

                            {/* LAST STEP ACTIONS (Checkout / Claim) */}
                            {isLastStep && (
                                <View style={{ width: '100%', marginTop: 10, gap: 10 }}>
                                    <TouchableOpacity
                                        style={{ backgroundColor: '#22C55E', padding: 15, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                                        onPress={() => handleScanBaggage(true)}
                                    >
                                        <MaterialCommunityIcons name="qrcode-scan" size={20} color="white" style={{ marginRight: 8 }} />
                                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Scanner QR (Check-out)</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={{ backgroundColor: '#EF4444', padding: 15, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                                        onPress={() => {
                                            onClose();
                                            router.push('/baggage-lost'); // Assuming route exists or open modal
                                            // Since baggage-lost route is hidden but accessible via router logic mentioned in step 409
                                        }}
                                    >
                                        <MaterialCommunityIcons name="bag-suitcase-off" size={20} color="white" style={{ marginRight: 8 }} />
                                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Réclamer (Perdu/Endommagé)</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}



                    {/* Route Steps Preview */}
                    {selectedRoute && (
                        <View style={{ marginTop: 24, paddingHorizontal: 4, paddingBottom: 20 }}>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 12 }}>
                                Détails du Trajet ({selectedRoute.route.steps.length} étapes)
                            </Text>
                            {selectedRoute.route.steps.map((step, index) => {
                                const isActive = currentNavStep === index;
                                const isDone = currentNavStep > index;
                                return (
                                    <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, opacity: isDone ? 0.6 : 1, backgroundColor: isActive ? '#FEF2F2' : 'transparent', padding: 8, borderRadius: 8 }}>
                                        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: isActive ? '#B22222' : (isDone ? '#10B981' : '#CBD5E1'), marginRight: 12, borderWidth: isActive ? 2 : 0, borderColor: '#FCA5A5' }} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 14, fontWeight: isActive ? '700' : '500', color: isActive ? '#991B1B' : '#334155' }}>{step.zoneName}</Text>
                                            {step.crowdWarning === 'high' && <Text style={{ fontSize: 10, color: '#DC2626', fontWeight: 'bold' }}>Foule intense</Text>}
                                        </View>
                                        <Text style={{ fontSize: 12, color: '#64748B' }}>{step.estimatedTime} min</Text>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* Baggage Scan Prompt */}
                    {showBaggageScan && (
                        <View style={styles.baggagePrompt}>
                            <View style={styles.baggagePromptIcon}>
                                <MaterialCommunityIcons name="qrcode-scan" size={40} color="#B22222" />
                            </View>
                            <Text style={styles.baggagePromptTitle}>Déposez vos bagages</Text>
                            <Text style={styles.baggagePromptText}>
                                Scannez le QR code de votre étiquette bagage pour valider le dépôt
                            </Text>
                            <TouchableOpacity style={styles.baggageScanBtn} onPress={() => handleScanBaggage(false)}>
                                <MaterialCommunityIcons name="qrcode" size={22} color="#fff" />
                                <Text style={styles.baggageScanBtnText}>Scanner le QR code</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Current Step Card */}
                    {currentStep && !showBaggageScan && (
                        <View style={styles.currentStepCard}>
                            {/* Crowd Warning */}
                            {currentStep.crowdWarning && (
                                <View style={[styles.crowdWarning, { backgroundColor: getCrowdColor(currentStep.crowdWarning) + '20' }]}>
                                    <MaterialCommunityIcons
                                        name="account-group"
                                        size={20}
                                        color={getCrowdColor(currentStep.crowdWarning)}
                                    />
                                    <Text style={[styles.crowdText, { color: getCrowdColor(currentStep.crowdWarning) }]}>
                                        {currentStep.crowdWarning === 'high' && 'Zone très fréquentée'}
                                        {currentStep.crowdWarning === 'medium' && 'Affluence moyenne'}
                                    </Text>
                                </View>
                            )}

                            {/* Wait Time */}
                            {currentStep.estimatedTime > 3 && (
                                <View style={styles.waitInfo}>
                                    <MaterialCommunityIcons name="clock-fast" size={18} color="#B22222" />
                                    <Text style={styles.waitText}>
                                        Attente: <Text style={styles.waitBold}>{currentStep.estimatedTime} min</Text>
                                    </Text>
                                </View>
                            )}

                            {/* Baggage step indicator */}
                            {isBaggageStep && !baggageValidated && (
                                <View style={styles.baggageHint}>
                                    <MaterialCommunityIcons name="bag-suitcase" size={18} color="#0369A1" />
                                    <Text style={styles.baggageHintText}>
                                        Vous devrez scanner votre bagage à cette étape
                                    </Text>
                                </View>
                            )}

                            {baggageValidated && isBaggageStep && (
                                <View style={styles.baggageValidated}>
                                    <MaterialCommunityIcons name="check-circle" size={18} color="#10B981" />
                                    <Text style={styles.baggageValidatedText}>Bagage enregistré</Text>
                                </View>
                            )}

                            {/* Action Button */}
                            <TouchableOpacity
                                style={[styles.actionButton, isLastStep && styles.actionButtonFinal]}
                                onPress={handleArrived}
                                activeOpacity={0.9}
                            >
                                <Text style={styles.actionButtonText}>
                                    {isLastStep ? "Je suis à ma porte !" : isBaggageStep && !baggageValidated ? "Déposer mon bagage" : "J'y suis arrivé"}
                                </Text>
                                <MaterialCommunityIcons
                                    name={isLastStep ? "airplane-takeoff" : isBaggageStep ? "bag-suitcase" : "check-circle"}
                                    size={22}
                                    color="#fff"
                                />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Steps Overview */}
                    {selectedRoute && (
                        <View style={styles.stepsOverview}>
                            <View style={styles.overviewHeader}>
                                <MaterialCommunityIcons name="map-legend" size={18} color="#1E293B" />
                                <Text style={styles.overviewTitle}>Étapes ({currentNavStep + 1}/{selectedRoute.route.steps.length})</Text>
                            </View>
                            {selectedRoute.route.steps.slice(currentNavStep).map((step, index) => (
                                <View
                                    key={step.zoneId + index}
                                    style={[styles.stepItem, index === 0 && styles.stepCurrent]}
                                >
                                    <View style={[styles.stepDot, { backgroundColor: index === 0 ? '#B22222' : '#CBD5E1' }]}>
                                        {step.crowdWarning === 'high' && (
                                            <MaterialCommunityIcons name="alert" size={12} color="#fff" />
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

                    {/* Progress Summary */}
                    {selectedRoute && (
                        <View style={styles.progressCard}>
                            <View style={styles.progressRow}>
                                <View style={styles.progressItem}>
                                    <MaterialCommunityIcons name="map-marker-distance" size={20} color="#64748B" />
                                    <Text style={styles.progressLabel}>Distance</Text>
                                    <Text style={styles.progressValue}>{selectedRoute.route.totalDistance}</Text>
                                </View>
                                <View style={styles.progressDivider} />
                                <View style={styles.progressItem}>
                                    <MaterialCommunityIcons name="clock-outline" size={20} color="#64748B" />
                                    <Text style={styles.progressLabel}>Temps</Text>
                                    <Text style={styles.progressValue}>{selectedRoute.route.totalTime} min</Text>
                                </View>
                                <View style={styles.progressDivider} />
                                <View style={styles.progressItem}>
                                    <MaterialCommunityIcons name="account-group" size={20} color="#64748B" />
                                    <Text style={styles.progressLabel}>Foule</Text>
                                    <Text style={[styles.progressValue, { color: getCrowdColor(selectedRoute.route.crowdScore) }]}>
                                        {selectedRoute.route.crowdScore > 60 ? 'Élevée' : selectedRoute.route.crowdScore > 40 ? 'Moyenne' : 'Faible'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                </ScrollView>

                {/* VIP Badge */}
                {
                    isVIP && (
                        <View style={styles.vipFooter}>
                            <MaterialCommunityIcons name="crown" size={16} color="#D4AF37" />
                            <Text style={styles.vipText}>Accès prioritaire activé</Text>
                        </View>
                    )
                }
            </View >
        </Modal >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        backgroundColor: '#B22222',
        paddingTop: 56,
        paddingBottom: 16,
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
    aiIconBox: {
        width: 52,
        height: 52,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    aiPulse: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#4ADE80',
        borderWidth: 3,
        borderColor: '#B22222',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#fff',
    },
    aiBadge: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    aiBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '500',
        marginTop: 2,
    },
    closeBtn: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    timeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
    },
    timeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4ADE80',
    },
    timeText: {
        fontSize: 18,
        fontWeight: '900',
        color: '#fff',
        fontVariant: ['tabular-nums'],
    },
    flightBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
    },
    flightCode: {
        fontSize: 16,
        fontWeight: '800',
        color: '#fff',
    },
    flightDest: {
        fontSize: 14,
        fontWeight: '700',
        color: '#D4AF37',
    },
    countdownBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0,0,0,0.15)',
        borderRadius: 14,
        padding: 14,
    },
    gateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    gateText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#fff',
    },
    timeRemaining: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    countdownValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#D4AF37',
    },
    routeOptionsContainer: {
        backgroundColor: '#fff',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E8ECF0',
    },
    routeOptionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    routeOptionsTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1E293B',
    },
    routeOptionCard: {
        backgroundColor: '#F1F5F9',
        borderRadius: 14,
        padding: 14,
        marginRight: 10,
        minWidth: 130,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    routeOptionCardSelected: {
        backgroundColor: '#B22222',
        borderColor: '#B22222',
    },
    routeOptionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    routeOptionName: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
    },
    routeOptionNameSelected: {
        color: '#fff',
    },
    routeOptionTime: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
    },
    routeOptionTimeSelected: {
        color: '#fff',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 32,
    },
    compassCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#B22222',
        shadowOpacity: 0.1,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
    },
    compassInfo: {
        alignItems: 'center',
        marginTop: 20,
    },
    compassDirection: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 4,
    },
    compassInstruction: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 12,
    },
    compassDistance: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    compassDistanceText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
    },
    baggagePrompt: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#B22222',
    },
    baggagePromptIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(178, 34, 34, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    baggagePromptTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
        marginBottom: 8,
    },
    baggagePromptText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    baggageScanBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#B22222',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        width: '100%',
    },
    baggageScanBtnText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#fff',
    },
    currentStepCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
    },
    crowdWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    crowdText: {
        fontSize: 13,
        fontWeight: '700',
        flex: 1,
    },
    waitInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    waitText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#B22222',
    },
    waitBold: {
        fontWeight: '800',
    },
    baggageHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#E0F2FE',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    baggageHintText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0369A1',
        flex: 1,
    },
    baggageValidated: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#DCFCE7',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
    },
    baggageValidatedText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#166534',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: '#B22222',
        paddingVertical: 16,
        borderRadius: 14,
    },
    actionButtonFinal: {
        backgroundColor: '#166534',
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#fff',
    },
    stepsOverview: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 16,
        marginBottom: 16,
    },
    overviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 14,
    },
    overviewTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1E293B',
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        opacity: 0.6,
    },
    stepCurrent: {
        opacity: 1,
    },
    stepDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    stepContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    stepName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    stepNameCurrent: {
        fontWeight: '800',
        color: '#1E293B',
    },
    stepTime: {
        fontSize: 12,
        fontWeight: '600',
        color: '#94A3B8',
    },
    progressCard: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 16,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressItem: {
        flex: 1,
        alignItems: 'center',
    },
    progressDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#E8ECF0',
    },
    progressLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#94A3B8',
        marginTop: 6,
    },
    progressValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1E293B',
        marginTop: 2,
    },
    vipFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#FEF3C7',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#FDE68A',
    },
    vipText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#92400E',
    },
    compassMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        marginTop: 12,
    },
    compassMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    compassMetaText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
});
