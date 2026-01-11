
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'dataset.json');

// --- SIMULATION CONSTANTS ---
const AIRPORTS_DEP = ['CDG', 'ORY', 'DXB', 'JFK', 'LHR', 'AMS'];
const AIRPORT_DETAILS = {
    'CMN': 'Mohammed V',
    'CDG': 'Charles de Gaulle',
    'ORY': 'Paris Orly',
    'DXB': 'Dubai Int.',
    'JFK': 'J.F. Kennedy',
    'LHR': 'Heathrow',
    'AMS': 'Schiphol',
    'RAK': 'Menara',
    'TNG': 'Ibn Battouta',
    'FEZ': 'Saïss',
    'AGA': 'Al Massira'
};

const STEP_TRANSITIONS = [
    { from: 'entrance', to: 'checkin', label: 'Entrée -> Enregistrement' },
    { from: 'checkin', to: 'security', label: 'Enregistrement -> Sécurité' },
    { from: 'security', to: 'passport', label: 'Sécurité -> Passeport' },
    { from: 'passport', to: 'duty_free', label: 'Passeport -> Duty Free' },
    { from: 'duty_free', to: 'gate', label: 'Duty Free -> Porte' },
    { from: 'gate', to: 'arrival', label: 'Vol (vers Destination)' },
    { from: 'arrival', to: 'baggage_claim', label: 'Débarquement -> Bagages' },
    { from: 'baggage_claim', to: 'exit', label: 'Bagages -> Sortie' }
];

// --- HELPER FUNCTION: generateTravelerProfile ---
// (Copied from server/index.js to ensure consistency)
function generateTravelerProfile(baseRecord = {}) {
    // Si on a déjà un ID, on essaie d'être cohérent, sinon nouveau
    const travelerId = baseRecord.travelerId || `user_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    // Vols fictifs mais réalistes
    const flightId = baseRecord.flightId || `AT${Math.floor(Math.random() * 900) + 100}`;
    const seat = baseRecord.seat || `${Math.floor(Math.random() * 30) + 1}${['A', 'B', 'C', 'D', 'E', 'F'][Math.floor(Math.random() * 6)]}`;
    const gate = baseRecord.gate || `${['A', 'B', 'C'][Math.floor(Math.random() * 3)]}${Math.floor(Math.random() * 20) + 1}`;

    // Si missing, choisir un aéroport de départ aléatoire (70% CMN, 30% autre)
    const allAirports = ['CMN', 'CDG', 'ORY', 'DXB', 'JFK', 'LHR', 'AMS', 'RAK'];
    const depCode = baseRecord.depAirport || (Math.random() < 0.7 ? 'CMN' : allAirports[Math.floor(Math.random() * allAirports.length)]);
    const arrCode = baseRecord.arrAirport || AIRPORTS_DEP[Math.floor(Math.random() * AIRPORTS_DEP.length)];

    // Dates & Heures
    // On se base sur le timestamp existant ou maintenant
    // Pour le seed, on veut des datas passées, donc on recule un peu
    const refTime = baseRecord.timestamp ? new Date(baseRecord.timestamp) : new Date();

    // Departure time = timestamp + 45-105min
    const depTime = new Date(refTime);
    depTime.setMinutes(depTime.getMinutes() + 45 + Math.floor(Math.random() * 60));

    const flightDuration = 180 + Math.floor(Math.random() * 300); // 3h-8h
    const arrTime = new Date(depTime);
    arrTime.setMinutes(arrTime.getMinutes() + flightDuration);

    const boardingTime = new Date(depTime);
    boardingTime.setMinutes(boardingTime.getMinutes() - 40);

    return {
        travelerId,
        flightId,
        seat,
        gate,
        depAirport: depCode,
        depAirportName: AIRPORT_DETAILS[depCode] || depCode,
        arrAirport: arrCode,
        arrAirportName: AIRPORT_DETAILS[arrCode] || arrCode,
        departureTime: baseRecord.departureTime || depTime.toISOString(),
        arrivalTime: baseRecord.arrivalTime || arrTime.toISOString(),
        boardingTime: baseRecord.boardingTime || boardingTime.toISOString(),
        ...baseRecord
    };
}


function generateSeedData(count = 50) {
    console.log(`Generating ${count} travelers...`);
    let dataset = [];

    for (let i = 0; i < count; i++) {
        // 1. Create a traveler
        // Start time between 1h and 6h ago to simulate ongoing day
        const startTime = new Date();
        startTime.setMinutes(startTime.getMinutes() - 60 - Math.floor(Math.random() * 300));

        let profile = generateTravelerProfile({
            travelerId: `user_seed_${i}_${Math.random().toString(36).substr(2, 4)}`,
            timestamp: startTime.toISOString()
        });

        // 2. Decide progress
        // 0 to Max Steps
        // Weighted towards middle/end to populate the dashboard
        const progress = Math.floor(Math.random() * (STEP_TRANSITIONS.length + 1));

        // Ensure some are fully completed for history
        // And some are in progress

        let currentTimestamp = new Date(startTime);

        // Generate COMPLETED steps
        for (let s = 0; s < progress; s++) {
            if (s >= STEP_TRANSITIONS.length) break;

            const t = STEP_TRANSITIONS[s];
            const duration = 120 + Math.floor(Math.random() * 900); // 2-15 min per step

            // Add completed record
            dataset.unshift({
                id: `rec_seed_${Date.now()}_${i}_${s}`,
                ...profile,
                stepFrom: t.from,
                stepTo: t.to,
                durationSeconds: duration,
                timestamp: currentTimestamp.toISOString(),
                isSimulated: true,
                stepStatus: 'completed'
            });

            // Advance time
            currentTimestamp.setSeconds(currentTimestamp.getSeconds() + duration + 30);
        }

        // If not finished, add IN_PROGRESS step
        if (progress < STEP_TRANSITIONS.length) {
            const t = STEP_TRANSITIONS[progress];
            const timeSpentSoFar = Math.floor(Math.random() * 300); // 0-5 min

            dataset.unshift({
                id: `rec_seed_IN_${Date.now()}_${i}`,
                ...profile,
                stepFrom: t.from,
                stepTo: t.to,
                durationSeconds: timeSpentSoFar,
                timestamp: currentTimestamp.toISOString(), // Time they reached this step
                isSimulated: true,
                stepStatus: 'in_progress'
            });
        }
    }

    return dataset;
}

try {
    const seedData = generateSeedData(50); // 50 travelers
    fs.writeFileSync(DATA_FILE, JSON.stringify(seedData, null, 2));
    console.log(`✅ Successfully generated ${seedData.length} records in dataset.json`);
} catch (e) {
    console.error('❌ Error generating seed data:', e);
}
