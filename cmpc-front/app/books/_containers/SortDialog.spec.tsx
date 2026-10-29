import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SortDialog } from './SortDialog';

jest.mock('../_components/SortControls', () => ({
  SortControls: ({
    sort,
    onChange,
  }: {
    sort: unknown[];
    onChange: (sort: unknown[]) => void;
  }) => (
    <div>
      <p>criterios: {sort.length}</p>
      <button onClick={() => onChange([{ field: 'title', direction: 'asc' }])}>agregar (mock)</button>
    </div>
  ),
}));

describe('SortDialog', () => {
  it('cerrado no se muestra', () => {
    render(<SortDialog open={false} sort={[]} onChange={jest.fn()} onClose={jest.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('abierto explica la combinación de campos y recibe el orden actual', () => {
    render(
      <SortDialog
        open
        sort={[{ field: 'price', direction: 'asc' }]}
        onChange={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Orden personalizado' })).toHaveTextContent(
      'hasta tres campos',
    );
    expect(screen.getByText('criterios: 1')).toBeInTheDocument();
  });

  it('los cambios de orden se aplican al instante', async () => {
    const onChange = jest.fn();
    render(<SortDialog open sort={[]} onChange={onChange} onClose={jest.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'agregar (mock)' }));

    expect(onChange).toHaveBeenCalledWith([{ field: 'title', direction: 'asc' }]);
  });

  it('«Listo» y Escape cierran', async () => {
    const onClose = jest.fn();
    render(<SortDialog open sort={[]} onChange={jest.fn()} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Listo' }));
    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
