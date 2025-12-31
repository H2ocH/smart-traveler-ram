// Système de navigation intelligente de l'aéroport
// Simule les zones, capteurs de foule et calcule les chemins optimaux

export interface AirportZone {
    id: string;
    name: string;
    type: 'checkin' | 'security' | 'passport' | 'gate' | 'lounge' | 'shop' | 'corridor' | 'escalator';
    location: { x: number; y: number }; // Position sur la carte
    crowdLevel: number; // 0-100 (densité de foule)
    waitTime: number; // Minutes d'attente estimées
    isOpen: boolean;
    connections: string[]; // IDs des zones connectées
    icon: string;
    floor: number;
}

export interface NavigationStep {
    zoneId: string;
    zoneName: string;
    instruction: string;
    direction: 'straight' | 'left' | 'right' | 'up' | 'down' | 'arrive';
    distance: string; // ex: "50m"
    estimatedTime: number; // minutes
    crowdWarning: 'low' | 'medium' | 'high' | null;
    alternativeRoute: string | null;
    icon: string;
}

export interface OptimalRoute {
    steps: NavigationStep[];
    totalTime: number;
    totalDistance: string;
    crowdScore: number; // 0-100, plus bas = moins de foule
    alternativeAvailable: boolean;
}

// Simulation des zones de l'aéroport Mohammed V
const AIRPORT_ZONES: AirportZone[] = [
    // Terminal 1 - Départ
    { id: 'entrance', name: 'Entrée Terminal', type: 'corridor', location: { x: 0, y: 0 }, crowdLevel: 30, waitTime: 0, isOpen: true, connections: ['checkin_a', 'checkin_b'], icon: 'door', floor: 0 },
    { id: 'checkin_a', name: 'Comptoirs A1-A10', type: 'checkin', location: { x: 1, y: 0 }, crowdLevel: 45, waitTime: 8, isOpen: true, connections: ['entrance', 'checkin_b', 'security_main'], icon: 'desktop-classic', floor: 0 },
    { id: 'checkin_b', name: 'Comptoirs B1-B10', type: 'checkin', location: { x: 1, y: 1 }, crowdLevel: 25, waitTime: 3, isOpen: true, connections: ['entrance', 'checkin_a', 'security_priority'], icon: 'desktop-classic', floor: 0 },
    { id: 'security_main', name: 'Sécurité Principale', type: 'security', location: { x: 2, y: 0 }, crowdLevel: 60, waitTime: 15, isOpen: true, connections: ['checkin_a', 'passport_zone'], icon: 'shield-check', floor: 0 },
    { id: 'security_priority', name: 'Sécurité Prioritaire', type: 'security', location: { x: 2, y: 1 }, crowdLevel: 20, waitTime: 3, isOpen: true, connections: ['checkin_b', 'passport_zone'], icon: 'shield-star', floor: 0 },
    { id: 'passport_zone', name: 'Contrôle Passeports', type: 'passport', location: { x: 3, y: 0 }, crowdLevel: 40, waitTime: 5, isOpen: true, connections: ['security_main', 'security_priority', 'duty_free', 'corridor_gates'], icon: 'passport', floor: 0 },
    { id: 'duty_free', name: 'Duty Free', type: 'shop', location: { x: 4, y: 0 }, crowdLevel: 50, waitTime: 0, isOpen: true, connections: ['passport_zone', 'corridor_gates', 'lounge_zenith'], icon: 'shopping', floor: 0 },
    { id: 'lounge_zenith', name: 'Salon Zénith', type: 'lounge', location: { x: 4, y: 1 }, crowdLevel: 25, waitTime: 0, isOpen: true, connections: ['duty_free', 'corridor_gates'], icon: 'sofa-single', floor: 0 },
    { id: 'corridor_gates', name: 'Couloir des Portes', type: 'corridor', location: { x: 5, y: 0 }, crowdLevel: 35, waitTime: 0, isOpen: true, connections: ['duty_free', 'lounge_zenith', 'gate_a1', 'gate_a2', 'gate_b1', 'escalator_up'], icon: 'walk', floor: 0 },
    { id: 'escalator_up', name: 'Escalator Niveau 1', type: 'escalator', location: { x: 5, y: 1 }, crowdLevel: 15, waitTime: 1, isOpen: true, connections: ['corridor_gates', 'corridor_upper'], icon: 'escalator-up', floor: 0 },
    { id: 'corridor_upper', name: 'Couloir Supérieur', type: 'corridor', location: { x: 5, y: 1 }, crowdLevel: 20, waitTime: 0, isOpen: true, connections: ['escalator_up', 'gate_c1', 'gate_c2'], icon: 'walk', floor: 1 },
    // Portes d'embarquement
    { id: 'gate_a1', name: 'Porte A1', type: 'gate', location: { x: 6, y: 0 }, crowdLevel: 55, waitTime: 0, isOpen: true, connections: ['corridor_gates'], icon: 'gate', floor: 0 },
    { id: 'gate_a2', name: 'Porte A2', type: 'gate', location: { x: 7, y: 0 }, crowdLevel: 30, waitTime: 0, isOpen: true, connections: ['corridor_gates'], icon: 'gate', floor: 0 },
    { id: 'gate_b1', name: 'Porte B1', type: 'gate', location: { x: 6, y: 1 }, crowdLevel: 45, waitTime: 0, isOpen: true, connections: ['corridor_gates'], icon: 'gate', floor: 0 },
    { id: 'gate_c1', name: 'Porte C1', type: 'gate', location: { x: 6, y: 2 }, crowdLevel: 25, waitTime: 0, isOpen: true, connections: ['corridor_upper'], icon: 'gate', floor: 1 },
    { id: 'gate_c2', name: 'Porte C2', type: 'gate', location: { x: 7, y: 2 }, crowdLevel: 15, waitTime: 0, isOpen: true, connections: ['corridor_upper'], icon: 'gate', floor: 1 },
];

// Simuler les données de capteurs en temps réel avec variations aléatoires
export function getRealtimeZoneData(): AirportZone[] {
    const now = new Date();
    const hour = now.getHours();
    const seconds = now.getSeconds();

    // Facteur de variation basé sur l'heure (heures de pointe)
    const peakFactor = (hour >= 6 && hour <= 9) || (hour >= 17 && hour <= 21) ? 1.4 : 1;

    return AIRPORT_ZONES.map(zone => {
        // Variation aléatoire qui change chaque seconde (simulation capteurs temps réel)
        const randomFactor = Math.random() * 25 - 12; // Entre -12 et +13
        const timeVariation = Math.sin(seconds * 0.15 + zone.id.charCodeAt(0)) * 18;

        let newCrowdLevel = Math.min(95, Math.max(8,
            zone.crowdLevel * peakFactor + timeVariation + randomFactor
        ));

        // Recalculer le temps d'attente basé sur la foule
        let newWaitTime = zone.waitTime;
        if (zone.type === 'security' || zone.type === 'passport' || zone.type === 'checkin') {
            newWaitTime = Math.round(newCrowdLevel / 4);
        }

        return {
            ...zone,
            crowdLevel: Math.round(newCrowdLevel),
            waitTime: newWaitTime,
        };
    });
}

// Trouver une zone par son ID
export function findZone(zones: AirportZone[], zoneId: string): AirportZone | undefined {
    return zones.find(z => z.id === zoneId);
}

// Calculer le score d'un chemin (plus bas = meilleur)
function calculatePathScore(zones: AirportZone[], path: string[]): number {
    let totalCrowd = 0;
    let totalWait = 0;

    for (const zoneId of path) {
        const zone = findZone(zones, zoneId);
        if (zone) {
            totalCrowd += zone.crowdLevel;
            totalWait += zone.waitTime;
        }
    }

    // Score = combinaison foule et temps d'attente
    return totalCrowd + (totalWait * 10);
}

// Algorithme de recherche du chemin optimal (Dijkstra simplifié avec poids de foule)
export function findOptimalPath(
    zones: AirportZone[],
    startId: string,
    endId: string,
    isVIP: boolean = false,
    avoidZones: string[] = []
): string[] {
    const visited = new Set<string>();
    const distances: Record<string, number> = {};
    const previous: Record<string, string | null> = {};

    // Initialiser
    for (const zone of zones) {
        distances[zone.id] = Infinity;
        previous[zone.id] = null;
    }
    distances[startId] = 0;

    const queue = [startId];

    while (queue.length > 0) {
        // Trouver le noeud avec la plus petite distance
        queue.sort((a, b) => distances[a] - distances[b]);
        const current = queue.shift()!;

        if (current === endId) break;
        if (visited.has(current)) continue;

        visited.add(current);
        const currentZone = findZone(zones, current);
        if (!currentZone) continue;

        for (const neighborId of currentZone.connections) {
            if (visited.has(neighborId)) continue;
            if (avoidZones.includes(neighborId)) continue; // Éviter certaines zones

            const neighbor = findZone(zones, neighborId);
            if (!neighbor || !neighbor.isOpen) continue;

            // Calculer le coût vers ce voisin
            let cost = 1; // Base
            cost += neighbor.crowdLevel / 10; // Pénalité foule
            cost += neighbor.waitTime; // Temps d'attente

            // Les VIP peuvent utiliser les files prioritaires
            if (isVIP && neighbor.type === 'security' && neighbor.id.includes('priority')) {
                cost *= 0.3; // Réduction significative
            }

            const newDistance = distances[current] + cost;
            if (newDistance < distances[neighborId]) {
                distances[neighborId] = newDistance;
                previous[neighborId] = current;
                if (!queue.includes(neighborId)) {
                    queue.push(neighborId);
                }
            }
        }
    }

    // Reconstruire le chemin
    const path: string[] = [];
    let current: string | null = endId;
    while (current) {
        path.unshift(current);
        current = previous[current];
    }

    return path[0] === startId ? path : [];
}

// Générer les instructions de navigation
export function generateNavigationSteps(zones: AirportZone[], path: string[]): NavigationStep[] {
    const steps: NavigationStep[] = [];

    for (let i = 0; i < path.length; i++) {
        const zone = findZone(zones, path[i]);
        if (!zone) continue;

        const isLast = i === path.length - 1;
        const nextZone = i < path.length - 1 ? findZone(zones, path[i + 1]) : null;

        // Déterminer la direction
        let direction: NavigationStep['direction'] = 'straight';
        if (isLast) {
            direction = 'arrive';
        } else if (nextZone) {
            if (nextZone.floor > zone.floor) direction = 'up';
            else if (nextZone.floor < zone.floor) direction = 'down';
            else if (nextZone.location.y > zone.location.y) direction = 'right';
            else if (nextZone.location.y < zone.location.y) direction = 'left';
        }

        // Génerer l'instruction
        let instruction = '';
        if (isLast) {
            instruction = `Vous êtes arrivé à ${zone.name}`;
        } else {
            switch (direction) {
                case 'up': instruction = `Montez vers ${nextZone?.name}`; break;
                case 'down': instruction = `Descendez vers ${nextZone?.name}`; break;
                case 'left': instruction = `Tournez à gauche vers ${nextZone?.name}`; break;
                case 'right': instruction = `Tournez à droite vers ${nextZone?.name}`; break;
                default: instruction = `Continuez tout droit vers ${nextZone?.name}`;
            }
        }

        // Avertissement foule
        let crowdWarning: NavigationStep['crowdWarning'] = null;
        if (zone.crowdLevel > 70) crowdWarning = 'high';
        else if (zone.crowdLevel > 45) crowdWarning = 'medium';

        // Chercher route alternative si foule élevée
        let alternativeRoute: string | null = null;
        if (crowdWarning === 'high' && zone.connections.length > 1) {
            const alternatives = zone.connections.filter(c => {
                const altZone = findZone(zones, c);
                return altZone && altZone.crowdLevel < zone.crowdLevel - 20;
            });
            if (alternatives.length > 0) {
                const altZone = findZone(zones, alternatives[0]);
                alternativeRoute = `Alternative: ${altZone?.name} (moins de monde)`;
            }
        }

        steps.push({
            zoneId: zone.id,
            zoneName: zone.name,
            instruction,
            direction,
            distance: `${(i + 1) * 30}m`,
            estimatedTime: zone.waitTime + 2,
            crowdWarning,
            alternativeRoute,
            icon: zone.icon,
        });
    }

    return steps;
}

// Interface pour routes multiples
export interface RouteOption {
    id: string;
    name: string;
    route: OptimalRoute;
    isFastest: boolean;
    isLeastCrowded: boolean;
    recommendation: string;
    timeDifference: number; // Différence avec la route la plus rapide
}

// Calculer la route optimale complète
export function calculateOptimalRoute(
    startZone: string,
    destinationGate: string,
    isVIP: boolean = false
): OptimalRoute {
    const zones = getRealtimeZoneData();
    const path = findOptimalPath(zones, startZone, destinationGate, isVIP);
    const steps = generateNavigationSteps(zones, path);

    const totalTime = steps.reduce((acc, s) => acc + s.estimatedTime, 0);
    const crowdScore = Math.round(
        steps.reduce((acc, s) => {
            const zone = findZone(zones, s.zoneId);
            return acc + (zone?.crowdLevel || 0);
        }, 0) / Math.max(steps.length, 1)
    );

    return {
        steps,
        totalTime,
        totalDistance: `${path.length * 30}m`,
        crowdScore,
        alternativeAvailable: steps.some(s => s.alternativeRoute !== null),
    };
}

// Générer plusieurs routes alternatives pour comparaison
export function calculateMultipleRoutes(
    startZone: string,
    destinationGate: string,
    isVIP: boolean = false
): RouteOption[] {
    const zones = getRealtimeZoneData();
    const routes: RouteOption[] = [];

    // Route 1: Chemin optimal (le plus rapide)
    const fastestPath = findOptimalPath(zones, startZone, destinationGate, isVIP);
    const fastestSteps = generateNavigationSteps(zones, fastestPath);
    const fastestTime = fastestSteps.reduce((acc, s) => acc + s.estimatedTime, 0);
    const fastestCrowd = Math.round(fastestSteps.reduce((acc, s) => {
        const zone = findZone(zones, s.zoneId);
        return acc + (zone?.crowdLevel || 0);
    }, 0) / Math.max(fastestSteps.length, 1));

    routes.push({
        id: 'fastest',
        name: 'Le plus rapide',
        route: {
            steps: fastestSteps,
            totalTime: fastestTime,
            totalDistance: `${fastestPath.length * 30}m`,
            crowdScore: fastestCrowd,
            alternativeAvailable: false,
        },
        isFastest: true,
        isLeastCrowded: false,
        recommendation: 'Ce chemin est le plus rapide',
        timeDifference: 0,
    });

    // Route 2: Éviter la sécurité principale (si possible)
    const alternativePath = findOptimalPath(zones, startZone, destinationGate, isVIP, ['security_main']);
    if (alternativePath.length > 0 && alternativePath.join(',') !== fastestPath.join(',')) {
        const altSteps = generateNavigationSteps(zones, alternativePath);
        const altTime = altSteps.reduce((acc, s) => acc + s.estimatedTime, 0);
        const altCrowd = Math.round(altSteps.reduce((acc, s) => {
            const zone = findZone(zones, s.zoneId);
            return acc + (zone?.crowdLevel || 0);
        }, 0) / Math.max(altSteps.length, 1));

        const timeDiff = altTime - fastestTime;
        let recommendation = '';
        if (altCrowd < fastestCrowd - 10) {
            recommendation = `Moins de monde (+${timeDiff}min)`;
        } else if (timeDiff > 5) {
            recommendation = `Va vous retarder de ${timeDiff}min`;
        } else {
            recommendation = `Similaire au plus rapide`;
        }

        routes.push({
            id: 'alternative',
            name: 'Moins de foule',
            route: {
                steps: altSteps,
                totalTime: altTime,
                totalDistance: `${alternativePath.length * 30}m`,
                crowdScore: altCrowd,
                alternativeAvailable: false,
            },
            isFastest: false,
            isLeastCrowded: altCrowd < fastestCrowd,
            recommendation,
            timeDifference: timeDiff,
        });
    }

    // Route 3: Via le Duty Free (pour ceux qui ont du temps)
    const scenicPath = findOptimalPath(zones, startZone, 'duty_free', isVIP);
    const scenicPath2 = findOptimalPath(zones, 'duty_free', destinationGate, isVIP);
    const fullScenicPath = [...scenicPath, ...scenicPath2.slice(1)];

    if (fullScenicPath.length > 0 && fullScenicPath.join(',') !== fastestPath.join(',')) {
        const scenicSteps = generateNavigationSteps(zones, fullScenicPath);
        const scenicTime = scenicSteps.reduce((acc, s) => acc + s.estimatedTime, 0);
        const scenicCrowd = Math.round(scenicSteps.reduce((acc, s) => {
            const zone = findZone(zones, s.zoneId);
            return acc + (zone?.crowdLevel || 0);
        }, 0) / Math.max(scenicSteps.length, 1));

        const timeDiff = scenicTime - fastestTime;

        routes.push({
            id: 'scenic',
            name: 'Via Duty Free',
            route: {
                steps: scenicSteps,
                totalTime: scenicTime,
                totalDistance: `${fullScenicPath.length * 30}m`,
                crowdScore: scenicCrowd,
                alternativeAvailable: false,
            },
            isFastest: false,
            isLeastCrowded: false,
            recommendation: timeDiff > 10
                ? `Risque de retard (+${timeDiff}min)`
                : `Temps pour le shopping (+${timeDiff}min)`,
            timeDifference: timeDiff,
        });
    }

    return routes;
}

// Mapper une porte de vol à un ID de zone
export function getGateZoneId(gate: string): string {
    const gateUpper = gate.toUpperCase();
    if (gateUpper.startsWith('A1')) return 'gate_a1';
    if (gateUpper.startsWith('A')) return 'gate_a2';
    if (gateUpper.startsWith('B')) return 'gate_b1';
    if (gateUpper.startsWith('C1')) return 'gate_c1';
    if (gateUpper.startsWith('C')) return 'gate_c2';
    return 'gate_a1'; // Défaut
}

// Obtenir le nom de direction en français
export function getDirectionText(direction: NavigationStep['direction']): string {
    switch (direction) {
        case 'straight': return 'Continuez';
        case 'left': return 'Tournez à gauche';
        case 'right': return 'Tournez à droite';
        case 'up': return 'Montez';
        case 'down': return 'Descendez';
        case 'arrive': return 'Destination';
    }
}
