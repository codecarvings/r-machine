import { useEffect, useState } from "react";
import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";

// Fine-grained highlighter: only the langs/theme we actually use are bundled
// (avoids pulling shiki's full set of grammars).
let highlighterPromise: Promise<HighlighterCore> | null = null;
function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [import("@shikijs/themes/github-light")],
      langs: [import("@shikijs/langs/typescript"), import("@shikijs/langs/tsx")],
      engine: createOnigurumaEngine(import("shiki/wasm")),
    });
  }
  return highlighterPromise;
}

export function CodeBlock({ code, lang = "tsx" }: { code: string; lang?: "ts" | "tsx" }) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const langId = lang === "ts" ? "typescript" : "tsx";
    getHighlighter().then((hl) => {
      if (alive) {
        setHtml(hl.codeToHtml(code, { lang: langId, theme: "github-light" }));
      }
    });
    return () => {
      alive = false;
    };
  }, [code, lang]);

  // Plain fallback until shiki has highlighted the snippet.
  if (html === null) {
    return (
      <pre className="overflow-auto rounded-lg border bg-muted/40 p-4 text-sm leading-relaxed">
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div
      className="overflow-auto rounded-lg border text-sm leading-relaxed [&_pre]:m-0 [&_pre]:p-4"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki output of our own source files
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
