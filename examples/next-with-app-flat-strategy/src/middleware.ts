import { rMachineProxy } from "./r-machine/server-toolset";

export default rMachineProxy;

export const config = {
  // Apply proxy to all routes except:
  // - Common system routes: `/_next`, `/_vercel`, `/api`
  // - Requests ending with a file extension (e.g., `.js`, `.css`, `.png`, etc.)
  matcher: ["/", "/((?!_next|_vercel|api|.*\\..*).*)"],
};
