/**
 * Runs the Decap CMS local backend so the dashboard can be used at
 * http://localhost:4321/admin/ without GitHub sign-in (localhost only).
 *
 *   npm run cms       — "fs" mode: saves edit files on disk directly.
 *                        Simple and safe; the Site status field still decides
 *                        what is public. Commit the changes with git yourself.
 *   npm run cms:git   — "git" mode: full editorial workflow using local
 *                        cms/* branches, exactly like production. It checks
 *                        out branches in this working copy, so commit or stash
 *                        your own changes first.
 *
 * Run it in a second terminal alongside `npm run dev`.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const mode = process.argv.includes('--git') ? 'git' : 'fs';
const require = createRequire(import.meta.url);
const server = require.resolve('decap-server/dist/index.js');

console.log(`Starting the Decap CMS local backend in "${mode}" mode on http://localhost:8081 …`);
console.log('Open http://localhost:4321/admin/ while `npm run dev` is running.');

const child = spawn(process.execPath, [server], {
  stdio: 'inherit',
  env: { ...process.env, MODE: mode, PORT: process.env.PORT ?? '8081' },
});
child.on('exit', (code) => process.exit(code ?? 0));
