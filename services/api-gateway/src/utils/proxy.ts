export const proxyHelper = async (serviceUrl: string, req: Request) => {
  try {
    const url = new URL(req.url);
    const targetUrl = `${serviceUrl}${url.pathname}${url.search}`;

    console.log(`[Proxy] ${req.method} ${targetUrl}`);

    const headers = new Headers(req.headers);
    headers.delete('host');

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
      // @ts-ignore - Bun supports duplex for streaming body
      duplex: 'half',
    });

    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error(`[Proxy Error] to ${serviceUrl}:`, error);
    return new Response(JSON.stringify({ error: 'Service Unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
