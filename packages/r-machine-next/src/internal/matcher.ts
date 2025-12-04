// Matches all routes except:
// - Common system routes: `/_next`, `/_vercel`, `/api`
// - Static assets: files with extensions like `favicon.ico`, `robots.txt`
export const defaultPathMatcher: RegExp = /^\/(?!(?:_next|_vercel|api)(?:\/|$)|.*\.[^/]+$)/;
