// =====================================
// FLIGHT TRAFFIC SERVICE
// Real-time flight data from AviationStack API
// =====================================

const AVIATIONSTACK_API_KEY = '4271bd172a895161ce68879a6644232c';
const AIRPORT_CODE = 'CMN';
const BASE_URL = 'http://api.aviationstack.com/v1/flights';
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const API_TIMEOUT_MS = 5000; // 5 seconds

export interface FlightTrafficData {
    arrivals: number;
    departures: number;
    totalFlights: number;
    trafficLevel: 'low' | 'medium' | 'high';
    trafficLabel: string;
    trafficColor: string;
    waitTimeMultiplier: number;
    lastUpdated: Date;
    isFromCache: boolean;
    isFromMock: boolean;
}

interface AviationStackResponse {
    pagination: {
        total: number;
        count: number;
    };
    data: Array<{
        flight: { iata: string };
        airline: { name: string };
        departure: { airport: string; scheduled: string };
        arrival: { airport: string; scheduled: string };
    }>;
}

// Cache storage
let cachedData: FlightTrafficData | null = null;
let cacheTimestamp: number = 0;
let isApiFetching: boolean = false;
let apiCallPromise: Promise<FlightTrafficData> | null = null;

// Mock data for fallback
const generateMockData = (): FlightTrafficData => {
    const hour = new Date().getHours();
    
    // Simulate realistic traffic based on time of day
    let arrivals: number;
    let departures: number;
    
    if (hour >= 6 && hour <= 9) {
        // Morning rush
        arrivals = 15 + Math.floor(Math.random() * 10);
        departures = 20 + Math.floor(Math.random() * 15);
    } else if (hour >= 11 && hour <= 14) {
        // Midday
        arrivals = 10 + Math.floor(Math.random() * 8);
        departures = 12 + Math.floor(Math.random() * 8);
    } else if (hour >= 17 && hour <= 21) {
        // Evening rush
        arrivals = 18 + Math.floor(Math.random() * 12);
        departures = 22 + Math.floor(Math.random() * 15);
    } else if (hour >= 22 || hour <= 5) {
        // Night (low traffic)
        arrivals = 3 + Math.floor(Math.random() * 5);
        departures = 4 + Math.floor(Math.random() * 5);
    } else {
        // Normal hours
        arrivals = 8 + Math.floor(Math.random() * 7);
        departures = 10 + Math.floor(Math.random() * 8);
    }
    
    return processTrafficData(arrivals, departures, true);
};

// Process raw counts into full traffic data
const processTrafficData = (arrivals: number, departures: number, isMock: boolean): FlightTrafficData => {
    const totalFlights = arrivals + departures;
    
    let trafficLevel: 'low' | 'medium' | 'high';
    let trafficLabel: string;
    let trafficColor: string;
    let waitTimeMultiplier: number;
    
    if (totalFlights < 15) {
        trafficLevel = 'low';
        trafficLabel = 'Faible';
        trafficColor = '#10B981'; // Green
        waitTimeMultiplier = 0.8; // 20% faster
    } else if (totalFlights <= 35) {
        trafficLevel = 'medium';
        trafficLabel = 'Modéré';
        trafficColor = '#F59E0B'; // Yellow
        waitTimeMultiplier = 1.0; // Normal
    } else {
        trafficLevel = 'high';
        trafficLabel = 'Intense';
        trafficColor = '#EF4444'; // Red
        waitTimeMultiplier = 1.0 + ((totalFlights - 35) * 0.02); // +2% per flight above 35
    }
    
    // Cap multiplier at 1.5x
    waitTimeMultiplier = Math.min(waitTimeMultiplier, 1.5);
    
    return {
        arrivals,
        departures,
        totalFlights,
        trafficLevel,
        trafficLabel,
        trafficColor,
        waitTimeMultiplier,
        lastUpdated: new Date(),
        isFromCache: false,
        isFromMock: isMock
    };
};

// Fetch with timeout
const fetchWithTimeout = async (url: string, timeout: number): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
};

// Fetch flight count from API
const fetchFlightCount = async (type: 'arrivals' | 'departures'): Promise<number> => {
    const iataParam = type === 'arrivals' ? 'arr_iata' : 'dep_iata';
    const url = `${BASE_URL}?access_key=${AVIATIONSTACK_API_KEY}&${iataParam}=${AIRPORT_CODE}&flight_status=active`;
    
    const response = await fetchWithTimeout(url, API_TIMEOUT_MS);
    
    if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
    }
    
    const data: AviationStackResponse = await response.json();
    
    // Check for API error
    if ((data as any).error) {
        throw new Error((data as any).error.message || 'API Error');
    }
    
    return data.pagination?.total || data.data?.length || 0;
};

// Main fetch function - ensures single API call
const fetchFromApi = async (): Promise<FlightTrafficData> => {
    console.log('[FlightTraffic] 🛫 Fetching real-time data from AviationStack...');
    
    try {
        // Fetch both endpoints in parallel
        const [arrivalsCount, departuresCount] = await Promise.all([
            fetchFlightCount('arrivals'),
            fetchFlightCount('departures')
        ]);
        
        console.log(`[FlightTraffic] ✅ API Success - Arrivals: ${arrivalsCount}, Departures: ${departuresCount}`);
        
        return processTrafficData(arrivalsCount, departuresCount, false);
    } catch (error: any) {
        console.log(`[FlightTraffic] ⚠️ API Failed: ${error.message}, using mock data`);
        return generateMockData();
    }
};

/**
 * Fetch real flight traffic data from AviationStack API
 * - Uses 10-minute cache to avoid rate limits
 * - 5-second timeout to prevent hanging
 * - Falls back to mock data on API failure
 * - Ensures only one API call at a time (singleton pattern)
 */
export const fetchRealFlightData = async (): Promise<FlightTrafficData> => {
    const now = Date.now();
    
    // Check if cache is valid
    if (cachedData && (now - cacheTimestamp) < CACHE_DURATION_MS) {
        console.log('[FlightTraffic] 📦 Returning cached data');
        return { ...cachedData, isFromCache: true };
    }
    
    // If already fetching, wait for that promise
    if (isApiFetching && apiCallPromise) {
        console.log('[FlightTraffic] ⏳ Waiting for existing API call...');
        return apiCallPromise;
    }
    
    // Start new API call
    isApiFetching = true;
    apiCallPromise = fetchFromApi()
        .then(data => {
            cachedData = data;
            cacheTimestamp = Date.now();
            isApiFetching = false;
            apiCallPromise = null;
            return data;
        })
        .catch(error => {
            console.error('[FlightTraffic] ❌ Fetch error:', error);
            isApiFetching = false;
            apiCallPromise = null;
            
            // Return mock data on failure
            const mockData = generateMockData();
            cachedData = mockData;
            cacheTimestamp = Date.now();
            return mockData;
        });
    
    return apiCallPromise;
};

// Get cached data synchronously (for initial render)
export const getCachedFlightData = (): FlightTrafficData | null => {
    if (cachedData && (Date.now() - cacheTimestamp) < CACHE_DURATION_MS) {
        return { ...cachedData, isFromCache: true };
    }
    return null;
};

// Force refresh (ignores cache)
export const forceRefreshFlightData = async (): Promise<FlightTrafficData> => {
    cachedData = null;
    cacheTimestamp = 0;
    return fetchRealFlightData();
};

// Get traffic level description
export const getTrafficDescription = (data: FlightTrafficData): string => {
    const source = data.isFromMock ? '(simulé)' : data.isFromCache ? '(cache)' : '(live)';
    return `${data.arrivals} arrivées, ${data.departures} départs/h ${source}`;
};
