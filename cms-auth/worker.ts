/**
 * Optional standalone Cloudflare Worker for the CMS OAuth handler.
 *
 * Use this instead of the Pages Function if the website moves to a host
 * without serverless functions. Deploy with `npx wrangler deploy` from this
 * folder, set the secrets with `npx wrangler secret put …`, set
 * ALLOWED_ORIGINS to the website origin, and build the site with
 * CMS_AUTH_BASE_URL set to this Worker's URL. See README > Migrating hosts.
 */
import { handleOAuthRequest, type OAuthEnv } from './github-oauth';

export default {
  fetch(request: Request, env: OAuthEnv): Promise<Response> {
    return handleOAuthRequest(request, env);
  },
};
