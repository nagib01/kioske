import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Servicos from '../../pages/servicos';

describe('Servicos page (Kiosk)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the page title', () => {
    render(<Servicos />);
    expect(screen.getByText('Selecione o Serviço')).toBeInTheDocument();
  });

  it('renders loading state initially', () => {
    render(<Servicos />);
    expect(screen.getByText('A carregar serviços...')).toBeInTheDocument();
  });
});
