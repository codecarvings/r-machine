import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DelayedSuspense } from "../../src/utils/delayed-suspense.js";

afterEach(cleanup);

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

describe("DelayedSuspense", () => {
  describe("non-suspending children", () => {
    it("renders children immediately", () => {
      render(
        <DelayedSuspense fallback={<div>Loading</div>}>
          <ResolvedChild />
        </DelayedSuspense>
      );

      screen.getByText("Content");
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

      screen.getByText("First");
      screen.getByText("Second");
    });
  });

  describe("suspending children", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

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

      await act(async () => {
        vi.advanceTimersByTime(DELAY);
      });

      screen.getByText("Loading");
    });

    it("shows fallback immediately when delay is 0", () => {
      const { SuspendingChild } = createSuspenseSetup();

      render(
        <DelayedSuspense fallback={<div>Loading</div>} delay={0}>
          <SuspendingChild />
        </DelayedSuspense>
      );

      screen.getByText("Loading");
    });

    it("shows fallback immediately when delay is negative", () => {
      const { SuspendingChild } = createSuspenseSetup();

      render(
        <DelayedSuspense fallback={<div>Loading</div>} delay={-1}>
          <SuspendingChild />
        </DelayedSuspense>
      );

      screen.getByText("Loading");
    });

    it("renders nothing as fallback when no fallback prop is provided", async () => {
      const { SuspendingChild } = createSuspenseSetup();

      const { container } = render(
        <DelayedSuspense delay={DELAY}>
          <SuspendingChild />
        </DelayedSuspense>
      );

      await act(async () => {
        vi.advanceTimersByTime(DELAY * 2);
      });

      expect(container.textContent).toBe("");
    });

    it("shows children and hides fallback after suspension resolves", async () => {
      const { SuspendingChild, resolve } = createSuspenseSetup();

      render(
        <DelayedSuspense fallback={<div>Loading</div>} delay={DELAY}>
          <SuspendingChild />
        </DelayedSuspense>
      );

      await act(async () => {
        vi.advanceTimersByTime(DELAY);
      });

      screen.getByText("Loading");

      await act(async () => {
        resolve();
      });

      expect(screen.queryByText("Loading")).toBeNull();
      screen.getByText("Resolved content");
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

      screen.getByText("Resolved content");
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

      await act(async () => {
        vi.advanceTimersByTime(DELAY * 2);
      });
    });
  });
});

describe("DelayedSuspense.create", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("uses the default 300ms delay when created without arguments", async () => {
    const DefaultSuspense = DelayedSuspense.create();
    const { SuspendingChild } = createSuspenseSetup();

    render(
      <DefaultSuspense fallback={<div>Loading</div>}>
        <SuspendingChild />
      </DefaultSuspense>
    );

    expect(screen.queryByText("Loading")).toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    screen.getByText("Loading");
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

    await act(async () => {
      vi.advanceTimersByTime(DELAY);
    });

    screen.getByText("Fast loading");
    expect(screen.queryByText("Slow loading")).toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(DELAY * 5);
    });

    screen.getByText("Slow loading");
  });
});
