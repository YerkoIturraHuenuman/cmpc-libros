import { renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { useIsHydrated } from './useIsHydrated';

describe('useIsHydrated', () => {
  it('es true en el cliente', () => {
    const { result } = renderHook(() => useIsHydrated());
    expect(result.current).toBe(true);
  });

  it('es false al renderizar en el servidor', () => {
    function Probe() {
      return createElement('span', null, String(useIsHydrated()));
    }
    expect(renderToString(createElement(Probe))).toContain('false');
  });
});
