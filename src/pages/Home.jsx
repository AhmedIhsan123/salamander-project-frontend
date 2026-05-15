import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-green-950 flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">

      <div className="absolute top-0 left-0 w-64 h-64 bg-green-500 rounded-full opacity-[0.06] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-green-600 rounded-full opacity-[0.07] translate-x-1/4 translate-y-1/4 pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg text-center flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">

        <h1 className="font-[SchoolBell] text-6xl text-green-50 leading-tight mb-6">
          Salamander Tracker
        </h1>

        <div className="flex items-center gap-3 w-full mb-6">
          <div className="h-px flex-1 bg-green-900" />
        </div>

        <p className="text-green-100 text-base leading-relaxed opacity-80">
          Pick a video from the{" "}
          <Link to="/videos" className="text-green-400 font-medium border-b border-green-800 hover:border-green-400 transition-colors">
            Videos
          </Link>{" "}
          page to start analyzing.
        </p>
      </div>
    </div>
  );
}
