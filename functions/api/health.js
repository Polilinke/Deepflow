export async function onRequest({ request, env }) {
  return new Response(JSON.stringify({
    ok: true,
    service: 'DeepFlow Cloudflare Pages Functions',
    route: new URL(request.url).pathname,
    youtubeKeyConfigured: Boolean(env.YOUTUBE_API_KEY)
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
