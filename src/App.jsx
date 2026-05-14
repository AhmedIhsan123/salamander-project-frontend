import { Routes, Route } from 'react-router-dom';
import Home from './pages/Videos.jsx';
import Videos from './pages/Home.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/videos" element={<Videos />} />
    </Routes>
  );
}