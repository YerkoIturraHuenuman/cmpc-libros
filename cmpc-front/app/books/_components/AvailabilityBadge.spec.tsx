import { render, screen } from '@testing-library/react';
import { AvailabilityBadge } from './AvailabilityBadge';

describe('AvailabilityBadge', () => {
  it('muestra «Disponible» en verde', () => {
    render(<AvailabilityBadge isAvailable />);

    const badge = screen.getByText('Disponible');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('muestra «No disponible» en rojo', () => {
    render(<AvailabilityBadge isAvailable={false} />);

    const badge = screen.getByText('No disponible');
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });
});
