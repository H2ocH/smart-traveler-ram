import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface RewardPurchase {
    id: string;
    name: string;
    miles: number;
    category: string;
    date: string;
    type: 'reward' | 'transfer';
}

interface PassengerData {
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
    // Données de fidélité
    totalMilesEarned: number;
    milesUsed: number;
    rewardsHistory: RewardPurchase[];
}

interface PassengerContextType {
    passenger: PassengerData;
    setPassenger: (data: Partial<PassengerData>) => void;
    logout: () => void;
    hydrated: boolean;
}

const defaultPassenger: PassengerData = {
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
    totalMilesEarned: 0,
    milesUsed: 0,
    rewardsHistory: [],
};

const STORAGE_KEY = 'passengerSession';

const PassengerContext = createContext<PassengerContextType | undefined>(undefined);

export function PassengerProvider({ children }: { children: ReactNode }) {
    const [passenger, setPassengerState] = useState<PassengerData>(defaultPassenger);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const raw = await AsyncStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw) as Partial<PassengerData>;
                    setPassengerState({ ...defaultPassenger, ...parsed });
                }
            } catch {
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
                } catch {
                }
            })();
            return next;
        });
    };

    const logout = () => {
        setPassengerState(defaultPassenger);
        void AsyncStorage.removeItem(STORAGE_KEY);
    };

    return (
        <PassengerContext.Provider value={{ passenger, setPassenger, logout, hydrated }}>
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
