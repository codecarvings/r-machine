import { ReactRMachine } from "@/r-machine/toolset";
import ContentLoading from "./components/client/ContentLoading";
import LandingPage from "./LandingPage";

export default function App() {
  return (
    <ReactRMachine fallback={<ContentLoading />}>
      <LandingPage />
    </ReactRMachine>
  );
}
