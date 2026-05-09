import { ReactRMachine } from "@/r-machine/toolset";
import ContentLoading from "./components/client/ContentLoading";
import WipLandingPage from "./WIPLandingPage";

export default function App() {
  return (
    <ReactRMachine fallback={<ContentLoading />}>
      <WipLandingPage />
    </ReactRMachine>
  );
}
