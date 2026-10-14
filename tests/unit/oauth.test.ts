import { describe, expect, it, vi } from 'vitest';
import {
  STATE_COOKIE,
  allowedOrigins,
  handleOAuthRequest,
  readCookie,
  timingSafeEqual,
  type OAuthEnv,
} from '../../cms-auth/github-oauth.ts';

const ORIGIN = 'https://tekktech.com';

const env: OAuthEnv = {
  GITHUB_CLIENT_ID: 'client-id',
  GITHUB_CLIENT_SECRET: 'super-secret-value',
  ALLOWED_GITHUB_USERS: 'Owner-Account, second-owner',
  GITHUB_REPO: 'hugocc06/tekktech',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** A fake GitHub. */
function github(options: { login?: string; push?: boolean; tokenOk?: boolean } = {}) {
  const { login = 'owner-account', push = true, tokenOk = true } = options;
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    if (url === 'https://github.com/login/oauth/access_token') {
      return tokenOk ? json({ access_token: 'gho_test_token', token_type: 'bearer' }) : json({ error: 'bad_verification_code' });
    }
    if (url === 'https://api.github.com/user') return json({ login });
    if (url === 'https://api.github.com/repos/hugocc06/tekktech') return json({ permissions: { push } });
    if (url.startsWith('https://api.github.com/applications/')) return new Response(null, { status: 204 });
    return new Response('unexpected', { status: 500 });
  });
  return { fetchMock: fetchMock as unknown as typeof fetch, calls };
}

async function startAuth(environment: OAuthEnv = env) {
  return handleOAuthRequest(new Request(`${ORIGIN}/oauth/auth?provider=github&site_id=tekktech.com&scope=repo`), environment);
}

function callback(query: string, cookie?: string) {
  return new Request(`${ORIGIN}/oauth/callback?${query}`, { headers: cookie ? { Cookie: cookie } : {} });
}

describe('/oauth/auth', () => {
  it('redirects to GitHub with client id, callback URL and a random state', async () => {
    const response = await startAuth();
    expect(response.status).toBe(302);
    const location = new URL(response.headers.get('Location')!);
    expect(location.origin + location.pathname).toBe('https://github.com/login/oauth/authorize');
    expect(location.searchParams.get('client_id')).toBe('client-id');
    expect(location.searchParams.get('redirect_uri')).toBe(`${ORIGIN}/oauth/callback`);
    expect(location.searchParams.get('scope')).toBe('repo');
    expect(location.searchParams.get('allow_signup')).toBe('false');
    expect(location.searchParams.get('state')).toMatch(/^[A-Za-z0-9_-]{40,}$/);
  });

  it('stores the state in a secure, HttpOnly, short-lived __Host- cookie', async () => {
    const response = await startAuth();
    const cookie = response.headers.get('Set-Cookie')!;
    const state = new URL(response.headers.get('Location')!).searchParams.get('state');
    expect(cookie).toContain(`${STATE_COOKIE}=${state}`);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/Secure/);
    expect(cookie).toMatch(/SameSite=Lax/);
    expect(cookie).toMatch(/Max-Age=600/);
    expect(cookie).toMatch(/Path=\//);
  });

  it('generates a different state each time', async () => {
    const a = new URL((await startAuth()).headers.get('Location')!).searchParams.get('state');
    const b = new URL((await startAuth()).headers.get('Location')!).searchParams.get('state');
    expect(a).not.toBe(b);
  });

  it('never exposes the client secret', async () => {
    const response = await startAuth();
    expect(response.headers.get('Location')).not.toContain('super-secret-value');
    expect(await response.text()).not.toContain('super-secret-value');
  });

  it('fails closed when no users are allowed', async () => {
    const response = await startAuth({ ...env, ALLOWED_GITHUB_USERS: '' });
    expect(response.status).toBe(500);
    expect(response.headers.get('Location')).toBeNull();
  });

  it('refuses to start when the OAuth app is not configured', async () => {
    const response = await startAuth({ ALLOWED_GITHUB_USERS: 'owner' });
    expect(response.status).toBe(500);
  });

  it('rejects other providers and non-GET methods', async () => {
    expect((await handleOAuthRequest(new Request(`${ORIGIN}/oauth/auth?provider=gitlab`), env)).status).toBe(400);
    expect((await handleOAuthRequest(new Request(`${ORIGIN}/oauth/auth`, { method: 'POST' }), env)).status).toBe(405);
  });
});

describe('/oauth/callback', () => {
  it('rejects a missing state cookie (CSRF protection) without contacting GitHub', async () => {
    const { fetchMock } = github();
    const response = await handleOAuthRequest(callback('code=abc&state=xyz'), env, fetchMock);
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a mismatched state', async () => {
    const { fetchMock } = github();
    const response = await handleOAuthRequest(callback('code=abc&state=attacker', `${STATE_COOKIE}=expected`), env, fetchMock);
    expect(response.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('signs in an allowed user with push access and posts the token only to the dashboard origin', async () => {
    const { fetchMock, calls } = github();
    const response = await handleOAuthRequest(callback('code=abc&state=s1', `${STATE_COOKIE}=s1`), env, fetchMock);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('authorization:github:success:');
    expect(html).toContain('gho_test_token');
    expect(html).toContain(JSON.stringify([ORIGIN]));
    expect(html).not.toMatch(/postMessage\([^)]*['"]\*['"]/);
    // The client secret is sent to GitHub server-to-server only.
    expect(html).not.toContain('super-secret-value');
    expect(String(calls[0]?.init?.body)).toContain('super-secret-value');
  });

  it('sets strict, no-store response headers and clears the state cookie', async () => {
    const { fetchMock } = github();
    const response = await handleOAuthRequest(callback('code=abc&state=s1', `${STATE_COOKIE}=s1`), env, fetchMock);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
    expect(response.headers.get('Content-Security-Policy')).toMatch(/default-src 'none'; script-src 'nonce-/);
    expect(response.headers.get('Set-Cookie')).toMatch(/Max-Age=0/);
  });

  it('matches allowed users case-insensitively', async () => {
    const { fetchMock } = github({ login: 'OWNER-ACCOUNT' });
    const response = await handleOAuthRequest(callback('code=abc&state=s1', `${STATE_COOKIE}=s1`), env, fetchMock);
    expect(response.status).toBe(200);
  });

  it('refuses a GitHub user who is not on the allow-list and revokes their token', async () => {
    const { fetchMock, calls } = github({ login: 'random-stranger' });
    const response = await handleOAuthRequest(callback('code=abc&state=s1', `${STATE_COOKIE}=s1`), env, fetchMock);
    expect(response.status).toBe(403);
    const html = await response.text();
    expect(html).toContain('authorization:github:error:');
    expect(html).not.toContain('gho_test_token');
    expect(calls.some((call) => call.url.includes('/applications/client-id/token') && call.init?.method === 'DELETE')).toBe(true);
  });

  it('refuses an allowed user without push access to the repository', async () => {
    const { fetchMock } = github({ push: false });
    const response = await handleOAuthRequest(callback('code=abc&state=s1', `${STATE_COOKIE}=s1`), env, fetchMock);
    expect(response.status).toBe(403);
    expect(await response.text()).not.toContain('gho_test_token');
  });

  it('handles a failed code exchange', async () => {
    const { fetchMock } = github({ tokenOk: false });
    const response = await handleOAuthRequest(callback('code=abc&state=s1', `${STATE_COOKIE}=s1`), env, fetchMock);
    expect(response.status).toBe(502);
  });

  it('reports a cancelled sign-in', async () => {
    const response = await handleOAuthRequest(callback('error=access_denied&state=s1', `${STATE_COOKIE}=s1`), env);
    expect(response.status).toBe(400);
    expect(await response.text()).toContain('Sign-in was cancelled.');
  });

  it('escapes the token safely inside the inline script', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/access_token')) return json({ access_token: '</script><script>alert(1)</script>' });
      if (url.endsWith('/user')) return json({ login: 'owner-account' });
      return json({ permissions: { push: true } });
    }) as unknown as typeof fetch;
    const response = await handleOAuthRequest(callback('code=abc&state=s1', `${STATE_COOKIE}=s1`), env, fetchMock);
    const html = await response.text();
    expect(html).not.toContain('</script><script>alert(1)');
  });
});

describe('helpers', () => {
  it('compares strings in constant time correctly', () => {
    expect(timingSafeEqual('abc', 'abc')).toBe(true);
    expect(timingSafeEqual('abc', 'abd')).toBe(false);
    expect(timingSafeEqual('abc', 'abcd')).toBe(false);
  });

  it('reads cookies', () => {
    expect(readCookie('a=1; __Host-tt_oauth_state=xyz; b=2', STATE_COOKIE)).toBe('xyz');
    expect(readCookie(null, STATE_COOKIE)).toBeUndefined();
  });

  it('only accepts well-formed extra origins', () => {
    const origins = allowedOrigins(new URL(`${ORIGIN}/oauth/callback`), {
      ALLOWED_ORIGINS: 'https://preview.example.com/, javascript:alert(1), https://ok.example.com',
    });
    expect(origins).toEqual([ORIGIN, 'https://preview.example.com', 'https://ok.example.com']);
  });

  it('returns 404 for unknown paths', async () => {
    expect((await handleOAuthRequest(new Request(`${ORIGIN}/oauth/other`), env)).status).toBe(404);
  });
});
