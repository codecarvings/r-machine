import { DelayedSuspense } from "@r-machine/react/utils";
import { ReactRMachine } from "@/r-machine/toolset";
import Body from "./Body";
import BodyLoading from "./components/BodyLoading";

export default function App() {
  return (
    <ReactRMachine>
      <DelayedSuspense fallback={<BodyLoading />}>
        <Body />
      </DelayedSuspense>
    </ReactRMachine>
  );
}
