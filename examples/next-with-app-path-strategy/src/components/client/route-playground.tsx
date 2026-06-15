"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientPlug } from "@/r-machine/client-toolset";

export const plug = ClientPlug("shell/navigation", "shell/landing-page");
export function RoutePlayground() {
  const [sn, sp, $] = plug.useR();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{sp.playground.title}</CardTitle>
        <CardDescription>{sp.playground.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Locale-aware links — the URL shape depends on the routing strategy */}
        <PlaygroundLink href={$.getPath("/example-static/page-1")} label={sn.exampleStatic.page1.label}>
          {sn.exampleStatic.page1.description}
        </PlaygroundLink>
        <PlaygroundLink href={$.getPath("/example-static/page-2")} label={sn.exampleStatic.page2.label}>
          {sn.exampleStatic.page2.description}
        </PlaygroundLink>
        <PlaygroundLink href={$.getPath("/example-dynamic")} label={sn.exampleDynamic.label}>
          {sn.exampleDynamic.description}
        </PlaygroundLink>
        {/* Non-localized route — plain href, never gets a locale prefix */}
        <PlaygroundLink href="/hello-world" label={sn.helloWorld.label}>
          {sn.helloWorld.description}
        </PlaygroundLink>
      </CardContent>
    </Card>
  );
}

function PlaygroundLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="block rounded-md border p-3 transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <code className="text-xs text-muted-foreground">{href}</code>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{children}</p>
    </Link>
  );
}
