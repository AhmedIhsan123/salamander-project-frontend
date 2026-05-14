import { Routes, Route } from "react-router-dom";
import Videos from "./pages/Videos.jsx";
import Home from "./pages/Home.jsx";

export default function App() {
	return (
		<Routes>
			<Route path="/" element={<Home />} />
			<Route path="/videos" element={<Videos />} />
		</Routes>
	);
}
