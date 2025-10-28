import { DelayedSuspense } from "@r-machine/react/utils";
import Body from "./Body";
import BodyLoading from "./components/BodyLoading";
import { ReactRMachine } from "./r-machine/toolset";

export default function App() {
  return (
    <ReactRMachine>
      <DelayedSuspense fallback={<BodyLoading />}>
        <Body />
      </DelayedSuspense>
    </ReactRMachine>
  );
}
