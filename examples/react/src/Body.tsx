import Box1 from "./components/Box1";
import Box2 from "./components/Box2";
import Box3 from "./components/Box3";
import LanguageSwitcher from "./components/LanguageSwitcher";
import Logo from "./components/Logo";
import { useRKit } from "./r-machine/toolset";

export default function Body() {
  const [rBody, rCommon] = useRKit("body", "common"); // Fetch R-Machine content for the body section

  return (
    <div className="min-h-screen bg-linear-to-tr from-stone-600 to-stone-800 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-12 backdrop-blur-sm bg-opacity-95">
          <div className="text-center">
            <Logo />

            <LanguageSwitcher />

            <h1 className="text-5xl font-bold text-gray-800 mb-4">{rBody.header.title}</h1>
            <p className="text-xl text-gray-600 mb-8">{rBody.header.subTitle}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <Box1 />
              <Box2 />
              <Box3 />
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">{rCommon.footer.message}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
