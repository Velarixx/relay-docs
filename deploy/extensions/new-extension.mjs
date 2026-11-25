#!/usr/bin/env node
/**
 * Creates a starting extension: a folder with a manifest and a module that answers one command.
 *
 *   node new-extension.mjs <id> [--dir extensions]
 *
 * The id is lower case letters, digits and dashes, starting with a letter. The folder
 * <dir>/<id> must not exist yet. Point EXTENSIONS_DIR at <dir> and the extension appears under
 * Administration → Extensions; docs/extension-guide.md explains the rest.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { dir: { type: 'string', default: 'extensions' } },
});
const id = positionals[0] ?? '';
if (!/^[a-z][a-z0-9-]{1,31}$/.test(id)) {
  console.error('usage: node new-extension.mjs <id> [--dir extensions]');
  console.error('The id is 2 to 32 lower case letters, digits and dashes, starting with a letter.');
  process.exit(64);
}
const folder = path.resolve(values.dir, id);
if (existsSync(folder)) {
  console.error(`${folder} already exists.`);
  process.exit(1);
}

const manifest = {
  id,
  version: '0.1.0',
  name: { en: id, nl: id },
  description: {
    en: 'Answers /' + id + ' with a greeting.',
    nl: 'Beantwoordt /' + id + ' met een groet.',
  },
  permissions: ['commands'],
  commands: [
    {
      name: id,
      description: { en: 'Say hello', nl: 'Zeg hallo' },
      usage: { en: `/${id} [name]`, nl: `/${id} [naam]` },
    },
  ],
};

const code = `// ${id}: answers /${id} with a greeting, in the language of the person asking.
// See docs/extension-guide.md for every hook and everything \`relay\` can do.

const HELLO = { en: 'Hello', nl: 'Hallo' };

export default {
  async onCommand({ text, user }) {
    const hello = HELLO[user.language] ?? HELLO.en;
    const name = text.trim() || user.displayName;
    // Only the person who asked sees an ephemeral answer.
    return { ephemeral: true, text: \`\${hello}, \${name}!\` };
  },
};
`;

mkdirSync(folder, { recursive: true });
writeFileSync(path.join(folder, 'extension.json'), JSON.stringify(manifest, null, 2) + '\n');
writeFileSync(path.join(folder, 'index.js'), code);
console.log(`Created ${folder}`);
console.log(`Set EXTENSIONS_DIR=${path.dirname(folder)} and restart Relay to see it.`);
