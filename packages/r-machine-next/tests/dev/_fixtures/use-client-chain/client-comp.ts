"use client";

// Fixture: a `"use client"` module that imports a browser-only Next entrypoint.
// Under jiti WITHOUT the boundary stub, following this import statically would
// crash with ERR_MODULE_NOT_FOUND on `next/navigation`. With the stub, this
// whole module is replaced before that import is ever resolved.
import { useRouter } from "next/navigation";

export function ClientThing() {
  return useRouter();
}

export default function ClientComponent() {
  return useRouter();
}
