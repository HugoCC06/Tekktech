/**
 * Prepares the private publishing dashboard (/admin/) before dev and build:
 *
 * 1. Self-hosts the Decap CMS browser bundle. The exact version below is
 *    downloaded from the npm registry (`npm pack`), checked against a pinned
 *    SHA-384 hash, and copied to public/admin/vendor/. The dashboard
 *    therefore loads no third-party script, and a tampered bundle stops the
 *    build instead of reaching the browser.
 * 2. Writes public/admin/cms-config.json from scripts/cms-config.ts.
 *
 * To upgrade Decap: change DECAP_VERSION, run `npm run prepare:admin`, and
 * replace DECAP_SHA384 with the hash it reports — after reviewing the
 * release notes at https://github.com/decaporg/decap-cms/releases.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { buildCmsConfig } from './cms-config.ts';

const DECAP_VERSION = '3.16.3';
const DECAP_SHA384 = 'A/Gdn928CNLufmnGWGs9RM4Q9o8bSNLeJERqBFrBjwzL7FRpoLT3MPF8Tl0+Wd2p';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const vendorDir = resolve(root, 'public/admin/vendor');
const vendorFile = resolve(vendorDir, 'decap-cms.js');
const cacheFile = resolve(root, 'node_modules/.cache/tekktech/decap-cms-' + DECAP_VERSION + '.js');

const sha384 = (data: Buffer) => createHash('sha384').update(data).digest('base64');

/** Extracts a single file from a .tgz without external tools. */
function extractFromTarball(tarball: Buffer, wanted: string): Buffer {
  const tar = gunzipSync(tarball);
  let offset = 0;
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/s, '');
    if (!name) break;
    const prefix = header.subarray(345, 500).toString('utf8').replace(/\0.*$/s, '');
    const size = parseInt(header.subarray(124, 136).toString('utf8').replace(/\0.*$/s, '').trim() || '0', 8);
    const fullName = prefix ? `${prefix}/${name}` : name;
    const start = offset + 512;
    if (fullName === wanted) return Buffer.from(tar.subarray(start, start + size));
    offset = start + Math.ceil(size / 512) * 512;
  }
  throw new Error(`${wanted} not found in tarball`);
}

function downloadDecap(): Buffer {
  const work = mkdtempSync(join(tmpdir(), 'tekktech-decap-'));
  try {
    execFileSync('npm', ['pack', `decap-cms@${DECAP_VERSION}`, '--pack-destination', work, '--silent'], {
      stdio: ['ignore', 'ignore', 'inherit'],
      shell: process.platform === 'win32',
    });
    const tarballName = readdirSync(work).find((file) => file.endsWith('.tgz'));
    if (!tarballName) throw new Error('npm pack did not produce a tarball');
    return extractFromTarball(readFileSync(join(work, tarballName)), 'package/dist/decap-cms.js');
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

function ensureDecapBundle() {
  if (existsSync(vendorFile) && sha384(readFileSync(vendorFile)) === DECAP_SHA384) return;

  let bundle = existsSync(cacheFile) ? readFileSync(cacheFile) : undefined;
  if (!bundle || sha384(bundle) !== DECAP_SHA384) {
    console.log(`[admin] Downloading Decap CMS ${DECAP_VERSION} from the npm registry…`);
    bundle = downloadDecap();
  }

  const actual = sha384(bundle);
  if (actual !== DECAP_SHA384) {
    throw new Error(
      `[admin] Decap CMS bundle integrity check failed.\n  expected sha384-${DECAP_SHA384}\n  received sha384-${actual}\n` +
        'If you intentionally changed DECAP_VERSION, update DECAP_SHA384 after reviewing the release.',
    );
  }

  mkdirSync(dirname(cacheFile), { recursive: true });
  writeFileSync(cacheFile, bundle);
  mkdirSync(vendorDir, { recursive: true });
  writeFileSync(vendorFile, bundle);
  console.log(`[admin] Decap CMS ${DECAP_VERSION} verified (sha384-${actual.slice(0, 12)}…)`);
}

function writeConfig() {
  const config = buildCmsConfig();
  writeFileSync(resolve(root, 'public/admin/cms-config.json'), JSON.stringify(config, null, 2) + '\n');
  console.log(`[admin] Wrote public/admin/cms-config.json (${config.collections.length} collections)`);
}

ensureDecapBundle();
writeConfig();
