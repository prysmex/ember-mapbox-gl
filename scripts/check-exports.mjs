/**
 * Verifies every public module resolves through package.json#exports the ways
 * consumers import it: without extension, with `.js`, and as a directory for
 * `index` modules. Run after `pnpm build`.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const { name } = JSON.parse(readFileSync('package.json', 'utf8'));

function* modules(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* modules(path);
    else if (/\.g?ts$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      yield relative('src', path).replace(/\.g?ts$/, '');
    }
  }
}

const specifiers = new Set(['', '/addon-main.js']);

for (const mod of modules('src')) {
  // private modules are not part of the public API
  if (mod.startsWith('-private/')) continue;

  if (mod === 'index') continue;

  specifiers.add(`/${mod}`);
  specifiers.add(`/${mod}.js`);

  if (mod.endsWith('/index'))
    specifiers.add(`/${mod.slice(0, -'/index'.length)}`);
}

const failures = [];

for (const specifier of [...specifiers].sort()) {
  const id = name + specifier;

  try {
    const resolved = import.meta.resolve(id);

    if (!existsSync(new URL(resolved))) {
      failures.push(
        `${id} -> ${relative(process.cwd(), new URL(resolved).pathname)} (missing)`,
      );
    }
  } catch (e) {
    failures.push(`${id} (${e.code ?? e.message})`);
  }
}

if (failures.length) {
  console.error(`Unresolvable exports:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}

console.log(`All ${specifiers.size} public import paths resolve.`);
