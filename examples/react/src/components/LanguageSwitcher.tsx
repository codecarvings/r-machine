import { useLocale } from "../r-machine/toolset";

export default function LanguageSwitcher() {
  const [locale, setLocale] = useLocale();

  const languages = [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "it", label: "Italiano", flag: "🇮🇹" },
  ] as const;

  return (
    <div className="flex justify-center mb-8">
      <div className="inline-flex bg-stone-100 rounded-full p-1 shadow-md">
        {languages.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLocale(lang.code)}
            className={`
              px-6 py-2.5 rounded-full font-medium transition-all duration-300
              flex items-center gap-2
              ${
                locale === lang.code
                  ? "bg-white text-gray-900 shadow-lg transform scale-105"
                  : "text-gray-600 hover:text-gray-900"
              }
            `}
          >
            <span className="text-xl">{lang.flag}</span>
            <span>{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
