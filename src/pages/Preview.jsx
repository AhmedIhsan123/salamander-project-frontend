import { Link, useParams } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

export default function Preview() {
	const { filename } = useParams();
	const [color, setColor] = useState(null);
	const [tolerance, setTolerance] = useState(0);
	const [imageReady, setImageReady] = useState(false);
	const canvasRef = useRef(null);
	const imageRef = useRef(null);

	function handleColorChange(e) {
		setColor(e.target.value);
		console.log(color);
	}

	function handleToleranceChange(e) {
		console.log(e.target.value);
	}

	return (
		<div className="flex flex-col items-center justify-center px-6 py-16">
			<div className="w-full max-w-2xl border-t-4 border-green-800 mb-10" />
			<div className="w-full max-w-2xl bg-white border border-stone-200 rounded-sm shadow-sm px-10 py-12">
				<p className="text-xs uppercase tracking-[0.2em] text-stone-400 font-medium mb-3">
					Previewing
				</p>

				<h1 className="text-3xl font-[SchoolBell] text-green-800 mb-6 break-all">
					{filename}
				</h1>

				<p className="text-stone-500 text-sm leading-relaxed mb-8"></p>
				<img src={thumbnail} alt={thumbnail.filename}></img>
				<div className="flex items-center gap-3 mb-6">
					<div className="h-px flex-1 bg-stone-200" />
				</div>

				<p className="text-stone-500 text-sm leading-relaxed mb-8">
					Thumbnail and tuning controls will go here in a future pair program.
				</p>

				<div>
					<input type="color" onChange={handleColorChange} />
					<input type="range" onChange={handleToleranceChange} />
				</div>

				<canvas ref={canvasRef}></canvas>

				<Link
					to="/videos"
					className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-900 underline underline-offset-2 decoration-green-300 hover:decoration-green-600 transition-colors"
				>
					Back to videos
				</Link>
			</div>
			<div className="w-full max-w-2xl border-b-4 border-green-800 mt-10" />
		</div>
	);
}
