import { Calendar, Hash, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plug } from "@/r-machine/toolset";
import FeatureBox from "./FeatureBox";

export const plug = Plug("shell/features/intl_demo");
export default function IntlDemo() {
  const [comp, $] = plug.use();
  const { time } = $.kit.fmt;

  // Live clock
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Interactive counter for plural demo
  const [count, setCount] = useState(1);

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">{comp.sectionTitle}</h2>
          <p className="text-lg text-muted-foreground">{comp.sectionSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Date formatting */}
          <FeatureBox
            badge={comp.dateTime.badge}
            title={comp.dateTime.label}
            icon={<Calendar className="size-5 text-stone-600 group-hover:text-red-600" />}
          >
            <div className="text-2xl font-mono font-bold text-foreground mb-1.5">{time(now)}</div>
            <div className="text-xs text-muted-foreground">{comp.dateTime.caption(now)}</div>
          </FeatureBox>

          {/* Number & Currency formatting */}
          <FeatureBox
            badge={comp.number.badge}
            title={comp.number.label}
            icon={<Hash className="size-5 text-stone-600 group-hover:text-red-600" />}
          >
            <div className="text-lg leading-relaxed text-foreground">{comp.number.description(1234.56)}</div>
          </FeatureBox>

          {/* Plural rules */}
          <FeatureBox
            badge={comp.plural.badge}
            title={comp.plural.label}
            icon={<Users className="size-5 text-stone-600 group-hover:text-red-600" />}
          >
            <div className="text-lg leading-relaxed text-foreground">
              <comp.plural.Items count={count} />
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
