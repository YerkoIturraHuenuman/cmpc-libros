import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CatalogItemDialog } from './CatalogItemDialog';

jest.mock('./CatalogItemPanel', () => ({
  CatalogItemPanel: ({
    kind,
    onCreated,
    onCancel,
  }: {
    kind: string;
    onCreated: (item: { id: string; name: string }) => void;
    onCancel: () => void;
  }) => (
    <div>
      <p>panel de {kind}</p>
      <button onClick={() => onCreated({ id: 'n1', name: 'Nuevo' })}>crear</button>
      <button onClick={onCancel}>cancelar panel</button>
    </div>
  ),
}));

describe('CatalogItemDialog', () => {
  it('sin tipo no se muestra', () => {
    render(<CatalogItemDialog kind={null} onCreated={jest.fn()} onClose={jest.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('con un tipo monta el panel de ese tipo', () => {
    render(<CatalogItemDialog kind="genres" onCreated={jest.fn()} onClose={jest.fn()} />);
    expect(screen.getByText('panel de genres')).toBeInTheDocument();
  });

  it('al crear avisa con el tipo y el elemento', async () => {
    const onCreated = jest.fn();
    render(<CatalogItemDialog kind="authors" onCreated={onCreated} onClose={jest.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'crear' }));

    expect(onCreated).toHaveBeenCalledWith('authors', { id: 'n1', name: 'Nuevo' });
  });

  it('Escape y cancelar cierran', async () => {
    const onClose = jest.fn();
    render(<CatalogItemDialog kind="authors" onCreated={jest.fn()} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: 'cancelar panel' }));
    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
