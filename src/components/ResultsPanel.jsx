import { useEffect, useState } from "react";
import RunAnalytics from "./RunAnalytics.jsx";

// Shows the state of the current job: processing, error, or done.
// When done: summary line, download button, and an Analytics panel
export default function ResultsPanel({ job, onSeek }) {
	const [rows, setRows] = useState(null);
	const [showAnalytics, setShowAnalytics] = useState(false);

	// Load the result CSV once the job finishes
	useEffect(() => {
		if (job?.status !== "done" || !job.result) {
			setRows(null);
			setShowAnalytics(false);
			return;
		}
		fetch(job.result)
			.then((res) => {
				if (!res.ok) throw new Error(`Server responded ${res.status}`);
				return res.text();
			})
			.then((text) => {
				const parsed = text
					.trim()
					.split("\n")
					.filter((line) => line.length > 0)
					.map((line) => line.split(","));
				setRows(parsed);
				setShowAnalytics(true);
			})
			.catch(() => setRows([]));
	}, [job?.status, job?.result]);

	if (!job) return null;

	if (job.status === "processing") {
		return (
			<div className="rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
				<span className="animate-pulse">●</span> Processing video — this can
				take a while. Job ID: <code className="text-xs">{job.jobId}</code>
			</div>
		);
	}

	if (job.status === "error") {
		return (
			<div className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
				Something went wrong: {job.error || "processing failed."} Try again, or
				check that the server is running.
			</div>
		);
	}

	// done
	return (
		<div className="rounded-sm border border-green-200 bg-green-50 px-5 py-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<p className="text-sm font-medium text-green-800">
						✓ Processing complete
					</p>
					<p className="mt-0.5 text-xs text-green-700">
						{rows === null
							? "Loading results..."
							: rows.length === 0
								? "No data found in results."
								: `${rows.length.toLocaleString()} data points tracked`}
					</p>
				</div>

				<div className="flex items-center gap-3">
					{rows !== null && rows.length > 0 && (
						<button
							type="button"
							onClick={() => setShowAnalytics((s) => !s)}
							className={
								"rounded-sm border px-4 py-2 text-sm font-medium transition-colors " +
								(showAnalytics
									? "border-green-500 bg-green-100 text-green-900"
									: "border-green-300 text-green-800 hover:bg-green-100")
							}
						>
							{showAnalytics ? "Hide analytics" : "View analytics"}
						</button>
					)}
					<a
						href={job.result}
						download
						className="rounded-sm bg-green-800 px-4 py-2 text-sm font-medium
						           text-white transition-colors hover:bg-green-700"
					>
						Download CSV
					</a>
				</div>
			</div>

			{showAnalytics && rows !== null && rows.length > 0 && (
				<div className="mt-4">
					<RunAnalytics rows={rows} onSeek={onSeek} />
				</div>
			)}
		</div>
	);
}
