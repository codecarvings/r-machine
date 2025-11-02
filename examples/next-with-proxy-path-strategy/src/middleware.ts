import type { NextMiddleware, NextRequest } from "next/server";
import { NextResponse } from "next/server";

// biome-ignore lint/suspicious/noConfusingVoidType: Use exact type definition from Next.js
type NextMiddlewareResult = NextResponse | Response | null | undefined | void;

export function withRequestHeaders(
  middleware: NextMiddleware | undefined,
  headersToAdd: Record<string, string>
): NextMiddleware {
  return (request: NextRequest, context) => {
    const requestHeaders = new Headers(request.headers);

    // Add custom headers
    for (const [key, value] of Object.entries(headersToAdd)) {
      requestHeaders.set(key, value);
    }

    const handleResponse = (response: NextMiddlewareResult): Response => {
      // If the middleware returns a successful response (not a redirect),
      // ensure our headers are included in the forwarded request
      if (response) {
        // Only forward headers for successful responses (200-299)
        // Redirects (3xx), errors (4xx, 5xx) are returned as-is
        if (response.status >= 200 && response.status < 300) {
          // Re-create the response with our headers to ensure they reach the page
          return NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });
        }

        // For redirects, errors, etc., return as-is
        return response;
      }

      // No response, just forward with headers
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    };

    // If there's a wrapped middleware, call it with the modified request
    if (middleware) {
      const modifiedRequest = new Request(request, {
        headers: requestHeaders,
      }) as NextRequest;

      const result = middleware(modifiedRequest, context);

      // Handle both sync and async middleware
      if (result instanceof Promise) {
        return result.then(handleResponse);
      }

      return handleResponse(result);
    }

    // No middleware provided, just forward with headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  };
}

export function middleware(request: NextRequest) {
  const nextUrl = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.append("x-rm-locale", nextUrl.pathname);

  return NextResponse.rewrite(new URL(`/it-IT${nextUrl.pathname}`, request.url));
}

export function middleware3(request: NextRequest) {
  const nextUrl = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.append("x-rm-locale", nextUrl.pathname);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return response;
}

export const config = {
  // Apply proxy to all routes except:
  // - Common system routes: `/_next`, `/_vercel`, `/api`
  // - Static assets: files with extensions like `favicon.ico`, `robots.txt`
  matcher: "/((?!_next|_vercel|api|.*\\..*).*)",
};
