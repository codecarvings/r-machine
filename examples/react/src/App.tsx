import { DelayedSuspense } from "@r-machine/react/utils";
import { ReactRMachine } from "@/r-machine/toolset";
import PageLoading from "./components/PageLoading";
import LandingPage from "./LandingPage";

export default function App() {
  return (
    <ReactRMachine>
      <DelayedSuspense fallback={<PageLoading />}>
        <LandingPage />
      </DelayedSuspense>
    </ReactRMachine>
  );
}
