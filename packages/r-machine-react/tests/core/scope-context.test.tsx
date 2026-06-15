import { cleanup, render } from "@testing-library/react";
import { createRequestScope, type RequestScope } from "r-machine/core";
import { useContext } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { RequestScopeContext } from "../../src/core/scope-context.js";

afterEach(cleanup);

function captureScope(ui: (probe: React.ReactNode) => React.ReactElement): RequestScope | null | undefined {
  let captured: RequestScope | null | undefined;
  function Probe() {
    captured = useContext(RequestScopeContext);
    return null;
  }
  render(ui(<Probe />));
  return captured;
}

describe("RequestScopeContext", () => {
  it("defaults to null when no Provider is present (client/test fallback)", () => {
    expect(captureScope((probe) => <>{probe}</>)).toBeNull();
  });

  it("propagates the active scope from its Provider to consumers", () => {
    const scope = createRequestScope();
    const seen = captureScope((probe) => (
      <RequestScopeContext.Provider value={scope}>{probe}</RequestScopeContext.Provider>
    ));
    expect(seen).toBe(scope);
  });
});
