import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Videos from './pages/Videos.jsx';
import Preview from './pages/Preview.jsx';

export default function App() {
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