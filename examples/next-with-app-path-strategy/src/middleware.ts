import { rMachineProxy } from "./r-machine/server-toolset";

export default rMachineProxy;

export const config = {
  // Apply proxy to all routes except:
  // - Common system routes: `/_next`, `/_vercel`, `/api`
  // - Static assets: files with extensions like `favicon.ico`, `robots.txt`
  matcher: ["/", "/((?!_next|_vercel|api|.*\\..*).*)"],
};
