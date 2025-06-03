import { render, screen } from '@testing-library/react';
import App from '../App';
import { describe, it, expect } from 'vitest';

describe('App', () => {
  it('renderiza el título principal', () => {
    render(<App />);
    expect(screen.getByText(/mensajería/i)).toBeInTheDocument();
  });
});
