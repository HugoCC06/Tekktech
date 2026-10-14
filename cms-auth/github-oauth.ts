/**
 * GitHub OAuth handler for the TekkTech publishing dashboard (Decap CMS).
 *
 * Decap CMS runs entirely in the browser and talks to the GitHub API with
 * the signed-in user's token. Obtaining that token requires a server-side
 * step, because the GitHub client secret must never reach the browser.
 * This module is that step. It is platform-neutral (standard Request /
 * Response / fetch / Web Crypto) and is mounted:
 *
 *   - as a Cloudflare Pages Function: functions/oauth/[[route]].ts
 *   - or as a standalone Cloudflare Worker: cms-auth/worker.ts
 *
 * Routes:  GET …/oauth/auth      → redirects to GitHub with a random `state`
 *          GET …/oauth/callback  → validates state, exchanges the code,
 *                                  checks the user is allowed, and hands the
 *                                  token to the dashboard window.
 *
 * Security controls:
 *   - The client secret is only read from server-side environment variables.
 *   - CSRF protection: a random `state` is stored in a short-lived,
 *     HttpOnly, Secure, SameSite=Lax `__Host-` cookie and compared in
 *     constant time on callback.
 *   - Authorisation: the GitHub login must be listed in ALLOWED_GITHUB_USERS
 *     (fail closed when empty) and, when GITHUB_REPO is set, must have push
 *     access to that repository. Rejected tokens are revoked immediately.
 *   - The token is posted only to an allow-listed origin (the dashboard's
 *     own origin by default), never with a "*" target.
 *   - Responses are no-store, no-referrer, and locked down with a
 *     nonce-based Content-Security-Policy.
 *
 * GitHub itself remains the final authority: every write the dashboard
 * makes is a GitHub API call that succeeds only if the token's owner has
 * write access to the repository.
 */

export interface OAuthEnv {
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  /** Comma-separated GitHub usernames allowed to sign in. Empty = nobody. */
  ALLOWED_GITHUB_USERS?: string;
  /** owner/repo — if set, the user must have push access to it. */
  GITHUB_REPO?: string;
  /** OAuth App scope ("repo" or "public_repo"). Ignored by GitHub Apps. */
  OAUTH_SCOPE?: string;
  /** Extra comma-separated origins allowed to receive the token (standalone Worker deployments). */
  ALLOWED_ORIGINS?: string;
}

type Fetch = typeof fetch;

export const STATE_COOKIE = '__Host-tt_oauth_state';
const STATE_MAX_AGE_SECONDS = 600;
const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_API = 'https://api.github.com';
const USER_AGENT = 'TekkTech-CMS-Auth';

export async function handleOAuthRequest(request: Request, env: OAuthEnv, fetchImpl: Fetch = fetch): Promise<Response> {
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET' } });
  }

  if (url.pathname.endsWith('/oauth/auth')) return startAuthorization(url, env);
  if (url.pathname.endsWith('/oauth/callback')) return completeAuthorization(request, url, env, fetchImpl);
  return new Response('Not found', { status: 404 });
}

function isConfigured(env: OAuthEnv): boolean {
  return Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);
}

export function allowedUsers(env: OAuthEnv): Set<string> {
  return new Set(
    (env.ALLOWED_GITHUB_USERS ?? '')
      .split(',')
      .map((user) => user.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function allowedOrigins(url: URL, env: OAuthEnv): string[] {
  const extra = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter((origin) => /^https?:\/\/[^/]+$/.test(origin));
  return [...new Set([url.origin, ...extra])];
}

function startAuthorization(url: URL, env: OAuthEnv): Response {
  const provider = url.searchParams.get('provider');
  if (provider && provider !== 'github') {
    return errorPage(url, env, 400, 'Unsupported sign-in provider.');
  }
  if (!isConfigured(env)) {
    return errorPage(
      url,
      env,
      500,
      'Sign-in is not configured yet. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET on the server.',
    );
  }
  if (allowedUsers(env).size === 0) {
    return errorPage(url, env, 500, 'No users are allowed to sign in. Set ALLOWED_GITHUB_USERS on the server.');
  }

  const state = randomToken();
  const authorize = new URL(GITHUB_AUTHORIZE_URL);
  authorize.searchParams.set('client_id', env.GITHUB_CLIENT_ID!);
  authorize.searchParams.set('redirect_uri', callbackUrl(url));
  authorize.searchParams.set('state', state);
  authorize.searchParams.set('allow_signup', 'false');
  const scope = env.OAUTH_SCOPE?.trim() ?? 'repo';
  if (scope) authorize.searchParams.set('scope', scope);

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.toString(),
      'Set-Cookie': `${STATE_COOKIE}=${state}; Path=/; Max-Age=${STATE_MAX_AGE_SECONDS}; HttpOnly; Secure; SameSite=Lax`,
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
    },
  });
}

async function completeAuthorization(request: Request, url: URL, env: OAuthEnv, fetchImpl: Fetch): Promise<Response> {
  if (!isConfigured(env)) {
    return errorPage(url, env, 500, 'Sign-in is not configured yet.');
  }

  const githubError = url.searchParams.get('error');
  if (githubError) {
    return errorPage(
      url,
      env,
      400,
      githubError === 'access_denied' ? 'Sign-in was cancelled.' : 'GitHub returned an error during sign-in.',
    );
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expectedState = readCookie(request.headers.get('Cookie'), STATE_COOKIE);
  if (!code || !state || !expectedState || !timingSafeEqual(state, expectedState)) {
    return errorPage(
      url,
      env,
      403,
      'Sign-in could not be verified (invalid or expired state). Close this window and try again.',
    );
  }

  let token: string;
  try {
    const response = await fetchImpl(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': USER_AGENT },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: callbackUrl(url),
      }),
    });
    const data = (await response.json()) as { access_token?: string; error?: string };
    if (!response.ok || !data.access_token) {
      return errorPage(url, env, 502, 'GitHub did not issue an access token. Close this window and try again.');
    }
    token = data.access_token;
  } catch {
    return errorPage(url, env, 502, 'Could not reach GitHub. Close this window and try again.');
  }

  const authorised = await authoriseUser(token, env, fetchImpl);
  if (!authorised.ok) {
    await revokeToken(token, env, fetchImpl);
    return errorPage(url, env, 403, authorised.reason);
  }

  return successPage(url, env, token);
}

async function authoriseUser(
  token: string,
  env: OAuthEnv,
  fetchImpl: Fetch,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': USER_AGENT,
  };

  const userResponse = await fetchImpl(`${GITHUB_API}/user`, { headers });
  if (!userResponse.ok) return { ok: false, reason: 'Could not verify your GitHub account.' };
  const user = (await userResponse.json()) as { login?: string };
  const login = user.login?.toLowerCase();

  if (!login || !allowedUsers(env).has(login)) {
    return { ok: false, reason: 'This GitHub account is not authorised to use the TekkTech dashboard.' };
  }

  if (env.GITHUB_REPO) {
    const repoResponse = await fetchImpl(`${GITHUB_API}/repos/${env.GITHUB_REPO}`, { headers });
    if (!repoResponse.ok) return { ok: false, reason: 'Your account cannot access the content repository.' };
    const repo = (await repoResponse.json()) as { permissions?: { push?: boolean } };
    if (!repo.permissions?.push) {
      return { ok: false, reason: 'Your account does not have write access to the content repository.' };
    }
  }

  return { ok: true };
}

/** Best-effort revocation so a rejected user's token is useless. */
async function revokeToken(token: string, env: OAuthEnv, fetchImpl: Fetch): Promise<void> {
  try {
    await fetchImpl(`${GITHUB_API}/applications/${env.GITHUB_CLIENT_ID}/token`, {
      method: 'DELETE',
      headers: {
        Authorization: `Basic ${btoa(`${env.GITHUB_CLIENT_ID}:${env.GITHUB_CLIENT_SECRET}`)}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
      },
      body: JSON.stringify({ access_token: token }),
    });
  } catch {
    // Revocation is defence in depth; the user was already refused.
  }
}

function callbackUrl(url: URL): string {
  return `${url.origin}${url.pathname.replace(/\/auth$/, '/callback')}`;
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return undefined;
}

export function timingSafeEqual(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  let diff = left.length ^ right.length;
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

/** JSON for embedding inside an inline <script>. */
function scriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

const clearStateCookie = `${STATE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;

/**
 * Renders the popup page that completes Decap's handshake: it announces
 * itself to the opener, waits for the opener to reply, and only then posts
 * the result to that opener — and only if its origin is allow-listed.
 */
function handshakePage(url: URL, env: OAuthEnv, status: number, message: string, visibleText: string): Response {
  const nonce = randomToken();
  const origins = allowedOrigins(url, env);
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex">
<title>TekkTech sign-in</title>
<style nonce="${nonce}">body{font:15px/1.5 system-ui,sans-serif;color:#0e1014;background:#fafaf7;display:grid;place-items:center;min-height:100vh;margin:0}main{max-width:28rem;padding:2rem;text-align:center}</style>
</head>
<body>
<main><p>${escapeHtml(visibleText)}</p></main>
<script nonce="${nonce}">
(function () {
  var origins = ${scriptJson(origins)};
  var message = ${scriptJson(message)};
  if (!window.opener) return;
  function receive(event) {
    if (origins.indexOf(event.origin) === -1) return;
    window.removeEventListener('message', receive, false);
    window.opener.postMessage(message, event.origin);
  }
  window.addEventListener('message', receive, false);
  origins.forEach(function (origin) { window.opener.postMessage('authorizing:github', origin); });
})();
</script>
</body>
</html>`;

  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex',
      'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`,
      'Set-Cookie': clearStateCookie,
    },
  });
}

function successPage(url: URL, env: OAuthEnv, token: string): Response {
  const message = `authorization:github:success:${JSON.stringify({ token, provider: 'github' })}`;
  return handshakePage(
    url,
    env,
    200,
    message,
    'Signed in. You can close this window if it does not close automatically.',
  );
}

function errorPage(url: URL, env: OAuthEnv, status: number, reason: string): Response {
  const message = `authorization:github:error:${JSON.stringify({ message: reason })}`;
  return handshakePage(url, env, status, message, reason);
}
