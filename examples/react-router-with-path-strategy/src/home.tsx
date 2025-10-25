import { Link } from "react-router";
import { useR } from "./r-machine/toolset";

export default function Home() {
  const r = useR("common");

  const date = new Date();

  return (
    <>
      <nav>
        <Link to="/en">[English]</Link>
        <Link to="/it">[Italiano]</Link>
      </nav>
      {r.currentLanguage}
      <div>
        <h1>{r.title}</h1>
        <p>
          <r.welcomeMessage date={date} />
        </p>
      </div>
    </>
  );
}
