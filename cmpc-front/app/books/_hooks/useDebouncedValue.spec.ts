import { act, renderHook } from '@testing-library/react';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('devuelve el valor inicial al tiro y el nuevo tras la espera', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 400), {
      initialProps: { value: 'a' },
    });
    expect(result.current).toBe('a');

    rerender({ value: 'b' });
    expect(result.current).toBe('a');

    act(() => jest.advanceTimersByTime(399));
    expect(result.current).toBe('a');
    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe('b');
  });

  it('reinicia la espera si el valor cambia de nuevo', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 400), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    act(() => jest.advanceTimersByTime(300));
    rerender({ value: 'c' });
    act(() => jest.advanceTimersByTime(300));
    expect(result.current).toBe('a');

    act(() => jest.advanceTimersByTime(100));
    expect(result.current).toBe('c');
  });
});
