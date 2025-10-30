import rMachineLogo from "./assets/r-machine.logo.svg";

export default function Logo() {
  return (
    <a
      href="https://r-machine.codecarvings.com"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block transition-transform hover:scale-105 duration-300"
    >
      <img src={rMachineLogo} className="w-48 h-48 mx-auto mb-8 drop-shadow-lg" alt="R-Machine logo" />
    </a>
  );
}
