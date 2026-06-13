import { useEffect, useState } from "react";

// Shows the state of the current job: processing, error, or done
// When done: summary line, download button, and an optional data table.
export default function ResultsPanel({ job }) {
	const [rows, setRows] = useState(null);
	const [showTable, setShowTable] = useState(false);

	// Load the result CSV once the job finishes
	useEffect(() => {
		if (job?.status !== "done" || !job.result) {
			setRows(null);
			setShowTable(false);
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
							onClick={() => setShowTable((s) => !s)}
							className="rounded-sm border border-green-300 px-4 py-2 text-sm
							           font-medium text-green-800 transition-colors hover:bg-green-100"
						>
							{showTable ? "Hide data" : "View data"}
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

			{showTable && rows !== null && rows.length > 0 && (
				<div className="mt-4 max-h-72 overflow-auto rounded-sm border border-green-200 bg-white">
					<table className="w-full text-left text-xs">
						<thead className="sticky top-0 bg-stone-50 text-stone-500">
							<tr>
								<th className="px-3 py-2 font-medium">#</th>
								{/* CSV format from the JAR is: seconds, x, y */}
								{rows[0].map((_, i) => (
									<th key={i} className="px-3 py-2 font-medium">
										{rows[0].length === 3
											? ["Time (s)", "X", "Y"][i]
											: `Col ${i + 1}`}
									</th>
								))}
							</tr>
						</thead>
						<tbody className="text-stone-700">
							{/* show at most 200 rows so the page stays fast */}
							{rows.slice(0, 200).map((row, ri) => (
								<tr key={ri} className="border-t border-stone-100">
									<td className="px-3 py-1.5 text-stone-400">{ri + 1}</td>
									{row.map((cell, ci) => (
										<td key={ci} className="px-3 py-1.5 tabular-nums">
											{cell}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
					{rows.length > 200 && (
						<p className="border-t border-stone-100 px-3 py-2 text-xs text-stone-400">
							Showing first 200 of {rows.length.toLocaleString()} rows — download
							the CSV for everything.
						</p>
					)}
				</div>
			)}

			{/* Charts/heatmap section will go here later (Ahmed's feature) —
			    it can reuse the rows data already that i used above. it should be parsed above. */}
		</div>
	);
}
