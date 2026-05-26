import { Link, useParams } from "react-router-dom";
import { getThumbnail } from "../mockApi.js";
import { useEffect, useState, useRef } from "react";

export default function Preview() {
	const { filename } = useParams();
	const [thumbnail, setThumbnail] = useState(null);
	const [color, setColor] = useState(null);
	const [tolerance, setTolerance] = useState(0);
	const [imageReady, setImageReady] = useState(false);
	const canvasRef = useRef(null);
	const imageRef = useRef(null);

	useEffect(() => {
		getThumbnail(filename)
			.then((url) => setThumbnail(url))
			.catch(() => setThumbnail(null));
	}, [filename]);

	function handleColorChange(e) {
		setColor(e.target.value);
	}

	function handleToleranceChange(e) {
		setTolerance(e.target.value);
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

				<div className="flex items-center gap-3 mb-6">
					<div className="h-px flex-1 bg-stone-200" />
				</div>

				<div className="mb-8">
					{thumbnail ? (
						<img
							ref={imageRef}
							src={thumbnail}
							alt={filename}
							className="w-full aspect-video object-cover"
							onLoad={() => setImageReady(true)}
						/>
					) : (
						<div className="w-full aspect-video bg-stone-100 flex items-center justify-center text-stone-400 text-sm">
							Loading thumbnail...
						</div>
					)}
				</div>

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
