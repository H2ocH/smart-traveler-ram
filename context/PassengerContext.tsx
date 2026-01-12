import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

interface RewardPurchase {
    id: string;
    name: string;
    miles: number;
    category: string;
    date: string;
    type: 'reward' | 'transfer';
}

// Historique des voyages
interface JourneyRecord {
    journeyId: string;
    flightNumber: string;
    destination: string;
    destinationCode: string;
    startedAt: string;
    completedAt: string | null;
    stepsCompleted: string[];
}

interface PassengerData {
    // Identifiant unique persistant (ne change jamais)
    passengerId: string;
    flightNumber: string;
    passengerName: string;
    seatNumber: string;
    gate?: string; // NEW: Porte d'embarquement
    depAirport?: string; // NEW: Code aéroport départ (ex: CMN, CDG)
    depAirportName?: string; // NEW: Nom complet aéroport départ
    departureTime?: string; // NEW: Heure de départ (ISO)
    arrivalTime?: string; // NEW: Heure d'arrivée (ISO)
    destination?: string;
    destinationCode?: string;
    loyaltyTier: 'standard' | 'silver' | 'gold' | 'platinum';
    travelClass: 'economy' | 'business' | 'first';
    hasCheckedBag: boolean;
    isLoggedIn: boolean;
    hasCompletedParcours: boolean;
    // Données de fidélité
    totalMilesEarned: number;
    milesUsed: number;
    rewardsHistory: RewardPurchase[];
    // Voyage actuel et historique
    currentJourneyId: string | null;
    journeyHistory: JourneyRecord[];
}

interface PassengerContextType {
    passenger: PassengerData;
    setPassenger: (data: Partial<PassengerData>) => void;
    logout: () => void;
    hydrated: boolean;
    // Gestion des voyages
    startNewJourney: () => string; // Retourne le journeyId
    completeCurrentJourney: (stepsCompleted: string[]) => void;
    getPassengerId: () => string;
}

const defaultPassenger: PassengerData = {
    passengerId: '', // Sera généré au premier lancement
    flightNumber: '',
    passengerName: '',
    seatNumber: '',
    gate: '',
    depAirport: 'CMN', // Default: Mohammed V
    depAirportName: 'Mohammed V',
    departureTime: '',
    arrivalTime: '',
    loyaltyTier: 'standard',
    travelClass: 'economy',
    hasCheckedBag: false,
    isLoggedIn: false,
    hasCompletedParcours: false,
    totalMilesEarned: 0,
    milesUsed: 0,
    rewardsHistory: [],
    currentJourneyId: null,
    journeyHistory: [],
};

const PASSENGER_ID_KEY = 'persistentPassengerId';
const JOURNEY_HISTORY_KEY = 'journeyHistory';

const STORAGE_KEY = 'passengerSession';

const PassengerContext = createContext<PassengerContextType | undefined>(undefined);

export function PassengerProvider({ children }: { children: ReactNode }) {
    const [passenger, setPassengerState] = useState<PassengerData>(defaultPassenger);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                // 1. Charger ou générer l'ID passager persistant
                let persistentId: string = await AsyncStorage.getItem(PASSENGER_ID_KEY) || '';
                if (!persistentId) {
                    persistentId = uuidv4();
                    await AsyncStorage.setItem(PASSENGER_ID_KEY, persistentId);
                    console.log('[PassengerContext] 🆔 Nouveau passengerId généré:', persistentId);
                } else {
                    console.log('[PassengerContext] 🆔 PassengerId existant:', persistentId);
                }

                // 2. Charger l'historique des voyages (persistant)
                let journeyHistory: JourneyRecord[] = [];
                const historyRaw = await AsyncStorage.getItem(JOURNEY_HISTORY_KEY);
                if (historyRaw) {
                    journeyHistory = JSON.parse(historyRaw);
                }

                // 3. Charger la session passager (si connecté)
                const raw = await AsyncStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw) as Partial<PassengerData>;
                    setPassengerState({ 
                        ...defaultPassenger, 
                        ...parsed, 
                        passengerId: persistentId,
                        journeyHistory 
                    });
                } else {
                    setPassengerState({ 
                        ...defaultPassenger, 
                        passengerId: persistentId,
                        journeyHistory 
                    });
                }
            } catch (error) {
                console.error('[PassengerContext] Erreur hydration:', error);
                setPassengerState(defaultPassenger);
            } finally {
                setHydrated(true);
            }
        })();
    }, []);

    const setPassenger = (data: Partial<PassengerData>) => {
        setPassengerState(prev => {
            const next = { ...prev, ...data };
            void (async () => {
                try {
                    if (next.isLoggedIn) {
                        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                    } else {
                        await AsyncStorage.removeItem(STORAGE_KEY);
                    }
                    // Toujours sauvegarder l'historique des voyages
                    await AsyncStorage.setItem(JOURNEY_HISTORY_KEY, JSON.stringify(next.journeyHistory));
                } catch {
                }
            })();
            return next;
        });
    };

    // Démarrer un nouveau voyage (génère un journeyId)
    const startNewJourney = (): string => {
        if (passenger.hasCompletedParcours) {
            console.log('[PassengerContext] ⛔️ Cannot start new journey: parcours already completed. Please logout first.');
            return passenger.currentJourneyId || '';
        }
        const journeyId = uuidv4();
        const newJourney: JourneyRecord = {
            journeyId,
            flightNumber: passenger.flightNumber,
            destination: passenger.destination || '',
            destinationCode: passenger.destinationCode || '',
            startedAt: new Date().toISOString(),
            completedAt: null,
            stepsCompleted: [],
        };
        
        setPassengerState(prev => {
            const next = {
                ...prev,
                currentJourneyId: journeyId,
                journeyHistory: [...prev.journeyHistory, newJourney],
            };
            // Sauvegarder immédiatement
            void AsyncStorage.setItem(JOURNEY_HISTORY_KEY, JSON.stringify(next.journeyHistory));
            if (next.isLoggedIn) {
                void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            }
            return next;
        });
        
        console.log('[PassengerContext] 🚀 Nouveau voyage démarré:', journeyId);
        return journeyId;
    };

    // Terminer le voyage actuel
    const completeCurrentJourney = (stepsCompleted: string[]) => {
        setPassengerState(prev => {
            if (!prev.currentJourneyId) return prev;

            const updatedHistory = prev.journeyHistory.map(journey => {
                if (journey.journeyId === prev.currentJourneyId) {
                    return {
                        ...journey,
                        completedAt: new Date().toISOString(),
                        stepsCompleted,
                    };
                }
                return journey;
            });

            const next = {
                ...prev,
                currentJourneyId: null,
                journeyHistory: updatedHistory,
                hasCompletedParcours: true,
            };

            // Sauvegarder
            void AsyncStorage.setItem(JOURNEY_HISTORY_KEY, JSON.stringify(next.journeyHistory));
            if (next.isLoggedIn) {
                void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            }

            console.log('[PassengerContext] ✅ Voyage terminé:', prev.currentJourneyId);
            return next;
        });
    };

    // Récupérer l'ID passager
    const getPassengerId = (): string => {
        return passenger.passengerId;
    };

    const logout = () => {
        // Conserver l'ID persistant mais réinitialiser l'historique (nouvel utilisateur/billet)
        const { passengerId } = passenger;
        setPassengerState({
            ...defaultPassenger,
            passengerId,
            journeyHistory: [],
        });
        void AsyncStorage.removeItem(STORAGE_KEY);
        void AsyncStorage.removeItem(JOURNEY_HISTORY_KEY);
    };

    return (
        <PassengerContext.Provider value={{ 
            passenger, 
            setPassenger, 
            logout, 
            hydrated,
            startNewJourney,
            completeCurrentJourney,
            getPassengerId,
        }}>
            {children}
        </PassengerContext.Provider>
    );
}

export function usePassenger() {
    const context = useContext(PassengerContext);
    if (!context) {
        throw new Error('usePassenger must be used within a PassengerProvider');
    }
    return context;
}
