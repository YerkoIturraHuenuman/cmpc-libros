import { downloadBlob } from './downloadBlob';

describe('downloadBlob', () => {
  it('descarga el archivo con el nombre indicado y libera la URL', () => {
    const create = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:abc');
    const revoke = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const click = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        expect(this.download).toBe('libros.csv');
        expect(this.href).toBe('blob:abc');
      });
    const blob = new Blob(['csv']);

    downloadBlob(blob, 'libros.csv');

    expect(create).toHaveBeenCalledWith(blob);
    expect(click).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledWith('blob:abc');
    expect(document.querySelector('a[download]')).toBeNull();
  });
});
