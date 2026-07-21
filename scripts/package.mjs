/** Zips the contents of dist/ (manifest at zip root, as the Web Store requires). */
import AdmZip from 'adm-zip';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');

const { version } = JSON.parse(readFileSync(join(DIST, 'manifest.json'), 'utf8'));
const out = join(ROOT, `judgy-calculator-${version}.zip`);

const zip = new AdmZip();
zip.addLocalFolder(DIST);
zip.writeZip(out);
console.log(`packaged ${out}`);
