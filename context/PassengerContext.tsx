import React, { createContext, ReactNode, useContext, useState } from 'react';

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
}

const defaultPassenger: PassengerData = {
    flightNumber: '',
    passengerName: '',
    seatNumber: '',
    loyaltyTier: 'standard',
    hasCheckedBag: false,
    isLoggedIn: false,
};

const PassengerContext = createContext<PassengerContextType | undefined>(undefined);

export function PassengerProvider({ children }: { children: ReactNode }) {
    const [passenger, setPassengerState] = useState<PassengerData>(defaultPassenger);

    const setPassenger = (data: Partial<PassengerData>) => {
        setPassengerState(prev => ({ ...prev, ...data }));
    };

    const logout = () => {
        setPassengerState(defaultPassenger);
    };

    return (
        <PassengerContext.Provider value={{ passenger, setPassenger, logout }}>
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
