/**
 * Cloudflare Pages Function: mounts the CMS GitHub OAuth handler at
 * /oauth/auth and /oauth/callback on the same origin as the website.
 * Secrets come from Pages > Settings > Variables and Secrets.
 * See cms-auth/github-oauth.ts for the security design.
 */
import { handleOAuthRequest, type OAuthEnv } from '../../cms-auth/github-oauth';

interface PagesContext {
  request: Request;
  env: OAuthEnv;
}

export const onRequest = (context: PagesContext): Promise<Response> => handleOAuthRequest(context.request, context.env);
