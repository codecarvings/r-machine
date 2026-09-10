---
"@r-machine/next": patch
---

Fix the Next App Router path strategy poisoning the client router's prefetch cache with a cookie-dependent redirect, and declare the auto-detect header dependency on the responses that can carry it.

### Fixed

- **Path strategy — auto-detect no longer applies to RSC requests.** With `implicitDefaultLocale` on, an auto-detect URL answered a request from the locale cookie: a `<Link href="/">` — the crawlable href a locale switcher renders for the default locale — made the router prefetch `/` while the cookie still held the previous locale, and the resulting `307 → /it` was cached by the client router under the key `/`. `router.push("/")` after a switch reads that cache entry instead of re-requesting, so switching *to* the default locale landed back on the previous one, with the cookie already updated. Auto-detect is an entrance concern, so it now runs on document requests only; an RSC request (navigation or prefetch) always gets the canonical content of the URL it asked for, which for an implicit URL is the default locale. The non-implicit branch is unchanged: without implicit URLs an unprefixed path has no canonical content of its own, so the redirect is its only possible outcome.

  The exposure is as wide as `autoDetectLocale.pathMatcher`: the root-only matcher is just the default for `implicitDefaultLocale` on, any path the matcher covers produced the same cookie-dependent response, and with `implicitDefaultLocale` off the default matcher is already every standard path. The fix sits in the auto-detect branch, so it covers the whole matched set.

  Next strips its own `rsc` and `next-router-prefetch` headers before the proxy runs (measured on Next 16.3), so the request kind is read from `next-url` — sent by the client router on every RSC request — with `sec-fetch-dest` as the second marker. A request carrying neither (curl, older bots) is treated as a document request, preserving the previous behaviour.

- **`vary` on the auto-detect responses.** The auto-detect branch picks the locale from `Cookie` and `Accept-Language`, and nothing declared that dependency to shared caches. Both the path strategy's auto-detect branches and the flat strategy's rewrite (whose every handled path is chosen from those headers) now append `Accept-Language, Cookie` — `Accept-Language` alone when the cookie is off. `redirectToCanonicalLocalePath` is deliberately left alone: the `/en/about → /about` canonicalization depends on the URL only, and a `vary` there would be spurious.

  Measured limit: `vary` survives on a redirect but **not** on a rewrite, where Next owns it and overwrites whatever the proxy (or `next.config` `headers()`) sets. It is declared on both outcomes anyway — it is correct where the response is produced — but it cannot be relied on for the outcome that matters most, the cacheable 200.

- **Locale-dependent responses are kept out of a URL-keyed shared cache.** A rewrite inherits the `cache-control` of the page it rewrites to: for a prerendered target that is `s-maxage` measured in months, correct for the canonical locale-prefixed URL and wrong at the requested one, where the response was chosen from a cookie. A shared cache keying on the request URL would store it and serve it to everyone, silently disabling auto-detect for whoever did not warm it — across every path the auto-detect matcher covers in the path strategy, which the consumer can widen to the whole site, and across every handled path in the flat strategy, where the locale is never in the URL. Since `vary` cannot express this and `cache-control` survives the rewrite, those responses now carry `private, no-cache`: a private cache may still keep them, it just has to revalidate — which it has to anyway once the locale cookie changes.

  Scoped to exactly the header-dependent responses: in the path strategy, paths outside the auto-detect matcher are untouched, and so is the RSC rewrite, whose outcome no longer depends on the cookie after the fix above — so client-router traffic, most of the navigation on a live site, stays fully shared-cacheable.

### Added

- **`localeCacheControl` on the path and flat strategy configs** — `"private" | "inherit"`, default `"private"`. It names what the proxy writes on the locale-dependent responses, not what sits in front of the app: `"private"` marks them `private, no-cache`, `"inherit"` leaves the `cache-control` Next would assign. Whether the second is safe depends on the cache in front resolving the locale itself — by running the proxy ahead of its own lookup, or by keying on the cookie — which is a property of the deployment that this library cannot observe or test, hence an explicit opt-in rather than a guess. Same key, same default and same meaning on both strategies; it just covers a different set of responses on each. The origin strategy does not take it: there the locale comes from the host, which is already part of any cache key.
