export type AnyPathComposer = (path: string, params?: object) => string;
export type AnyProxyFn = (request: unknown) => unknown;
export type AnySupplierFn = () => Promise<AnyPathComposer>;
export type MockRewriteArgs = [url: { pathname: string }, options?: { request: { headers: Headers } }];
