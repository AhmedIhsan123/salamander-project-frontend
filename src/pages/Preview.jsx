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
	const imgRef = useRef(null);

	useEffect(() => {
		getThumbnail(filename)
			.then((url) => {
				setThumbnail(url);
				setImageReady(false);
				const img = new Image();
				img.crossOrigin = "anonymous";
				img.onload = () => {
					imgRef.current = img;
					setImageReady(true);
					console.log(
						"image loaded:",
						imgRef.current.naturalWidth,
						"x",
						imgRef.current.naturalHeight,
					);
				};
				img.src = url;
			})
			.catch(() => setThumbnail(null));
	}, [filename]);

	useEffect(() => {
		if (!imageReady) return;
		const img = imgRef.current;
		const canvas = canvasRef.current;
		if (!img || !canvas) return;

		canvas.width = img.naturalWidth;
		canvas.height = img.naturalHeight;
		const ctx = canvas.getContext("2d");
		ctx.drawImage(img, 0, 0);
		const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const px = data.data;

		// Parse target color from hex string
		const targetR = parseInt(color?.slice(1, 3), 16) ?? 0;
		const targetG = parseInt(color?.slice(3, 5), 16) ?? 0;
		const targetB = parseInt(color?.slice(5, 7), 16) ?? 0;

		for (let i = 0; i < px.length; i += 4) {
			const dr = px[i] - targetR;
			const dg = px[i + 1] - targetG;
			const db = px[i + 2] - targetB;

			// Euclidean distance between pixel color and target color
			const distance = Math.sqrt(dr * dr + dg * dg + db * db);

			// White if within threshold, black otherwise (matches DistanceImageBinarizer)
			const binary = distance < tolerance ? 255 : 0;

			px[i] = binary;
			px[i + 1] = binary;
			px[i + 2] = binary;
			// px[i + 3] = alpha, leave unchanged
		}

		ctx.putImageData(data, 0, 0);
	}, [imageReady, color, tolerance]);

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
							src={thumbnail}
							alt={filename}
							className="w-full aspect-video object-cover"
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
