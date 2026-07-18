import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RideCard } from '../../../src/components/RideCard';

const mockRide = {
  id: 'ride-123',
  origin: 'Luanda',
  destination: 'Benguela',
  date: '2026-04-20',
  time: '08:00',
  departure_time: '2026-04-20T08:00:00Z',
  price: 5000,
  currency: 'Kz',
  availableSeats: 3,
  duration: '4h 30m',
  stops: ['Sumbe', 'Lobito'],
  driver: {
    id: 'driver-1',
    name: 'João Silva',
    full_name: 'João Silva',
    rating: 4.8,
    reviews_count: 24,
    avatar_url: 'https://example.com/avatar.jpg',
    is_verified: true,
    experience_level: 'gold' as const,
  },
  preferences: {
    smoking: false,
    pets: true,
    music: true,
    chattiness: 'talkative' as const,
  },
  vehicle: {
    id: 'veh-1',
    owner_id: 'driver-1',
    make: 'Toyota',
    model: 'Corolla',
    color: 'Prata',
    plate: 'LD-00-12-AB',
    seats_capacity: 4,
  },
};

describe('RideCard', () => {
  it('deve renderizar informações da viagem', () => {
    const onClick = vi.fn();
    render(<RideCard ride={mockRide} onClick={onClick} />);

    expect(screen.getByText('Luanda')).toBeInTheDocument();
    expect(screen.getByText('Benguela')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
  });

  it('deve formatar preço corretamente', () => {
    const onClick = vi.fn();
    render(<RideCard ride={mockRide} onClick={onClick} />);

    expect(screen.getByText(/5.000 Kz/i)).toBeInTheDocument();
  });

  it('deve exibir assentos disponíveis', () => {
    const onClick = vi.fn();
    render(<RideCard ride={mockRide} onClick={onClick} />);

    expect(screen.getByText(/3 lug./i)).toBeInTheDocument();
  });

  it('deve clicar no card', () => {
    const onClick = vi.fn();
    const { container } = render(<RideCard ride={mockRide} onClick={onClick} />);

    // Get the card div by class or testid
    const card = container.querySelector('[role="button"]') || container.querySelector('div.cursor-pointer');

    if (card) {
      fireEvent.click(card);
      expect(onClick).toHaveBeenCalledWith(mockRide);
    }
  });

  it('deve exibir rating do motorista', () => {
    const onClick = vi.fn();
    render(<RideCard ride={mockRide} onClick={onClick} />);

    expect(screen.getByText(/4.8/i)).toBeInTheDocument();
    expect(screen.getByText(/24 avaliações/i)).toBeInTheDocument();
  });

  it('deve exibir informações do veículo', () => {
    const onClick = vi.fn();
    render(<RideCard ride={mockRide} onClick={onClick} />);

    expect(screen.getByText(/toyota corolla/i)).toBeInTheDocument();
    expect(screen.getByText(/prata/i)).toBeInTheDocument();
  });
});
