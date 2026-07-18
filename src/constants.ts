import { Ride } from './types';

export const CITIES = [
  "Luanda",
  "Benguela",
  "Huambo",
  "Lubango",
  "Lobito",
  "Malanje",
  "Namibe",
  "Cabinda",
  "Soyo",
  "Sumbe"
];

export const MOCK_RIDES: Ride[] = [
  {
    id: '1',
    driver: {
      id: 'd1',
      full_name: 'Paulo João',
      rating: 4.8,
      reviews_count: 124,
      avatar_url: 'https://picsum.photos/seed/user1/100/100',
      is_verified: true,
      experience_level: 'ambassador',
      bio: 'Motorista cuidadoso, viajo regularmente para Benguela a trabalho.'
    },
    origin: 'Luanda',
    destination: 'Benguela',
    date: '2023-11-15',
    time: '08:00',
    price: 8000,
    currency: 'Kz',
    availableSeats: 3,
    duration: '7h 30m',
    stops: ['Sumbe', 'Lobito'],
    preferences: {
      smoking: false,
      pets: false,
      music: true,
      chattiness: 'talkative'
    }
  },
  {
    id: '2',
    driver: {
      id: 'd2',
      full_name: 'Maria Costa',
      rating: 4.9,
      reviews_count: 45,
      avatar_url: 'https://picsum.photos/seed/user2/100/100',
      is_verified: true,
      experience_level: 'expert',
      bio: 'Adoro viajar e conhecer pessoas novas durante o trajeto.'
    },
    origin: 'Luanda',
    destination: 'Huambo',
    date: '2023-11-15',
    time: '06:30',
    price: 12000,
    currency: 'Kz',
    availableSeats: 2,
    duration: '9h 15m',
    stops: ['Dondo'],
    preferences: {
      smoking: false,
      pets: true,
      music: true,
      chattiness: 'medium'
    }
  },
  {
    id: '3',
    driver: {
      id: 'd3',
      full_name: 'Carlos Manuel',
      rating: 4.5,
      reviews_count: 12,
      avatar_url: 'https://picsum.photos/seed/user3/100/100',
      is_verified: false,
      experience_level: 'intermediate',
      bio: 'Viagens tranquilas e seguras.'
    },
    origin: 'Benguela',
    destination: 'Luanda',
    date: '2023-11-16',
    time: '14:00',
    price: 7500,
    currency: 'Kz',
    availableSeats: 4,
    duration: '7h 30m',
    stops: ['Lobito'],
    preferences: {
      smoking: true,
      pets: false,
      music: false,
      chattiness: 'quiet'
    }
  },
  {
    id: '4',
    driver: {
      id: 'd4',
      full_name: 'Ana Silva',
      rating: 5.0,
      reviews_count: 8,
      avatar_url: 'https://picsum.photos/seed/user4/100/100',
      is_verified: true,
      experience_level: 'novice',
      bio: 'Começando a oferecer caronas agora!'
    },
    origin: 'Lubango',
    destination: 'Namibe',
    date: '2023-11-16',
    time: '09:00',
    price: 3000,
    currency: 'Kz',
    availableSeats: 1,
    duration: '2h 15m',
    stops: [],
    preferences: {
      smoking: false,
      pets: false,
      music: true,
      chattiness: 'medium'
    }
  }
];
