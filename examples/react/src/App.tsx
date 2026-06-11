import { ReactRMachine } from "@/r-machine/toolset";
import ContentLoading from "./components/client/ContentLoading";
import { AppShell } from "./components/showcase/AppShell";

export default function App() {
  return (
    <ReactRMachine fallback={<ContentLoading />}>
      <AppShell />
    </ReactRMachine>
  );
}
