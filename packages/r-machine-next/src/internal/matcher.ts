// Matches all routes except:
// - Common system routes: `/_next`, `/_vercel`, `/api`
// - Requests ending with a file extension (e.g., `.js`, `.css`, `.png`, etc.)
export const defaultPathMatcher: RegExp = /^\/(?!(?:_next|_vercel|api)(?:\/|$)|.*\.[^/]+$)/;
