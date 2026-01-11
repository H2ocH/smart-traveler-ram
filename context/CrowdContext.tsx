import { usePassenger } from '@/context/PassengerContext';
import {
    AIRPORT_STEPS,
    TimeRecord,
    createUserRecord,
    generateHistoricalData,
    getAverageTime
} from '@/data/crowdData';
import {
    FlightTrafficData,
    fetchRealFlightData,
    getCachedFlightData
} from '@/data/flightTrafficService';
import React, { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';
import { Socket, io } from 'socket.io-client';

// ============================================
// CONFIGURATION SERVEUR
// Modifiez SERVER_URL avec l'IP de votre PC
// Pour trouver votre IP: ipconfig (Windows)
// ============================================
const SERVER_URL = 'http://172.20.10.7:3001'; // <-- REMPLACEZ PAR VOTRE IP

// Interface pour les infos passager (optionnel)
interface PassengerInfo {
    travelerId?: string;
    flightId?: string;
    seat?: string;
    gate?: string;
    depAirport?: string;
    depAirportName?: string;
    arrAirport?: string;
    arrAirportName?: string;
    passengerName?: string;
    departureTime?: string;
    arrivalTime?: string;
    sessionId?: string;
}

interface CrowdContextType {
    // Dataset
    dataset: TimeRecord[];

    // Active users (real-time from server)
    activeUsers: number;

    // Connection status
    isConnected: boolean;

    // Flight Traffic Data (AviationStack API)
    flightTraffic: FlightTrafficData | null;
    isLoadingTraffic: boolean;
    refreshFlightTraffic: () => Promise<void>;

    // Actions
    submitTime: (from: string, to: string, durationSeconds: number, passengerInfo?: PassengerInfo, stepStatus?: 'in_progress' | 'completed') => void;
    simulateUsers: (count: number) => void;
    getEstimatedTime: (from: string, to: string) => number;
    getAdjustedEstimatedTime: (from: string, to: string) => number;
    getCrowdLevel: (from: string, to: string) => 'low' | 'medium' | 'high';
    getRemainingTimes: (stepIndex: number, now: number) => { remainingCurrent: number; remainingTotal: number };

    // Stats
    getTotalRecords: () => number;
    getRealRecords: () => number;
    getSteps: () => typeof AIRPORT_STEPS;
    getActiveInProgress: () => number;
    // Guide State (Persistent)
    guideSessionId: string | null;
    currentStep: number;
    stepStartTime: number | null;
    isGuideActive: boolean;
    setGuideState: (step: number, startTime: number | null, sessionId?: string) => void;
    startGuideSession: () => void;
    endGuideSession: () => void;
}

const CrowdContext = createContext<CrowdContextType | undefined>(undefined);

interface CrowdProviderProps {
    children: ReactNode;
}

export function CrowdProvider({ children }: CrowdProviderProps) {
    const [dataset, setDataset] = useState<TimeRecord[]>([]);
    const [activeUsers, setActiveUsers] = useState<number>(0);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const socketRef = useRef<Socket | null>(null);

    // Flight Traffic State (AviationStack API)
    const [flightTraffic, setFlightTraffic] = useState<FlightTrafficData | null>(getCachedFlightData());
    const [isLoadingTraffic, setIsLoadingTraffic] = useState<boolean>(false);
    const trafficFetchedRef = useRef<boolean>(false);

    const { passenger } = usePassenger();

    // Guide State (Persistent)
    const [guideSessionId, setGuideSessionId] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [stepStartTime, setStepStartTime] = useState<number | null>(null);
    const [isGuideActive, setIsGuideActive] = useState(false);

    // Auto-Reset on Logout
    useEffect(() => {
        if (!passenger.isLoggedIn && guideSessionId) {
            console.log('[CrowdContext] User logged out, resetting guide session.');
            setGuideSessionId(null);
            setCurrentStep(0);
            setStepStartTime(null);
            setIsGuideActive(false);
        }
    }, [passenger.isLoggedIn]);

    // Fetch Flight Traffic Data ONCE on mount
    useEffect(() => {
        if (!trafficFetchedRef.current) {
            trafficFetchedRef.current = true;
            loadFlightTraffic();
        }
    }, []);

    const loadFlightTraffic = async () => {
        if (isLoadingTraffic) return;
        
        setIsLoadingTraffic(true);
        try {
            const data = await fetchRealFlightData();
            setFlightTraffic(data);
            console.log('[CrowdContext] ✈️ Flight traffic loaded:', data.totalFlights, 'flights,', data.trafficLabel);
        } catch (error) {
            console.error('[CrowdContext] Failed to load flight traffic:', error);
        } finally {
            setIsLoadingTraffic(false);
        }
    };

    const refreshFlightTraffic = async () => {
        await loadFlightTraffic();
    };

    useEffect(() => {
        console.log('[CrowdContext] Connecting to server:', SERVER_URL);

        // Connexion WebSocket
        const socket = io(SERVER_URL, {
            transports: ['websocket'], // Force WebSocket only for better React Native stability
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
            autoConnect: true,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[CrowdContext] ✅ Connected to server!');
            setIsConnected(true);

            // Si le dataset est vide côté serveur, envoyer les données historiques
            const historical = generateHistoricalData();
            fetch(`${SERVER_URL}/api/init`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dataset: historical })
            }).catch(err => console.log('[CrowdContext] Init error:', err));
        });

        socket.on('disconnect', () => {
            console.log('[CrowdContext] ❌ Disconnected from server');
            setIsConnected(false);
        });

        socket.on('connect_error', (err) => {
            console.log('[CrowdContext] Connection error:', err.message);
            setIsConnected(false);
        });

        // Recevoir les mises à jour du dataset
        socket.on('dataset-updated', (data: { dataset: TimeRecord[], activeUsers: number }) => {
            console.log('[CrowdContext] Dataset updated:', data.dataset.length, 'records');
            setDataset(data.dataset);
            setActiveUsers(data.activeUsers);
        });

        // Recevoir le nombre d'utilisateurs actifs
        socket.on('active-users', (count: number) => {
            setActiveUsers(count);
        });

        // Recevoir un nouveau record (pour animation/notification)
        socket.on('new-record', (record: TimeRecord) => {
            console.log('[CrowdContext] 🆕 New record received:', record.stepFrom, '->', record.stepTo);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Soumettre un nouveau temps via WebSocket
    const submitTime = (from: string, to: string, durationSeconds: number, passengerInfo?: PassengerInfo, stepStatus: 'in_progress' | 'completed' = 'completed') => {
        // Créer le record de base
        const newRecord = createUserRecord(from, to, durationSeconds);

        // Ajouter les infos passager depuis le contexte si connecté
        const autoPassengerInfo = passenger.isLoggedIn ? {
            travelerId: passenger.passengerName || `user_${Date.now()}`,
            flightId: passenger.flightNumber,
            seat: passenger.seatNumber,
            gate: passenger.gate,
            depAirport: passenger.depAirport,
            depAirportName: passenger.depAirportName,
            arrAirport: passenger.destinationCode,
            arrAirportName: passenger.destination,
            passengerName: passenger.passengerName,
            departureTime: passenger.departureTime,
            arrivalTime: passenger.arrivalTime,
        } : {};

        // Fusionner: infos auto + infos manuelles (priorité aux manuelles)
        const enrichedRecord = {
            ...newRecord,
            ...autoPassengerInfo,
            ...(passengerInfo || {}),
            stepStatus // 'in_progress' ou 'completed'
        };

        console.log('[CrowdContext] 📤 submitTime called:', { from, to, durationSeconds, passengerInfo });
        console.log('[CrowdContext] 📋 Auto passenger info:', autoPassengerInfo);

        if (socketRef.current?.connected) {
            console.log('[CrowdContext] Socket connected, emitting event...');
            socketRef.current.emit('submit-record', enrichedRecord);
        } else {
            console.log('[CrowdContext] ⚠️ Socket disconnected, trying HTTP fallback to:', `${SERVER_URL}/api/record`);
            // Fallback HTTP si WebSocket déconnecté
            fetch(`${SERVER_URL}/api/record`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(enrichedRecord)
            })
                .then(res => res.json())
                .then(data => console.log('[CrowdContext] HTTP fallback success:', data))
                .catch(err => console.error('[CrowdContext] Submit error:', err));
        }
    };

    // Simuler des utilisateurs (Injection Batch)
    const simulateUsers = (count: number) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('inject-records', count);
            console.log('[CrowdContext] Injecting simulated records:', count);
        }
    };

    // Obtenir le temps estimé pour une transition (base)
    const getEstimatedTime = (from: string, to: string): number => {
        return getAverageTime(dataset, from, to);
    };

    // Obtenir le temps estimé AJUSTÉ avec le multiplicateur de trafic
    const getAdjustedEstimatedTime = (from: string, to: string): number => {
        const baseTime = getAverageTime(dataset, from, to);
        const multiplier = flightTraffic?.waitTimeMultiplier || 1.0;
        return Math.round(baseTime * multiplier);
    };

    // Temps restant pour l'étape courante et total (en secondes) - AJUSTÉ avec trafic
    const getRemainingTimes = (stepIndex: number, now: number): { remainingCurrent: number; remainingTotal: number } => {
        const steps = AIRPORT_STEPS;
        const curIndex = Math.min(Math.max(stepIndex, 0), steps.length - 1);
        const cur = steps[curIndex];
        const next = steps[curIndex + 1];
        const multiplier = flightTraffic?.waitTimeMultiplier || 1.0;

        let remainingCurrent = 0;
        if (next) {
            const base = getEstimatedTime(cur.id, next.id);
            const adjusted = Math.round(base * multiplier);
            const elapsed = stepStartTime ? Math.max(0, Math.floor((now - stepStartTime) / 1000)) : 0;
            remainingCurrent = Math.max(0, adjusted - elapsed);
        }

        let remainingTotal = remainingCurrent;
        for (let i = curIndex + 1; i < steps.length - 1; i++) {
            const from = steps[i];
            const to = steps[i + 1];
            const baseTime = getEstimatedTime(from.id, to.id) || 0;
            remainingTotal += Math.round(baseTime * multiplier);
        }

        return { remainingCurrent, remainingTotal };
    };

    // Obtenir le niveau de foule basé sur le nombre d'actifs (in_progress)
    const getCrowdLevel = (_from: string, _to: string): 'low' | 'medium' | 'high' => {
        const active = getActiveInProgress();
        if (active < 10) return 'low';
        if (active < 25) return 'medium';
        return 'high';
    };

    // Stats
    const getTotalRecords = () => dataset.length;
    const getRealRecords = () => dataset.filter(r => !r.isSimulated).length;
    const getSteps = () => AIRPORT_STEPS;
    
    // Compter les passagers actuellement en IN_PROGRESS (actifs dans l'aéroport)
    const getActiveInProgress = () => {
        // Simplifié: compter tous les records en in_progress (même si doublons) pour refléter la simulation
        return (dataset as any[]).filter(r => (r as any).stepStatus === 'in_progress').length;
    };

    // Guide State Logic
    const setGuideState = (step: number, startTime: number | null, sessionId?: string) => {
        setCurrentStep(step);
        if (startTime !== undefined) setStepStartTime(startTime);
        if (sessionId) setGuideSessionId(sessionId);
    };

    const startGuideSession = () => {
        const newSessionId = `session_${Date.now()}`;
        setGuideSessionId(newSessionId);
        setCurrentStep(0);
        setStepStartTime(null); // NE PAS démarrer le timer automatiquement
        setIsGuideActive(true);
    };

    const endGuideSession = () => {
        setIsGuideActive(false);
        setGuideSessionId(null);
        setCurrentStep(0);
        setStepStartTime(null);
    };

    return (
        <CrowdContext.Provider value={{
            dataset,
            activeUsers,
            isConnected,
            // Flight Traffic
            flightTraffic,
            isLoadingTraffic,
            refreshFlightTraffic,
            // Actions
            submitTime,
            simulateUsers,
            getEstimatedTime,
            getAdjustedEstimatedTime,
            getCrowdLevel,
            getTotalRecords,
            getRealRecords,
            getSteps,
            getActiveInProgress,
            getRemainingTimes,
            // Guide State
            guideSessionId,
            currentStep,
            stepStartTime,
            isGuideActive,
            setGuideState,
            startGuideSession,
            endGuideSession
        }}>
            {children}
        </CrowdContext.Provider>
    );
}

export function useCrowd(): CrowdContextType {
    const context = useContext(CrowdContext);
    if (!context) {
        throw new Error('useCrowd must be used within a CrowdProvider');
    }
    return context;
}
