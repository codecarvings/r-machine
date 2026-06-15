import { describe, expect, it } from "vitest";
import { createToken, getNamespace } from "../../src/core/res-domain.js";
import { getNamespaceList } from "../../src/core/res-list.js";
import { getNamespaceMap } from "../../src/core/res-map.js";

describe("getNamespace — internal-namespace marker strip", () => {
  it("strips a leading `#` from a string handle", () => {
    expect(getNamespace("#base/jwt")).toBe("base/jwt");
    expect(getNamespace("#outer/temp")).toBe("outer/temp");
  });

  it("strips a leading `#` from a token handle", () => {
    const t = createToken("#base/jwt");
    expect(getNamespace(t)).toBe("base/jwt");
  });

  it("leaves a non-internal string unchanged", () => {
    expect(getNamespace("base/jwt")).toBe("base/jwt");
    expect(getNamespace("outer/timer")).toBe("outer/timer");
  });

  it("leaves a non-internal token unchanged", () => {
    expect(getNamespace(createToken("base/jwt"))).toBe("base/jwt");
  });

  it("strips at most one leading `#` (defensive)", () => {
    // Atlas-key validation rejects multiple `#` at type level, but the
    // runtime strip must be safe regardless: only the very first char is
    // consumed.
    expect(getNamespace("##weird")).toBe("#weird");
  });
});

describe("getNamespaceList / getNamespaceMap — strip propagates through composer extraction", () => {
  it("strips `#` from every entry of a HandleList (composer dep list path)", () => {
    const result = getNamespaceList(["#base/jwt", "outer/timer", createToken("#shell/lib/fmt")] as never);
    expect(result).toEqual(["base/jwt", "outer/timer", "shell/lib/fmt"]);
  });

  it("strips `#` from every entry of a HandleMap (composer dep map path)", () => {
    const result = getNamespaceMap({
      jwt: "#base/jwt",
      timer: "outer/timer",
      fmt: createToken("#shell/lib/fmt"),
    } as never);
    expect(result).toEqual({ jwt: "base/jwt", timer: "outer/timer", fmt: "shell/lib/fmt" });
  });
});
