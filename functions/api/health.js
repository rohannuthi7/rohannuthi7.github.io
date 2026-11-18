// GET /api/health — a small Cloudflare Pages Function beside the static site.
// Returns build metadata so uptime checks and curious engineers can see which
// commit is live. Headers are set here because _headers does not apply to
// Function responses.
export async function onRequestGet({ env, request }) {
  const started = Date.now();
  // One real dependency check: the static site itself must be reachable.
  const home = await fetch(new URL('/', request.url), { method: 'HEAD', cf: { cacheTtl: 0 } }).catch(() => null);
  const ok = !!home && home.ok;
  const body = {
    status: ok ? 'ok' : 'degraded',
    commit: env.CF_PAGES_COMMIT_SHA ?? null,
    branch: env.CF_PAGES_BRANCH ?? null,
    checks: { site: ok ? 'ok' : 'fail' },
    latencyMs: Date.now() - started,
    time: new Date().toISOString(),
  };
  return new Response(JSON.stringify(body, null, 2) + '\n', {
    status: ok ? 200 : 503,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
