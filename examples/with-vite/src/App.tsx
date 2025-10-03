import "./App.css";
import Home from "./home";
import { RMachineProvider } from "./r-machine/context";

function App() {
  // TODO: manage locale properly
  const locale = "it";

  return (
    <RMachineProvider locale={locale}>
      <Home />
    </RMachineProvider>
  );
}

export default App;
