import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DelayedSuspense } from "../../../src/utils/delayed-suspense.js";

afterEach(cleanup);

/** Short enough for fast tests, long enough for reliable timer resolution. */
const DELAY = 50;

function ResolvedChild({ text = "Content" }: { text?: string }) {
  return <div>{text}</div>;
}

function createSuspenseSetup() {
  let resolvePromise!: () => void;
  let isResolved = false;

  const suspensePromise = new Promise<void>((resolve) => {
    resolvePromise = resolve;
  });

  function SuspendingChild() {
    if (!isResolved) {
      throw suspensePromise;
    }
    return <div>Resolved content</div>;
  }

  return {
    SuspendingChild,
    resolve: () => {
      isResolved = true;
      resolvePromise();
    },
  };
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

describe("DelayedSuspense", () => {
  describe("non-suspending children", () => {
    it("renders children immediately", () => {
      render(
        <DelayedSuspense fallback={<div>Loading</div>}>
          <ResolvedChild />
        </DelayedSuspense>
      );

      expect(screen.getByText("Content")).toBeDefined();
    });

    it("does not render fallback when children don't suspend", () => {
      render(
        <DelayedSuspense fallback={<div>Loading</div>}>
          <ResolvedChild />
        </DelayedSuspense>
      );

      expect(screen.queryByText("Loading")).toBeNull();
    });

    it("renders multiple children", () => {
      render(
        <DelayedSuspense>
          <ResolvedChild text="First" />
          <ResolvedChild text="Second" />
        </DelayedSuspense>
      );

      expect(screen.getByText("First")).toBeDefined();
      expect(screen.getByText("Second")).toBeDefined();
    });
  });

  describe("suspending children", () => {
    it("does not show fallback immediately after render", () => {
      const { SuspendingChild } = createSuspenseSetup();

      render(
        <DelayedSuspense fallback={<div>Loading</div>}>
          <SuspendingChild />
        </DelayedSuspense>
      );

      expect(screen.queryByText("Loading")).toBeNull();
    });

    it("shows fallback after the delay", async () => {
      const { SuspendingChild } = createSuspenseSetup();

      render(
        <DelayedSuspense fallback={<div>Loading</div>} delay={DELAY}>
          <SuspendingChild />
        </DelayedSuspense>
      );

      expect(screen.queryByText("Loading")).toBeNull();
      await screen.findByText("Loading", {}, { timeout: DELAY * 4 });
    });

    it("shows fallback immediately when delay is 0", () => {
      const { SuspendingChild } = createSuspenseSetup();

      render(
        <DelayedSuspense fallback={<div>Loading</div>} delay={0}>
          <SuspendingChild />
        </DelayedSuspense>
      );

      expect(screen.getByText("Loading")).toBeDefined();
    });

    it("shows fallback immediately when delay is negative", () => {
      const { SuspendingChild } = createSuspenseSetup();

      render(
        <DelayedSuspense fallback={<div>Loading</div>} delay={-1}>
          <SuspendingChild />
        </DelayedSuspense>
      );

      expect(screen.getByText("Loading")).toBeDefined();
    });

    it("renders nothing as fallback when no fallback prop is provided", async () => {
      const { SuspendingChild } = createSuspenseSetup();

      const { container } = render(
        <DelayedSuspense delay={DELAY}>
          <SuspendingChild />
        </DelayedSuspense>
      );

      await wait(DELAY * 2);
      expect(container.textContent).toBe("");
    });

    it("shows children and hides fallback after suspension resolves", async () => {
      const { SuspendingChild, resolve } = createSuspenseSetup();

      render(
        <DelayedSuspense fallback={<div>Loading</div>} delay={DELAY}>
          <SuspendingChild />
        </DelayedSuspense>
      );

      await screen.findByText("Loading", {}, { timeout: DELAY * 4 });

      await act(async () => {
        resolve();
      });

      expect(screen.queryByText("Loading")).toBeNull();
      expect(screen.getByText("Resolved content")).toBeDefined();
    });

    it("shows children without exposing fallback when suspension resolves before the delay", async () => {
      const { SuspendingChild, resolve } = createSuspenseSetup();

      render(
        <DelayedSuspense fallback={<div>Loading</div>} delay={DELAY}>
          <SuspendingChild />
        </DelayedSuspense>
      );

      expect(screen.queryByText("Loading")).toBeNull();

      await act(async () => {
        resolve();
      });

      expect(screen.getByText("Resolved content")).toBeDefined();
      expect(screen.queryByText("Loading")).toBeNull();
    });

    it("cleans up the timer when unmounted before delay fires", async () => {
      const { SuspendingChild } = createSuspenseSetup();

      const { unmount } = render(
        <DelayedSuspense fallback={<div>Loading</div>} delay={DELAY}>
          <SuspendingChild />
        </DelayedSuspense>
      );

      unmount();

      // Wait past the delay — no errors should be thrown from a state update on an unmounted component.
      await wait(DELAY * 2);
    });
  });
});

describe("DelayedSuspense.create", () => {
  it("returns a function (component)", () => {
    expect(typeof DelayedSuspense.create(200)).toBe("function");
  });

  it("renders non-suspending children without fallback", () => {
    const CustomSuspense = DelayedSuspense.create(200);

    render(
      <CustomSuspense fallback={<div>Loading</div>}>
        <ResolvedChild />
      </CustomSuspense>
    );

    expect(screen.getByText("Content")).toBeDefined();
    expect(screen.queryByText("Loading")).toBeNull();
  });

  describe("with suspending children", () => {
    it("does not show fallback immediately before the fixed delay", () => {
      const CustomSuspense = DelayedSuspense.create(DELAY);
      const { SuspendingChild } = createSuspenseSetup();

      render(
        <CustomSuspense fallback={<div>Loading</div>}>
          <SuspendingChild />
        </CustomSuspense>
      );

      expect(screen.queryByText("Loading")).toBeNull();
    });

    it("shows fallback after the fixed delay", async () => {
      const CustomSuspense = DelayedSuspense.create(DELAY);
      const { SuspendingChild } = createSuspenseSetup();

      render(
        <CustomSuspense fallback={<div>Loading</div>}>
          <SuspendingChild />
        </CustomSuspense>
      );

      await screen.findByText("Loading", {}, { timeout: DELAY * 4 });
    });

    it("uses the default 300ms delay when created without arguments", () => {
      const DefaultSuspense = DelayedSuspense.create();
      const { SuspendingChild } = createSuspenseSetup();

      render(
        <DefaultSuspense fallback={<div>Loading</div>}>
          <SuspendingChild />
        </DefaultSuspense>
      );

      // 300ms default — verify it is not shown synchronously.
      expect(screen.queryByText("Loading")).toBeNull();
    });

    it("shows children and hides fallback after suspension resolves", async () => {
      const CustomSuspense = DelayedSuspense.create(DELAY);
      const { SuspendingChild, resolve } = createSuspenseSetup();

      render(
        <CustomSuspense fallback={<div>Loading</div>}>
          <SuspendingChild />
        </CustomSuspense>
      );

      await screen.findByText("Loading", {}, { timeout: DELAY * 4 });

      await act(async () => {
        resolve();
      });

      expect(screen.queryByText("Loading")).toBeNull();
      expect(screen.getByText("Resolved content")).toBeDefined();
    });

    it("shows fallback immediately when created with delay 0", () => {
      const ImmediateSuspense = DelayedSuspense.create(0);
      const { SuspendingChild } = createSuspenseSetup();

      render(
        <ImmediateSuspense fallback={<div>Loading</div>}>
          <SuspendingChild />
        </ImmediateSuspense>
      );

      expect(screen.getByText("Loading")).toBeDefined();
    });

    it("shows children without exposing fallback when suspension resolves before the delay", async () => {
      const CustomSuspense = DelayedSuspense.create(DELAY);
      const { SuspendingChild, resolve } = createSuspenseSetup();

      render(
        <CustomSuspense fallback={<div>Loading</div>}>
          <SuspendingChild />
        </CustomSuspense>
      );

      expect(screen.queryByText("Loading")).toBeNull();

      await act(async () => {
        resolve();
      });

      expect(screen.getByText("Resolved content")).toBeDefined();
      expect(screen.queryByText("Loading")).toBeNull();
    });

    it("each created instance uses its own independent delay", async () => {
      const FastSuspense = DelayedSuspense.create(DELAY);
      const SlowSuspense = DelayedSuspense.create(DELAY * 6);
      const { SuspendingChild: FastChild } = createSuspenseSetup();
      const { SuspendingChild: SlowChild } = createSuspenseSetup();

      render(
        <div>
          <FastSuspense fallback={<div>Fast loading</div>}>
            <FastChild />
          </FastSuspense>
          <SlowSuspense fallback={<div>Slow loading</div>}>
            <SlowChild />
          </SlowSuspense>
        </div>
      );

      await screen.findByText("Fast loading", {}, { timeout: DELAY * 4 });
      expect(screen.queryByText("Slow loading")).toBeNull();

      await screen.findByText("Slow loading", {}, { timeout: DELAY * 7 });
    });
  });
});
