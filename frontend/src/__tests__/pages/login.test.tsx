import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Login from '../../pages/login';

describe('Login page', () => {
  it('renders login form', () => {
    render(<Login />);
    expect(screen.getByText('Acesso ao Sistema')).toBeInTheDocument();
  });

  it('renders email and password fields', () => {
    render(<Login />);
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Senha')).toBeInTheDocument();
  });

  it('renders the login button', () => {
    render(<Login />);
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });
});
