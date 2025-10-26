import Body from "./Body";
import { ReactRMachine } from "./r-machine/toolset";

export default function App() {
  return (
    <ReactRMachine locale="en">
      <Body />
    </ReactRMachine>
  );
}
