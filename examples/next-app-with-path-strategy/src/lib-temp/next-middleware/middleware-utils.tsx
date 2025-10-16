import type { NextMiddleware } from "next/server";
import { NextResponse } from "next/server";

type MiddlewareFactory = (nextMiddleware: NextMiddleware) => NextMiddleware;

export function chainMiddlewares(middlewareFactories: MiddlewareFactory[]): NextMiddleware {
  function process(index: number): NextMiddleware {
    const current = middlewareFactories[index];

    if (current) {
      const next = process(index + 1);
      return current(next);
    }

    return () => NextResponse.next();
  }

  return process(0);
}

export function withLogging(nextMiddleware: NextMiddleware): NextMiddleware {
  return async (request, event) => {
    console.log(`[${request.method}] ${request.url}`);
    return nextMiddleware(request, event);
  };
}
