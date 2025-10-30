import { type ReactNode, Suspense, useEffect, useState } from "react";

const defaultDelay = 300;

function DelayedFallback({ fallback, delay }: { fallback: ReactNode; delay: number }) {
  const [showFallback, setShowFallback] = useState(delay <= 0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFallback(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!showFallback) {
    return null;
  }

  return fallback;
}

interface DelayedSuspenseProps {
  children: ReactNode;
  fallback: ReactNode;
  delay?: number;
}

export function DelayedSuspense({ children, fallback, delay = defaultDelay }: DelayedSuspenseProps) {
  return <Suspense fallback={<DelayedFallback fallback={fallback} delay={delay} />}>{children}</Suspense>;
}
