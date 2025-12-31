export type DemoPassenger = {
  passengerName: string;
  flightNumber: string;
  destination: string;
  destinationCode: string;
  seatNumber: string;
  loyaltyTier: 'standard' | 'silver' | 'gold' | 'platinum';
  hasCheckedBag: boolean;
};

export const DEMO_PASSENGERS: DemoPassenger[] = [
  {
    passengerName: 'Mohamed Alami',
    flightNumber: 'AT205',
    destination: 'Paris CDG',
    destinationCode: 'CDG',
    seatNumber: '12A',
    loyaltyTier: 'gold',
    hasCheckedBag: true,
  },
  {
    passengerName: 'Sara Benali',
    flightNumber: 'AT302',
    destination: 'Londres Heathrow',
    destinationCode: 'LHR',
    seatNumber: '18C',
    loyaltyTier: 'silver',
    hasCheckedBag: false,
  },
  {
    passengerName: 'Youssef El Idrissi',
    flightNumber: 'AT125',
    destination: 'Dubai',
    destinationCode: 'DXB',
    seatNumber: '3F',
    loyaltyTier: 'platinum',
    hasCheckedBag: true,
  },
];
