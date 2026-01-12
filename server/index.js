// =====================================================
// SMART TRAVELER - SYNC SERVER
// Simple Express + Socket.IO server for real-time sync
// Run with: node server/index.js
// =====================================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Configuration CORS pour accepter les connexions de l'app Expo
const io = new Server(server, {
    cors: {
        origin: '*', // Autoriser toutes les origines pour le dev
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Pour les gros datasets
app.use(express.static(path.join(__dirname, 'public'))); // Servir le dashboard HTML

// ===== STOCKAGE EN MÉMOIRE + FICHIER (Persistance) =====

const DATA_FILE = path.join(__dirname, 'dataset.json');

// ===== LISTES GLOBALES DE VOLS (Partagées) =====
// Liste synchronisée avec airportDatabase.ts MOROCCAN_AIRPORTS
const MOROCCAN_AIRPORTS = ['CMN', 'RAK', 'AGA', 'TNG', 'FEZ', 'RBA', 'OUD', 'NDR', 'VIL', 'EUN'];

// Liste des vols RAM (Copie de home.tsx pour cohérence)
const REAL_FLIGHTS = [
    // --- MAROC (DOMESTIQUE) ---
    { number: 'AT400', destination: 'Marrakech Menara', code: 'RAK' },
    { number: 'AT402', destination: 'Agadir Al Massira', code: 'AGA' },
    { number: 'AT404', destination: 'Tanger Ibn Battouta', code: 'TNG' },
    { number: 'AT406', destination: 'Fès Saïss', code: 'FEZ' },
    { number: 'AT408', destination: 'Oujda Angads', code: 'OUD' },
    { number: 'AT410', destination: 'Nador Al Aroui', code: 'NDR' },
    { number: 'AT412', destination: 'Laâyoune Hassan I', code: 'EUN' },
    { number: 'AT414', destination: 'Dakhla', code: 'VIL' },
    { number: 'AT416', destination: 'Ouarzazate', code: 'OZZ' },
    { number: 'AT418', destination: 'Al Hoceima', code: 'AHU' },
    { number: 'AT420', destination: 'Errachidia', code: 'ERH' },
    // --- FRANCE ---
    { number: 'AT700', destination: 'Paris CDG', code: 'CDG' },
    { number: 'AT702', destination: 'Paris Orly', code: 'ORY' },
    { number: 'AT704', destination: 'Lyon St-Exupéry', code: 'LYS' },
    { number: 'AT706', destination: 'Marseille Provence', code: 'MRS' },
    { number: 'AT708', destination: 'Toulouse Blagnac', code: 'TLS' },
    { number: 'AT710', destination: 'Bordeaux Mérignac', code: 'BOD' },
    { number: 'AT712', destination: 'Nice Côte d\'Azur', code: 'NCE' },
    { number: 'AT714', destination: 'Nantes Atlantique', code: 'NTE' },
    { number: 'AT716', destination: 'Montpellier', code: 'MPL' },
    // --- EUROPE (HORS FRANCE) ---
    { number: 'AT800', destination: 'Londres Heathrow', code: 'LHR' },
    { number: 'AT802', destination: 'Londres Gatwick', code: 'LGW' },
    { number: 'AT804', destination: 'Bruxelles Zaventem', code: 'BRU' },
    { number: 'AT806', destination: 'Amsterdam Schiphol', code: 'AMS' },
    { number: 'AT808', destination: 'Madrid Barajas', code: 'MAD' },
    { number: 'AT810', destination: 'Barcelone El Prat', code: 'BCN' },
    { number: 'AT812', destination: 'Malaga', code: 'AGP' },
    { number: 'AT814', destination: 'Valence', code: 'VLC' },
    { number: 'AT816', destination: 'Lisbonne', code: 'LIS' },
    { number: 'AT818', destination: 'Rome Fiumicino', code: 'FCO' },
    { number: 'AT820', destination: 'Milan Malpensa', code: 'MXP' },
    { number: 'AT822', destination: 'Bologne', code: 'BLQ' },
    { number: 'AT824', destination: 'Genève Cointrin', code: 'GVA' },
    { number: 'AT826', destination: 'Frankfurt', code: 'FRA' },
    { number: 'AT828', destination: 'Istanbul', code: 'IST' },
    // --- AMÉRIQUE DU NORD ---
    { number: 'AT200', destination: 'New York JFK', code: 'JFK' },
    { number: 'AT202', destination: 'Washington Dulles', code: 'IAD' },
    { number: 'AT204', destination: 'Montréal Trudeau', code: 'YUL' },
    { number: 'AT206', destination: 'Miami', code: 'MIA' },
    // --- AFRIQUE ---
    { number: 'AT500', destination: 'Dakar Diass', code: 'DSS' },
    { number: 'AT502', destination: 'Abidjan', code: 'ABJ' },
    { number: 'AT504', destination: 'Lagos', code: 'LOS' },
    { number: 'AT506', destination: 'Tunis Carthage', code: 'TUN' },
    { number: 'AT508', destination: 'Le Caire', code: 'CAI' },
    { number: 'AT510', destination: 'Alger', code: 'ALG' },
    { number: 'AT512', destination: 'Bamako', code: 'BKO' },
    { number: 'AT514', destination: 'Conakry', code: 'CKY' },
    { number: 'AT516', destination: 'Libreville', code: 'LBV' },
    // --- MOYEN-ORIENT ---
    { number: 'AT250', destination: 'Dubai International', code: 'DXB' },
    { number: 'AT252', destination: 'Jeddah', code: 'JED' },
    { number: 'AT254', destination: 'Riyad', code: 'RUH' },
    { number: 'AT256', destination: 'Doha Hamad', code: 'DOH' },
    ];

const AIRPORT_DETAILS = {
    // Maroc (synchronisé avec airportDatabase.ts)
    'CMN': 'Mohammed V', 'RAK': 'Menara', 'AGA': 'Al Massira', 'TNG': 'Ibn Battouta',
    'FEZ': 'Saïss', 'RBA': 'Rabat Salé', 'OUD': 'Oujda Angads', 'NDR': 'Nador Al Aroui',
    'VIL': 'Dakhla', 'EUN': 'Laâyoune',
    // France
    'CDG': 'Charles de Gaulle', 'ORY': 'Paris Orly', 'LYS': 'Lyon St-Exupéry',
    'MRS': 'Marseille Provence', 'TLS': 'Toulouse Blagnac', 'BOD': 'Bordeaux Mérignac',
    'NCE': 'Nice Côte d\'Azur', 'NTE': 'Nantes Atlantique', 'MPL': 'Montpellier',
    // Europe
    'LHR': 'Heathrow', 'LGW': 'Gatwick', 'BRU': 'Bruxelles', 'AMS': 'Schiphol',
    'MAD': 'Madrid Barajas', 'BCN': 'Barcelone El Prat', 'AGP': 'Malaga', 'VLC': 'Valence',
    'LIS': 'Lisbonne', 'FCO': 'Rome Fiumicino', 'MXP': 'Milan Malpensa', 'BLQ': 'Bologne',
    'GVA': 'Genève Cointrin', 'FRA': 'Frankfurt', 'IST': 'Istanbul',
    // Amérique
    'JFK': 'J.F. Kennedy', 'IAD': 'Washington Dulles', 'YUL': 'Montréal Trudeau', 'MIA': 'Miami',
    // Afrique
    'DSS': 'Dakar Diass', 'ABJ': 'Abidjan', 'LOS': 'Lagos', 'TUN': 'Tunis Carthage',
    'CAI': 'Le Caire', 'ALG': 'Alger', 'BKO': 'Bamako', 'CKY': 'Conakry', 'LBV': 'Libreville',
    // Moyen-Orient
    'DXB': 'Dubai Int.', 'JED': 'Jeddah', 'RUH': 'Riyad', 'DOH': 'Doha Hamad'
};

// --- HELPER: Générateur de données de vol réalistes ---
function generateTravelerProfile(baseRecord = {}) {
    // 1. Sélectionner un vol réel aléatoire
    const randomFlight = REAL_FLIGHTS[Math.floor(Math.random() * REAL_FLIGHTS.length)];

    // 2. Déterminer Départ / Arrivée
    // Tous les vols sont des départs depuis le Maroc
    let depCode, arrCode, depName, arrName;

    // Départ de Casa (Standard) - 60% des cas
    // Départ Province (Agadir, Marrakech, etc.) - 40% des cas
    const isProvinceDeparture = Math.random() < 0.4;
    if (isProvinceDeparture) {
        const PROVINCE = MOROCCAN_AIRPORTS.filter(a => a !== 'CMN');
        const chosen = PROVINCE[Math.floor(Math.random() * PROVINCE.length)] || 'CMN';
        depCode = chosen;
        depName = AIRPORT_DETAILS[chosen] || chosen;
        arrCode = randomFlight.code;
        arrName = randomFlight.destination;
    } else {
        depCode = 'CMN';
        depName = 'Mohammed V';
        arrCode = randomFlight.code;
        arrName = randomFlight.destination;
    }

    // Sécurité: toujours départ depuis un aéroport marocain
    if (!MOROCCAN_AIRPORTS.includes(depCode)) {
        depCode = 'CMN';
        depName = 'Mohammed V';
    }

    // Override si fourni par baseRecord
    if (baseRecord.depAirport) { depCode = baseRecord.depAirport; depName = AIRPORT_DETAILS[depCode] || depCode; }
    if (baseRecord.arrAirport) { arrCode = baseRecord.arrAirport; arrName = AIRPORT_DETAILS[arrCode] || arrCode; }
    if (baseRecord.depAirportName) depName = baseRecord.depAirportName;
    if (baseRecord.arrAirportName) arrName = baseRecord.arrAirportName;

    // 3. IDs & Details
    const travelerId = baseRecord.travelerId || `user_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const flightId = baseRecord.flightId || randomFlight.number;

    // --- DETERMINISTIC LOGIC (Must match airportDatabase.ts) ---
    // Generate a unique seed from the Flight Number string
    const flightSeed = flightId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    // Gate Logic
    const gates = ['A1', 'A5', 'B3', 'B12', 'C4', 'C8', 'D2', 'D10'];
    let gate = gates[flightSeed % gates.length];

    // Seat Logic
    const seatRow = (flightSeed % 30) + 1; // 1-30
    const seatCol = ['A', 'B', 'C', 'D', 'E', 'F'][flightSeed % 6];
    let seat = `${seatRow}${seatCol}`;

    // OVERRIDE: Specific Seat/Gate for specific flights if needed (Legacy support)
    if (flightId === 'AT408') { // CASA - OUJDA
        seat = '17F';
        gate = 'A5';
    }

    // Override if provided in baseRecord
    if (baseRecord.seat) seat = baseRecord.seat;
    if (baseRecord.gate) gate = baseRecord.gate;

    // 4. Dates
    const refTime = baseRecord.timestamp ? new Date(baseRecord.timestamp) : new Date();

    // Departure time = timestamp + 45-120min (Futur proche)
    const depTime = new Date(refTime);
    depTime.setMinutes(depTime.getMinutes() + 45 + Math.floor(Math.random() * 75));

    const flightDuration = 60 + Math.floor(Math.random() * 300); // 1h-6h
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
        depAirportName: depName,
        arrAirport: arrCode,
        arrAirportName: arrName,
        departureTime: baseRecord.departureTime || depTime.toISOString(),
        arrivalTime: baseRecord.arrivalTime || arrTime.toISOString(),
        boardingTime: baseRecord.boardingTime || boardingTime.toISOString(),
        // Conserver les champs existants
        ...baseRecord
    };
}

// Charger les données au démarrage
function loadDataset() {
    let loadedData = [];
    try {
        if (fs.existsSync(DATA_FILE)) {
            const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
            loadedData = JSON.parse(fileContent);
        }
    } catch (e) {
        console.log('[Server] Could not load dataset:', e.message);
    }

    // --- MIGRATION / ENRICHISSEMENT AUTOMATIQUE ---
    // Si des records n'ont pas les détails de vol (vieux dataset), on les génère.
    let modified = false;
    loadedData = loadedData.map(record => {
        if (!record.flightId || !record.depAirportName || !record.departureTime) {
            // C'est un vieux record, on l'enrichit
            modified = true;
            return generateTravelerProfile(record);
        }
        return record;
    });

    if (modified) {
        console.log('[Server] Migrated/Enriched old records with flight details.');
        saveDataset(loadedData);
    }

    return loadedData;
}

// Sauvegarder les données
function saveDataset(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.log('[Server] Could not save dataset:', e.message);
    }
}

let crowdDataset = loadDataset();
let activeConnections = 0;
let simulatedUsers = 0; // New: Simulated users count

console.log(`[Server] Loaded ${crowdDataset.length} records from file`);

// ===== NETTOYAGE AU DÉMARRAGE =====
// Traiter les passagers bloqués en IN_PROGRESS depuis trop longtemps (ex: après redémarrage PC)
function cleanupStuckPassengers() {
    const now = new Date();
    let cleaned = 0;
    
    // Reconstruire l'état actuel
    const userStatus = {};
    for (const r of crowdDataset) {
        if (!userStatus[r.travelerId]) {
            userStatus[r.travelerId] = r;
        }
    }
    
    Object.values(userStatus).forEach(lastRecord => {
        if (lastRecord.stepStatus === 'in_progress') {
            const timeSpentMs = now - new Date(lastRecord.timestamp);
            const timeSpentMinutes = timeSpentMs / (1000 * 60);
            
            // Si bloqué depuis plus de 15 minutes, le faire avancer immédiatement
            if (timeSpentMinutes > 15) {
                console.log(`[Cleanup] 🧹 User ${lastRecord.travelerId.substr(0, 8)} stuck for ${Math.floor(timeSpentMinutes)}min - advancing...`);
                
                // Marquer comme completed
                const completedRecord = {
                    ...lastRecord,
                    id: `rec_cleanup_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                    timestamp: now.toISOString(),
                    durationSeconds: Math.floor(timeSpentMs / 1000),
                    stepStatus: 'completed'
                };
                
                // Remplacer l'ancien record
                const idx = crowdDataset.indexOf(lastRecord);
                if (idx !== -1) {
                    crowdDataset[idx] = completedRecord;
                }
                
                // Créer le prochain IN_PROGRESS si applicable
                const nextStepMap = {
                    'entrance': 'checkin',
                    'checkin': 'security',
                    'security': 'passport',
                    'passport': 'duty_free',
                    'duty_free': 'gate',
                    'gate': 'arrival',
                    'arrival': 'baggage_claim',
                    'baggage_claim': 'exit',
                    'exit': 'finished'
                };
                
                const nextStep = nextStepMap[lastRecord.stepTo];
                if (nextStep && nextStep !== 'finished') {
                    const newInProgress = {
                        ...lastRecord,
                        id: `rec_cleanup_IN_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                        stepFrom: lastRecord.stepTo,
                        stepTo: nextStep,
                        durationSeconds: 0,
                        timestamp: now.toISOString(),
                        stepStatus: 'in_progress'
                    };
                    crowdDataset.unshift(newInProgress);
                }
                
                cleaned++;
            }
        }
    });
    
    if (cleaned > 0) {
        saveDataset(crowdDataset);
        console.log(`[Cleanup] ✅ Cleaned ${cleaned} stuck passengers`);
    }
}

// Exécuter le nettoyage au démarrage
cleanupStuckPassengers();

// ===== NETTOYAGE VOLS HORS MAROC =====
// Supprimer les anciens enregistrements avec départ hors Maroc (TU711, EK751, AF123, etc.)
function cleanupNonMoroccanDepartures() {
    const before = crowdDataset.length;
    crowdDataset = crowdDataset.filter(record => {
        const depOk = !record.depAirport || MOROCCAN_AIRPORTS.includes(record.depAirport);
        const flightOk = !record.flightId || record.flightId.startsWith('AT'); // on garde uniquement les vols ATxxx
        return depOk && flightOk;
    });
    const removed = before - crowdDataset.length;
    
    if (removed > 0) {
        saveDataset(crowdDataset);
        console.log(`[Cleanup] 🧹 Removed ${removed} records with non-Moroccan departures or non-AT flights`);
    }
}

// Exécuter le nettoyage des vols hors Maroc
cleanupNonMoroccanDepartures();

// ===== ROUTES HTTP =====

// Récupérer le dataset complet
app.get('/api/dataset', (req, res) => {
    console.log(`[API] GET /dataset - ${crowdDataset.length} records`);
    res.json({
        dataset: crowdDataset,
        activeUsers: activeConnections,
        timestamp: new Date().toISOString()
    });
});

// Ajouter un nouveau record (depuis l'app mobile)
app.post('/api/record', (req, res) => {
    const record = req.body;

    if (!record || !record.stepFrom || !record.stepTo) {
        return res.status(400).json({ error: 'Invalid record' });
    }

    // Ajouter l'ID et le timestamp si manquants
    record.id = record.id || `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    record.timestamp = record.timestamp || new Date().toISOString();
    record.isSimulated = false;

    // Si le record reçu n'a pas les infos de vol (ex: vient d'une vieille version de l'app), on les ajoute
    if (!record.flightId || !record.depAirportName) {
        Object.assign(record, generateTravelerProfile(record));
    }

    // Ajouter en tête du dataset
    crowdDataset.unshift(record);
    saveDataset(crowdDataset);

    console.log(`[API] POST /record - New: ${record.stepFrom} -> ${record.stepTo} (${record.durationSeconds}s)`);

    // Diffuser à tous les clients WebSocket connectés
    io.emit('new-record', record);
    io.emit('dataset-updated', {
        dataset: crowdDataset,
        activeUsers: activeConnections + simulatedUsers
    });

    res.json({ success: true, record });
});

// Initialiser avec des données historiques (optionnel)
app.post('/api/init', (req, res) => {
    const { dataset } = req.body;

    // PROTECTION: Si le serveur a déjà des données (> 0), on NE L'ÉCRASE PAS avec le cache du client.
    // On renvoie plutôt les données du serveur pour que le client se mette à jour.
    if (crowdDataset.length > 0) {
        console.log(`[API] POST /init - Client requested init, but server has ${crowdDataset.length} records. PRESERVING SERVER DATA.`);
        return res.json({
            success: true,
            count: crowdDataset.length,
            serverOverride: true,
            dataset: crowdDataset // Optionnel: renvoyer le bon dataset au client
        });
    }

    if (Array.isArray(dataset)) {
        // Enriched incoming initial dataset too if needed
        crowdDataset = dataset.map(r => {
            if (!r.flightId || !r.depAirportName) return generateTravelerProfile(r);
            return r;
        });

        saveDataset(crowdDataset);
        console.log(`[API] POST /init - Loaded ${dataset.length} records (from client, enriched)`);
        io.emit('dataset-updated', { dataset: crowdDataset, activeUsers: activeConnections + simulatedUsers });
    }
    res.json({ success: true, count: crowdDataset.length });
});

// Reset le dataset
app.delete('/api/dataset', (req, res) => {
    crowdDataset = [];
    console.log('[API] DELETE /dataset - Cleared');
    io.emit('dataset-updated', { dataset: [], activeUsers: activeConnections + simulatedUsers });
    res.json({ success: true });
});

// ===== WEBSOCKET =====

io.on('connection', (socket) => {
    activeConnections++;
    console.log(`[WS] Client connected (${activeConnections} total + ${simulatedUsers} simulated)`);

    // Envoyer le dataset actuel au nouveau client
    socket.emit('dataset-updated', {
        dataset: crowdDataset,
        activeUsers: activeConnections + simulatedUsers
    });

    // Diffuser le nouveau compte d'utilisateurs
    io.emit('active-users', activeConnections + simulatedUsers);

    socket.on('disconnect', () => {
        activeConnections--;
        console.log(`[WS] Client disconnected (${activeConnections} remaining)`);
        io.emit('active-users', activeConnections + simulatedUsers);
    });

    // Injecter des TRAJETS COMPLETS (Batch One-Off)
    socket.on('inject-records', (count) => {
        console.log(`[WS] 💉 Injecting ${count} full traveler journeys...`);

        const AIRPORTS_DEP = ['CDG', 'ORY', 'DXB', 'JFK', 'LHR', 'AMS'];
        const AIRPORTS_ARR = ['CMN', 'RAK', 'TNG', 'FEZ', 'AGA']; // Arrivée Maroc (contexte) ou inverse

        const STEPS = [
            'entrance',
            'checkin',
            'security',
            'passport',
            'duty_free',
            'gate',
            'boarding',      // Ajouté pour cohérence
            'arrival',       // Arrivée destination
            'baggage_claim',
            'exit'
        ]; // Total 10 steps, ou on adapte aux 9 demandées

        // Mapping des étapes demandées (9 colonnes)
        // 1. Entrée terminal
        // 2. Comptoir enregistrement
        // 3. Contrôle sécurité
        // 4. Contrôle passeport
        // 5. Zone duty free
        // 6. Porte embarquement
        // 7. Arrivée destination
        // 8. Zone récupération
        // 9. Sortie aéroport

        const STEP_TRANSITIONS = [
            { from: 'entrance', to: 'checkin', label: 'Entrée -> Enregistrement' },
            { from: 'checkin', to: 'security', label: 'Enregistrement -> Sécurité' },
            { from: 'security', to: 'passport', label: 'Sécurité -> Passeport' },
            { from: 'passport', to: 'duty_free', label: 'Passeport -> Duty Free' },
            { from: 'duty_free', to: 'gate', label: 'Duty Free -> Porte' },
            { from: 'gate', to: 'arrival', label: 'Vol (vers Destination)' },
            { from: 'arrival', to: 'baggage_claim', label: 'Débarquement -> Bagages' },
            { from: 'baggage_claim', to: 'exit', label: 'Bagages -> Sortie' },
            { from: 'exit', to: 'finished', label: 'Sortie -> Fin' }
        ];

        for (let i = 0; i < count; i++) {
            // 1. Choisir un vol réel aléatoire depuis la même liste que l'app
            const randomFlight = REAL_FLIGHTS[Math.floor(Math.random() * REAL_FLIGHTS.length)];
            const flightId = randomFlight.number;
            
            // 2. Déterminer les aéroports départ/arrivée
            // Tous les vols sont des départs depuis le Maroc
            let depCode, arrCode, depName, arrName;
            
            // 40% de départs depuis province (Agadir, Marrakech, etc.)
            const isProvinceDeparture = Math.random() < 0.4;
            
            if (isProvinceDeparture) {
                // Départ province vers destination
                const PROVINCE = MOROCCAN_AIRPORTS.filter(a => a !== 'CMN');
                depCode = PROVINCE[Math.floor(Math.random() * PROVINCE.length)];
                depName = AIRPORT_DETAILS[depCode] || depCode;
                arrCode = randomFlight.code;
                arrName = randomFlight.destination;
            } else {
                // Cas Standard: Départ de Casa vers Destination
                depCode = 'CMN';
                depName = 'Mohammed V';
                arrCode = randomFlight.code;
                arrName = randomFlight.destination;
            }
            
            // 3. Générer le profil avec ces infos spécifiques
            const startTime = new Date();
            startTime.setMinutes(startTime.getMinutes() - Math.floor(Math.random() * 240));

            let profile = generateTravelerProfile({
                travelerId: `user_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
                flightId: flightId,
                depAirport: depCode,
                arrAirport: arrCode,
                depAirportName: depName,
                arrAirportName: arrName,
                timestamp: startTime.toISOString()
            });
            
            // LOG pour vérifier la cohérence
            console.log(`[Sim] ✈️ Generated passenger ${i+1}: ${flightId} | ${depCode}->${arrCode} | Gate: ${profile.gate} | Seat: ${profile.seat}`);

            // 2. Simuler son avancement (Progression)
            // 2. Simuler son avancement (Progression)
            // On veut que la plupart des passagers simulés aient complété tout le parcours pour la démo
            // Taux d'achèvement: 80% finissent, 20% sont en cours de route
            const isComplete = Math.random() < 0.8;
            const progress = isComplete ? STEP_TRANSITIONS.length : Math.floor(Math.random() * STEP_TRANSITIONS.length);

            // Générer les étapes passées
            for (let s = 0; s < progress; s++) {
                if (s >= STEP_TRANSITIONS.length) break;

                const t = STEP_TRANSITIONS[s];

                // Durées réalistes (en secondes)
                let minTime = 120; // 2 min
                let maxTime = 900; // 15 min

                // Ajustement par étape
                if (t.from === 'security') { minTime = 600; maxTime = 1800; } // Sécurité: 10-30 min
                if (t.from === 'checkin') { minTime = 300; maxTime = 1200; } // Checkin: 5-20 min
                if (t.from === 'duty_free') { minTime = 900; maxTime = 2700; } // Duty Free: 15-45 min (shopping)
                if (t.from === 'exit') { minTime = 60; maxTime = 300; } // Sortie: 1-5 min (Walk out)

                const duration = minTime + Math.floor(Math.random() * (maxTime - minTime));

                // Créer le record d'étape
                const record = {
                    ...profile, // Copie des infos de vol
                    id: `rec_sim_${Date.now()}_${i}_${s}`,
                    stepFrom: t.from,
                    stepTo: t.to,
                    durationSeconds: duration,
                    timestamp: startTime.toISOString(), // Le timestamp du record est approximatif ici pour la simu
                    isSimulated: true,
                    stepStatus: 'completed'
                };

                // On pourrait ajuster le timestamp pour qu'il soit séquentiel, mais pour la démo dashboard c'est OK
                crowdDataset.push(record);
            }

            // Générer l'étape COURANTE (in_progress) s'il n'a pas fini (ou s'il vient de finir l'avant dernier ?)
            // Si le user a fait toutes les étapes, il est "Sorti", donc pas de 'in_progress'
            if (progress < STEP_TRANSITIONS.length) {
                const t = STEP_TRANSITIONS[progress];
                const record = {
                    ...profile,
                    id: `rec_sim_IN_${Date.now()}_${i}`,
                    stepFrom: t.from,
                    stepTo: t.to,
                    durationSeconds: Math.floor(Math.random() * 300), // En cours depuis X secondes
                    timestamp: new Date().toISOString(),
                    isSimulated: true,
                    stepStatus: 'in_progress'
                };
                crowdDataset.push(record);
            }
        }


        // Limit dataset size
        if (crowdDataset.length > 5000) crowdDataset = crowdDataset.slice(0, 5000);

        saveDataset(crowdDataset);

        // Broadcast updates
        io.emit('dataset-updated', {
            dataset: crowdDataset,
            activeUsers: activeConnections
        });

        console.log(`[WS] ✅ Injected ${count} travelers.`);
    });

    // Recevoir un record depuis l'App Mobile
    socket.on('submit-record', (record) => {
        console.log(`[WS] 📥 User record received: ${record.stepFrom} -> ${record.stepTo} (${record.durationSeconds || 0}s) status=${record.stepStatus || 'completed'}`);

        const travelerId = record.travelerId;
        const journeyId = record.journeyId || null;

        // Cas 1 : enregistrement IN_PROGRESS (démarrage d'étape pour un vrai utilisateur)
        if (record.stepStatus === 'in_progress') {
            const inProgressRecord = {
                ...record,
                id: record.id || `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date().toISOString(),
                isSimulated: false,
                stepStatus: 'in_progress',
                durationSeconds: record.durationSeconds || 0
            };

            // On ne supprime pas les autres in_progress ici pour ne pas perturber la simulation,
            // mais on peut nettoyer les doublons exacts du même travelerId.
            if (travelerId) {
                // Ne supprimer que les in_progress du MÊME voyage (journeyId), conserver l'historique des voyages précédents
                crowdDataset = crowdDataset.filter(r => !(
                    r.travelerId === travelerId &&
                    r.stepStatus === 'in_progress' &&
                    (journeyId ? r.journeyId === journeyId : true)
                ));
            }
            crowdDataset.unshift(inProgressRecord);

            if (crowdDataset.length > 2000) {
                crowdDataset = crowdDataset.slice(0, 2000);
            }
            saveDataset(crowdDataset);
            io.emit('new-record', inProgressRecord);
            io.emit('dataset-updated', { dataset: crowdDataset, activeUsers: activeConnections + simulatedUsers });
            return;
        }

        // Cas 2 : enregistrement COMPLETED (fin d'étape)
        if (travelerId) {
            // Nettoyer uniquement les in_progress du même voyage (pas des voyages précédents)
            crowdDataset = crowdDataset.filter(r => !(
                r.travelerId === travelerId &&
                r.stepStatus === 'in_progress' &&
                (journeyId ? r.journeyId === journeyId : true)
            ));
        }

        const finishedRecord = {
            ...record,
            id: record.id || `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            isSimulated: false,
            stepStatus: 'completed'
        };
        crowdDataset.unshift(finishedRecord);

        if (crowdDataset.length > 2000) {
            crowdDataset = crowdDataset.slice(0, 2000);
        }

        saveDataset(crowdDataset);
        io.emit('new-record', finishedRecord);
        io.emit('dataset-updated', { dataset: crowdDataset, activeUsers: activeConnections + simulatedUsers });
    });
});


// Helper: durée aléatoire et réaliste par étape (en ms)
function getRandomStepDurationMs(stepFrom) {
    let minTime = 120; // secondes (2 min par défaut)
    let maxTime = 600; // secondes (10 min par défaut)

    switch (stepFrom) {
        case 'entrance':
            minTime = 60; maxTime = 180; break;    // 1-3 min
        case 'checkin':
            minTime = 180; maxTime = 600; break;   // 3-10 min
        case 'security':
            minTime = 300; maxTime = 900; break;   // 5-15 min
        case 'passport':
            minTime = 120; maxTime = 360; break;   // 2-6 min
        case 'duty_free':
            minTime = 300; maxTime = 900; break;   // 5-15 min
        case 'gate':
            minTime = 600; maxTime = 1200; break;  // 10-20 min
        case 'arrival':
            minTime = 180; maxTime = 480; break;   // 3-8 min
        case 'baggage_claim':
            minTime = 300; maxTime = 720; break;   // 5-12 min
        case 'exit':
            minTime = 60; maxTime = 180; break;    // 1-3 min
    }

    return (minTime + Math.random() * (maxTime - minTime)) * 1000;
}

// ===== SIMULATION ENGINE (Server-Side) =====
// Fait avancer les utilisateurs simulés automatiquement
setInterval(() => {
    let updates = false;
    const now = new Date();

    // 1. Identifier les voyageurs simulés qui sont 'in_progress'
    // On reconstruit l'état actuel en prenant le DERNIER record (le plus récent) pour chaque traveler
    const userStatus = {};
    // Parcours à l'envers pour toujours garder le record le plus récent pour chaque traveler
    // (car la simu initiale pousse les records avec push, alors que les updates temps réel font unshift)
    for (let i = crowdDataset.length - 1; i >= 0; i--) {
        const r = crowdDataset[i];
        if (!r?.travelerId) continue;
        if (!userStatus[r.travelerId]) {
            userStatus[r.travelerId] = r; // première rencontre en partant de la fin => plus récent
        }
    }

    Object.values(userStatus).forEach(lastRecord => {
        // UNIQUEMENT les utilisateurs SIMULÉS qui sont IN_PROGRESS
        if (!lastRecord.isSimulated || lastRecord.stepStatus !== 'in_progress') return;

        // Durée cible (ms) stockée dans le record, sinon on la génère et on la sauvegarde
        if (!lastRecord.stepDurationNeeded) {
            lastRecord.stepDurationNeeded = getRandomStepDurationMs(lastRecord.stepFrom);
        }
        const stepDurationNeeded = lastRecord.stepDurationNeeded;

        // Has enough time passed? (Simulate varying speeds)
        const timeSpentMs = now - new Date(lastRecord.timestamp);

        // LOG pour vérifier les durées
        const timeSpentSec = Math.floor(timeSpentMs / 1000);
        const neededSec = Math.floor(stepDurationNeeded / 1000);

        if (timeSpentMs > stepDurationNeeded) {
            // MOVE TO NEXT STEP
            updates = true;
            
            console.log(`[Sim] 🤖 ${lastRecord.travelerId.substr(0, 8)} spent ${timeSpentSec}s (needed ${neededSec}s) at ${lastRecord.stepFrom} -> advancing`);

            // 1. Mark current as COMPLETED
            const completedRecord = {
                ...lastRecord,
                id: `rec_sim_done_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                timestamp: now.toISOString(),
                durationSeconds: Math.floor(timeSpentMs / 1000),
                stepStatus: 'completed'
            };

            // REMPLACEMENT: On remplace l'ancien record "in_progress" par le "completed"
            // Cela évite d'avoir des doublons "IN" + "COMPLETED" pour la même étape
            const idx = crowdDataset.indexOf(lastRecord);
            if (idx !== -1) {
                crowdDataset[idx] = completedRecord;
            } else {
                crowdDataset.push(completedRecord);
            }

            // 2. Start NEXT STEP (if any)
            const nextStepMap = {
                'entrance': 'checkin',
                'checkin': 'security',
                'security': 'passport',
                'passport': 'duty_free',
                'duty_free': 'gate',
                'gate': 'arrival', // Corrected: removed 'boarding' intermediate
                'arrival': 'baggage_claim',
                'baggage_claim': 'exit',
                'exit': 'finished'
            };

            const nextStep = nextStepMap[lastRecord.stepTo];

            if (nextStep && nextStep !== 'finished') {
                const newInProgress = {
                    ...lastRecord, // Keep passenger info
                    id: `rec_sim_IN_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                    stepFrom: lastRecord.stepTo, // We are now IN the previous 'to'
                    stepTo: nextStep,
                    durationSeconds: 0,
                    timestamp: now.toISOString(),
                    stepStatus: 'in_progress',
                    stepDurationNeeded: getRandomStepDurationMs(nextStep)
                };
                crowdDataset.unshift(newInProgress);
                console.log(`[Sim] 🤖 User ${lastRecord.travelerId.substr(0, 4)} advanced: ${newInProgress.stepFrom}`);
            } else {
                // Si c'est fini (stepTo='finished'), on ne crée pas de nouveau record IN_PROGRESS
                // Le record 'completed' précédent (exit->finished) suffit pour marquer la fin
                console.log(`[Sim] 🏁 User ${lastRecord.travelerId.substr(0, 4)} finished journey.`);
            }
        }
    });

    if (updates) {
        // Limit dataset
        if (crowdDataset.length > 5000) crowdDataset = crowdDataset.slice(0, 5000);
        saveDataset(crowdDataset);

        io.emit('dataset-updated', {
            dataset: crowdDataset,
            activeUsers: activeConnections + simulatedUsers
        });
    }
}, 3000); // Check every 3 seconds for smoother animation


// ===== DÉMARRAGE =====

const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║     🚀 SMART TRAVELER SYNC SERVER                  ║');
    console.log('╠════════════════════════════════════════════════════╣');
    console.log(`║  HTTP API:    http://localhost:${PORT}      ║`);
    console.log(`║  WebSocket:   ws://localhost:${PORT}                    ║`);
    console.log('╠════════════════════════════════════════════════════╣');
    console.log('║  Pour l\'App Mobile, utilisez l\'IP de votre PC:     ║');
    console.log(`║  ex: http://192.168.x.x:${PORT}                        ║`);
    console.log('╚════════════════════════════════════════════════════╝');
    console.log('');
});
