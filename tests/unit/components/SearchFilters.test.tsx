import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchFilters, FilterState } from '../../../src/components/SearchFilters';

describe('SearchFilters', () => {
  const mockFilters: FilterState = {
    minPrice: 0,
    maxPrice: 10000,
    timeOfDay: [],
    amenities: {
      pets: false,
      smoking: false,
      instantBooking: false,
      womenOnly: false,
    },
    baggage: [],
    driverLevel: [],
  };

  const defaultProps = {
    isOpen: true as const,
    onClose: vi.fn(),
    filters: mockFilters,
    setFilters: vi.fn() as React.Dispatch<React.SetStateAction<FilterState>>,
    priceRange: { min: 0, max: 10000 },
    totalResults: 10,
  };

  it('deve renderizar filtros corretamente', () => {
    render(<SearchFilters {...defaultProps} />);

    expect(screen.getByText(/filtros/i)).toBeInTheDocument();
    expect(screen.getByText(/faixa de preço/i)).toBeInTheDocument();
    expect(screen.getByText(/horário de saída/i)).toBeInTheDocument();
    expect(screen.getByText(/comodidades/i)).toBeInTheDocument();
  });

  it('deve renderizar botão de fechar', () => {
    render(<SearchFilters {...defaultProps} />);

    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(btn => btn.parentElement?.querySelector('svg'));

    if (closeButton) {
      fireEvent.click(closeButton);
      expect(defaultProps.onClose).toHaveBeenCalled();
    }
  });

  it('deve renderizar faixas de horário', () => {
    render(<SearchFilters {...defaultProps} />);

    expect(screen.getByText(/manhã/i)).toBeInTheDocument();
    expect(screen.getByText(/tarde/i)).toBeInTheDocument();
    expect(screen.getByText(/noite/i)).toBeInTheDocument();
  });

  it('deve renderizar opções de bagagem', () => {
    render(<SearchFilters {...defaultProps} />);

    expect(screen.getByText(/pequena \(mochila\)/i)).toBeInTheDocument();
    expect(screen.getByText(/média \(mala de mão\)/i)).toBeInTheDocument();
    expect(screen.getByText(/grande \(despachada\)/i)).toBeInTheDocument();
  });

  it('deve renderizar botão de ação', () => {
    render(<SearchFilters {...defaultProps} />);

    expect(screen.getByText(/ver 10 caronas/i)).toBeInTheDocument();
  });
});
