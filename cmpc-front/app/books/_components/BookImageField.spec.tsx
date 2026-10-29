import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookImageField } from './BookImageField';

jest.mock('react-easy-crop', () => ({
  __esModule: true,
  default: (props: { onCropComplete: (percentages: unknown, pixels: unknown) => void }) => (
    <button
      type="button"
      data-testid="cropper"
      onClick={() => props.onCropComplete({ x: 10, y: 5, width: 60, height: 80 }, {})}
    />
  ),
}));

function setup(props: Partial<React.ComponentProps<typeof BookImageField>> = {}) {
  const handlers = { onSelect: jest.fn(), onClear: jest.fn(), onRestore: jest.fn() };
  const view = render(
    <BookImageField
      title="Rayuela"
      shownUrl={null}
      hasCurrent={false}
      removed={false}
      error={null}
      {...handlers}
      {...props}
    />,
  );
  return { ...handlers, ...view };
}

describe('BookImageField', () => {
  it('sin imagen ofrece cargar, deja quitar deshabilitado y la portada no es clicable', () => {
    setup();

    expect(screen.getByRole('button', { name: /Cargar imagen/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quitar' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Ajustar encuadre' })).not.toBeInTheDocument();
  });

  it('con imagen ofrece cambiar y quitar', async () => {
    const { onClear } = setup({ shownUrl: 'https://res.cloudinary.com/x.webp', hasCurrent: true });

    expect(screen.getByRole('button', { name: /Cambiar imagen/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Quitar/ }));

    expect(onClear).toHaveBeenCalled();
  });

  it('entrega el archivo original, sin recortar, y abre el ajuste de encuadre', async () => {
    const { onSelect, container } = setup({ shownUrl: 'blob:preview' });
    const file = new File(['x'], 'portada.png', { type: 'image/png' });

    await userEvent.upload(container.querySelector('input[type="file"]')!, file);

    expect(onSelect).toHaveBeenCalledWith(file);
    expect(await screen.findByRole('dialog', { name: 'Ajustar portada' })).toBeInTheDocument();
  });

  it('cancelar el ajuste conserva la imagen elegida', async () => {
    const { container } = setup({ shownUrl: 'blob:preview' });

    await userEvent.upload(
      container.querySelector('input[type="file"]')!,
      new File(['x'], 'portada.png', { type: 'image/png' }),
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ajustar encuadre' })).toBeInTheDocument();
  });

  it('sin archivo elegido no hace nada', () => {
    const { onSelect, container } = setup();

    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [] } });

    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('tocar la portada abre el ajuste también con una imagen ya guardada', async () => {
    setup({ shownUrl: 'https://res.cloudinary.com/x.webp', hasCurrent: true });

    await userEvent.click(screen.getByRole('button', { name: 'Ajustar encuadre' }));

    expect(await screen.findByRole('dialog', { name: 'Ajustar portada' })).toBeInTheDocument();
  });

  it('al aplicar, la vista previa se muestra con el encuadre elegido', async () => {
    setup({ shownUrl: 'https://res.cloudinary.com/x.webp', hasCurrent: true, title: 'Rayuela' });

    await userEvent.click(screen.getByRole('button', { name: 'Ajustar encuadre' }));
    await userEvent.click(await screen.findByTestId('cropper'));
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    const image = screen.getByAltText('Portada de Rayuela');
    expect(image.tagName).toBe('IMG');
    expect(parseFloat(image.style.width)).toBeCloseTo(10000 / 60);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('quitar la imagen olvida el encuadre', async () => {
    const { onClear } = setup({ shownUrl: 'blob:preview' });

    await userEvent.click(screen.getByRole('button', { name: /Quitar/ }));

    expect(onClear).toHaveBeenCalled();
  });

  it('el botón de cargar abre el selector de archivos', async () => {
    const { container } = setup();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const click = jest.spyOn(input, 'click');

    await userEvent.click(screen.getByRole('button', { name: /Cargar imagen/ }));

    expect(click).toHaveBeenCalled();
  });

  it('ofrece conservar la portada actual si se marcó quitarla', async () => {
    const { onRestore } = setup({ removed: true, hasCurrent: true });

    await userEvent.click(screen.getByRole('button', { name: /Conservar la actual/ }));

    expect(onRestore).toHaveBeenCalled();
  });

  it('no ofrece conservar si no hay portada actual', () => {
    setup({ removed: true, hasCurrent: false });

    expect(screen.queryByRole('button', { name: /Conservar/ })).not.toBeInTheDocument();
  });

  it('muestra el error', () => {
    setup({ error: 'La portada no puede superar los 5 MB' });

    expect(screen.getByText('La portada no puede superar los 5 MB')).toBeInTheDocument();
  });
});
