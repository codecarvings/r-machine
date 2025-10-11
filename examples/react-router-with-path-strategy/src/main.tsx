import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import "./index.css";
import DefaultLocaleRedirect from "./default-locale-redirect.tsx";
import Home from "./home.tsx";
import LocaleRoot from "./locale-root.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/:locale" element={<LocaleRoot />}>
          <Route index element={<Home />} />
        </Route>
        <Route index element={<DefaultLocaleRedirect />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
