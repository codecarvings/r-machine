"use client";

import { Calendar, Hash, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useFmt, useR } from "@/r-machine/client-toolset";
import FeatureBox from "../server/feature-box";

export default function IntlDemo() {
  const r = useR("features/intl_demo");
  const { time } = useFmt();

  // Live clock — start null to avoid hydration mismatch (server vs client time)
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Interactive counter for plural demo
  const [count, setCount] = useState(1);

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{r.sectionTitle}</h2>
          <p className="text-lg text-muted-foreground">{r.sectionSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Date formatting */}
          <FeatureBox
            badge={r.dateTime.badge}
            title={r.dateTime.label}
            icon={<Calendar className="size-5 text-stone-600 group-hover:text-red-600" />}
          >
            <div className="text-2xl font-mono font-bold text-foreground mb-1.5">{now ? time(now) : "\u00A0"}</div>
            <div className="text-xs text-muted-foreground">{now ? r.dateTime.caption(now) : "---"}</div>
          </FeatureBox>

          {/* Number & Currency formatting */}
          <FeatureBox
            badge={r.number.badge}
            title={r.number.label}
            icon={<Hash className="size-5 text-stone-600 group-hover:text-red-600" />}
          >
            <div className="text-lg leading-relaxed text-foreground">{r.number.description(1234.56)}</div>
          </FeatureBox>

          {/* Plural rules */}
          <FeatureBox
            badge={r.plural.badge}
            title={r.plural.label}
            icon={<Users className="size-5 text-stone-600 group-hover:text-red-600" />}
          >
            <div className="text-lg leading-relaxed text-foreground">
              <r.plural.Items count={count} />
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" onClick={() => setCount(Math.max(0, count - 1))}>
                −
              </Button>
              <Button size="sm" variant="outline" onClick={() => setCount(count + 1)}>
                +
              </Button>
            </div>
          </FeatureBox>
        </div>
      </div>
    </section>
  );
}
