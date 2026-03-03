import { vi } from "vitest";

export function createMockHeadersFn(entries: Record<string, string> = {}): any {
  const map = new Map(Object.entries(entries));
  return vi.fn(async () => ({
    get: (name: string) => map.get(name) ?? null,
  }));
}

export function createMockCookiesFn(options: { succeedOnSet?: boolean } = {}): any {
  const mockSet = vi.fn();
  const cookiesFn = vi.fn(async () => ({
    set:
      options.succeedOnSet === false
        ? () => {
            throw new Error("Not in a Server Action");
          }
        : mockSet,
  }));
  return { cookiesFn, mockSet };
}

export function createMockRequest(
  pathname: string,
  options: { cookie?: string; cookieName?: string; acceptLanguage?: string; url?: string } = {}
) {
  const cookieName = options.cookieName ?? "NEXT_LOCALE";
  const headers = new Headers();
  if (options.acceptLanguage) {
    headers.set("accept-language", options.acceptLanguage);
  }

  const cookies = {
    get: vi.fn((name: string) => {
      if (name === cookieName && options.cookie !== undefined) {
        return { value: options.cookie };
      }
      return undefined;
    }),
  };

  return {
    nextUrl: {
      pathname,
      clone() {
        return { pathname };
      },
    },
    url: options.url ?? "https://example.com",
    headers,
    cookies,
  };
}
