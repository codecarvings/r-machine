"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { usePathComposer, useR } from "@/r-machine/client-toolset";

export function MainNav() {
  const r = useR("navigation");
  const getPath = usePathComposer();

  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href={getPath("/")}>{r.home}</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>{r.exampleStatic.label}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 w-[300px]">
              <ListItem href={getPath("/example-static/page-1")} title={r.exampleStatic.page1.label}>
                {r.exampleStatic.page1.description}
              </ListItem>
              <ListItem href={getPath("/example-static/page-2")} title={r.exampleStatic.page2.label}>
                {r.exampleStatic.page2.description}
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link href={getPath("/example-dynamic")}>{r.exampleDynamic.label}</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function ListItem({
  className,
  title,
  children,
  href,
  ...props
}: ComponentPropsWithoutRef<"a"> & { href: string; title: string }) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}
