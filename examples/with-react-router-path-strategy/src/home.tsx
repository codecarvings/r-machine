import { useLocale } from "react-r-machine";
import { Link } from "react-router";
import { useR } from "./r-machine/hooks";

export default function Home() {
  const r = useR("common");
  const [locale] = useLocale();

  return (
    <>
      <nav>
        <Link to="/en">[English]</Link>
        <Link to="/it">[Italiano]</Link>
      </nav>
      <r.currentLanguage locale={locale} />
      <div>
        <h1>{r.title}</h1>
        <p>{r.welcomeMessage}</p>
      </div>
    </>
  );
}
