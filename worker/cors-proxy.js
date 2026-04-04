/**
 * Cloudflare Worker: CORS proxy for Web Slide Presenter
 *
 * Deploy:
 *   npx wrangler deploy worker/cors-proxy.js --name slide-cors-proxy
 *
 * Usage:
 *   https://slide-cors-proxy.<your-subdomain>.workers.dev/?url=<encoded-url>
 *
 * After deploying, set the proxy URL in localStorage:
 *   localStorage.setItem('slide-cors-proxy', 'https://slide-cors-proxy.<your-subdomain>.workers.dev/?url=')
 */

export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(),
      });
    }

    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return new Response('Missing ?url= parameter', { status: 400 });
    }

    // Only allow fetching text-based files
    try {
      const res = await fetch(decodeURIComponent(targetUrl));
      const contentType = res.headers.get('content-type') || '';

      // Block non-text responses for safety
      if (!contentType.match(/text|json|xml|markdown|html|css|javascript/i)) {
        return new Response('Only text-based content is proxied', { status: 403 });
      }

      const body = await res.text();

      return new Response(body, {
        status: res.status,
        headers: {
          'content-type': contentType,
          ...corsHeaders(),
        },
      });
    } catch (err) {
      return new Response(`Proxy error: ${err.message}`, { status: 502 });
    }
  },
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
