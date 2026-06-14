import { Routes, Route, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Home from './pages/Home.jsx';
import Videos from './pages/Videos.jsx';
import Preview from './pages/Preview.jsx';
import { countProcessing } from './jobStore.js';

export default function App() {
  const [running, setRunning] = useState(0);

  // Keep the navbar processing badge in sync with the job store
  useEffect(() => {
    const update = () => setRunning(countProcessing());
    update();
    const interval = setInterval(update, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">

      <header className="bg-white border-b-2 border-green-800">
        <nav className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="font-[SchoolBell] text-2xl text-green-800 leading-none hover:text-green-600 transition-colors"
          >
            Salamander Tracker
          </Link>
          <div className="flex items-center gap-6">
            {running > 0 && (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                {running} processing
              </span>
            )}
            <Link
              to="/"
              className="text-sm text-stone-500 hover:text-green-800 transition-colors font-medium tracking-wide"
            >
              Home
            </Link>
            <Link
              to="/videos"
              className="text-sm text-stone-500 hover:text-green-800 transition-colors font-medium tracking-wide"
            >
              Videos
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/preview/:filename" element={<Preview />} />

        </Routes>
      </main>
    </div>
  );
}