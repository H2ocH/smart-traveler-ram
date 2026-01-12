// =====================================
// CROWDSOURCED TIME DATA
// Dataset of real and simulated transit times
// =====================================

export interface TimeRecord {
    id: string;
    stepFrom: string;
    stepTo: string;
    durationSeconds: number;
    timestamp: Date;
    isSimulated: boolean;
    dayType: 'crowded' | 'normal' | 'empty';
    // Champs optionnels injectés par le serveur (realtime)
    passengerId?: string; // ID unique persistant du passager
    journeyId?: string | null; // ID du voyage actuel
    travelerId?: string;
    stepStatus?: string;
    depAirport?: string;
    arrAirport?: string;
}

export interface StepDefinition {
    id: string;
    name: string;
    icon: string;
    order: number;
}

// Les étapes du parcours aéroport (correspondant au Smart Guide existant)
// Les étapes du parcours aéroport (Mise à jour pour inclure scan obligatoire)
export const AIRPORT_STEPS: StepDefinition[] = [
    { id: 'entrance', name: 'Entrée Terminal', icon: 'door', order: 0 },
    { id: 'checkin', name: 'Comptoir d\'Enregistrement', icon: 'bag-suitcase', order: 1 }, // MANDATORY SCAN (Check-in)
    { id: 'security', name: 'Contrôle Sécurité', icon: 'shield-check', order: 2 },
    { id: 'passport', name: 'Contrôle Passeports', icon: 'passport', order: 3 },
    { id: 'duty_free', name: 'Zone Duty Free', icon: 'shopping', order: 4 },
    { id: 'gate', name: 'Porte d\'Embarquement', icon: 'airplane-takeoff', order: 5 },
    { id: 'arrival', name: 'Arrivée Destination', icon: 'airplane-landing', order: 6 },
    { id: 'baggage_claim', name: 'Zone de Récupération', icon: 'bag-suitcase', order: 7 }, // MANDATORY SCAN (Check-out)
    { id: 'exit', name: 'Sortie Aéroport', icon: 'exit-to-app', order: 8 },
];

// Génère un ID unique
const generateId = (): string => `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Temps de base en secondes pour chaque transition (conditions normales)
const BASE_TIMES: Record<string, number> = {
    'entrance->checkin': 180,      // 3 min
    'checkin->security': 600,      // 10 min (inclut attente check-in)
    'security->passport': 480,     // 8 min (inclut contrôle sécurité)
    'passport->duty_free': 120,    // 2 min
    'duty_free->gate': 300,        // 5 min
};

// Génère le dataset historique simulé
export function generateHistoricalData(): TimeRecord[] {
    const records: TimeRecord[] = [];
    const now = new Date();

    // Simuler 30 jours d'historique
    for (let dayOffset = 30; dayOffset >= 1; dayOffset--) {
        const date = new Date(now);
        date.setDate(date.getDate() - dayOffset);

        // Déterminer le type de jour (Lundi/Vendredi = crowded, Dimanche = empty, reste = normal)
        const dayOfWeek = date.getDay();
        let dayType: TimeRecord['dayType'] = 'normal';
        let multiplier = 1.0;

        if (dayOfWeek === 1 || dayOfWeek === 5) {
            // Lundi et Vendredi = jours de pointe
            dayType = 'crowded';
            multiplier = 1.8 + Math.random() * 0.4; // +80% à +120%
        } else if (dayOfWeek === 0) {
            // Dimanche = calme
            dayType = 'empty';
            multiplier = 0.6 + Math.random() * 0.2; // -40% à -20%
        } else {
            // Autres jours = normal avec légère variation
            multiplier = 0.9 + Math.random() * 0.3; // -10% à +20%
        }

        // Simuler plusieurs "utilisateurs" par jour (3-8)
        const usersPerDay = 3 + Math.floor(Math.random() * 6);

        for (let user = 0; user < usersPerDay; user++) {
            // Heure aléatoire dans la journée
            const hour = 5 + Math.floor(Math.random() * 18); // 5h à 23h
            date.setHours(hour, Math.floor(Math.random() * 60));

            // Bonus multiplicateur pour heures de pointe
            let hourMultiplier = 1.0;
            if ((hour >= 6 && hour <= 9) || (hour >= 17 && hour <= 20)) {
                hourMultiplier = 1.3; // +30% aux heures de pointe
            }

            // Générer un record pour chaque transition
            Object.entries(BASE_TIMES).forEach(([transition, baseTime]) => {
                const [from, to] = transition.split('->');
                const variance = 0.8 + Math.random() * 0.4; // ±20% de variance individuelle
                const duration = Math.round(baseTime * multiplier * hourMultiplier * variance);

                records.push({
                    id: generateId(),
                    stepFrom: from,
                    stepTo: to,
                    durationSeconds: duration,
                    timestamp: new Date(date),
                    isSimulated: true,
                    dayType: dayType,
                });
            });
        }
    }

    return records;
}

// Calcule la moyenne des temps pour une transition donnée
export function getAverageTime(records: TimeRecord[], from: string, to: string): number {
    const relevantRecords = records.filter(r => r.stepFrom === from && r.stepTo === to);
    if (relevantRecords.length === 0) {
        return BASE_TIMES[`${from}->${to}`] || 300; // Fallback 5 min
    }
    const sum = relevantRecords.reduce((acc, r) => acc + r.durationSeconds, 0);
    return Math.round(sum / relevantRecords.length);
}

// Calcule le niveau de foule actuel basé sur les records récents
export function getCurrentCrowdLevel(records: TimeRecord[], from: string, to: string): 'low' | 'medium' | 'high' {
    const baseTime = BASE_TIMES[`${from}->${to}`] || 300;
    const avgTime = getAverageTime(records, from, to);

    const ratio = avgTime / baseTime;

    if (ratio < 1.2) return 'low';
    if (ratio < 1.6) return 'medium';
    return 'high';
}

// Formatte les secondes en temps lisible
export function formatDuration(seconds: number, hideSeconds: boolean = false): string {
    if (seconds < 60 && !hideSeconds) {
        return `${seconds}s`;
    }
    const hours = Math.floor(seconds / 3600);
    const remAfterHours = seconds % 3600;
    const minutes = Math.floor(remAfterHours / 60);
    const remainingSeconds = remAfterHours % 60;

    if (hours > 0) {
        const parts: string[] = [];
        parts.push(`${hours}h`);
        if (minutes > 0 || (!hideSeconds && remainingSeconds > 0)) {
            parts.push(`${minutes} min`);
        }
        if (!hideSeconds && remainingSeconds > 0) {
            parts.push(`${remainingSeconds}s`);
        }
        return parts.join(' ');
    }

    if (hideSeconds || remainingSeconds === 0) {
        return `${minutes} min`;
    }
    return `${minutes} min ${remainingSeconds}s`;
}

// Crée un nouveau record utilisateur
export function createUserRecord(from: string, to: string, durationSeconds: number): TimeRecord {
    return {
        id: generateId(),
        stepFrom: from,
        stepTo: to,
        durationSeconds,
        timestamp: new Date(),
        isSimulated: false,
        dayType: 'normal', // Sera calculé côté serveur si besoin
    };
}
