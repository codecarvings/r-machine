interface AcceptLanguageItem {
  lang: string;
  q: number;
}

export function parseAcceptLanguage(header: string): readonly AcceptLanguageItem[] {
  return header
    .split(",")
    .map((lang) => {
      const [tag, qValue] = lang.trim().split(";");
      const q = qValue ? parseFloat(qValue.split("=")[1]) : 1.0;
      return { lang: tag.trim(), q };
    })
    .sort((a, b) => b.q - a.q);
}
