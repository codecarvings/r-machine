import { type ReactNode, Suspense, useEffect, useState } from "react";

const defaultDelay = 300;

export type SuspenseComponent = (props: { children: ReactNode; fallback?: ReactNode }) => ReactNode;

function DelayedFallback({ fallback, delay }: { fallback: ReactNode; delay: number }) {
  const [showFallback, setShowFallback] = useState(delay <= 0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFallback(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!showFallback) {
    return undefined;
  }

  return fallback;
}

interface CustomDelayedSuspenseProps {
  children: ReactNode;
  fallback?: ReactNode;
}
interface DelayedSuspenseProps extends CustomDelayedSuspenseProps {
  delay?: number | undefined;
}

export function DelayedSuspense({ children, fallback, delay = defaultDelay }: DelayedSuspenseProps) {
  return <Suspense fallback={<DelayedFallback fallback={fallback} delay={delay} />}>{children}</Suspense>;
}
DelayedSuspense.create = (delay: number = defaultDelay) =>
  function DelayedSuspenseWithFixedDelay({ children, fallback }: CustomDelayedSuspenseProps) {
    return <Suspense fallback={<DelayedFallback fallback={fallback} delay={delay} />}>{children}</Suspense>;
  };
