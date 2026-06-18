import { useEffect, useMemo, useRef, useState } from "react";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	ReferenceDot,
	CartesianGrid,
	Area,
	AreaChart,
} from "recharts";

// Multi tab analytics: heatmap, path, speed, x/y, stats 
// All views share the same hovered index so they stay in sync
export default function RunAnalytics({ rows, onSeek }) {
	const [tab, setTab] = useState("heatmap");
	const [hoverIdx, setHoverIdx] = useState(null);

	// Parse rows once into something every view can consume
	const data = useMemo(() => parseRows(rows), [rows]);

	if (!data || data.points.length === 0) {
		return (
			<div className="rounded-md border border-stone-200 bg-stone-50 px-6 py-10 text-center text-sm text-stone-500">
				No centroid was detected in this run — try a different color or a
				higher threshold and process again.
			</div>
		);
	}

	const tabs = [
		{ id: "heatmap", label: "Heatmap", icon: "🔥" },
		{ id: "path", label: "Motion path", icon: "🛤️" },
		{ id: "speed", label: "Speed", icon: "📈" },
		{ id: "xy", label: "X & Y over time", icon: "📊" },
		{ id: "stats", label: "Stats", icon: "🎯" },
	];

	return (
		<div className="rounded-md border border-stone-200 bg-white">
			<div className="flex flex-wrap items-center gap-1 border-b border-stone-200 px-2 py-2">
				{tabs.map((t) => (
					<button
						key={t.id}
						type="button"
						onClick={() => setTab(t.id)}
						className={
							"rounded-sm px-3 py-1.5 text-xs font-medium transition-colors " +
							(tab === t.id
								? "bg-green-800 text-white"
								: "text-stone-600 hover:bg-stone-100")
						}
					>
						<span className="mr-1">{t.icon}</span>
						{t.label}
					</button>
				))}

				{/* Detection rate bubble — always visible across tabs */}
				<span className="ml-auto inline-flex items-center gap-1.5 rounded-sm bg-stone-100 px-2 py-1 text-[10px] font-medium text-stone-600">
					<span className="inline-block h-1.5 w-1.5 rounded-full bg-green-600" />
					{Math.round(data.detectionRate * 100)}% detection rate
				</span>
			</div>

			<div className="p-4">
				{tab === "heatmap" && (
					<HeatmapView
						data={data}
						hoverIdx={hoverIdx}
						setHoverIdx={setHoverIdx}
						onSeek={onSeek}
					/>
				)}
				{tab === "path" && (
					<PathView
						data={data}
						hoverIdx={hoverIdx}
						setHoverIdx={setHoverIdx}
						onSeek={onSeek}
					/>
				)}
				{tab === "speed" && (
					<SpeedView
						data={data}
						hoverIdx={hoverIdx}
						setHoverIdx={setHoverIdx}
						onSeek={onSeek}
					/>
				)}
				{tab === "xy" && (
					<XYView
						data={data}
						hoverIdx={hoverIdx}
						setHoverIdx={setHoverIdx}
						onSeek={onSeek}
					/>
				)}
				{tab === "stats" && <StatsView data={data} />}

				{/* Time scrubber lives on every view except plain stats */}
				{tab !== "stats" && (
					<TimeScrubber
						data={data}
						hoverIdx={hoverIdx}
						setHoverIdx={setHoverIdx}
						onSeek={onSeek}
					/>
				)}
			</div>
		</div>
	);
}

// ──────────────────────────────────────────────────────────────────────────────
// Data parsing + stats
// ──────────────────────────────────────────────────────────────────────────────

function parseRows(rows) {
	if (!rows || rows.length === 0) return null;

	// rows: [seconds, x, y]; -1,-1 means there isnt like any detection
	const all = rows.map((r) => ({
		t: Number(r[0]),
		x: Number(r[1]),
		y: Number(r[2]),
		detected: Number(r[1]) >= 0 && Number(r[2]) >= 0,
	}));

	const points = all.filter((p) => p.detected);
	if (points.length === 0) return { points: [], all, detectionRate: 0 };

	let maxX = 0, maxY = 0;
	for (const p of points) {
		if (p.x > maxX) maxX = p.x;
		if (p.y > maxY) maxY = p.y;
	}

	// Compute speed between consecutive detections pixels/second
	let totalDist = 0;
	for (let i = 1; i < points.length; i++) {
		const dx = points[i].x - points[i - 1].x;
		const dy = points[i].y - points[i - 1].y;
		const dt = points[i].t - points[i - 1].t || 1 / 30;
		const dist = Math.sqrt(dx * dx + dy * dy);
		points[i].dist = dist;
		points[i].speed = dist / dt;
		totalDist += dist;
	}
	if (points[0]) {
		points[0].dist = 0;
		points[0].speed = 0;
	}

	// smooth speed a bit so it doesn't look like static
	const smoothed = smooth(points.map((p) => p.speed || 0), 5);
	points.forEach((p, i) => (p.speedSmooth = smoothed[i]));

	const duration = (points[points.length - 1].t - points[0].t) || 1;
	const avgSpeed = totalDist / duration;
	const maxSpeed = Math.max(...points.map((p) => p.speed || 0));

	// Time spent stationary — speed below 10 px/sec
	const stationaryFrames = points.filter((p) => (p.speed || 0) < 10).length;
	const stationaryPct = stationaryFrames / points.length;

	// Bounding box of the motion
	const minX = Math.min(...points.map((p) => p.x));
	const minXY = Math.min(...points.map((p) => p.y));
	const bboxW = maxX - minX;
	const bboxH = maxY - minXY;

	return {
		all,
		points,
		maxX: maxX + 20,
		maxY: maxY + 20,
		duration,
		totalDist,
		avgSpeed,
		maxSpeed,
		stationaryPct,
		bboxW,
		bboxH,
		detectionRate: points.length / all.length,
	};
}

function smooth(arr, window) {
	const out = new Array(arr.length);
	const half = Math.floor(window / 2);
	for (let i = 0; i < arr.length; i++) {
		let sum = 0;
		let n = 0;
		for (let j = i - half; j <= i + half; j++) {
			if (j >= 0 && j < arr.length) {
				sum += arr[j];
				n++;
			}
		}
		out[i] = sum / n;
	}
	return out;
}

// ──────────────────────────────────────────────────────────────────────────────
// Heatmap canvas  faster than SVG for hundreds of cells
// ──────────────────────────────────────────────────────────────────────────────

function HeatmapView({ data, hoverIdx, setHoverIdx, onSeek }) {
	const canvasRef = useRef(null);
	const [showPath, setShowPath] = useState(true);
	const [cellSize, setCellSize] = useState(18);
	const width = 720;
	const height = 420;

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");

		ctx.fillStyle = "#1c1917";
		ctx.fillRect(0, 0, width, height);

		const { points, maxX, maxY } = data;
		const scale = Math.min(width / maxX, height / maxY);
		const offsetX = (width - maxX * scale) / 2;
		const offsetY = (height - maxY * scale) / 2;

		const cols = Math.ceil(width / cellSize);
		const grid = new Array(cols * Math.ceil(height / cellSize)).fill(0);
		let maxCount = 0;
		for (const p of points) {
			const cx = Math.floor((p.x * scale + offsetX) / cellSize);
			const cy = Math.floor((p.y * scale + offsetY) / cellSize);
			const idx = cy * cols + cx;
			grid[idx] = (grid[idx] || 0) + 1;
			if (grid[idx] > maxCount) maxCount = grid[idx];
		}

		for (let i = 0; i < grid.length; i++) {
			const count = grid[i];
			if (!count) continue;
			const t = count / maxCount;
			ctx.fillStyle = heatColor(t);
			ctx.globalAlpha = 0.35 + 0.55 * t;
			const gx = (i % cols) * cellSize;
			const gy = Math.floor(i / cols) * cellSize;
			ctx.fillRect(gx, gy, cellSize, cellSize);
		}
		ctx.globalAlpha = 1;

		if (showPath) {
			ctx.strokeStyle = "rgba(255,255,255,0.45)";
			ctx.lineWidth = 1.2;
			ctx.beginPath();
			points.forEach((p, i) => {
				const px = p.x * scale + offsetX;
				const py = p.y * scale + offsetY;
				if (i === 0) ctx.moveTo(px, py);
				else ctx.lineTo(px, py);
			});
			ctx.stroke();

			drawDot(ctx, points[0].x * scale + offsetX, points[0].y * scale + offsetY, "#16a34a");
			drawDot(
				ctx,
				points[points.length - 1].x * scale + offsetX,
				points[points.length - 1].y * scale + offsetY,
				"#dc2626",
			);
		}

		// marker for hovered moment
		if (hoverIdx != null && points[hoverIdx]) {
			const p = points[hoverIdx];
			const px = p.x * scale + offsetX;
			const py = p.y * scale + offsetY;
			ctx.strokeStyle = "#fff";
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(px, py, 9, 0, Math.PI * 2);
			ctx.stroke();
			ctx.fillStyle = "#fff";
			ctx.beginPath();
			ctx.arc(px, py, 3, 0, Math.PI * 2);
			ctx.fill();
		}
	}, [data, showPath, cellSize, hoverIdx]);

	// convert mouse click on canvas to nearest point index to seek
	function handleClick(e) {
		const rect = e.currentTarget.getBoundingClientRect();
		const { points, maxX, maxY } = data;
		const scale = Math.min(width / maxX, height / maxY);
		const offsetX = (width - maxX * scale) / 2;
		const offsetY = (height - maxY * scale) / 2;
		const clickX = ((e.clientX - rect.left) * (width / rect.width) - offsetX) / scale;
		const clickY = ((e.clientY - rect.top) * (height / rect.height) - offsetY) / scale;

		let bestIdx = 0;
		let bestDist = Infinity;
		points.forEach((p, i) => {
			const dx = p.x - clickX;
			const dy = p.y - clickY;
			const d = dx * dx + dy * dy;
			if (d < bestDist) {
				bestDist = d;
				bestIdx = i;
			}
		});
		setHoverIdx(bestIdx);
		if (onSeek) onSeek(points[bestIdx].t);
	}

	return (
		<div>
			<div className="mb-3 flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3 text-xs text-stone-500">
					<span className="flex items-center gap-1.5">
						<span className="inline-block h-2.5 w-2.5 rounded-full bg-green-600" />
						Start
					</span>
					<span className="flex items-center gap-1.5">
						<span className="inline-block h-2.5 w-2.5 rounded-full bg-red-600" />
						End
					</span>
					<span className="flex items-center gap-1.5">
						<span
							className="inline-block h-2.5 w-10 rounded-sm"
							style={{
								background:
									"linear-gradient(to right, #1e3a8a, #0ea5e9, #facc15, #dc2626)",
							}}
						/>
						Cold → hot
					</span>
				</div>
				<div className="flex items-center gap-3 text-xs text-stone-500">
					<label className="flex items-center gap-1.5">
						Cell
						<input
							type="range"
							min="8"
							max="40"
							value={cellSize}
							onChange={(e) => setCellSize(Number(e.target.value))}
							className="w-20 accent-green-700"
						/>
					</label>
					<label className="flex items-center gap-1.5">
						<input
							type="checkbox"
							checked={showPath}
							onChange={(e) => setShowPath(e.target.checked)}
							className="accent-green-700"
						/>
						Path
					</label>
				</div>
			</div>
			<div className="overflow-hidden rounded-sm border border-stone-200 bg-stone-900">
				<canvas
					ref={canvasRef}
					width={width}
					height={height}
					onClick={handleClick}
					className="block h-auto w-full cursor-crosshair"
				/>
			</div>
			<p className="mt-2 text-[11px] text-stone-400">
				Click anywhere — jumps the video to when the centroid was nearest that point.
			</p>
		</div>
	);
}

// ──────────────────────────────────────────────────────────────────────────────
// Motion path (canvas — colored by time)
// ──────────────────────────────────────────────────────────────────────────────

function PathView({ data, hoverIdx, setHoverIdx, onSeek }) {
	const canvasRef = useRef(null);
	const width = 720;
	const height = 420;

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		ctx.fillStyle = "#fafaf9";
		ctx.fillRect(0, 0, width, height);

		const { points, maxX, maxY } = data;
		const scale = Math.min(width / maxX, height / maxY);
		const offsetX = (width - maxX * scale) / 2;
		const offsetY = (height - maxY * scale) / 2;

		// Subtle grid
		ctx.strokeStyle = "#e7e5e4";
		ctx.lineWidth = 1;
		for (let x = 0; x < width; x += 60) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, height);
			ctx.stroke();
		}
		for (let y = 0; y < height; y += 60) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(width, y);
			ctx.stroke();
		}

		// Path colored by progress through time cool to warm
		for (let i = 1; i < points.length; i++) {
			const t = i / (points.length - 1);
			ctx.strokeStyle = pathColor(t);
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(points[i - 1].x * scale + offsetX, points[i - 1].y * scale + offsetY);
			ctx.lineTo(points[i].x * scale + offsetX, points[i].y * scale + offsetY);
			ctx.stroke();
		}

		drawDot(ctx, points[0].x * scale + offsetX, points[0].y * scale + offsetY, "#16a34a", 6);
		drawDot(
			ctx,
			points[points.length - 1].x * scale + offsetX,
			points[points.length - 1].y * scale + offsetY,
			"#dc2626",
			6,
		);

		if (hoverIdx != null && points[hoverIdx]) {
			const p = points[hoverIdx];
			const px = p.x * scale + offsetX;
			const py = p.y * scale + offsetY;
			ctx.strokeStyle = "#0f172a";
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(px, py, 10, 0, Math.PI * 2);
			ctx.stroke();
			ctx.fillStyle = "#0f172a";
			ctx.beginPath();
			ctx.arc(px, py, 3, 0, Math.PI * 2);
			ctx.fill();
		}
	}, [data, hoverIdx]);

	function handleClick(e) {
		const rect = e.currentTarget.getBoundingClientRect();
		const { points, maxX, maxY } = data;
		const scale = Math.min(width / maxX, height / maxY);
		const offsetX = (width - maxX * scale) / 2;
		const offsetY = (height - maxY * scale) / 2;
		const cx = ((e.clientX - rect.left) * (width / rect.width) - offsetX) / scale;
		const cy = ((e.clientY - rect.top) * (height / rect.height) - offsetY) / scale;
		let bestIdx = 0;
		let bestDist = Infinity;
		points.forEach((p, i) => {
			const dx = p.x - cx;
			const dy = p.y - cy;
			const d = dx * dx + dy * dy;
			if (d < bestDist) {
				bestDist = d;
				bestIdx = i;
			}
		});
		setHoverIdx(bestIdx);
		if (onSeek) onSeek(points[bestIdx].t);
	}

	return (
		<div>
			<div className="mb-3 flex items-center gap-3 text-xs text-stone-500">
				<span className="flex items-center gap-1.5">
					<span className="inline-block h-2.5 w-2.5 rounded-full bg-green-600" />
					Start
				</span>
				<span className="flex items-center gap-1.5">
					<span className="inline-block h-2.5 w-2.5 rounded-full bg-red-600" />
					End
				</span>
				<span className="flex items-center gap-1.5">
					<span
						className="inline-block h-2.5 w-10 rounded-sm"
						style={{
							background:
								"linear-gradient(to right, #06b6d4, #8b5cf6, #f43f5e)",
						}}
					/>
					Path over time
				</span>
			</div>
			<div className="overflow-hidden rounded-sm border border-stone-200">
				<canvas
					ref={canvasRef}
					width={width}
					height={height}
					onClick={handleClick}
					className="block h-auto w-full cursor-crosshair"
				/>
			</div>
			<p className="mt-2 text-[11px] text-stone-400">
				Path is colored by time — click anywhere to jump the video to that moment.
			</p>
		</div>
	);
}

// ──────────────────────────────────────────────────────────────────────────────
// Speed over time (Recharts area chart)
// ──────────────────────────────────────────────────────────────────────────────

function SpeedView({ data, hoverIdx, setHoverIdx, onSeek }) {
	const chartData = data.points.map((p, i) => ({
		i,
		t: Number(p.t.toFixed(2)),
		speed: Math.round(p.speedSmooth || 0),
	}));

	return (
		<div>
			<p className="mb-2 text-xs text-stone-500">
				How fast the centroid is moving (pixels/sec). Hover the chart to highlight that moment everywhere.
			</p>
			<div className="rounded-sm border border-stone-200 bg-white p-2">
				<ResponsiveContainer width="100%" height={300}>
					<AreaChart
						data={chartData}
						margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
						onMouseMove={(e) => {
							if (e?.activePayload?.[0]?.payload) {
								setHoverIdx(e.activePayload[0].payload.i);
							}
						}}
						onMouseLeave={() => setHoverIdx(null)}
						onClick={(e) => {
							if (e?.activePayload?.[0]?.payload && onSeek) {
								onSeek(e.activePayload[0].payload.t);
							}
						}}
					>
						<defs>
							<linearGradient id="speedFill" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="#16a34a" stopOpacity={0.5} />
								<stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
							</linearGradient>
						</defs>
						<CartesianGrid stroke="#f5f5f4" />
						<XAxis
							dataKey="t"
							tick={{ fontSize: 11, fill: "#78716c" }}
							label={{ value: "Time (s)", position: "insideBottom", offset: -2, fontSize: 11, fill: "#78716c" }}
						/>
						<YAxis
							tick={{ fontSize: 11, fill: "#78716c" }}
							label={{ value: "px/s", angle: -90, position: "insideLeft", fontSize: 11, fill: "#78716c" }}
						/>
						<Tooltip
							contentStyle={{ fontSize: 12, borderRadius: 4 }}
							labelFormatter={(v) => `${v}s`}
						/>
						<Area
							type="monotone"
							dataKey="speed"
							stroke="#16a34a"
							strokeWidth={2}
							fill="url(#speedFill)"
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}

// ──────────────────────────────────────────────────────────────────────────────
// X & Y over time (Recharts line chart with two series)
// ──────────────────────────────────────────────────────────────────────────────

function XYView({ data, hoverIdx, setHoverIdx, onSeek }) {
	const chartData = data.points.map((p, i) => ({
		i,
		t: Number(p.t.toFixed(2)),
		x: p.x,
		y: p.y,
	}));

	return (
		<div>
			<p className="mb-2 text-xs text-stone-500">
				X and Y position of the centroid plotted separately over time.
			</p>
			<div className="rounded-sm border border-stone-200 bg-white p-2">
				<ResponsiveContainer width="100%" height={300}>
					<LineChart
						data={chartData}
						margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
						onMouseMove={(e) => {
							if (e?.activePayload?.[0]?.payload) {
								setHoverIdx(e.activePayload[0].payload.i);
							}
						}}
						onMouseLeave={() => setHoverIdx(null)}
						onClick={(e) => {
							if (e?.activePayload?.[0]?.payload && onSeek) {
								onSeek(e.activePayload[0].payload.t);
							}
						}}
					>
						<CartesianGrid stroke="#f5f5f4" />
						<XAxis dataKey="t" tick={{ fontSize: 11, fill: "#78716c" }} />
						<YAxis tick={{ fontSize: 11, fill: "#78716c" }} />
						<Tooltip
							contentStyle={{ fontSize: 12, borderRadius: 4 }}
							labelFormatter={(v) => `${v}s`}
						/>
						<Line
							type="monotone"
							dataKey="x"
							stroke="#0ea5e9"
							strokeWidth={2}
							dot={false}
							name="X"
						/>
						<Line
							type="monotone"
							dataKey="y"
							stroke="#f43f5e"
							strokeWidth={2}
							dot={false}
							name="Y"
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
			<div className="mt-2 flex gap-4 text-xs text-stone-500">
				<span className="flex items-center gap-1.5">
					<span className="inline-block h-0.5 w-3 bg-sky-500" />
					X (horizontal)
				</span>
				<span className="flex items-center gap-1.5">
					<span className="inline-block h-0.5 w-3 bg-rose-500" />
					Y (vertical)
				</span>
			</div>
		</div>
	);
}

// ──────────────────────────────────────────────────────────────────────────────
// Stats (cards)
// ──────────────────────────────────────────────────────────────────────────────

function StatsView({ data }) {
	const stats = [
		{
			label: "Total distance",
			value: `${Math.round(data.totalDist).toLocaleString()} px`,
			hint: "Sum of frame-to-frame movement",
		},
		{
			label: "Avg speed",
			value: `${Math.round(data.avgSpeed)} px/s`,
			hint: "Total distance ÷ duration",
		},
		{
			label: "Peak speed",
			value: `${Math.round(data.maxSpeed)} px/s`,
			hint: "Fastest single jump",
		},
		{
			label: "Duration tracked",
			value: `${data.duration.toFixed(1)}s`,
			hint: "From first detection to last",
		},
		{
			label: "Time stationary",
			value: `${Math.round(data.stationaryPct * 100)}%`,
			hint: "% of frames with speed < 10 px/s",
		},
		{
			label: "Detection rate",
			value: `${Math.round(data.detectionRate * 100)}%`,
			hint: "Frames where centroid was found",
		},
		{
			label: "Range covered",
			value: `${Math.round(data.bboxW)} × ${Math.round(data.bboxH)} px`,
			hint: "Bounding box of all detections",
		},
		{
			label: "Sample size",
			value: data.points.length.toLocaleString(),
			hint: "Detected frames",
		},
	];

	return (
		<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
			{stats.map((s) => (
				<div
					key={s.label}
					className="rounded-sm border border-stone-200 bg-stone-50 px-4 py-3"
				>
					<p className="text-[10px] uppercase tracking-wider text-stone-500">
						{s.label}
					</p>
					<p className="mt-1 text-lg font-semibold text-stone-800 tabular-nums">
						{s.value}
					</p>
					<p className="mt-0.5 text-[10px] text-stone-400">{s.hint}</p>
				</div>
			))}
		</div>
	);
}

// ──────────────────────────────────────────────────────────────────────────────
// Synchronized time scrubber (shared across views)
// ──────────────────────────────────────────────────────────────────────────────

function TimeScrubber({ data, hoverIdx, setHoverIdx, onSeek }) {
	const idx = hoverIdx ?? 0;
	const p = data.points[idx];

	return (
		<div className="mt-4 rounded-sm border border-stone-200 bg-stone-50 px-4 py-3">
			<div className="mb-2 flex items-center justify-between text-xs">
				<span className="font-medium text-stone-600">
					Moment {idx + 1} / {data.points.length}
				</span>
				<span className="tabular-nums text-stone-500">
					{p ? p.t.toFixed(2) : "0.00"}s · x={p?.x ?? "—"}, y={p?.y ?? "—"}
				</span>
			</div>
			<input
				type="range"
				min="0"
				max={data.points.length - 1}
				value={idx}
				onChange={(e) => {
					const newIdx = Number(e.target.value);
					setHoverIdx(newIdx);
					if (onSeek && data.points[newIdx]) onSeek(data.points[newIdx].t);
				}}
				className="w-full accent-green-700"
			/>
			<p className="mt-1.5 text-[11px] text-stone-400">
				Drag — the video and all charts jump to that moment.
			</p>
		</div>
	);
}

// ──────────────────────────────────────────────────────────────────────────────
// Color helpers
// ──────────────────────────────────────────────────────────────────────────────

function heatColor(t) {
	const stops = [
		{ at: 0.0, c: [30, 58, 138] },
		{ at: 0.35, c: [14, 165, 233] },
		{ at: 0.7, c: [250, 204, 21] },
		{ at: 1.0, c: [220, 38, 38] },
	];
	for (let i = 0; i < stops.length - 1; i++) {
		const a = stops[i];
		const b = stops[i + 1];
		if (t >= a.at && t <= b.at) {
			const k = (t - a.at) / (b.at - a.at);
			const r = Math.round(a.c[0] + (b.c[0] - a.c[0]) * k);
			const g = Math.round(a.c[1] + (b.c[1] - a.c[1]) * k);
			const bl = Math.round(a.c[2] + (b.c[2] - a.c[2]) * k);
			return `rgb(${r},${g},${bl})`;
		}
	}
	return "rgb(220,38,38)";
}

function pathColor(t) {
	const stops = [
		{ at: 0.0, c: [6, 182, 212] },
		{ at: 0.5, c: [139, 92, 246] },
		{ at: 1.0, c: [244, 63, 94] },
	];
	for (let i = 0; i < stops.length - 1; i++) {
		const a = stops[i];
		const b = stops[i + 1];
		if (t >= a.at && t <= b.at) {
			const k = (t - a.at) / (b.at - a.at);
			const r = Math.round(a.c[0] + (b.c[0] - a.c[0]) * k);
			const g = Math.round(a.c[1] + (b.c[1] - a.c[1]) * k);
			const bl = Math.round(a.c[2] + (b.c[2] - a.c[2]) * k);
			return `rgb(${r},${g},${bl})`;
		}
	}
	return "rgb(244,63,94)";
}

function drawDot(ctx, x, y, color, size = 4) {
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(x, y, size, 0, Math.PI * 2);
	ctx.fill();
	ctx.strokeStyle = "rgba(0,0,0,0.6)";
	ctx.lineWidth = 1;
	ctx.stroke();
}
