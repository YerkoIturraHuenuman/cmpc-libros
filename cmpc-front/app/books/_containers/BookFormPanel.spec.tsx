import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ApiError } from '@/services/httpClient';
import { useState } from 'react';
import { booksService } from '../_services/booksService';
import { catalogService, type CatalogItem, type CatalogKind } from '../_services/catalogService';
import { BookFormPanel } from './BookFormPanel';
import { makeBook } from './fixtures';

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('react-easy-crop', () => ({
  __esModule: true,
  default: (props: { onCropComplete: (area: unknown, pixels: unknown) => void }) => (
    <button
      type="button"
      data-testid="cropper"
      onClick={() => props.onCropComplete({}, { x: 0, y: 0, width: 10, height: 14 })}
    />
  ),
}));
jest.mock('../_services/booksService');
jest.mock('../_services/catalogService');
jest.mock('../_components/OptionSelect', () => ({
  OptionSelect: (props: {
    id: string;
    value: string;
    onValueChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder: string;
  }) => (
    <select
      id={props.id}
      aria-label={props.placeholder}
      value={props.value}
      onChange={(event) => props.onValueChange(event.target.value)}
    >
      <option value="">{props.placeholder}</option>
      {props.options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

const catalogs = {
  authors: [{ id: 'a1', name: 'Cortázar' }],
  publishers: [{ id: 'p1', name: 'Alfaguara' }],
  genres: [{ id: 'g1', name: 'Novela' }],
};

function setup(book = null as ReturnType<typeof makeBook> | null) {
  const onSaved = jest.fn();
  const onCancel = jest.fn();
  const onCatalogItemCreated = jest.fn();

  function Host() {
    const [authors, setAuthors] = useState(catalogs.authors);
    return (
      <Dialog open>
        <DialogContent>
          <BookFormPanel
            book={book}
            {...catalogs}
            authors={authors}
            onSaved={onSaved}
            onCancel={onCancel}
            onCatalogItemCreated={(kind: CatalogKind, item: CatalogItem) => {
              onCatalogItemCreated(kind, item);
              if (kind === 'authors') setAuthors((prev) => [...prev, item]);
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }
  render(<Host />);
  return { onSaved, onCancel, onCatalogItemCreated };
}

describe('BookFormPanel', () => {
  beforeEach(() => jest.resetAllMocks());

  it('en modo crear muestra el título y el botón de crear', () => {
    setup();

    expect(screen.getByRole('heading', { name: 'Nuevo libro' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear libro' })).toBeInTheDocument();
    expect(screen.getByLabelText('Título')).toHaveValue('');
  });

  it('en modo editar parte con los datos del libro', () => {
    setup(makeBook());

    expect(screen.getByRole('heading', { name: 'Editar libro' })).toBeInTheDocument();
    expect(screen.getByLabelText('Título')).toHaveValue('Rayuela');
    expect(screen.getByLabelText('Precio (CLP)')).toHaveValue('$12.990');
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument();
  });

  it('enviar vacío muestra los errores de validación y no llama a la API', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Crear libro' }));

    expect(await screen.findByText('El título es obligatorio')).toBeInTheDocument();
    const errors = screen.getAllByRole('alert').map((alert) => alert.textContent);
    expect(errors).toEqual(
      expect.arrayContaining([
        'Ingresa el precio',
        'Selecciona un autor',
        'Selecciona una editorial',
        'Selecciona un género',
      ]),
    );
    expect(booksService.create).not.toHaveBeenCalled();
  });

  it('completar y enviar crea el libro', async () => {
    jest.mocked(booksService.create).mockResolvedValue(makeBook());
    const { onSaved } = setup();

    await userEvent.type(screen.getByLabelText('Título'), 'Ficciones');
    await userEvent.type(screen.getByLabelText('Precio (CLP)'), '9990');
    await userEvent.selectOptions(screen.getByLabelText('Selecciona un autor'), 'a1');
    await userEvent.selectOptions(screen.getByLabelText('Selecciona una editorial'), 'p1');
    await userEvent.selectOptions(screen.getByLabelText('Selecciona un género'), 'g1');
    await userEvent.click(screen.getByRole('button', { name: 'Crear libro' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(jest.mocked(booksService.create).mock.calls[0][0].get('title')).toBe('Ficciones');
  });

  it('cancelar avisa', async () => {
    const { onCancel } = setup();

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancel).toHaveBeenCalled();
  });

  it('permite elegir una portada y muestra su vista previa', async () => {
    jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview');
    setup();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(input, new File(['x'], 'p.png', { type: 'image/png' }));
    await userEvent.click(await screen.findByTestId('cropper'));
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(await screen.findByRole('button', { name: /Cambiar imagen/ })).toBeInTheDocument();
  });

  it('rechaza una portada de tipo inválido', async () => {
    setup();
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const user = userEvent.setup({ applyAccept: false });

    await user.upload(input, new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' }));

    expect(await screen.findByText('La portada debe ser JPEG, PNG o WebP')).toBeInTheDocument();
  });

  describe('alta de un autor desde el formulario', () => {
    const newAuthor = { id: 'a-new', name: 'Alejandra Pizarnik' };

    async function openAuthorDialog() {
      await userEvent.click(screen.getByRole('button', { name: 'Agregar autor' }));
      return screen.findByRole('dialog', { name: 'Nuevo autor' });
    }

    it('abre un diálogo y, al crear, deja elegido el autor nuevo', async () => {
      jest.mocked(catalogService.create).mockResolvedValue(newAuthor);
      const { onCatalogItemCreated } = setup();

      const dialog = await openAuthorDialog();
      await userEvent.type(within(dialog).getByLabelText('Nombre'), '  Alejandra Pizarnik ');
      await userEvent.click(within(dialog).getByRole('button', { name: 'Crear autor' }));

      await waitFor(() => expect(onCatalogItemCreated).toHaveBeenCalledWith('authors', newAuthor));
      expect(catalogService.create).toHaveBeenCalledWith('authors', 'Alejandra Pizarnik');
      expect(screen.queryByRole('dialog', { name: 'Nuevo autor' })).not.toBeInTheDocument();
      expect(screen.getByLabelText('Selecciona un autor')).toHaveValue('a-new');
    });

    it('pide el nombre antes de crear', async () => {
      setup();

      const dialog = await openAuthorDialog();
      await userEvent.click(within(dialog).getByRole('button', { name: 'Crear autor' }));

      expect(await within(dialog).findByText('Escribe un nombre')).toBeInTheDocument();
      expect(catalogService.create).not.toHaveBeenCalled();
    });

    it('si la API lo rechaza (por ejemplo, ya existe) lo muestra y no cierra', async () => {
      jest.mocked(catalogService.create).mockRejectedValue(new ApiError(409, 'Ya existe'));
      setup();

      const dialog = await openAuthorDialog();
      await userEvent.type(within(dialog).getByLabelText('Nombre'), 'Cortázar');
      await userEvent.click(within(dialog).getByRole('button', { name: 'Crear autor' }));

      expect(await within(dialog).findByRole('alert')).toHaveTextContent('Ya existe');
      expect(screen.getByRole('dialog', { name: 'Nuevo autor' })).toBeInTheDocument();
    });

    it('cancelar cierra el diálogo sin crear nada', async () => {
      setup();

      const dialog = await openAuthorDialog();
      await userEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

      expect(screen.queryByRole('dialog', { name: 'Nuevo autor' })).not.toBeInTheDocument();
      expect(catalogService.create).not.toHaveBeenCalled();
    });
  });
});
