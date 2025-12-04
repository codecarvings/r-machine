"use client";

import { setLocaleOnServer } from "./client-comp-2.actions";

export default function ClientComp2() {
  return (
    <div>
      <button type="button" onClick={async () => await setLocaleOnServer("en")}>
        en (SERVER)
      </button>
      <button type="button" onClick={async () => await setLocaleOnServer("it-IT")}>
        it (SERVER)
      </button>
    </div>
  );
}
