import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(__dirname, '..');
const DIRS = ['app', 'components', 'hooks', 'utils', 'services'];
const EXTENSIONS = /\.(tsx?|css)$/;
const SKIP = new Set(['components/Lightfall.tsx', 'components/ShinyText.tsx']);

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return EXTENSIONS.test(name) && !/\.spec\.tsx?$/.test(name) ? [path] : [];
  });
}

const files = DIRS.flatMap((dir) => sources(join(ROOT, dir))).filter(
  (file) => !SKIP.has(relative(ROOT, file)),
);

const FORBIDDEN: { name: string; pattern: RegExp }[] = [
  { name: 'tamaño arbitrario (text-[14px], text-[0.8rem]…)', pattern: /\btext-\[\s*[\d.]+\s*(px|rem|em|%)?\s*\]/ },
  { name: 'fontSize en línea', pattern: /\bfontSize\b/ },
  { name: 'font-size escrito a mano', pattern: /\bfont-size\s*:/ },
];

describe('escala tipográfica', () => {
  it('revisa archivos (la prueba no puede quedar vacía)', () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it.each(FORBIDDEN)('ningún archivo usa $name', ({ pattern }) => {
    const offenders = files
      .filter((file) => pattern.test(readFileSync(file, 'utf8')))
      .map((file) => relative(ROOT, file));

    expect(offenders).toEqual([]);
  });

  it('el detector sí reconoce lo prohibido', () => {
    const [arbitrary] = FORBIDDEN;
    expect(arbitrary.pattern.test('className="text-[14px]"')).toBe(true);
    expect(arbitrary.pattern.test('className="text-[0.8rem]"')).toBe(true);
    expect(arbitrary.pattern.test('className="text-sm"')).toBe(false);
    expect(FORBIDDEN[1].pattern.test('style={{ fontSize: 20 }}')).toBe(true);
    expect(FORBIDDEN[2].pattern.test('font-size: 14px')).toBe(true);
  });
});
