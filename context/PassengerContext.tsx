import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface PassengerData {
    flightNumber: string;
    passengerName: string;
    seatNumber: string;
    destination?: string;
    destinationCode?: string;
    loyaltyTier: 'standard' | 'silver' | 'gold' | 'platinum';
    hasCheckedBag: boolean;
    isLoggedIn: boolean;
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
    loyaltyTier: 'standard',
    hasCheckedBag: false,
    isLoggedIn: false,
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
