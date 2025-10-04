import { Link } from "react-router";
import { useR } from "./r-machine/context";

export default function Home() {
  const r = useR("common");

  return (
    <>
      <nav>
        <Link to="/en">[English]</Link>
        <Link to="/it">[Italiano]</Link>
      </nav>
      <div>
        <h1>{r.title}</h1>
        <p>{r.welcomeMessage}</p>
      </div>
    </>
  );
}
