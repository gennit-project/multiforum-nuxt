import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/*
assets/css/index.css resets Tailwind's palette (`--color-*: initial`) and
defines a custom one. A color class whose hue/stop isn't defined there (e.g.
`bg-slate-100`, `dark:bg-gray-975`) generates no CSS at all, with no build
warning — issue #582 found ~400 of them, including an invisible primary button
in every modal. This test fails with the offending file:line for each one.
*/

const ROOT = path.resolve(__dirname, '../..');
const SOURCE_DIRS = [
  'components',
  'pages',
  'layouts',
  'composables',
  'utils',
  'plugins',
];
const SOURCE_FILES = ['app.vue', 'error.vue'];

// Tailwind's default hue names: a class using one of these is a palette color.
const TAILWIND_HUES = [
  'slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber',
  'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue',
  'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
];

const COLOR_CLASS = new RegExp(
  String.raw`(?<![\w-])(?:[a-z0-9-]+:)*!?(?:bg|text|border(?:-[trblxyse])?|ring(?:-offset)?|outline|divide|placeholder|from|via|to|fill|stroke|decoration|accent|caret|shadow)-(` +
    TAILWIND_HUES.join('|') +
    String.raw`)-(\d{2,3})(?:/\d+)?(?![\w-])`,
  'g'
);

const definedColors = (): Set<string> => {
  const css = fs.readFileSync(path.join(ROOT, 'assets/css/index.css'), 'utf8');
  return new Set(
    [...css.matchAll(/--color-([a-z0-9-]+):/g)].map((m) => m[1] ?? '')
  );
};

const sourceFiles = (): string[] => {
  const files: string[] = [];
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(vue|ts|js)$/.test(entry.name) && !/\.spec\./.test(entry.name)) {
        files.push(full);
      }
    }
  };
  SOURCE_DIRS.forEach((dir) => walk(path.join(ROOT, dir)));
  SOURCE_FILES.map((file) => path.join(ROOT, file))
    .filter((file) => fs.existsSync(file))
    .forEach((file) => files.push(file));
  return files;
};

const findUndefinedColorClasses = (): string[] => {
  const defined = definedColors();
  return sourceFiles().flatMap((file) => {
    const source = fs.readFileSync(file, 'utf8');
    return [...source.matchAll(COLOR_CLASS)]
      .filter(([, hue, stop]) => !defined.has(`${hue}-${stop}`))
      .map((match) => {
        const line = source.slice(0, match.index).split('\n').length;
        return `${path.relative(ROOT, file)}:${line} ${match[0]}`;
      });
  });
};

describe('theme palette', () => {
  it('defines every palette color class used in the app', () => {
    expect(findUndefinedColorClasses()).toEqual([]);
  });

  it('detects a class whose color is missing from the theme', () => {
    const defined = definedColors();
    const match = [...'bg-slate-100'.matchAll(COLOR_CLASS)][0];
    expect(defined.has(`${match?.[1]}-${match?.[2]}`)).toBe(false);
  });
});
