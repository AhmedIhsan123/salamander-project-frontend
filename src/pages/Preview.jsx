import { Link, useParams } from "react-router-dom";
import { submitProcessingJob, getJobStatus } from "../api.js";
import { getJobs, saveJob } from "../jobStore.js";
import ResultsPanel from "../components/ResultsPanel.jsx";
import { useToast } from "../components/Toast.jsx";
import { useEffect, useState, useRef } from "react";

export default function Preview() {
	const { filename } = useParams();
	const toast = useToast();
	const [color, setColor] = useState("#ffa200");
	const [tolerance, setTolerance] = useState(100);
	const [videoReady, setVideoReady] = useState(false);
	const [job, setJob] = useState(null); // { jobId, status, result?, error? }
	const [submitting, setSubmitting] = useState(false);
	const [hover, setHover] = useState(null); // color under the mouse
	const [history, setHistory] = useState([]);

	const videoRef = useRef(null);
	const canvasRef = useRef(null);
	const pickRef = useRef(null); // hidden canvas used to read pixel colors
	// keep latest color/threshold in refs so the animation loop sees fresh values
	const colorRef = useRef(color);
	const tolRef = useRef(tolerance);
	colorRef.current = color;
	tolRef.current = tolerance;

	const videoUrl = `/videos/${filename}`;

	// Load saved runs for this video
	useEffect(() => {
		setHistory(getJobs(filename));
	}, [filename]);

	// Breaks "#rrggbb" into [r, g, b]
	function hexToRgb(hex) {
		return [
			parseInt(hex.slice(1, 3), 16) || 0,
			parseInt(hex.slice(3, 5), 16) || 0,
			parseInt(hex.slice(5, 7), 16) || 0,
		];
	}

	// Draws the current video frame to the canvas, binarizing it if needed.
	function drawFrame() {
		const video = videoRef.current;
		const canvas = canvasRef.current;
		if (!video || !canvas || video.videoWidth === 0) return;

		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		const ctx = canvas.getContext("2d");
		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

		// also keep a copy of the raw frame so the eyedropper can read true colors
		const pick = pickRef.current;
		if (pick) {
			pick.width = canvas.width;
			pick.height = canvas.height;
			pick.getContext("2d").drawImage(video, 0, 0, pick.width, pick.height);
		}

		// always produce the binarized view (shown live in the right panel)
		const [tr, tg, tb] = hexToRgb(colorRef.current);
		const threshold = tolRef.current;
		const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const px = data.data;
		for (let i = 0; i < px.length; i += 4) {
			const dr = px[i] - tr;
			const dg = px[i + 1] - tg;
			const db = px[i + 2] - tb;
			// same Euclidean distance the Java binarizer uses
			const dist = Math.sqrt(dr * dr + dg * dg + db * db);
			const bin = dist < threshold ? 255 : 0;
			px[i] = px[i + 1] = px[i + 2] = bin;
		}
		ctx.putImageData(data, 0, 0);
	}

	// While the video plays, redraw every animation frame.
	useEffect(() => {
		if (!videoReady) return;
		let raf;
		const loop = () => {
			drawFrame();
			raf = requestAnimationFrame(loop);
		};
		loop();
		return () => cancelAnimationFrame(raf);
	}, [videoReady]);

	// Redraw once when paused and the color/threshold change (so tuning updates live)
	useEffect(() => {
		if (videoReady && videoRef.current?.paused) drawFrame();
	}, [color, tolerance, videoReady]);

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

	// Reads the color under the mouse from the hidden frame canvas.
	// The video is shown with object cover, so mirror that math.
	function colorAt(e) {
		const canvas = pickRef.current;
		if (!canvas || canvas.width === 0) return null;
		const rect = e.currentTarget.getBoundingClientRect();
		const x = Math.min(
			canvas.width - 1,
			Math.max(0, Math.floor((e.clientX - rect.left) * (canvas.width / rect.width))),
		);
		const y = Math.min(
			canvas.height - 1,
			Math.max(0, Math.floor((e.clientY - rect.top) * (canvas.height / rect.height))),
		);
		const [r, g, b] = canvas.getContext("2d").getImageData(x, y, 1, 1).data;
		const hex =
			"#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
		return { x: e.clientX - rect.left, y: e.clientY - rect.top, hex };
	}

	function handleCanvasMove(e) {
		setHover(colorAt(e));
	}

	function handleCanvasClick(e) {
		const picked = colorAt(e);
		if (picked) {
			setColor(picked.hex);
			toast("Color picked", "info");
		}
	}

	return (
		<div className="flex flex-col items-center justify-center px-6 py-16">
			<div className="w-full max-w-5xl border-t-4 border-green-800 mb-10" />
			<div className="w-full max-w-5xl bg-white border border-stone-200 rounded-sm shadow-sm px-10 py-12">
				<p className="text-xs uppercase tracking-[0.2em] text-stone-400 font-medium mb-3">
					Previewing
				</p>

				<h1 className="text-3xl font-[SchoolBell] text-green-800 mb-6 break-all">
					{filename}
				</h1>

				<div className="flex items-center gap-3 mb-6">
					<div className="h-px flex-1 bg-stone-200" />
				</div>

				{/* Original (left) and the live binarized view (right), side by side */}
				<div className="mb-2 grid grid-cols-1 gap-4 lg:grid-cols-2">
					{/* Original video — drives playback. Click anywhere to pick a target color. */}
					<div>
						<p className="mb-1.5 text-xs uppercase tracking-[0.15em] text-stone-400 font-medium">
							Original
						</p>
						<div
							className="relative flex justify-center overflow-hidden rounded-md border border-stone-200 bg-stone-900 shadow-inner"
							onMouseMove={handleCanvasMove}
							onMouseLeave={() => setHover(null)}
							onClick={handleCanvasClick}
						>
							<video
								ref={videoRef}
								src={videoUrl}
								controls
								onLoadedData={() => setVideoReady(true)}
								className="block max-h-[60vh] w-auto max-w-full cursor-crosshair"
							/>
							{hover && (
								<div
									className="pointer-events-none absolute z-10 flex items-center gap-2 rounded bg-stone-900/90 px-2 py-1 text-xs text-white"
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
					</div>

					{/* Live binarized view — updates as the video plays */}
					<div>
						<p className="mb-1.5 flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-stone-400 font-medium">
							Binarized
							<span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-700">
								<span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse" />
								live
							</span>
						</p>
						<div className="relative flex justify-center overflow-hidden rounded-md border border-stone-200 bg-stone-900 shadow-inner">
							<canvas
								ref={canvasRef}
								onMouseMove={handleCanvasMove}
								onMouseLeave={() => setHover(null)}
								onClick={handleCanvasClick}
								className="block max-h-[60vh] w-auto max-w-full cursor-crosshair"
							/>
							{/* hidden canvas that always holds the raw frame for the eyedropper */}
							<canvas ref={pickRef} className="hidden" />

							{hover && (
								<div
									className="pointer-events-none absolute z-10 flex items-center gap-2 rounded bg-stone-900/90 px-2 py-1 text-xs text-white"
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
					</div>
				</div>

				<p className="mb-8 mt-3 text-xs text-stone-400">
					Tip: press play on the original — the binarized view tracks live beside it.
					Click anywhere on either panel to pick a target color.
				</p>

				<div className="mb-8 space-y-5">
					<div className="flex flex-wrap items-center gap-6">
						<label className="flex items-center gap-3 text-sm font-medium text-stone-600">
							Target color
							<input
								type="color"
								value={color}
								onChange={(e) => setColor(e.target.value)}
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
								onChange={(e) => setTolerance(Number(e.target.value))}
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
									<span className="text-stone-600">Threshold {run.threshold}</span>
									<span className="text-xs text-stone-400">
										{run.time ? new Date(run.time).toLocaleString() : ""}
									</span>
									<span className="ml-auto flex items-center gap-3">
										<button
											type="button"
											onClick={() => {
												setColor(run.color);
												setTolerance(run.threshold);
												toast("Settings loaded", "info");
											}}
											className="text-xs font-medium text-stone-500 underline underline-offset-2 hover:text-green-700"
										>
											Use settings
										</button>
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
			<div className="w-full max-w-5xl border-b-4 border-green-800 mt-10" />
		</div>
	);
}
