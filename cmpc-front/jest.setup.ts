import '@testing-library/jest-dom';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Los tests con `@jest-environment node` no tienen DOM.
if (typeof window !== 'undefined') {
  globalThis.ResizeObserver ??= ResizeObserverStub;

  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};

  URL.createObjectURL ??= () => 'blob:mock';
  URL.revokeObjectURL ??= () => {};
}
