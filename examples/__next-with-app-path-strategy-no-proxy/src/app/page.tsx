import { NextServerRMachine } from "@/r-machine/server-toolset";

// Automatically redirects to the correct locale based on:
// 1 - Cookie (if enabled and present)
// 2 - the Accept-Language header
export default NextServerRMachine.EntrancePage;
