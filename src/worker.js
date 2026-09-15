export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Return index.html for SPA fallback
    return env.ASSETS.fetch(new Request(new URL("/", request.url), request));
  }
}
