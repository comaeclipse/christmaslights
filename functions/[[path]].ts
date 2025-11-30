// Catch-all route for SPA - serves index.html for non-API routes
export async function onRequest(context: any) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Let API routes and static assets pass through
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/assets/')) {
    return next();
  }

  // For all other routes, serve index.html (SPA routing)
  return next();
}
