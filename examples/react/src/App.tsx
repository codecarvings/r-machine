import { ReactRMachine } from "@/r-machine/toolset";
import { AppShell } from "./components/showcase/app-shell";
import ContentLoading from "./components/showcase/content-loading";

export default function App() {
  return (
    <ReactRMachine fallback={<ContentLoading />}>
      <AppShell />
    </ReactRMachine>
  );
}
