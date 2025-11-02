"use client";

import { setLocaleOnServer } from "./client-comp-2.actions";

export default function ClientComp2() {
  return (
    <div>
      <button type="button" onClick={() => setLocaleOnServer("en")}>
        en (SERVER)
      </button>
      <button type="button" onClick={() => setLocaleOnServer("it")}>
        it (SERVER)
      </button>
    </div>
  );
}
