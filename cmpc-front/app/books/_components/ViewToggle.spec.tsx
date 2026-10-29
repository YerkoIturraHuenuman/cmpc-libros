import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ViewToggle } from './ViewToggle';

describe('ViewToggle', () => {
  it('marca la vista activa', () => {
    render(<ViewToggle view="list" onChange={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Vista en lista' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Vista en cuadrícula' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('al elegir la otra vista avisa con ella', async () => {
    const onChange = jest.fn();
    render(<ViewToggle view="grid" onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Vista en lista' }));
    await userEvent.click(screen.getByRole('button', { name: 'Vista en cuadrícula' }));

    expect(onChange).toHaveBeenNthCalledWith(1, 'list');
    expect(onChange).toHaveBeenNthCalledWith(2, 'grid');
  });

  it('el grupo tiene nombre accesible', () => {
    render(<ViewToggle view="grid" onChange={jest.fn()} />);
    expect(screen.getByRole('group', { name: 'Vista' })).toBeInTheDocument();
  });
});
