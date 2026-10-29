import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import type { BookFormValues } from '../_utils/bookSchema';
import { BookForm } from './BookForm';

jest.mock('./OptionSelect', () => ({
  OptionSelect: ({ id, value, onValueChange, options, placeholder }: never) => {
    const props = { id, value, onValueChange, options, placeholder } as {
      id: string;
      value: string;
      onValueChange: (value: string) => void;
      options: { value: string; label: string }[];
      placeholder: string;
    };
    return (
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
    );
  },
}));

const empty: BookFormValues = {
  title: '',
  price: '',
  isAvailable: true,
  authorId: '',
  publisherId: '',
  genreId: '',
};

function Harness(
  props: Partial<React.ComponentProps<typeof BookForm>> & { defaults?: BookFormValues },
) {
  const form = useForm<BookFormValues>({ defaultValues: props.defaults ?? empty });
  return (
    <BookForm
      form={form}
      imageField={<div>campo de imagen</div>}
      authors={[{ id: 'a1', name: 'Cortázar' }]}
      publishers={[{ id: 'p1', name: 'Alfaguara' }]}
      genres={[{ id: 'g1', name: 'Novela' }]}
      onSubmit={jest.fn()}
      onCancel={jest.fn()}
      onAddCatalogItem={jest.fn()}
      serverError={null}
      isSubmitting={false}
      isEditing={false}
      {...props}
    />
  );
}

describe('BookForm', () => {
  it('muestra todos los campos y el de imagen recibido', () => {
    render(<Harness />);

    expect(screen.getByLabelText('Título')).toBeInTheDocument();
    expect(screen.getByLabelText('Precio (CLP)')).toBeInTheDocument();
    expect(screen.getByLabelText('Selecciona un autor')).toBeInTheDocument();
    expect(screen.getByLabelText('Selecciona una editorial')).toBeInTheDocument();
    expect(screen.getByLabelText('Selecciona un género')).toBeInTheDocument();
    expect(screen.getByLabelText('Disponible para la venta')).toBeChecked();
    expect(screen.getByText('campo de imagen')).toBeInTheDocument();
  });

  it('escribe en el formulario y cambia la disponibilidad', async () => {
    render(<Harness />);

    await userEvent.type(screen.getByLabelText('Título'), 'Rayuela');
    await userEvent.type(screen.getByLabelText('Precio (CLP)'), '9990');
    await userEvent.selectOptions(screen.getByLabelText('Selecciona un autor'), 'a1');
    await userEvent.click(screen.getByLabelText('Disponible para la venta'));

    expect(screen.getByLabelText('Título')).toHaveValue('Rayuela');
    expect(screen.getByLabelText('Precio (CLP)')).toHaveValue('$9.990');
    expect(screen.getByLabelText('Selecciona un autor')).toHaveValue('a1');
    expect(screen.getByLabelText('Disponible para la venta')).not.toBeChecked();
  });

  it('muestra el botón según el modo', () => {
    const { rerender } = render(<Harness isEditing={false} />);
    expect(screen.getByRole('button', { name: 'Crear libro' })).toBeInTheDocument();

    rerender(<Harness isEditing />);
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument();
  });

  it('mientras guarda deshabilita el envío', () => {
    render(<Harness isSubmitting />);

    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled();
  });

  it('envía y cancela', async () => {
    const onSubmit = jest.fn((event?: React.FormEvent) => event?.preventDefault());
    const onCancel = jest.fn();
    render(<Harness onSubmit={onSubmit} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole('button', { name: 'Crear libro' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onSubmit).toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalled();
  });

  it('muestra el error del servidor', () => {
    render(<Harness serverError="Ya existe un libro con ese título" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Ya existe un libro con ese título');
  });

  it('no muestra alerta sin error', () => {
    render(<Harness />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each([
    ['Agregar autor', 'authors'],
    ['Agregar editorial', 'publishers'],
    ['Agregar género', 'genres'],
  ])('el botón «%s» pide el alta de %s', async (name, kind) => {
    const onAddCatalogItem = jest.fn();
    render(<Harness onAddCatalogItem={onAddCatalogItem} />);

    await userEvent.click(screen.getByRole('button', { name }));

    expect(onAddCatalogItem).toHaveBeenCalledWith(kind);
  });
});
