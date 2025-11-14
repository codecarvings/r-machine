import type { cookies, headers } from "next/headers";
import type { NextFetchEvent, NextRequest, NextResponse } from "next/server";

// *** Next.js types for internal use in r-machine-next package ***

export type HeadersFn = typeof headers;
export type CookiesFn = typeof cookies;

// biome-ignore lint/suspicious/noConfusingVoidType: Use exact type definition from Next.js
export type NextProxyResult = NextResponse | Response | null | undefined | void;
export type NextProxy = (request: NextRequest, event: NextFetchEvent) => NextProxyResult | Promise<NextProxyResult>;
