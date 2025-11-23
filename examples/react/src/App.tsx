import { ReactRMachine } from "@/r-machine/toolset";
import PageLoading from "./components/client/PageLoading";
import LandingPage from "./LandingPage";

export default function App() {
  return (
    <ReactRMachine fallback={<PageLoading />}>
      <LandingPage />
    </ReactRMachine>
  );
}
