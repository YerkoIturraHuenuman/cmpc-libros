import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageCropDialog } from './ImageCropDialog';

const area = { x: 10, y: 5, width: 60, height: 80 };
const framing = { ...area, imageAspect: 5 / 7 };

jest.mock('react-easy-crop', () => ({
  __esModule: true,
  default: (props: {
    image: string;
    aspect: number;
    zoom: number;
    initialCroppedAreaPercentages?: unknown;
    onCropComplete: (percentages: unknown, pixels: unknown) => void;
    onMediaLoaded: (media: { naturalWidth: number; naturalHeight: number }) => void;
  }) => (
    <button
      type="button"
      data-testid="cropper"
      data-zoom={props.zoom}
      data-aspect={props.aspect}
      data-initial={JSON.stringify(props.initialCroppedAreaPercentages ?? null)}
      onClick={() => props.onCropComplete({ x: 10, y: 5, width: 60, height: 80 }, {})}
      onDoubleClick={() => props.onMediaLoaded({ naturalWidth: 400, naturalHeight: 800 })}
    >
      {props.image}
    </button>
  ),
}));

function setup(overrides: Partial<React.ComponentProps<typeof ImageCropDialog>> = {}) {
  const handlers = { onCancel: jest.fn(), onApply: jest.fn() };
  render(<ImageCropDialog src="blob:original" framing={null} {...handlers} {...overrides} />);
  return handlers;
}

describe('ImageCropDialog', () => {
  it('cerrado no muestra nada', () => {
    setup({ src: null });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('muestra la imagen con la proporción de portada', () => {
    setup();

    expect(screen.getByRole('dialog', { name: 'Ajustar portada' })).toBeInTheDocument();
    expect(screen.getByTestId('cropper')).toHaveTextContent('blob:original');
    expect(Number(screen.getByTestId('cropper').dataset.aspect)).toBeCloseTo(5 / 7);
  });

  it('no se puede aplicar hasta que el encuadre esté calculado', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeDisabled();
  });

  it('el zoom se controla con el deslizador', () => {
    setup();
    const slider = screen.getByRole('slider', { name: 'Zoom' });

    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    setValue.call(slider, '2');
    slider.dispatchEvent(new Event('input', { bubbles: true }));

    expect(screen.getByTestId('cropper').dataset.zoom).toBe('2');
  });

  it('al aplicar entrega el encuadre elegido', async () => {
    const { onApply } = setup();

    await userEvent.click(screen.getByTestId('cropper'));
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(onApply).toHaveBeenCalledWith(framing);
  });

  it('el marco toma la proporción real de la foto una vez cargada, para cubrirla entera', async () => {
    const { onApply } = setup();
    expect(Number(screen.getByTestId('cropper').dataset.aspect)).toBeCloseTo(5 / 7);

    await userEvent.dblClick(screen.getByTestId('cropper'));

    expect(Number(screen.getByTestId('cropper').dataset.aspect)).toBeCloseTo(0.5);
    await userEvent.click(screen.getByTestId('cropper'));
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
    expect(onApply).toHaveBeenCalledWith({ ...area, imageAspect: 0.5 });
  });

  it('al reabrir parte del encuadre anterior y permite aplicar de inmediato', async () => {
    const { onApply } = setup({ framing });

    expect(JSON.parse(screen.getByTestId('cropper').dataset.initial!)).toEqual(framing);
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(onApply).toHaveBeenCalledWith(framing);
  });

  it('cancelar avisa', async () => {
    const { onCancel } = setup();

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancel).toHaveBeenCalled();
  });

  it('cerrar con Escape también cancela', async () => {
    const { onCancel } = setup();

    await userEvent.keyboard('{Escape}');

    expect(onCancel).toHaveBeenCalled();
  });
});
