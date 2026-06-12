import { Link, useParams } from "react-router-dom";
import { getThumbnail, submitProcessingJob, getJobStatus } from "../api.js";
import { useEffect, useState, useRef } from "react";

export default function Preview() {
	const { filename } = useParams();
	const [thumbnail, setThumbnail] = useState(null);
	const [color, setColor] = useState("#ffa200");
	const [tolerance, setTolerance] = useState(100);
	const [imageReady, setImageReady] = useState(false);
	const [job, setJob] = useState(null); 
	const [submitting, setSubmitting] = useState(false);
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

	// Poll the job status every 2 seconds while a job is processing.
	useEffect(() => {
		if (!job?.jobId || job.status !== "processing") return;

		const interval = setInterval(async () => {
			try {
				const status = await getJobStatus(job.jobId);
				setJob({ jobId: job.jobId, ...status });
			} catch (err) {
				setJob({ jobId: job.jobId, status: "error", error: err.message });
			}
		}, 2000);

		return () => clearInterval(interval);
	}, [job?.jobId, job?.status]);

	async function handleProcess() {
		setSubmitting(true);
		setJob(null);
		try {
			const { jobId } = await submitProcessingJob(filename, color, tolerance);
			setJob({ jobId, status: "processing" });
		} catch (err) {
			setJob({ status: "error", error: err.message });
		} finally {
			setSubmitting(false);
		}
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

					{job?.status === "processing" && (
						<div className="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
							<span className="animate-pulse">●</span> Processing video — this
							can take a while. Job ID:{" "}
							<code className="text-xs">{job.jobId}</code>
						</div>
					)}

					{job?.status === "done" && (
						<div className="flex items-center justify-between gap-4 rounded-sm border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
							<span>✓ Processing complete!</span>
							<a
								href={job.result}
								download
								className="font-medium underline underline-offset-2 hover:text-green-950"
							>
								Download results CSV
							</a>
						</div>
					)}

					{job?.status === "error" && (
						<div className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
							Something went wrong: {job.error || "processing failed."} Try
							again, or check that the server is running.
						</div>
					)}
				</div>

				<p className="text-xs uppercase tracking-[0.2em] text-stone-400 font-medium mb-3">
					Binarization preview
				</p>
				<canvas ref={canvasRef} className="w-full aspect-video object-cover mb-8"></canvas>

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
