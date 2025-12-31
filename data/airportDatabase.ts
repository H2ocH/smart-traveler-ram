// =====================================
// SIMULATION AÉROPORT MOHAMMED V (CMN)
// Base de données temps réel dynamique
// =====================================

// Seed basé sur l'heure pour avoir des données cohérentes mais variées
const seededRandom = (seed: number): number => {
    const x = Math.sin(seed * 9999) * 10000;
    return x - Math.floor(x);
};

export interface Flight {
    id: string;
    flightNumber: string;
    airline: 'RAM' | 'Air France' | 'Emirates' | 'Turkish' | 'Lufthansa';
    destination: string;
    destinationCode: string;
    scheduledDeparture: Date;
    gate: string;
    terminal: string;
    status: 'scheduled' | 'boarding' | 'gate-change' | 'delayed' | 'final-call' | 'departed';
    delay?: number;
    newGate?: string;
    boardingTime: Date;
    gateCloseTime: Date;
}

export interface SecurityZone {
    id: string;
    name: string;
    terminal: string;
    currentWaitTime: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    capacity: number;
    currentLoad: number;
}

export interface Lounge {
    id: string;
    name: string;
    terminal: string;
    currentOccupancy: number;
    maxCapacity: number;
    hasPromo: boolean;
    promoDiscount?: number;
    amenities: string[];
}

export interface PassengerContext {
    flightNumber: string;
    destination: string;
    gate: string;
    hasLoungeAccess: boolean;
    loyaltyTier: 'standard' | 'silver' | 'gold' | 'platinum';
    checkedBags: number;
}

// Contexte passager FIXE pour la session (simule un vrai passager)
let cachedPassenger: PassengerContext | null = null;

export const getPassengerContext = (): PassengerContext => {
    if (!cachedPassenger) {
        // Créé une seule fois par session
        cachedPassenger = {
            flightNumber: 'AT205',
            destination: 'Paris CDG',
            gate: 'B12',
            hasLoungeAccess: true,
            loyaltyTier: 'gold',
            checkedBags: 1,
        };
    }
    return cachedPassenger;
};

export const getCurrentTime = (): Date => new Date();

// Génère les vols basés sur l'heure ACTUELLE (cohérent dans le temps)
export const generateFlights = (): Flight[] => {
    const now = getCurrentTime();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const second = now.getSeconds();

    // Seed basé sur l'heure actuelle (change toutes les 10 secondes pour variation subtile)
    const timeSeed = Math.floor(now.getTime() / 10000);

    // Calcul des heures de départ basées sur l'heure réelle
    // Le vol AT205 part TOUJOURS dans ~1h15 depuis le chargement initial
    const baseOffset = 75; // minutes

    const flights: Flight[] = [
        {
            id: 'fl-1',
            flightNumber: 'AT205',
            airline: 'RAM',
            destination: 'Paris Charles de Gaulle',
            destinationCode: 'CDG',
            scheduledDeparture: new Date(now.getTime() + baseOffset * 60000),
            gate: 'B12',
            terminal: 'T1',
            status: 'scheduled',
            boardingTime: new Date(now.getTime() + (baseOffset - 40) * 60000),
            gateCloseTime: new Date(now.getTime() + (baseOffset - 10) * 60000),
        },
        {
            id: 'fl-2',
            flightNumber: 'AT450',
            airline: 'RAM',
            destination: 'Madrid Barajas',
            destinationCode: 'MAD',
            scheduledDeparture: new Date(now.getTime() + 35 * 60000),
            gate: 'A5',
            terminal: 'T1',
            status: 'boarding',
            boardingTime: new Date(now.getTime() - 15 * 60000),
            gateCloseTime: new Date(now.getTime() + 20 * 60000),
        },
        {
            id: 'fl-3',
            flightNumber: 'EK752',
            airline: 'Emirates',
            destination: 'Dubai International',
            destinationCode: 'DXB',
            scheduledDeparture: new Date(now.getTime() + 140 * 60000),
            gate: 'C3',
            terminal: 'T2',
            status: 'scheduled',
            boardingTime: new Date(now.getTime() + 95 * 60000),
            gateCloseTime: new Date(now.getTime() + 125 * 60000),
        },
        {
            id: 'fl-4',
            flightNumber: 'AT680',
            airline: 'RAM',
            destination: 'New York JFK',
            destinationCode: 'JFK',
            scheduledDeparture: new Date(now.getTime() + 95 * 60000),
            gate: 'D8',
            terminal: 'T1',
            status: 'delayed',
            delay: 20 + Math.floor(seededRandom(timeSeed + 4) * 15), // Délai variable 20-35 min
            boardingTime: new Date(now.getTime() + 55 * 60000),
            gateCloseTime: new Date(now.getTime() + 85 * 60000),
        },
        {
            id: 'fl-5',
            flightNumber: 'TK619',
            airline: 'Turkish',
            destination: 'Istanbul',
            destinationCode: 'IST',
            scheduledDeparture: new Date(now.getTime() + 55 * 60000),
            gate: 'B7',
            newGate: 'C12',
            terminal: 'T1',
            status: 'gate-change',
            boardingTime: new Date(now.getTime() + 15 * 60000),
            gateCloseTime: new Date(now.getTime() + 40 * 60000),
        },
        {
            id: 'fl-6',
            flightNumber: 'AF1875',
            airline: 'Air France',
            destination: 'Paris Orly',
            destinationCode: 'ORY',
            scheduledDeparture: new Date(now.getTime() + 25 * 60000),
            gate: 'A2',
            terminal: 'T1',
            status: 'final-call',
            boardingTime: new Date(now.getTime() - 20 * 60000),
            gateCloseTime: new Date(now.getTime() + 10 * 60000),
        },
    ];

    // Évolution dynamique du statut du vol principal (AT205) basée sur le temps
    const mainFlight = flights[0];
    const timeToBoarding = (mainFlight.boardingTime.getTime() - now.getTime()) / 60000;
    const timeToGateClose = (mainFlight.gateCloseTime.getTime() - now.getTime()) / 60000;

    if (timeToGateClose <= 15 && timeToGateClose > 0) {
        mainFlight.status = 'final-call';
    } else if (timeToBoarding <= 0) {
        mainFlight.status = 'boarding';
    }

    // Possibilité de changement de porte basé sur le temps (change toutes les ~5 min)
    const gateChangeSeed = Math.floor(now.getTime() / 300000); // Toutes les 5 min
    if (seededRandom(gateChangeSeed) > 0.7 && mainFlight.status === 'scheduled') {
        mainFlight.status = 'gate-change';
        mainFlight.newGate = ['C8', 'C15', 'D4'][Math.floor(seededRandom(gateChangeSeed + 1) * 3)];
    }

    return flights;
};

// Génère l'état des zones de sécurité - ÉVOLUE EN TEMPS RÉEL
export const generateSecurityZones = (): SecurityZone[] => {
    const now = getCurrentTime();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const second = now.getSeconds();

    // Facteur rush (5-8h, 11-14h, 17-20h = rush)
    const isRush = (hour >= 5 && hour <= 8) || (hour >= 11 && hour <= 14) || (hour >= 17 && hour <= 20);
    const rushMultiplier = isRush ? 1.6 : 1.0;

    // Variation basée sur les minutes (simule flux réel)
    const minuteWave = Math.sin((minute + second / 60) * 0.2) * 0.3 + 1;

    // Seed pour cohérence dans la même minute
    const minuteSeed = Math.floor(now.getTime() / 60000);

    const zones: SecurityZone[] = [
        {
            id: 'sec-a',
            name: 'Sécurité A',
            terminal: 'T1',
            currentWaitTime: Math.round((12 + seededRandom(minuteSeed) * 8) * rushMultiplier * minuteWave),
            trend: seededRandom(minuteSeed + 10) > 0.5 ? 'increasing' : 'stable',
            capacity: 200,
            currentLoad: Math.round((55 + seededRandom(minuteSeed + 20) * 25) * rushMultiplier),
        },
        {
            id: 'sec-b',
            name: 'Sécurité B',
            terminal: 'T1',
            currentWaitTime: Math.round((6 + seededRandom(minuteSeed + 1) * 6) * minuteWave),
            trend: 'decreasing',
            capacity: 150,
            currentLoad: Math.round(35 + seededRandom(minuteSeed + 21) * 20),
        },
        {
            id: 'sec-c',
            name: 'Sécurité C',
            terminal: 'T2',
            currentWaitTime: Math.round((8 + seededRandom(minuteSeed + 2) * 10) * rushMultiplier),
            trend: seededRandom(minuteSeed + 12) > 0.6 ? 'increasing' : 'stable',
            capacity: 180,
            currentLoad: Math.round((40 + seededRandom(minuteSeed + 22) * 30) * rushMultiplier),
        },
        {
            id: 'sec-priority',
            name: 'Accès Prioritaire',
            terminal: 'T1',
            currentWaitTime: Math.round(2 + seededRandom(minuteSeed + 3) * 4),
            trend: 'stable',
            capacity: 50,
            currentLoad: Math.round(15 + seededRandom(minuteSeed + 23) * 15),
        },
    ];

    return zones;
};

// Génère l'état des lounges - ÉVOLUE EN TEMPS RÉEL
export const generateLounges = (): Lounge[] => {
    const now = getCurrentTime();
    const hour = now.getHours();
    const minuteSeed = Math.floor(now.getTime() / 60000);

    // Lounges plus vides le matin tôt et tard le soir
    const occupancyFactor = (hour >= 6 && hour <= 10) || (hour >= 20) ? 0.65 : 1.0;

    // Promos changent toutes les 30 min
    const promoSeed = Math.floor(now.getTime() / 1800000);

    return [
        {
            id: 'lounge-atlas',
            name: 'Lounge Atlas',
            terminal: 'T1',
            currentOccupancy: Math.round((30 + seededRandom(minuteSeed) * 35) * occupancyFactor),
            maxCapacity: 80,
            hasPromo: seededRandom(promoSeed) > 0.4,
            promoDiscount: [15, 20, 25, 30][Math.floor(seededRandom(promoSeed + 1) * 4)],
            amenities: ['WiFi Premium', 'Buffet Marocain', 'Douches', 'Presse internationale'],
        },
        {
            id: 'lounge-premiere',
            name: 'Salon Première',
            terminal: 'T1',
            currentOccupancy: Math.round((20 + seededRandom(minuteSeed + 1) * 25) * occupancyFactor),
            maxCapacity: 40,
            hasPromo: seededRandom(promoSeed + 2) > 0.65,
            promoDiscount: 20,
            amenities: ['WiFi Premium', 'Champagne', 'Spa', 'Service conciergerie'],
        },
        {
            id: 'lounge-zenith',
            name: 'Espace Zénith',
            terminal: 'T2',
            currentOccupancy: Math.round(35 + seededRandom(minuteSeed + 2) * 40),
            maxCapacity: 60,
            hasPromo: seededRandom(promoSeed + 3) > 0.5,
            promoDiscount: [10, 15][Math.floor(seededRandom(promoSeed + 4) * 2)],
            amenities: ['WiFi', 'Snacks', 'Café & Thé', 'Vue piste'],
        },
    ];
};

// Formate le temps restant
export const formatTimeRemaining = (targetTime: Date): string => {
    const now = getCurrentTime();
    const diff = targetTime.getTime() - now.getTime();

    if (diff <= 0) return 'Maintenant';

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (hours > 0) {
        return `${hours}h ${minutes}min`;
    }
    if (minutes > 0) {
        return `${minutes}min ${seconds}s`;
    }
    return `${seconds}s`;
};

// Formate l'heure
export const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

// Formate l'heure avec secondes
export const formatTimeWithSeconds = (date: Date): string => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// Obtient des conditions météo (change lentement)
export const getWeatherConditions = (): { condition: string; impact: boolean; message: string } => {
    const now = getCurrentTime();
    const hourSeed = Math.floor(now.getTime() / 3600000); // Change toutes les heures
    const rand = seededRandom(hourSeed);

    if (rand > 0.85) {
        return { condition: 'storm', impact: true, message: 'Orages signalés - Possibles retards' };
    } else if (rand > 0.75) {
        return { condition: 'fog', impact: true, message: 'Brouillard matinal - Visibilité réduite' };
    } else if (rand > 0.6) {
        return { condition: 'rain', impact: false, message: 'Pluie légère - Pas d\'impact prévu' };
    }
    return { condition: 'clear', impact: false, message: 'Conditions optimales' };
};
