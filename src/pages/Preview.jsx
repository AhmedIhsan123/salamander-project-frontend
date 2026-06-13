import { Link, useParams } from "react-router-dom";
import { getThumbnail, submitProcessingJob, getJobStatus } from "../api.js";
import { getJobs, saveJob } from "../jobStore.js";
import ResultsPanel from "../components/ResultsPanel.jsx";
import { useEffect, useState, useRef } from "react";

export default function Preview() {
	const { filename } = useParams();
	const [thumbnail, setThumbnail] = useState(null);
	const [color, setColor] = useState("#ffa200");
	const [tolerance, setTolerance] = useState(100);
	const [imageReady, setImageReady] = useState(false);
	const [job, setJob] = useState(null); // { jobId, status, result?, error? }
	const [submitting, setSubmitting] = useState(false);
	const [hover, setHover] = useState(null); // color under the mouse on the thumbnail
	const [history, setHistory] = useState([]);
	const canvasRef = useRef(null);
	const imgRef = useRef(null);
	const pickRef = useRef(null); // hidden canvas used to read pixel colors

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
				};
				img.src = url;
			})
			.catch(() => setThumbnail(null));
	}, [filename]);

	// Load saved runs for this video
	useEffect(() => {
		setHistory(getJobs(filename));
	}, [filename]);

	// Draw the original image once so the eyedropper can read pixel colors
	useEffect(() => {
		if (!imageReady) return;
		const img = imgRef.current;
		const canvas = document.createElement("canvas");
		canvas.width = img.naturalWidth;
		canvas.height = img.naturalHeight;
		canvas.getContext("2d").drawImage(img, 0, 0);
		pickRef.current = canvas;
	}, [imageReady]);

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

	// Poll the job status every 2 seconds while a job is processing.
	useEffect(() => {
		if (!job?.jobId || job.status !== "processing") return;

		const interval = setInterval(async () => {
			try {
				const status = await getJobStatus(job.jobId);
				setJob((prev) => ({ ...prev, ...status }));
			} catch (err) {
				setJob((prev) => ({ ...prev, status: "error", error: err.message }));
			}
		}, 2000);

		return () => clearInterval(interval);
	}, [job?.jobId, job?.status]);

	// Keep the saved history in sync with the current job
	useEffect(() => {
		if (!job?.jobId) return;
		saveJob({ filename, ...job });
		setHistory(getJobs(filename));
	}, [job, filename]);

	async function handleProcess() {
		setSubmitting(true);
		setJob(null);
		try {
			const { jobId } = await submitProcessingJob(filename, color, tolerance);
			setJob({
				jobId,
				status: "processing",
				color,
				threshold: tolerance,
				time: Date.now(),
			});
		} catch (err) {
			setJob({ status: "error", error: err.message });
		} finally {
			setSubmitting(false);
		}
	}

	// Reads the color under the mouse from the hidden canvas.
	// The image is shown with object-cover, which crops it to fit the box,
	// so we mirror that same scale + crop math to land on the right pixel.
	function colorAt(e) {
		const canvas = pickRef.current;
		if (!canvas) return null;
		const rect = e.currentTarget.getBoundingClientRect();

		const scale = Math.max(
			rect.width / canvas.width,
			rect.height / canvas.height,
		);
		// how much got cropped off each side by object-cover (centered)
		const offsetX = (canvas.width * scale - rect.width) / 2;
		const offsetY = (canvas.height * scale - rect.height) / 2;

		const x = Math.min(
			canvas.width - 1,
			Math.max(0, Math.floor((e.clientX - rect.left + offsetX) / scale)),
		);
		const y = Math.min(
			canvas.height - 1,
			Math.max(0, Math.floor((e.clientY - rect.top + offsetY) / scale)),
		);
		const [r, g, b] = canvas.getContext("2d").getImageData(x, y, 1, 1).data;
		const hex =
			"#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
		return { x: e.clientX - rect.left, y: e.clientY - rect.top, hex };
	}

	function handleThumbMove(e) {
		setHover(colorAt(e));
	}

	function handleThumbLeave() {
		setHover(null);
	}

	function handleThumbClick(e) {
		const picked = colorAt(e);
		if (picked) setColor(picked.hex);
	}

	function handleColorChange(e) {
		setColor(e.target.value);
	}

	function handleToleranceChange(e) {
		setTolerance(Number(e.target.value));
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

				<div className="mb-2">
					{thumbnail ? (
						<div className="relative">
							<img
								src={thumbnail}
								alt={filename}
								onMouseMove={handleThumbMove}
								onMouseLeave={handleThumbLeave}
								onClick={handleThumbClick}
								className="w-full aspect-video object-cover cursor-crosshair"
							/>
							{hover && (
								<div
									className="pointer-events-none absolute z-10 flex items-center gap-2
									           rounded bg-stone-900/90 px-2 py-1 text-xs text-white"
									style={{ left: hover.x + 14, top: hover.y + 14 }}
								>
									<span
										className="h-3 w-3 rounded-sm border border-white/40"
										style={{ background: hover.hex }}
									/>
									{hover.hex}
								</div>
							)}
						</div>
					) : (
						<div className="w-full aspect-video bg-stone-100 flex items-center justify-center text-stone-400 text-sm">
							Loading thumbnail...
						</div>
					)}
				</div>

				<p className="mb-8 text-xs text-stone-400">
					Tip: click the thing you want to track to set it as the target color.
				</p>

				<div className="mb-8 space-y-5">
					<div className="flex flex-wrap items-center gap-6">
						<label className="flex items-center gap-3 text-sm font-medium text-stone-600">
							Target color
							<input
								type="color"
								value={color}
								onChange={handleColorChange}
								className="h-9 w-14 cursor-pointer rounded border border-stone-300 bg-white p-0.5"
							/>
						</label>

						<label className="flex flex-1 min-w-[220px] items-center gap-3 text-sm font-medium text-stone-600">
							Threshold
							<input
								type="range"
								min="0"
								max="255"
								value={tolerance}
								onChange={handleToleranceChange}
								className="flex-1 accent-green-700"
							/>
							<span className="w-10 text-right tabular-nums text-stone-700">
								{tolerance}
							</span>
						</label>
					</div>

					<button
						type="button"
						onClick={handleProcess}
						disabled={submitting || job?.status === "processing"}
						className="w-full rounded-sm bg-green-800 px-6 py-3 text-sm font-medium
						           tracking-wide text-white transition-colors hover:bg-green-700
						           disabled:cursor-not-allowed disabled:bg-stone-300"
					>
						{job?.status === "processing"
							? "Processing..."
							: submitting
								? "Starting..."
								: "Start Processing"}
					</button>

					<ResultsPanel job={job} />
				</div>

				<p className="text-xs uppercase tracking-[0.2em] text-stone-400 font-medium mb-3">
					Binarization preview
				</p>
				<canvas
					ref={canvasRef}
					className="w-full aspect-video object-cover mb-8"
				></canvas>

				{history.length > 0 && (
					<div className="mb-8">
						<p className="text-xs uppercase tracking-[0.2em] text-stone-400 font-medium mb-3">
							Previous runs
						</p>
						<ul className="divide-y divide-stone-100 rounded-sm border border-stone-200">
							{history.map((run) => (
								<li
									key={run.jobId}
									className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm"
								>
									<span
										className="h-4 w-4 rounded-sm border border-stone-200"
										style={{ background: run.color }}
										title={run.color}
									/>
									<span className="text-stone-600">
										Threshold {run.threshold}
									</span>
									<span className="text-xs text-stone-400">
										{run.time ? new Date(run.time).toLocaleString() : ""}
									</span>
									<span className="ml-auto flex items-center gap-3">
										{run.status === "done" && run.result ? (
											<a
												href={run.result}
												download
												className="font-medium text-green-700 underline underline-offset-2 hover:text-green-900"
											>
												Download CSV
											</a>
										) : (
											<span
												className={
													run.status === "error"
														? "text-xs font-medium text-red-500"
														: "text-xs font-medium text-amber-600"
												}
											>
												{run.status}
											</span>
										)}
									</span>
								</li>
							))}
						</ul>
					</div>
				)}

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
