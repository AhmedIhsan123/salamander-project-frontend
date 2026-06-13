import { Link } from "react-router-dom";
import { getAllJobs } from "../jobStore.js";

const steps = [
	{
		num: "1",
		title: "Pick a video",
		text: "Choose a recording from the Videos page.",
	},
	{
		num: "2",
		title: "Click your target",
		text: "Click the thing you want to track to set its color, then tune the threshold.",
	},
	{
		num: "3",
		title: "Process & download",
		text: "Run the job and download the tracked centroid data as a CSV.",
	},
];

export default function Home() {
	// last few runs saved in this browser
	const recent = getAllJobs().slice(0, 3);

	return (
		<div className="min-h-screen bg-green-950 flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
			<div className="absolute top-0 left-0 w-64 h-64 bg-green-500 rounded-full opacity-[0.06] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
			<div className="absolute bottom-0 right-0 w-80 h-80 bg-green-600 rounded-full opacity-[0.07] translate-x-1/4 translate-y-1/4 pointer-events-none" />

			<div className="relative z-10 w-full max-w-3xl text-center flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
				<h1 className="font-[SchoolBell] text-6xl text-green-50 leading-tight mb-4">
					Salamander Tracker
				</h1>

				<p className="text-green-100 text-base leading-relaxed opacity-80 max-w-md mb-8">
					Track anything with a distinct color through a video — salamanders,
					lab animals, sports balls — and export its position data as a CSV. No
					manual frame-by-frame counting.
				</p>

				<Link
					to="/videos"
					className="rounded-sm bg-green-500 px-8 py-3 text-sm font-medium tracking-wide
					           text-green-950 transition-colors hover:bg-green-400 mb-14"
				>
					Browse Videos →
				</Link>

				<div className="grid w-full gap-4 sm:grid-cols-3 mb-12">
					{steps.map((step) => (
						<div
							key={step.num}
							className="rounded-sm border border-green-900 bg-green-900/40 px-5 py-6 text-left"
						>
							<span className="font-[SchoolBell] text-3xl text-green-400">
								{step.num}
							</span>
							<h2 className="mt-2 mb-1 text-sm font-medium text-green-50">
								{step.title}
							</h2>
							<p className="text-xs leading-relaxed text-green-100 opacity-70">
								{step.text}
							</p>
						</div>
					))}
				</div>

				{recent.length > 0 && (
					<div className="w-full max-w-lg text-left">
						<p className="mb-3 text-xs uppercase tracking-[0.2em] text-green-400 font-medium">
							Recent runs
						</p>
						<ul className="divide-y divide-green-900 rounded-sm border border-green-900 bg-green-900/30">
							{recent.map((run) => (
								<li key={run.jobId}>
									<Link
										to={`/preview/${run.filename}`}
										className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-green-900/50"
									>
										<span
											className="h-3.5 w-3.5 rounded-sm border border-green-800"
											style={{ background: run.color }}
										/>
										<span className="truncate text-green-50">
											{run.filename}
										</span>
										<span
											className={
												"ml-auto text-xs font-medium " +
												(run.status === "done"
													? "text-green-400"
													: run.status === "error"
														? "text-red-400"
														: "text-amber-400")
											}
										>
											{run.status}
										</span>
									</Link>
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</div>
	);
}
