import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookActions } from './BookActions';

describe('BookActions', () => {
  it('editar y eliminar llaman a su acción', async () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    render(<BookActions title="Rayuela" onEdit={onEdit} onDelete={onDelete} />);

    await userEvent.click(screen.getByRole('button', { name: 'Editar Rayuela' }));
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar Rayuela' }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
